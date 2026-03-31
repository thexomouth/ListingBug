# ListingBug — SEO Audit Notes
*Generated March 31, 2026 — for human review, no code changes made*

---

## Existing Pages — Recommended Improvements

### / — Home Page
- **Title tag**: Currently "ListingBug — Real Estate Listing Alerts & Workflow Automation" ✅ (updated)
- **Meta description**: Updated to emphasise service providers + CRM/workflow angle ✅
- **H1**: Verify the hero H1 includes a primary keyword like "real estate listing alerts" or "new listings into your workflows" — confirm it's an actual `<h1>` tag, not styled div
- **Audience copy**: Hero copy references "agents, investors, and wholesalers" in some places — update to match target audience (service providers: inspectors, brokers, contractors, photographers, etc.)
- **Internal links**: Add links from homepage sections to `/for/mortgage-brokers`, `/for/property-service-providers`, and `/blog` — currently none exist
- **Schema markup**: Add `SoftwareApplication` JSON-LD schema to the homepage for rich results eligibility
- **Missing**: No FAQ section targeting "People Also Ask" queries — add FAQ targeting "what is ListingBug", "how does listing alert automation work", "what integrations does ListingBug have"

---

### /how-it-works
- **Title tag**: Add a specific title like "How ListingBug Works — Automated Listing Alerts & CRM Integration"
- **Meta description**: Missing page-specific meta — falls back to site default
- **H1 keyword**: Confirm H1 includes "how it works" and a secondary keyword
- **Internal links**: Add links to `/for/` persona pages in relevant step descriptions — e.g. step 3 (connect CRM) → link to `/integrations`
- **Schema**: Consider `HowTo` JSON-LD schema — Google can show numbered steps directly in search results

---

### /use-cases
- **Title tag**: Should be "Real Estate Listing Alerts — Use Cases for Service Providers | ListingBug"
- **Meta description**: No page-specific meta — add one targeting "real estate service provider listing alerts"
- **Opportunity**: Each use case section (Property Services, Home Improvement, Transaction Support) should link to its corresponding `/for/` persona page
  - Property Services → `/for/property-service-providers`
  - Home Improvement → `/for/home-improvement-pros`
  - Transaction Support → `/for/transaction-services`
- **Keyword gap**: Page doesn't target "home inspector real estate leads", "contractor real estate agent outreach" etc. — covered by blog posts, but use-cases page could be richer

---

### /integrations
- **Title tag**: Should be "Real Estate CRM & Marketing Integrations | ListingBug"
- **Meta description**: Add page-specific meta — currently uses site default
- **Content gap**: Integration cards don't describe *what the workflow looks like* for each integration — a "HubSpot workflow example" paragraph would target long-tail queries like "listingbug hubspot integration"
- **Internal links**: Add link to `/integrations/guide` from each integration card description

---

### /automation
- **Title tag**: Should be "Automated Real Estate Listing Alerts — Set It & Forget It | ListingBug"
- **Meta description**: Add one targeting "automate real estate listing search" and "scheduled listing alerts"
- **H1**: Ensure primary keyword is in H1

---

### /data-sets
- **Title tag**: Should be "Real Estate Listing Data — What's Included | ListingBug"
- **Meta description**: Add one targeting "real estate listing data fields", "listing agent contact data"
- **Opportunity**: This page could rank for "real estate listing data API" and "MLS listing data fields" — make sure those phrases appear naturally in the content

---

### /about
- **Schema**: Add `Organization` JSON-LD schema with name, url, logo, sameAs (social profiles)
- **Internal links**: Link to relevant product pages from the about page

---

## SPA / Technical SEO Limitations

**Important — applies to all pages:**

This is a React SPA (Vite, client-rendered). Google renders JavaScript but with a processing delay — pages may be indexed slower and less reliably than server-rendered alternatives.

**Recommended long-term improvements:**
1. **Per-page meta tags**: Currently all pages share the same `<title>` and `<meta description>` from `index.html`. Implementing `react-helmet-async` would allow each page to set its own meta tags (still client-rendered, but helps). A larger improvement would be migrating to Next.js for true SSR.
2. **Vercel prerendering**: Consider enabling Vercel's prerendering for static pages — this generates HTML snapshots for crawlers without a full Next.js migration.
3. **Sitemap submission**: Submit `https://thelistingbug.com/sitemap.xml` to Google Search Console manually to accelerate indexing of all new pages.

---

## New SEO Pages Added (this session)

| URL | Target Keywords |
|-----|----------------|
| `/for/mortgage-brokers` | "listing alerts for mortgage brokers", "real estate agent referrals mortgage broker" |
| `/for/property-service-providers` | "listing alerts for home inspectors", "connect with listing agents" |
| `/for/home-improvement-pros` | "listing alerts for contractors", "find motivated sellers listing alerts" |
| `/for/transaction-services` | "listing alerts for insurance agents", "real estate photographer listing alerts" |
| `/vs/zillow` | "listingbug vs zillow", "zillow alternative real estate professionals" |
| `/blog/automate-agent-outreach` | "automate real estate agent outreach" |
| `/blog/listing-alerts-for-mortgage-brokers` | "listing alerts mortgage brokers", "mortgage broker agent referrals" |
| `/blog/listing-alerts-for-property-services` | "listing alerts home inspectors", "property service provider agent leads" |
| `/blog/listing-alerts-for-contractors` | "listing alerts contractors", "motivated sellers listing alerts" |
| `/blog/listing-alerts-for-insurance-agents` | "listing alerts insurance agents", "new homeowner insurance leads" |
| `/blog/real-estate-listing-alerts-guide` | "real estate listing alerts guide", "MLS listing alerts" |
| `/blog/listingbug-vs-zillow` | "listingbug vs zillow", "zillow alternative" |

**None of these pages are linked from the main nav** — they are discoverable via the sitemap and internal blog post links only.

---

## Action Items for You

- [ ] Submit sitemap to Google Search Console: `https://thelistingbug.com/sitemap.xml`
- [ ] Add `/for/` persona links to the Use Cases page cards (each card → its persona page)
- [ ] Update homepage hero copy to reflect "service providers" audience, not "agents and investors"
- [ ] Consider `react-helmet-async` for per-page meta tags as a near-term improvement
- [ ] Consider Vercel prerendering or Next.js migration as a longer-term SEO investment
