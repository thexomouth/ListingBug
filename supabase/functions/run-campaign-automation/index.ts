/**
 * run-campaign-automation
 * Executes one campaign_automations row:
 *   1. Load the campaign_automation + its linked messaging_automation
 *   2. Run RentCast search using search_criteria
 *   3. Write results to search_runs (so agents appear in Agents page)
 *   4. Extract agent contacts from listings
 *   5. Upsert contacts into marketing_contacts
 *   6. Add contacts to the messaging_automation's list
 *   7. If messaging_automation.schedule = 'on_sync', fire send-marketing-email
 *   8. Update last_run_at / next_run_at on campaign_automations row
 *
 * Called by:
 *   - Frontend "Run Now" button (user JWT)
 *   - run-due-campaign-automations (service role key)
 *
 * verify_jwt = false  (same pattern as run-automation)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RENTCAST_API_KEY  = Deno.env.get("RENTCAST_API_KEY") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// RentCast fetch (mirrors run-automation exactly)
// ---------------------------------------------------------------------------
async function fetchListings(searchCriteria: Record<string, unknown>): Promise<unknown[]> {
  const {
    listingType = "sale",
    city, state, address,
    latitude, longitude, radius,
    propertyType,
    minPrice, maxPrice,
    daysOld: rawDaysOld,
    status = "Active",
    limit: resultLimit = 500,
  } = searchCriteria;

  const zipCode   = (searchCriteria.zipCode   ?? searchCriteria.zip)   as string | undefined;
  const bedrooms  = (searchCriteria.bedrooms  ?? searchCriteria.beds)  as string | number | undefined;
  const bathrooms = (searchCriteria.bathrooms ?? searchCriteria.baths) as string | number | undefined;

  const endpoint =
    listingType === "rental"
      ? "https://api.rentcast.io/v1/listings/rental/long-term"
      : "https://api.rentcast.io/v1/listings/sale";

  const params = new URLSearchParams();
  if (address)      params.set("address", String(address));
  if (city)         params.set("city",    String(city));
  if (state)        params.set("state",   String(state));
  if (zipCode)      params.set("zipCode", String(zipCode));
  if (latitude  != null && latitude  !== "") params.set("latitude",  String(latitude));
  if (longitude != null && longitude !== "") params.set("longitude", String(longitude));
  if (radius    != null && radius    !== "") params.set("radius",    String(radius));
  if (propertyType) params.set("propertyType", String(propertyType));
  if (bedrooms  != null && bedrooms  !== "") params.set("bedrooms",  String(bedrooms));
  if (bathrooms != null && bathrooms !== "") params.set("bathrooms", String(bathrooms));
  if (minPrice != null && maxPrice != null) params.set("price", `${minPrice}-${maxPrice}`);
  else if (minPrice != null) params.set("price", `${minPrice}+`);
  else if (maxPrice != null) params.set("price", `0-${maxPrice}`);
  if (rawDaysOld != null && rawDaysOld !== "") {
    const n = parseInt(String(rawDaysOld), 10);
    if (n > 0) params.set("daysOld", `${Math.max(0.1, n - 0.1)}-${n + 0.9}`);
  }
  params.set("status", String(status));
  params.set("limit",  String(Math.min(Number(resultLimit) || 500, 500)));

  const url = `${endpoint}?${params.toString()}`;
  console.log("[run-campaign-automation] RentCast request:", url);

  const res = await fetch(url, {
    headers: { "X-Api-Key": RENTCAST_API_KEY, Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RentCast ${res.status}: ${text}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// ---------------------------------------------------------------------------
// Normalize raw RentCast listing → camelCase shape for search_runs
// ---------------------------------------------------------------------------
function normalizeListings(raw: unknown[]): unknown[] {
  return raw.map((l: any, i: number) => ({
    id:               l.id || l.formattedAddress || String(i),
    address:          l.addressLine1 || l.formattedAddress || "",
    formattedAddress: l.formattedAddress || "",
    city:             l.city  || "",
    state:            l.state || "",
    zip:              l.zipCode || "",
    county:           l.county || "",
    propertyType:     l.propertyType || "Single Family",
    bedrooms:         l.bedrooms  || 0,
    bathrooms:        l.bathrooms || 0,
    sqft:             l.squareFootage || 0,
    lotSize:          l.lotSize   || 0,
    yearBuilt:        l.yearBuilt || 0,
    status:           l.status    || "Active",
    price:            l.price     || 0,
    daysListed:       l.daysOnMarket || 0,
    listedDate:       l.listedDate   || "",
    removedDate:      l.removedDate  || "",
    createdDate:      l.createdDate  || "",
    lastSeenDate:     l.lastSeenDate || "",
    listingType:      l.listingType  || "",
    mlsNumber:        l.mlsNumber    || "",
    mlsName:          l.mlsName      || "",
    hoaFee:           l.hoa?.fee ?? null,
    agentName:        l.listingAgent?.name    || "",
    agentPhone:       l.listingAgent?.phone   || "",
    agentEmail:       l.listingAgent?.email   || "",
    agentWebsite:     l.listingAgent?.website || "",
    officeName:       l.listingOffice?.name    || "",
    officePhone:      l.listingOffice?.phone   || "",
    officeEmail:      l.listingOffice?.email   || "",
    officeWebsite:    l.listingOffice?.website || "",
    brokerage:        l.listingAgent?.office || l.listingOffice?.name || "",
    priceDrop:        l.priceReduced || false,
    latitude:         l.latitude  || 0,
    longitude:        l.longitude || 0,
    description:      l.description || "",
    photos:           l.photos || [],
  }));
}

// ---------------------------------------------------------------------------
// Merge-tag renderer
// ---------------------------------------------------------------------------
function applyMergeTags(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? "");
}

// ---------------------------------------------------------------------------
// Resolve SendGrid API key for user
// ---------------------------------------------------------------------------
async function resolveSendGridKey(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<string | null> {
  const { data: mc } = await supabase
    .from("messaging_config")
    .select("config")
    .eq("user_id", userId)
    .eq("platform", "sendgrid")
    .maybeSingle();
  if (mc?.config?.api_key) return mc.config.api_key;

  const { data: conn } = await supabase
    .from("integration_connections")
    .select("credentials")
    .eq("user_id", userId)
    .eq("integration_id", "sendgrid")
    .maybeSingle();
  if ((conn?.credentials as any)?.api_key) return (conn.credentials as any).api_key;

  // Platform key — allows sending without any user setup
  const platformKey = Deno.env.get("SENDGRID_ADMIN_KEY");
  if (platformKey) return platformKey;

  return null;
}

// ---------------------------------------------------------------------------
// Calculate next_run_at from schedule
// ---------------------------------------------------------------------------
function calcNextRunAt(schedule: string): string {
  const next = new Date();
  if (schedule === "weekly") {
    next.setDate(next.getDate() + 7);
  } else {
    next.setDate(next.getDate() + 1);
  }
  next.setHours(8, 0, 0, 0);
  return next.toISOString();
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { automation_id } = await req.json();
    if (!automation_id) {
      return new Response(JSON.stringify({ error: "automation_id required" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ------------------------------------------------------------------
    // 1. Load campaign_automation + its messaging_automation
    // ------------------------------------------------------------------
    const { data: auto, error: autoErr } = await supabase
      .from("campaign_automations")
      .select("*")
      .eq("id", automation_id)
      .single();

    if (autoErr || !auto) {
      return new Response(JSON.stringify({ error: autoErr?.message ?? "Not found" }), {
        status: 404, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { data: msgAuto, error: msgErr } = await supabase
      .from("messaging_automations")
      .select("*")
      .eq("id", auto.messaging_automation_id)
      .single();

    if (msgErr || !msgAuto) {
      return new Response(JSON.stringify({ error: "Linked campaign not found" }), {
        status: 404, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const userId = auto.user_id as string;
    const listId = msgAuto.list_id as string;

    // ------------------------------------------------------------------
    // 2. Run RentCast search
    // ------------------------------------------------------------------
    const rawListings = await fetchListings(auto.search_criteria ?? {});
    if (rawListings.length === 0) {
      console.log("[run-campaign-automation] 0 listings — skipping contact sync");
      await supabase.from("campaign_automations").update({
        last_run_at: new Date().toISOString(),
        next_run_at: calcNextRunAt(auto.schedule),
        updated_at:  new Date().toISOString(),
      }).eq("id", automation_id);
      return new Response(JSON.stringify({ success: true, listings: 0, contacts: 0 }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const listings = normalizeListings(rawListings);

    // ------------------------------------------------------------------
    // 3. Write to search_runs (Agents page dependency)
    // ------------------------------------------------------------------
    try {
      await supabase.from("search_runs").insert({
        id:                   crypto.randomUUID(),
        user_id:              userId,
        location:             (auto.search_criteria as any)?.city
                              ?? (auto.search_criteria as any)?.state
                              ?? "Unknown",
        criteria_description: auto.search_name ?? auto.name,
        criteria_json:        auto.search_criteria,
        results_json:         listings,
        results_count:        listings.length,
        searched_at:          new Date().toISOString(),
        automation_name:      auto.name,
      });
    } catch (e: any) {
      console.warn("[run-campaign-automation] search_runs insert failed:", e?.message);
    }

    // ------------------------------------------------------------------
    // 4. Extract agent contacts with emails
    // ------------------------------------------------------------------
    const seen = new Set<string>();
    const agents: any[] = [];
    for (const l of listings as any[]) {
      const email = (l.agentEmail ?? "").toLowerCase().trim();
      if (!email || !email.includes("@") || seen.has(email)) continue;
      seen.add(email);
      const name: string = l.agentName ?? "";
      const parts = name.trim().split(/\s+/);
      agents.push({
        user_id:    userId,
        email,
        first_name: parts[0] ?? "",
        last_name:  parts.slice(1).join(" ") || null,
        city:       l.city    || null,
        company:    l.officeName || l.brokerage || null,
        phone:      l.agentPhone || null,
        source:     "campaign_automation",
      });
    }

    console.log(`[run-campaign-automation] ${listings.length} listings → ${agents.length} agents with email`);

    let contactsSynced = 0;
    if (agents.length > 0 && listId) {
      // ------------------------------------------------------------------
      // 5. Upsert contacts into marketing_contacts
      // ------------------------------------------------------------------
      const { error: upsertErr } = await supabase
        .from("marketing_contacts")
        .upsert(agents, { onConflict: "user_id,email", ignoreDuplicates: false });

      if (upsertErr) {
        console.error("[run-campaign-automation] upsert error:", upsertErr.message);
      } else {
        // ------------------------------------------------------------------
        // 6. Add contacts to the campaign's list
        // ------------------------------------------------------------------
        const { data: freshContacts } = await supabase
          .from("marketing_contacts")
          .select("id")
          .eq("user_id", userId)
          .in("email", agents.map((a) => a.email));

        const memberships = (freshContacts ?? []).map((c: any) => ({
          contact_id: c.id,
          list_id:    listId,
        }));

        if (memberships.length > 0) {
          await supabase
            .from("marketing_contacts_lists")
            .upsert(memberships, { onConflict: "contact_id,list_id", ignoreDuplicates: true });
          contactsSynced = memberships.length;
        }

        // ------------------------------------------------------------------
        // 7. If campaign schedule = 'on_sync', send now
        // ------------------------------------------------------------------
        if (msgAuto.schedule === "on_sync" && msgAuto.status === "active") {
          const apiKey = await resolveSendGridKey(supabase, userId);
          if (apiKey) {
            const sendersRes = await fetch("https://api.sendgrid.com/v3/senders", {
              headers: { Authorization: `Bearer ${apiKey}` },
            });
            const sendersData: any[] = sendersRes.ok ? await sendersRes.json() : [];
            const sender = sendersData.find((s: any) => String(s.id) === String(msgAuto.sender_id));

            if (sender && freshContacts && freshContacts.length > 0) {
              const contactIds = freshContacts.map((c: any) => c.id);

              // Load suppression list for this user
              const { data: suppressedRows } = await supabase
                .from("suppression_list")
                .select("email")
                .eq("user_id", userId);
              const suppressedEmails = new Set((suppressedRows ?? []).map((r: any) => r.email.toLowerCase()));

              const { data: sendableContacts } = await supabase
                .from("marketing_contacts")
                .select("id, email, first_name, last_name, city, company")
                .in("id", contactIds)
                .eq("user_id", userId)
                .eq("unsubscribed", false);

              // Also filter out suppression list entries
              const filteredContacts = (sendableContacts ?? []).filter(
                (c: any) => !suppressedEmails.has((c.email ?? "").toLowerCase())
              );

              // unsubscribeUrl stored on the automation; footer built per-recipient in the loop
              const unsubscribeBaseUrl = msgAuto.unsubscribe_url ?? "";

              if (filteredContacts.length > 0) {
                const campaignId = crypto.randomUUID();
                await supabase.from("marketing_campaigns").insert({
                  id:              campaignId,
                  user_id:         userId,
                  name:            `${msgAuto.name} (Campaign Automation)`,
                  subject:         msgAuto.subject,
                  channel:         "email",
                  sender_id:       String(msgAuto.sender_id),
                  recipient_count: filteredContacts.length,
                  sent_at:         new Date().toISOString(),
                });

                let sent = 0;
                for (const contact of filteredContacts) {
                  const mergeData: Record<string, string> = {
                    first_name: contact.first_name ?? "there",
                    last_name:  contact.last_name  ?? "",
                    city:       contact.city        ?? "",
                    company:    contact.company     ?? "",
                  };
                  const payload = {
                    personalizations: [{ to: [{ email: contact.email }] }],
                    from: { email: sender.from?.email, name: sender.from?.name },
                    subject: applyMergeTags(msgAuto.subject ?? "", mergeData),
                    content: [{ type: "text/html", value: applyMergeTags(msgAuto.body ?? "", mergeData) + (unsubscribeBaseUrl ? (() => { try { const u = new URL(unsubscribeBaseUrl); u.searchParams.set('email', contact.email); return `<br><br><hr style="border:none;border-top:1px solid #eee;margin:32px 0"><p style="font-size:11px;color:#aaa;text-align:center;margin:0;line-height:1.7">You are receiving this email because your contact information appears in a public real estate listing.<br>This message was sent by a ListingBug user. &nbsp;·&nbsp; <a href="${u.toString()}" style="color:#aaa;text-decoration:underline">Unsubscribe</a> &nbsp;·&nbsp; <a href="https://www.thelistingbug.com" style="color:#aaa;text-decoration:none">ListingBug</a></p>`; } catch { return `<br><br><hr style="border:none;border-top:1px solid #eee;margin:32px 0"><p style="font-size:11px;color:#aaa;text-align:center;margin:0;line-height:1.7">You are receiving this email because your contact information appears in a public real estate listing.<br>This message was sent by a ListingBug user. &nbsp;·&nbsp; <a href="${unsubscribeBaseUrl}?email=${encodeURIComponent(contact.email)}" style="color:#aaa;text-decoration:underline">Unsubscribe</a> &nbsp;·&nbsp; <a href="https://www.thelistingbug.com" style="color:#aaa;text-decoration:none">ListingBug</a></p>`; } })() : "") }],
                  };
                  try {
                    const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(payload),
                    });
                    const sgMsgId = sgRes.headers.get("X-Message-Id");
                    const status  = (sgRes.ok || sgRes.status === 202) ? "pending" : "failed";
                    if (status === "pending") sent++;
                    await supabase.from("marketing_sends").insert({
                      campaign_id: campaignId,
                      contact_id:  contact.id,
                      email:       contact.email,
                      status,
                      sg_message_id: sgMsgId,
                      sent_at:     new Date().toISOString(),
                    });
                  } catch (e: any) {
                    console.error("[run-campaign-automation] send error:", e?.message);
                  }
                }

                await supabase.from("messaging_automations").update({
                  last_run_at: new Date().toISOString(),
                  total_sent:  (msgAuto.total_sent ?? 0) + sent,
                  updated_at:  new Date().toISOString(),
                }).eq("id", msgAuto.id);

                console.log(`[run-campaign-automation] on_sync sent ${sent} emails`);
              }
            } else {
              console.warn("[run-campaign-automation] on_sync: sender not found or no contacts");
            }
          } else {
            console.warn("[run-campaign-automation] on_sync: no SendGrid key for user", userId);
          }
        }
      }
    }

    // ------------------------------------------------------------------
    // 8. Update campaign_automation timestamps
    // ------------------------------------------------------------------
    await supabase.from("campaign_automations").update({
      last_run_at: new Date().toISOString(),
      next_run_at: calcNextRunAt(auto.schedule),
      updated_at:  new Date().toISOString(),
    }).eq("id", automation_id);

    return new Response(
      JSON.stringify({ success: true, listings: listings.length, contacts: contactsSynced }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("[run-campaign-automation] unhandled error:", err?.message);
    return new Response(JSON.stringify({ error: err?.message ?? "Internal error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
