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

// ─── Service → value prop + subject line strategy ─────────────────────────
interface ServiceEntry {
  keywords: string[];
  pitch: string;
  subjectAngle: string;
  subjectFormulas: string[];
}

const SERVICE_MAP: ServiceEntry[] = [
  {
    keywords: ["photo", "photograph", "headshot"],
    pitch: "Professional listing photos drive more online clicks and showings. A great first impression online is the agent's best tool — and fast turnaround (same week or sooner) lets them publish the listing looking polished from day one.",
    subjectAngle: "First impression — agents fear losing buyers in the first 3 seconds of a listing click. Lean into speed and quality.",
    subjectFormulas: [
      "{{address}} — photos ready 24 hrs",
      "Pro photos for {{address}} — {{city}}",
      "listing photos — {{address}}",
    ],
  },
  {
    keywords: ["video", "reel", "cinematic"],
    pitch: "Listing videos significantly boost engagement on Zillow, Redfin, and social. Agents who use video stand out in their market and attract more buyer leads — which makes them look good to their sellers.",
    subjectAngle: "Differentiation — video listings get 10x more engagement. Agents want to stand out from competitors in the same neighborhood.",
    subjectFormulas: [
      "video walkthrough — {{address}}",
      "{{address}}: listing video available",
      "video for {{address}} — {{city}}",
    ],
  },
  {
    keywords: ["virtual tour", "3d tour", "matterport", "walkthrough"],
    pitch: "Virtual tours reduce wasted in-person showings and pull in serious out-of-area buyers. Agents who offer them look more tech-forward and win more listings.",
    subjectAngle: "Buyer convenience — 24/7 viewing without scheduling. Lets pre-qualified buyers self-qualify before ever stepping inside.",
    subjectFormulas: [
      "3D tour for {{address}}",
      "interactive tour — {{address}} live",
      "virtual walkthrough — {{address}}",
    ],
  },
  {
    keywords: ["drone", "aerial"],
    pitch: "Aerial footage highlights location, lot size, and neighborhood context that ground photography can't capture. It's a premium differentiator for the listing and the agent's brand.",
    subjectAngle: "Wow factor — dramatic aerials make listings unforgettable. Highlight land, pool, acreage, or neighborhood prestige.",
    subjectFormulas: [
      "aerial shots — {{address}}",
      "drone footage for {{address}} — {{city}}",
      "{{address}}: aerials available",
    ],
  },
  {
    keywords: ["stage", "staging", "furnish", "design"],
    pitch: "Staged homes sell faster and at higher prices — which means more commission and a happier seller client. It's one of the highest-ROI services an agent can offer their client.",
    subjectAngle: "Value unlock — staging increases perceived home value 10–20% and cuts time-on-market. Agents fear 'tired' first impressions.",
    subjectFormulas: [
      "staging for {{address}} — {{city}}",
      "pre-listing staging — {{address}}",
      "{{address}}: staging consult available",
    ],
  },
  {
    keywords: ["inspect", "inspection", "inspector"],
    pitch: "A pre-listing inspection surfaces issues before buyers do, preventing last-minute price renegotiations and deal collapses. Proactive agents use pre-listing inspections to protect their transactions.",
    subjectAngle: "Deal protection — inspections prevent surprises that kill deals after appraisal. Agents fear losing commission to undisclosed issues.",
    subjectFormulas: [
      "pre-listing inspection — {{address}}",
      "{{address}} inspection — 48 hr report",
      "inspection available — {{address}}",
    ],
  },
  {
    keywords: ["roof", "roofing"],
    pitch: "Roof issues are one of the top deal-killers in real estate. A roof certification removes that risk and gives buyers' lenders peace of mind — helping the deal close cleanly.",
    subjectAngle: "Deal-killer prevention — roof problems tank appraisals and kill buyer financing. Agents need proof of soundness to close fast.",
    subjectFormulas: [
      "roof cert for {{address}} — fast",
      "roof clearance — {{address}}",
      "{{address}}: roof certification available",
    ],
  },
  {
    keywords: ["pest", "termite", "bug", "rodent"],
    pitch: "Pest and termite clearance prevents nasty surprises in the inspection report that kill deals or force last-minute price concessions. Getting ahead of it positions the agent as thorough.",
    subjectAngle: "Hidden liability elimination — termites are deal-killers in underwriting. Agents need fast clearance to avoid contingency failures.",
    subjectFormulas: [
      "pest clearance — {{address}}",
      "termite cert for {{address}} — {{city}}",
      "{{address}}: pest-free certificate",
    ],
  },
  {
    keywords: ["hvac", "air condition", "heat", "furnace"],
    pitch: "HVAC issues frequently surface in buyer inspections. A clean HVAC report (or a disclosure of known issues) keeps closings on track and agents looking like professionals.",
    subjectAngle: "System reliability proof — buyers fear $5K+ HVAC replacements. Pre-certification removes buyer objections before they arise.",
    subjectFormulas: [
      "HVAC certified — {{address}}",
      "system check for {{address}} — {{city}}",
      "{{address}}: HVAC report available",
    ],
  },
  {
    keywords: ["clean", "cleaning", "maid", "housekeep", "janitorial"],
    pitch: "A professionally cleaned home photographs better, shows better, and communicates that the seller is serious. It sets a tone of care that buyers respond to.",
    subjectAngle: "Move-in ready perception — sparkling homes increase offer rates. Agents love listings that feel cared-for at first showing.",
    subjectFormulas: [
      "turnkey clean — {{address}}",
      "move-in clean for {{address}} — {{city}}",
      "{{address}}: listing clean available",
    ],
  },
  {
    keywords: ["landscap", "lawn", "curb", "garden", "outdoor"],
    pitch: "Curb appeal is the first frame of every online listing photo and the first impression at every showing. A quick landscaping refresh can change how buyers feel before they even walk in.",
    subjectAngle: "Curb appeal investment — overgrown yards drop perceived value 5–15%. First exterior impression drives traffic before the door opens.",
    subjectFormulas: [
      "curb appeal — {{address}}",
      "landscape refresh for {{address}}",
      "{{address}}: yard cleanup available",
    ],
  },
  {
    keywords: ["moving", "mover", "relocation", "storage"],
    pitch: "Recommending a reliable, affordable mover is a genuine value-add that sellers appreciate — and agents who go the extra mile build loyalty and referrals.",
    subjectAngle: "Coordination relief — agents need movers who understand transaction timelines. Reduces seller friction and last-minute deal delays.",
    subjectFormulas: [
      "move coordination — {{address}}",
      "closing-day movers — {{city}}",
      "{{address}}: movers available your timeline",
    ],
  },
  {
    keywords: ["mortgage", "lend", "loan", "financ", "rate"],
    pitch: "Pre-qualified, reliable buyers close faster and with fewer headaches. Agents value lender partners who communicate well and get deals to the finish line.",
    subjectAngle: "Speed of capital — agents fear financing delays killing deals. Fast pre-approvals that close in days are genuinely valuable.",
    subjectFormulas: [
      "fast pre-approvals for {{city}} buyers",
      "buyers for {{address}} — financing ready",
      "{{city}} listings: quick loan approvals",
    ],
  },
  {
    keywords: ["title", "escrow", "closing"],
    pitch: "A smooth, on-time close is what every agent wants. Agents stick with title and escrow partners who make the process easy and don't create surprises at the closing table.",
    subjectAngle: "Deal finality — agents fear title liens and slow closings. Fast, transparent process = deals done without drama.",
    subjectFormulas: [
      "title for {{address}} — fast close",
      "{{address}}: clean title available",
      "smooth close — {{address}}, {{city}}",
    ],
  },
  {
    keywords: ["insur", "homeowner", "policy", "coverage"],
    pitch: "Helping buyers get coverage quickly and affordably removes a friction point that can delay closings. Agents notice when their referral partners make the transaction easier.",
    subjectAngle: "Underwriting certainty — properties with insurance issues stall closings. Fast coverage removes lender objections.",
    subjectFormulas: [
      "coverage ready — {{address}}",
      "{{address}}: insurance clearance",
      "insurable — {{address}}, {{city}}",
    ],
  },
  {
    keywords: ["apprais"],
    pitch: "An accurate pre-listing appraisal helps agents price confidently and defend that price to sellers. It prevents overpricing and the inevitable price reductions that frustrate everyone.",
    subjectAngle: "No appraisal surprises — shortfalls kill 18% of deals. Pre-appraisal or fast turnaround keeps transactions on track.",
    subjectFormulas: [
      "appraisal for {{address}} — {{city}}",
      "fast appraisal — {{address}}",
      "{{address}}: value cert available",
    ],
  },
  {
    keywords: ["contractor", "repair", "handyman", "renovation", "remodel"],
    pitch: "Inspection contingencies often require quick repairs to keep deals alive. A trusted contractor who can turn around repairs fast is genuinely valuable to an active listing agent.",
    subjectAngle: "Contingency resolution — buyers request repairs; agents need fast quotes to negotiate. Speed wins.",
    subjectFormulas: [
      "repair quote — {{address}}",
      "{{address}}: contractor available now",
      "inspection fixes — {{address}}, {{city}}",
    ],
  },
  {
    keywords: ["attorney", "legal", "lawyer"],
    pitch: "Contract complexity and seller-side legal questions come up in every transaction. Agents value having a trusted legal referral who won't slow the deal down.",
    subjectAngle: "Risk elimination — agents fear legal entanglements. Fast, clear counsel = confident closings.",
    subjectFormulas: [
      "contract review — {{address}}",
      "{{address}}: legal cleared",
      "real estate attorney — {{city}}",
    ],
  },
];

