# ListingBug Punch List
**Last updated:** March 24, 2026
**How to use:** Jack adds items anytime. Claude reads this at the start of every session.

## notes for the developer
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 

---

## 🔴 CRITICAL — Fix Now

### In Progress (Current Session)
- [ ] changeplanmodal indicates current plan is starter plan when my account is trial. only add current plan if user is on a paid account and be sure to add it to the right one.
- [ ] in changeplanmodal, add an 'upgrade to starter' button for the starter plan for trial user accounts (not an option right now)
- [ ] saved listings are not saving. saving in listingdetailmodal then closing the modal and reopening it shows unsaved icon design and the saved listing is not appearing on dashboar dor in listings/savedlistings
- [ ] api key generator still not generating ' '
- [ ] saved listings are not saving. leave the page, navigate back and it's reset. this needs to be saved to the user account until they remove it
- [ ] remove all toggles except pricedrop from listings/search
- [ ] password reset tool doesn't recognize an incorrect current password or is failing to initialize 'failed to fetch'
- [ ] update supa schema to track full name for users "Could not find the 'full_name' column of 'users' in the schema cache" when trying to update name
- [ ] when updating profile information in the profile information section of account/profile, allow users to update any one field, don't require full section fill in order to update. for instance, if they onyl wanna update name or company it's fine - update shouldn't be dependent on all fields filled for profile information section
- [ ] in listings/history, if the search run was from a saved search with a name or from an automation with a name, impor the name and use it for the container heading, if no name for the search or run exists, then use the current city/state for container title/heading
- [x] in the hero section of the dashboard, link the 'listings saved' activity meter to the listings/savedlistings page/tab
- [ ] the preview and test page shows a preview payload that was made during prototyping phase and it needs to be dynamic to reflect all of the fields we recieve from our rentcast get sale listings GET function in total which is much more vast, and the fields each platform will want/accept. this  preview payload needs to be prepped for each platform integration/ data 'destination' aswell
- [ \] i want to remove the full field mappings section that comes unhidden after selecting a destination in create automation page (still not right)
- [x] listings page got a background visible in all tabs - remove that shit
- [ ] automation page create an automation tab, when choosing a destination, themap fields section still shows up. remove the entire
- [ ] saved listings are not saving in the db to the user account - they give the appearance of saving but are no longer saved after refresh and do not populate in L:istings/saved listings or dashboard in the saved listigns section
- [ ] automations page my automations tab needs a 'run' button. also the 'active' column is offset from the toggle that should live in it. perhaps the trash icon to remvoe automations is sharing the column with the toggle? if so, give the trash icon it's own blank column with no heading
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [x] Build and push ListingDetailModal rebuild + edge fn v24 field capture
  - `./b.bat` then `git add -A && git commit -m "..." && git push`
- [ ] Verify usage is displayed in the text beneath the search button on listings search
- [x] Open History tab, confirm listings appear under saved run

### Search & Core Functionality
- [x] Search function returning toast error 'Internal server error' — diagnose and fix
- [x] Search history empty after running a search — history tab not populating
- [x] Search history zero state — still showing black screen, needs empty state message
- [x] Search history View Results — can't verify until history populates
- [x] Saved listings empty — new saves not persisting to Supabase on reload
- [ ] Usage stats mismatch — dashboard ≠ account/usage ≠ listings/search. Investigate whether they will reconcile with UUID+Supa fix or needs additional work

### Stripe / Billing
- [ ] Stripe checkout fails: "Could not start checkout. Please try again." — broken on trial→starter and starter→pro
- [ ] Verify Stripe checkout works end-to-end on test account (STRIPE_SECRET_KEY set in Supabase secrets)

### Search Form Cleanup
- [x] Move zip, radius, lat, long, price/sqft to Additional Filters dropdown
- [x] On desktop: City and State join Address row (columns 3+4)
- [x] Remove static beds/baths from Property Details (already in additional filters)
- [x] Move 'state' input up to same row as city (left: city, right: state)
- [ ] Make toggles appear on one row (currently two rows × two columns)
- [ ] Remove 'New Construction' and 'Foreclosure Status' from additional filters dropdown

