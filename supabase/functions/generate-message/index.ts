import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";

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

// ─── Service → value prop for listing agents ───────────────────────────────
const SERVICE_VALUE_MAP: { keywords: string[]; pitch: string }[] = [
  {
    keywords: ["photo", "photograph", "headshot"],
    pitch: "Professional listing photos drive more online clicks and showings. A great first impression online is the agent's best tool — and fast turnaround (same week or sooner) lets them publish the listing looking polished from day one.",
  },
  {
    keywords: ["video", "reel", "cinematic"],
    pitch: "Listing videos significantly boost engagement on Zillow, Redfin, and social. Agents who use video stand out in their market and attract more buyer leads — which makes them look good to their sellers.",
  },
  {
    keywords: ["virtual tour", "3d tour", "matterport", "walkthrough"],
    pitch: "Virtual tours reduce wasted in-person showings and pull in serious out-of-area buyers. Agents who offer them look more tech-forward and win more listings.",
  },
  {
    keywords: ["drone", "aerial"],
    pitch: "Aerial footage highlights location, lot size, and neighborhood context that ground photography can't capture. It's a premium differentiator for the listing and the agent's brand.",
  },
  {
    keywords: ["stage", "staging", "furnish", "design"],
    pitch: "Staged homes sell faster and at higher prices — which means more commission and a happier seller client. It's one of the highest-ROI services an agent can offer their client.",
  },
  {
    keywords: ["inspect", "inspection", "inspector"],
    pitch: "A pre-listing inspection surfaces issues before buyers do, preventing last-minute price renegotiations and deal collapses. Proactive agents use pre-listing inspections to protect their transactions.",
  },
  {
    keywords: ["roof", "roofing"],
    pitch: "Roof issues are one of the top deal-killers in real estate. A roof certification removes that risk and gives buyers' lenders peace of mind — helping the deal close cleanly.",
  },
  {
    keywords: ["pest", "termite", "bug", "rodent"],
    pitch: "Pest and termite clearance prevents nasty surprises in the inspection report that kill deals or force last-minute price concessions. Getting ahead of it positions the agent as thorough.",
  },
  {
    keywords: ["hvac", "air condition", "heat", "furnace"],
    pitch: "HVAC issues frequently surface in buyer inspections. A clean HVAC report (or a disclosure of known issues) keeps closings on track and agents looking like professionals.",
  },
  {
    keywords: ["clean", "cleaning", "maid", "housekeep", "janitorial"],
    pitch: "A professionally cleaned home photographs better, shows better, and communicates that the seller is serious. It sets a tone of care that buyers respond to.",
  },
  {
    keywords: ["landscap", "lawn", "curb", "garden", "outdoor"],
    pitch: "Curb appeal is the first frame of every online listing photo and the first impression at every showing. A quick landscaping refresh can change how buyers feel before they even walk in.",
  },
  {
    keywords: ["moving", "mover", "relocation", "storage"],
    pitch: "Recommending a reliable, affordable mover is a genuine value-add that sellers appreciate — and agents who go the extra mile build loyalty and referrals.",
  },
  {
    keywords: ["mortgage", "lend", "loan", "financ", "rate"],
    pitch: "Pre-qualified, reliable buyers close faster and with fewer headaches. Agents value lender partners who communicate well and get deals to the finish line.",
  },
  {
    keywords: ["title", "escrow", "closing"],
    pitch: "A smooth, on-time close is what every agent wants. Agents stick with title and escrow partners who make the process easy and don't create surprises at the closing table.",
  },
  {
    keywords: ["insur", "homeowner", "policy", "coverage"],
    pitch: "Helping buyers get coverage quickly and affordably removes a friction point that can delay closings. Agents notice when their referral partners make the transaction easier.",
  },
  {
    keywords: ["apprais"],
    pitch: "An accurate pre-listing appraisal helps agents price confidently and defend that price to sellers. It prevents overpricing and the inevitable price reductions that frustrate everyone.",
  },
  {
    keywords: ["contractor", "repair", "handyman", "renovation", "remodel"],
    pitch: "Inspection contingencies often require quick repairs to keep deals alive. A trusted contractor who can turn around repairs fast is genuinely valuable to an active listing agent.",
  },
  {
    keywords: ["attorney", "legal", "lawyer"],
    pitch: "Contract complexity and seller-side legal questions come up in every transaction. Agents value having a trusted legal referral who won't slow the deal down.",
  },
];

function matchServicePitches(services: string[]): string {
  if (!services.length) return "";

  const matched: string[] = [];
  for (const service of services) {
    const lower = service.toLowerCase();
    const found = SERVICE_VALUE_MAP.find(entry =>
      entry.keywords.some(kw => lower.includes(kw))
    );
    if (found) {
      matched.push(`${service}:\n  ${found.pitch}`);
    } else {
      matched.push(`${service}:\n  Focus on how this saves the agent time or helps them close faster and look more professional to their clients.`);
    }
  }
  return matched.join("\n\n");
}

