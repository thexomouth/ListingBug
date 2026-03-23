# ListingBug — Launch Plan v4
**Last Updated:** March 22, 2026

---

## Pricing

| Plan | Price | Listings/mo | Notes |
|---|---|---|---|
| Starter | $19/mo | 4,000 | 1 automation, all integrations, CSV |
| Professional | $49/mo | 10,000 | 14-day free trial, no card required |
| Enterprise | Contact sales@thelistingbug.com | Unlimited | Custom quote |

---

## Stack

| Platform | Status |
|---|---|
| Vercel | ✅ Live — auto-deploys on push |
| Supabase | ✅ Live — auth, DB, edge functions |
| Stripe | ✅ Wired — checkout, webhook, portal |
| RentCast | ✅ Live — ~$50/mo |
| Google Street View | ✅ Live — key in ListingDetailModal |

---

## What's Live

- Real listing data via RentCast
- Stripe billing — checkout, webhook, portal, trial enforcement
- Subscription gate — blocks expired/canceled/past_due accounts
- Trial abuse prevention — browser fingerprinting
- Cross-device sync — saved listings, searches, history
- Search history with clickable cards → SearchResultsPage
- Favicon, OG image, page title
- Street View in listing modal

---

## What's Broken / In QC

- Stripe checkout end-to-end — needs test run
- Search form needs simplification (large task — see punch list)
- Create Automation field mappings section — needs removal verification
- Several account page sections need QC after recent cleanup

---

## Remaining Human Actions Before Launch

| Action | Owner |
|---|---|
| Supabase email confirmations | Jack |
| Google OAuth verification | Jack |
| Stripe end-to-end test | Jack + Claude |

---

## Post-Launch Roadmap

1. **PropertyRadar** — homeowner data enrichment, credit model
2. **Automation backend runner** — scheduled execution engine
3. **SEO** — title tags, JSON-LD schema, sitemap, blog posts, directory submissions
4. **OAuth integrations** — Mailchimp, HubSpot, Salesforce