### Account / Integrations Cleanup
- [x] Create Automation: remove 'Manual Sync' from frequency options
- [ ] Create Automation: remove Field Mappings section entirely. Add note: "Field mappings will be configured per integration at implementation time."
- [x] Automation history table: white background → black background, white/grey text and icon

### API Key Generation
- [ ] API key generation broken — "Unable to generate API key: null value in column "key_hash" of relation "api_keys" violates not-null constraint"


### Listing Detail Modal
- [ ] Save listing button — add to listingdetailmodal
- [x] Street View — verify loads in listing modal on a property with lat/lng

---

## 🟡 PRODUCT — AGENTS PAGE & LEADERBOARD

### New "Agents" nav item
- [ ] Add `Agents` between `Listings` and `Automations` in TopNav
- [ ] Create `/agents` route and `AgentsPage.tsx`
- [ ] Build filterable agent leaderboard from existing `listings` DB data (no new API calls)
- [ ] don't forget the agent & office website data we get
  - Aggregate by `agent_name` + `agent_phone` + `agent_email`
  - Columns: Agent Name, Brokerage, # Listings, Avg Price, Avg DOM, Price Drops, ZIP codes
  - Filters: ZIP code, time window (7/30/90 days), property type, min listing count
  - Sort: by any column
  - Each row expandable or links to agent profile view
- [ ] Agent profile view: listing history, call/email CTA buttons, brokerage info
- [ ] Add DB index: `listings(agent_name, listed_date)` for query performance

---

## 🟡 PRODUCT — STAGING COMPANY GTM PIVOT

### Target audience: Home Staging Companies
**Core insight:** Stagers need to know which agents list frequently so they can
build relationships *before* the listing happens. The leaderboard is their killer feature.

**Their workflow:**
1. Search market → see all new listings (DOM 0–3 days)
2. Agents tab → filter by ZIP, sort by volume
3. Find top agents in territory not yet in their network
4. Export CSV → name, phone, email ready for outreach
5. Set automation alert → notified same day a new listing hits their farm area

- [ ] Write one concrete staging company use case (2–3 paragraphs, real scenario)
- [ ] Draft testimonial copy from existing local business relationship:
      "I built an early version of this for [business]. They've been using it [X months]. Here's what changed: [outcome]."
- [ ] Get permission to use their name and outcome on site

---

## 🟡 MARKETING — SIGNED-OUT PAGES OVERHAUL

### Philosophy: story first, features never
Current problem: too much text explaining concepts. Fix: one scenario a stager
instantly recognizes, then show the product doing it.

### Homepage hero rewrite
- [ ] Headline: "New listing just hit your market. Do you know about it?"
- [ ] Sub: "ListingBug monitors your territory and tells you the moment it happens —
      so you can be the first stager to call."
- [ ] CTA: "See it in action" — triggers sample search, no signup required

### "Who is this for?" section
- [ ] Persona cards (visible without login):
  - 🏠 Home Stagers — "Be first to every new listing in your territory"
  - 📸 Photographers — "Know which agents list most in your ZIP"
  - 🏦 Lenders — "Find agents with consistent deal flow"
  - 💼 Investors — "Surface price drops and distressed inventory automatically"
  - 🏗️ Contractors — "Identify renovation-ready listings before they sell"

### Demo / aha moment
- [ ] Sample search widget on homepage (unauthenticated, limited to 5 results)
      OR animated GIF of search → results → export flow
- [ ] "Try a sample search" CTA before signup wall

### Social proof
- [ ] Testimonial section using local staging business case study
- [ ] Format: name/company + 1–2 sentence outcome + time using it


---

## 🟢 CONTENT — MARKET INTELLIGENCE REPORTS

- [ ] Weekly posts from real ListingBug data (LinkedIn / Instagram / local Facebook):
  - "Top 10 agents listing homes in Denver this week"
  - "Denver listings that dropped price in the last 48 hours"
  - "New luxury listings (>$1M) this week in Metro Denver"
- [ ] Use as proof-of-product for grant applications and investor conversations

---

## 🟢 MESSAGING — AUTOMATION LANGUAGE CLEANUP

