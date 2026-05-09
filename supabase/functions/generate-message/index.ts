import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildSystemPrompt(ctx: Record<string, unknown>): string {
  const city = ctx.city as string || "";
  const state = ctx.state as string || "";
  const listingType = ctx.listing_type as string || "For Sale";
  const propertyType = ctx.property_type as string || "";
  const channel = ctx.channel as string || "email";
  const businessName = ctx.business_name as string || "";
  const contactName = ctx.contact_name as string || "";
  const serviceTypes = (ctx.service_type as string[]) || [];

  return `You are an expert real estate marketing copywriter. You write outreach messages for vendors and service providers reaching out to listing agents about their active listings.

Campaign context:
- Target market: ${city}${state ? `, ${state}` : ""}
- Listing type: ${listingType}${propertyType ? ` · ${propertyType}` : ""}
- Channel: ${channel === "email" ? "Email" : "SMS"}
- Sender: ${contactName || "the sender"}${businessName ? ` from ${businessName}` : ""}${serviceTypes.length ? `\n- Services: ${serviceTypes.join(", ")}` : ""}

Available merge tags (always use these for personalization — never use real names or addresses):
- {{agent_name}} — the listing agent's name
- {{address}} — the property street address
- {{city}} — the listing's city
- {{price}} — the listing price

Writing rules:
- Write in first person from the sender's perspective
- Be warm and human — not corporate or salesy
- Use {{agent_name}} to open the message
- Reference the listing with {{address}} or {{city}}
- Subject lines: under 60 characters, punchy, personalized
- Preview text: under 90 characters, complements the subject
- Message body: 2–4 short paragraphs, end with a clear CTA${channel === "sms" ? "\n- SMS: under 160 characters total, plain text only" : ""}

Output format — always label sections on their own line, exactly like this:
SUBJECT: your subject line
PREVIEW: your preview text
BODY: your
multi-line
body here

Only include the fields that were requested. Do not add commentary outside of the labeled fields unless the user is asking a general question.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();

    if (!ANTHROPIC_API_KEY) return json({ error: "ANTHROPIC_API_KEY not configured" }, 500);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: buildSystemPrompt(context ?? {}),
        messages,
      }),
    });

    const data = await response.json();
    if (!response.ok) return json({ error: data.error?.message ?? "Anthropic API error" }, 500);

    return json({ reply: data.content[0].text });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