function formatPriceRange(min: number | null | undefined, max: number | null | undefined): string {
  const fmt = (n: number) => n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
    : `$${(n / 1000).toFixed(0)}K`;
  if (min && max) return `${fmt(min)}–${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  if (max) return `up to ${fmt(max)}`;
  return "";
}

function buildSystemPrompt(ctx: Record<string, unknown>): string {
  const city          = (ctx.city as string) || "";
  const state         = (ctx.state as string) || "";
  const listingType   = (ctx.listing_type as string) || "For Sale";
  const propertyType  = (ctx.property_type as string) || "";
  const channel       = (ctx.channel as string) || "email";
  const businessName  = (ctx.business_name as string) || "";
  const contactName   = (ctx.contact_name as string) || "";
  const serviceTypes  = (ctx.service_type as string[]) || [];
  const daysOld       = ctx.days_old as number | undefined;
  const priceMin      = ctx.price_min as number | null | undefined;
  const priceMax      = ctx.price_max as number | null | undefined;

  const location      = [city, state].filter(Boolean).join(", ");
  const priceRange    = formatPriceRange(priceMin, priceMax);
  const senderName    = contactName || "the sender";
  const senderFull    = businessName ? `${senderName} from ${businessName}` : senderName;
  const servicePitches = matchServicePitches(serviceTypes);
  const isSMS         = channel === "sms";

  return `You are a direct-response copywriter who specializes in real estate vendor outreach. You write short, specific, personalized cold ${isSMS ? "SMS messages" : "emails"} from service providers to listing agents.

━━━ WHO IS SENDING THIS ━━━
${senderFull} offers: ${serviceTypes.length ? serviceTypes.join(", ") : "professional services to real estate agents"}.
Write in first person as ${senderName}. Sound like a real person, not a marketing department.

━━━ THE AUDIENCE ━━━
Listing agents in ${location || "the target market"} who have active ${listingType}${propertyType ? ` ${propertyType}` : ""} listings${priceRange ? ` priced ${priceRange}` : ""}${daysOld ? ` listed within the last ${daysOld} day${daysOld === 1 ? "" : "s"}` : ""}.

Understand their mindset:
- They are busy and receive a lot of generic vendor outreach. Most of it goes straight to trash.
- They respond when a message references THEIR specific listing and makes the value obvious in 10 seconds.
- They care about: closing the deal, looking good to their seller client, and not creating extra work for themselves.
- A well-timed, relevant offer at the moment a listing is fresh is genuinely useful to them — not spam.
${daysOld && daysOld <= 7 ? "- These are NEW listings — the agent is in active setup mode, making decisions about services right now. Urgency and timing are natural to mention." : ""}

━━━ VALUE PROPOSITION BY SERVICE ━━━
Use this to inform your angle. Lead with the benefit to the AGENT (or their seller), not a feature list:

${servicePitches || "Focus on how your service saves the agent time, protects the deal, or helps their client get a better outcome."}

━━━ WRITING STRATEGY ━━━
Every message should follow this structure (even if adapted for tone):
1. HOOK — Acknowledge their specific listing. "I saw your listing at {{address}}" beats any generic opener.
2. VALUE — One sentence on what you can do FOR THIS LISTING. Not your company history.
3. CTA — A single, low-friction ask. "Would this be helpful for {{address}}?" or "Happy to send availability if timing works."

The goal is a reply, not a close. Keep the ask small.

━━━ AVAILABLE MERGE TAGS ━━━
Always use these — never invent fake names or addresses:
- {{agent_name}} — the listing agent's name (use to open the message)
- {{address}} — the property's street address
- {{city}} — the listing's city
- {{price}} — the listing price

━━━ RULES ━━━
- Subject lines: under 60 characters — punchy, specific, personalized
- Preview text: under 90 characters — adds context, doesn't just repeat the subject
- Body: 2–3 short paragraphs max. Trim ruthlessly.
- Use {{agent_name}} in the greeting
- Use {{address}} at least once in the body${isSMS ? "\n- SMS only: 160 characters max total, plain text, no greeting fluff, get to the point in line 1" : ""}

━━━ WHAT TO AVOID ━━━
- "I hope this finds you well" — delete it
- Listing multiple services in one message — pick the most relevant one
- Vague subject lines like "Quick question" or "Following up"
- Corporate buzzwords: world-class, industry-leading, cutting-edge, best-in-class
- Long company backstories — nobody cares yet
- Pressure: "limited time", "act now", "don't miss out"
- More than one CTA — pick one

━━━ OUTPUT FORMAT ━━━
Always label sections on their own line, exactly like this. No commentary outside the labels unless the user asked a general question:

SUBJECT: subject line here
PREVIEW: preview text here
BODY: body paragraph one

body paragraph two

body paragraph three

Only output the fields that were requested.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();

    if (!GROQ_API_KEY) return json({ error: "GROQ_API_KEY not configured" }, 500);

    const systemPrompt = buildSystemPrompt(context ?? {});
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1024,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) return json({ error: data.error?.message ?? "Groq API error" }, 500);

    return json({ reply: data.choices[0].message.content });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