- [ ] Audit all automation copy in app and marketing pages
- [ ] Replace "outreach" → "workflow"
- [ ] Replace "contact people" → "trigger your systems"
- [ ] Replace "send emails to" → "export to your CRM" / "alert your team"
- Safe approved phrases:
  - "Turn every new listing into an automated workflow"
  - "Trigger your CRM, ads, or internal processes the moment a listing hits"
  - "Your marketing engine, powered by live listing intelligence"

---

## 🔵 LAUNCH SEQUENCE

1. **Fix current bugs** — UUID/search/history/Stripe — this week
2. **Build Agents page + leaderboard** — highest leverage, no API cost
3. **Rewrite homepage hero** — staging use case, 1 hour of copy
4. **Add testimonial** — one conversation with local business
5. **Add "Who is this for?" section** — persona cards
6. **Add sample search CTA** — small dev lift, high conversion impact
7. **Start Market Intelligence content** — LinkedIn, free, demonstrates product
8. **Grant applications** — staging case study + leaderboard as proof of traction

---

## 🟡 NEEDS LIVE QA

- [ ] Usage cap — trial should allow 4,000 listings (was 500). Test after search is fixed
- [ ] Google OAuth consent screen — submit at console.cloud.google.com (/privacy and /terms live)
- [ ] ChangePlanModal — center the two remaining plan options (blank space where Enterprise was)
- [ ] ChangePlanModal — restore "Upgrades take effect immediately" line (non-proration version)

---

## 🟡 POST-STRIPE QA (needs test paid account)

- [ ] Billing history — real Stripe invoice data
- [ ] Download invoice button
- [ ] Payment method — pull real card from Stripe post-subscription
- [ ] Stripe Customer Portal link on Billing page

---

## 📋 BACKLOG / FUTURE

- [ ] OAuth integrations — Mailchimp, HubSpot, Salesforce (flagged as launch critical — revisit)
- [ ] PropertyRadar homeowner data — full implementation (teaser live, waiting on search fix)
- [ ] CSV email delivery backend
- [ ] Automation runner backend (scheduled execution)
- [ ] Email notification system for automation alerts
- [ ] Saved Listings page improvements
- [ ] Search run history retention policy
- [ ] Saved listings photo grid view
- [ ] Mobile app (post-funding)
- [ ] Facebook/Apple OAuth
- [ ] Namecheap CNAME → e53e829ee840f3ad.vercel-dns-017.com
- [ ] Custom email templates for Supabase auth emails (skeleton in place)
- [ ] Light mode

---

## ✅ COMPLETED

- [x] Email verification — Supabase auth enabled, working
- [x] Account/Profile — placeholders with grey color until input given
- [x] Account/Profile — update password working with edge function
- [x] Account/Billing — trial date label fixed (was "Invalid Date")
- [x] Account/Billing — payment method shows zero state (no fake Visa)
- [x] Account/Billing — history shows empty state (no fake invoices)
- [x] Account/API — integrations section removed
- [x] Account/Usage — plan info block removed
- [x] ChangePlanModal — trial shows as "Trial" not "Starter"
- [x] ChangePlanModal — proration language removed
- [x] ChangePlanModal — Enterprise option removed
- [x] Cancel subscription modal — shows correct trial plan and dates
- [x] Automation history — green background removed
- [x] Create Automation — Manual Sync removed from frequency options
- [x] search_runs — UUID fix (was Date.now() string, now crypto.randomUUID())
- [x] search_runs — loads results_json from DB for cross-device support
- [x] UsagePage — auth fix (getSession → getUser), projection formula corrected
- [x] CSV export — professional format: company header, search params, 28 columns, sort + contact filter
- [x] ListingDetailModal — rebuilt with all RentCast fields, agent contact at top
- [x] Edge function v24 — captures all RentCast fields including garage, pool, stories, description, history
- [x] Stripe: Starter $19/mo, Pro $49/mo
- [x] Stripe: checkout, webhook, portal edge functions
- [x] Stripe: 14-day free trial, no card required
- [x] Browser fingerprinting on signup
- [x] SubscriptionGate + trial/inactive enforcement in edge function
- [x] Favicon + OG image + page title
- [x] Street View API key live
- [x] Search history cards clickable + View Results button
- [x] SavedListingsPage Supabase sync
