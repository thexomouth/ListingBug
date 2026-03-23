# ListingBug — MVP Launch Plan v4
**Last Updated:** March 22, 2026 | **Status:** Active

---

## Locked Decisions

| Decision | Answer |
|---|---|
| Pricing | $19/mo Starter · $49/mo Professional · Contact Sales Enterprise |
| Backend | Supabase |
| Data source | RentCast API (live) |
| Billing | Stripe (live — checkout, webhook, portal all wired) |
| Deployment | Vercel (auto-deploys on push to main) |
| Trial | 14-day free trial on Professional, no card required |

---

## Pricing

| Plan | Price | Listings/mo | Key Features |
|---|---|---|---|
| Starter | $19/month | 4,000 | 1 automation, all integrations, CSV exports |
| Professional | $49/month | 10,000 | 14-day free trial, property valuations, priority support |
| Enterprise | Contact sales@thelistingbug.com | Unlimited | Team (10 users), dedicated account manager |

---

## PHASES 1–6 ✅ COMPLETE

All infrastructure is live: Vercel, Supabase, RentCast, Stripe billing.

---

## Current Status — What's Working

- Site live at thelistingbug.com
- Real RentCast listing data
- Stripe billing infrastructure wired (checkout, webhook, portal)
- Subscription enforcement (gate blocks expired/canceled accounts)
- Trial abuse prevention (browser fingerprinting)
- Cross-device sync (saved listings, searches, history)
- Search history with clickable cards → SearchResultsPage
- CSV export tracking
- Street View in listing modal

---

## What's Broken / Needs Fixing Before Launch

### Stripe
- Checkout returning "Could not start checkout" error — verify STRIPE_SECRET_KEY in Supabase secrets
- Trial account hitting usage limit at 500 listings instead of 4,000 — edge function bug

### Account Pages (all UI cleanup)
- Profile: remove redundant Subscription section
- Billing: payment method and billing history need zero states
- Billing: trial date shows "Invalid Date" — fix to show trial_ends_at
- API: remove entire integrations section (just API keys + Browse Integrations button)
- Usage: remove plan info block from top
- ChangePlanModal: remove prorated billing language, remove Enterprise option

### Listings Search
- Simplify form: move zip, radius, lat, lng, beds, baths, price/sqft to Additional Filters
- Desktop layout: City + State join Address row

### Automations
- Remove Field Mappings section from Create Automation wizard
- Remove 'Manual' from sync frequency

### Misc
- Search history zero state missing
- Automation history zero state has green background
- API key generation throws "not signed in" error

---

## Remaining Human Actions Before Launch

| Action | Owner |
|---|---|
| Supabase email confirmations toggle | Jack |
| Google OAuth verification | Jack |
| Place favicon.png in public/ | Jack |
| Place og-image.png in public/ (1200x630) | Jack |
| Verify STRIPE_SECRET_KEY in Supabase secrets | Jack + Claude |

---

## Post-Launch Roadmap

### PropertyRadar Enrichment
- "Get Homeowner Data" teaser live in listing modal
- Full implementation: get-homeowner edge function, credit model ($0.50/lookup retail)

### Automation Backend Runner
- Wizard captures full config. Execution engine needed post-Stripe stability.
- Supabase scheduled functions or external cron → edge function

### SEO & Discoverability
- Title tags, meta descriptions for all public pages
- JSON-LD SoftwareApplication schema on homepage
- sitemap.xml + Google Search Console
- Blog posts targeting key searches
- Product Hunt, Indie Hackers, G2, Capterra submissions
