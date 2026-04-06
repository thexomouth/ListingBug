import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

// Snapshot item count in a Twilio Sync List.
// Uses X-Total-Count header from a PageSize=1 request — efficient, no data transfer.
// Returns -1 on failure.
async function snapshotSyncListCount(basicAuth: string, syncBase: string, listSid: string): Promise<number> {
  try {
    const res = await fetch(`${syncBase}/Lists/${listSid}/Items?PageSize=1`, {
      headers: { 'Authorization': `Basic ${basicAuth}` },
    });
    if (!res.ok) return -1;
    const header = res.headers.get('X-Total-Count');
    if (header !== null) return parseInt(header, 10);
    // Fallback: parse from body meta
    const data = await res.json();
    return data?.meta?.total ?? -1;
  } catch {
    return -1;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  let userId: string | null = null;
  const authHeader = req.headers.get('Authorization');
  let body: any;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }); }
  if (body.user_id) { userId = body.user_id; }
  else if (authHeader) {
    const uc = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await uc.auth.getUser();
    if (user) userId = user.id;
  }
  if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });

  const { listings, sync_service_sid = 'default', list_unique_name = 'listingbug_contacts', ttl = 0 } = body;
  if (!Array.isArray(listings) || listings.length === 0) return new Response(JSON.stringify({ error: 'listings must be a non-empty array' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });

  const { data: conn } = await serviceClient.from('integration_connections').select('credentials').eq('user_id', userId).eq('integration_id', 'twilio').single();
  if (!conn) return new Response(JSON.stringify({ error: 'Twilio not connected. Please add credentials in Integrations.' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  const creds = conn.credentials as any;
  const accountSid = creds?.account_sid;
  const authToken = creds?.auth_token;
  if (!accountSid || !authToken) return new Response(JSON.stringify({ error: 'Twilio credentials incomplete.' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });

  const basicAuth = btoa(`${accountSid}:${authToken}`);
  const twilioHeaders = { 'Authorization': `Basic ${basicAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' };
  const syncBase = `https://sync.twilio.com/v1/Services/${sync_service_sid}`;

  // Find or create the Sync List
  const createListRes = await fetch(`${syncBase}/Lists`, {
    method: 'POST', headers: twilioHeaders,
    body: new URLSearchParams({ UniqueName: list_unique_name, ...(ttl > 0 ? { Ttl: String(ttl) } : {}) }),
  });
  let syncListSid: string;
  if (createListRes.ok) {
    syncListSid = (await createListRes.json()).sid;
  } else if (createListRes.status === 409) {
    const getRes = await fetch(`${syncBase}/Lists/${list_unique_name}`, { headers: { 'Authorization': `Basic ${basicAuth}` } });
    if (!getRes.ok) return new Response(JSON.stringify({ error: 'Failed to access Twilio Sync List.' }), { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } });
    syncListSid = (await getRes.json()).sid;
  } else {
    const err = await createListRes.text();
    return new Response(JSON.stringify({ error: 'Failed to create Sync List', details: err.slice(0, 200) }), { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  // ── STEP 1: Snapshot BEFORE ──────────────────────────────────────────
  const countBefore = await snapshotSyncListCount(basicAuth, syncBase, syncListSid);
  console.log(`[send-to-twilio] count_before=${countBefore} sending=${listings.length} listings`);

  // ── STEP 2: Push items ─────────────────────────────────────────────────
  const listItemsUrl = `${syncBase}/Lists/${syncListSid}/Items`;
  let pushed = 0, skipped_no_phone = 0;
  const errors: string[] = [];
  const addedAt = new Date().toISOString();

  for (const l of listings) {
    const agentPhone = l.agent_phone ?? l.agentPhone ?? l.listingAgent?.phone;
    if (!agentPhone) { skipped_no_phone++; }
    const item = {
      agent_name:      l.agent_name    ?? l.agentName    ?? l.listingAgent?.name    ?? '',
      agent_phone:     agentPhone ?? '',
      agent_email:     l.agent_email   ?? l.agentEmail   ?? l.listingAgent?.email   ?? '',
      office_name:     l.office_name   ?? l.officeName   ?? l.listingOffice?.name   ?? '',
      listing_address: l.formatted_address ?? l.formattedAddress ?? '',
      city:            l.city  ?? '',
      state:           l.state ?? '',
      zip:             l.zip_code ?? l.zipCode ?? l.zip ?? '',
      price:           l.price ?? '',
      bedrooms:        l.bedrooms ?? '',
      bathrooms:       l.bathrooms ?? '',
      property_type:   l.property_type ?? l.propertyType ?? '',
      listed_date:     l.listed_date   ?? l.listedDate   ?? '',
      days_on_market:  l.days_on_market ?? l.daysOnMarket ?? '',
      mls_number:      l.mls_number    ?? l.mlsNumber    ?? '',
      added_at: addedAt,
    };
    const itemRes = await fetch(listItemsUrl, {
      method: 'POST', headers: twilioHeaders,
      body: new URLSearchParams({ Data: JSON.stringify(item), ...(ttl > 0 ? { Ttl: String(ttl) } : {}) }),
    });
    if (itemRes.ok) pushed++;
    else {
      const e = await itemRes.json().catch(() => ({}));
      errors.push(`${item.agent_name || item.listing_address}: ${e.message ?? `HTTP ${itemRes.status}`}`);
    }
  }

  // ── STEP 3: Snapshot AFTER ──────────────────────────────────────────
  const countAfter = await snapshotSyncListCount(basicAuth, syncBase, syncListSid);
  console.log(`[send-to-twilio] count_after=${countAfter} pushed=${pushed} errors=${errors.length}`);

  // Delta = ground truth. Fall back to per-request success count if snapshots failed.
  const confirmed = (countBefore >= 0 && countAfter >= 0)
    ? Math.max(0, countAfter - countBefore)
    : pushed;

  console.log(`[send-to-twilio] confirmed=${confirmed} skipped_no_phone=${skipped_no_phone}`);

  await serviceClient.from('integration_connections')
    .update({ last_used_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('integration_id', 'twilio');

  return new Response(JSON.stringify({
    confirmed,
    sent: confirmed,
    pushed,
    skipped_no_phone,
    total: listings.length,
    count_before: countBefore >= 0 ? countBefore : null,
    count_after: countAfter >= 0 ? countAfter : null,
    sync_list_sid: syncListSid,
    list_name: list_unique_name,
    errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
  }), { headers: { ...cors, 'Content-Type': 'application/json' } });
});