function matchService(services: string[]): ServiceEntry | null {
  if (!services.length) return null;
  const lower = services[0].toLowerCase();
  return SERVICE_MAP.find(entry => entry.keywords.some(kw => lower.includes(kw))) ?? null;
}

function buildServiceContext(services: string[]): { pitch: string; subjectBlock: string } {
  const entry = matchService(services);
  const label = services[0] ?? "your service";

  if (!entry) {
    return {
      pitch: `${label}:\n  Focus on how this saves the agent time, protects the deal, or helps their client get a better outcome.`,
      subjectBlock: `Lead with the property address and make the value clear in under 6 words. Use {{address}} in the subject.`,
    };
  }

  const formulaList = entry.subjectFormulas.map(f => `  • ${f}`).join("\n");
  return {
    pitch: `${label}:\n  ${entry.pitch}`,
    subjectBlock: `Angle: ${entry.subjectAngle}\n\nProven formulas — pick one and adapt it (always include {{address}} or {{city}}):\n${formulaList}`,
  };
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

// ─── Goal / Tone / Hook context maps ─────────────────────────────────────────
const GOAL_MAP: Record<string, string> = {
  'Make Sales': 'Drive action — move the agent toward booking or hiring you. Create desire. CTA should push for a concrete next step: schedule a call, get a quote, confirm availability. Every sentence should earn its place.',
  'Get Engagement': 'Spark a conversation — a reply is the only win. Keep the ask tiny. Ask a question or offer something with zero friction. Do not pitch hard. An open loop ("curious what you\'re doing for photos on this one?") beats a sales paragraph.',
  'Repeat Business': 'Re-activate a relationship — this agent may already know you. Skip the intro, get to the point. Reference their market or a past interaction if relevant. The tone should feel like a follow-up from a trusted vendor, not a cold pitch.',
  'Spread Awareness': 'Plant a flag — even if they don\'t reply now, they should remember you next time they need this service. Prioritize a memorable, specific statement of what you do and who you serve in this market. No pressure, no hard sell.',
};

const TONE_MAP: Record<string, string> = {
  'Funny': 'Use light, dry humor where it fits naturally. One well-placed line beats forced cheerfulness. Do not be cringe — aim for a knowing smile, not a dad joke.',
  'Optimistic': 'Upbeat and forward-looking. Frame everything as an opportunity. Energy and enthusiasm, but not over the top.',
  'Formal': 'Professional and structured. Complete sentences. No contractions. Measured, credible tone throughout.',
  'Informal': 'Casual and direct. Contractions are fine. Short sentences. Write like you\'re texting a colleague.',
  'Friendly': 'Warm and approachable. Feels like a peer reaching out, not a salesperson. Genuine, not performative.',
  'Entertaining': 'Make it worth reading. Something unexpected — a vivid image, a sharp observation, an unusual angle. Being boring is the biggest failure.',
  'Professional': 'Competent and credible. Confident without being pushy. Focused on results and reliability. No fluff.',
};

const HOOK_MAP: Record<string, string> = {
  'Fast turnaround': 'Speed is the differentiator. The agent is under timeline pressure — you can help them move fast. Turnaround time or same-week availability should appear early.',
  'Best price': 'Value and affordability are the angle. Be concrete — "free quote" or a specific offer beats vague promises about saving money.',
  'Premium quality': 'Quality and results are the differentiator. Reference outcomes, craftsmanship, or what great work does for the listing.',
  'Local market': 'Local expertise is the credibility. You know this neighborhood, this market, these listings. Specificity is the hook — mention the city or area.',
  'Free consult': 'Zero friction is the angle. The first step costs nothing. Make it trivially easy to say yes to a conversation.',
};

function buildSystemPrompt(ctx: Record<string, unknown>, goal?: string, tone?: string, hook?: string): string {
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

  const location       = [city, state].filter(Boolean).join(", ");
  const priceRange     = formatPriceRange(priceMin, priceMax);
  const senderName     = contactName || "the sender";
  const senderFull     = businessName ? `${senderName} from ${businessName}` : senderName;
  const serviceCtx     = buildServiceContext(serviceTypes);
  const isSMS          = channel === "sms";

  return `You are a direct-response copywriter who specializes in real estate vendor outreach. You write short, specific, personalized cold ${isSMS ? "SMS messages" : "emails"} from service providers to listing agents.

━━━ WHO IS SENDING THIS ━━━
${senderFull} offers: ${serviceTypes.length ? serviceTypes.join(", ") : "professional services to real estate agents"}.
Write in first person as ${senderName}. Sound like a real person, not a marketing department.

━━━ THE AUDIENCE ━━━
Listing agents in ${location || "the target market"} who have active ${listingType}${propertyType ? ` ${propertyType}` : ""} listings${priceRange ? ` priced ${priceRange}` : ""}${daysOld ? ` listed within the last ${daysOld} day${daysOld === 1 ? "" : "s"}` : ""}.

Their mindset:
- They are busy and receive a flood of generic vendor outreach. Most of it goes straight to trash.
- They respond when a message references THEIR specific listing and makes the value obvious in 10 seconds.
- They care about: closing the deal, looking good to their seller client, and not creating extra work for themselves.
- A well-timed, relevant offer at the moment a listing is fresh is genuinely useful to them — not spam.
${daysOld && daysOld <= 7 ? "- These are NEW listings — the agent is in active setup mode, making vendor decisions right now. Timing is natural to mention." : ""}

━━━ VALUE PROPOSITION ━━━
Lead with the benefit to the AGENT (or their seller), not a feature list:

${serviceCtx.pitch}
${goal || tone || hook ? `
━━━ CAMPAIGN BRIEF ━━━
${goal && GOAL_MAP[goal] ? `Goal — ${goal}: ${GOAL_MAP[goal]}` : ''}
${tone && TONE_MAP[tone] ? `\nTone — ${tone}: ${TONE_MAP[tone]}` : ''}
${hook && HOOK_MAP[hook] ? `\nMain angle — ${hook}: ${HOOK_MAP[hook]}` : ''}` : ''}

━━━ SUBJECT LINE STRATEGY ━━━
${isSMS ? "N/A — SMS has no subject line. Get to the point in line 1." : `${serviceCtx.subjectBlock}

Additional rules for subject lines:
- Under 60 characters — fits iPhone inbox preview
- Lowercase preferred — feels less sales-y, more peer-to-peer
- No question marks — statements outperform questions in cold vendor email
- Lead with {{address}} or {{city}} when possible — specificity is the hook
- Avoid: "Quick question", "Following up", "Checking in", "Just wanted to…"`}

━━━ WRITING STRATEGY ━━━
Every message should follow this structure:
1. HOOK — Acknowledge their specific listing. "Saw your listing at {{address}}" beats any generic opener.
2. VALUE — One sentence on what you can do FOR THIS LISTING. Not your company history.
3. CTA — A single, low-friction ask. "Worth a quick chat?" or "Happy to send availability if timing works."

The goal is a reply, not a close. Keep the ask small.

━━━ AVAILABLE MERGE TAGS ━━━
Always use these — never invent fake names or addresses:
- {{agent_name}} — the listing agent's name (use to open the message)
- {{address}} — the property's street address
- {{city}} — the listing's city
- {{price}} — the listing price

━━━ RULES ━━━
- Subject lines: under 60 characters, lowercase, specific, include {{address}} or {{city}}
- Preview text: under 90 characters — adds context, doesn't just repeat the subject
- Body: 2–3 short paragraphs max. Trim ruthlessly. Under 100 words is ideal.
- Use {{agent_name}} in the greeting
- Use {{address}} at least once in the body${isSMS ? "\n- SMS: 160 characters max total, plain text, no greeting fluff, lead with the value in line 1" : ""}

━━━ WHAT TO AVOID ━━━
- "I hope this finds you well" — delete it
- Vague subject lines: "Quick question", "Following up", "Just checking in"
- Generic subject lines that don't mention the property or service
- Corporate buzzwords: world-class, industry-leading, cutting-edge, best-in-class
- Long company backstories — nobody cares yet
- Pressure language: "limited time", "act now", "don't miss out"
- More than one CTA — pick one and stop

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
    const { messages, context, goal, tone, hook } = await req.json();

    if (!GROQ_API_KEY) return json({ error: "GROQ_API_KEY not configured" }, 500);

    const systemPrompt = buildSystemPrompt(context ?? {}, goal, tone, hook);
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
