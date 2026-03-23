# ListingBug Punch List
**Last updated:** March 22, 2026
**How to use:** Jack adds items anytime. Claude reads this at the start of every session.

---

## 🔴 Critical (Human Action Required)

- [ ] **Email verification** — Supabase → Auth → Email → Enable email confirmations. Code ready.
- [ ] **Google OAuth consent screen** — submit at console.cloud.google.com. /privacy and /terms live.
- [ ] **Stripe checkout** — verify working end-to-end on test account. Was failing with "Could not start checkout." STRIPE_SECRET_KEY should be set in Supabase → Edge Functions → Secrets.

---

## 🔴 Bugs (Needs QC)

- [ ] **Stripe checkout** — test upgrade flow on trial account to confirm it works
- [ ] **Search history empty** — verify after running a new search that history tab populates
- [ ] **Saved listings empty** — verify new saves persist to Supabase and show on reload

---

## 🔴 UI Cleanup (Needs QC After Latest Deploy)

- [ ] **Search form simplification** — move zip, radius, lat, lng, beds, baths, price/sqft to Additional Filters. On desktop: City and State join Address row (columns 3+4). Remove static beds/baths from Property Details.
- [ ] **Account/Profile subscription block** — verify removed
- [ ] **Account/Billing payment method** — verify shows zero state (no fake Visa 4242)
- [ ] **Account/Billing history** — verify shows empty state (no sample invoices)
- [ ] **Account/Billing trial date** — verify shows "Trial ends: MM/DD/YY" not "Invalid Date"
- [ ] **ChangePlanModal** — verify no proration language, no Enterprise option, shows clean confirmation
- [ ] **Account/API integrations section** — verify removed, only API keys + Browse Integrations button remains
- [ ] **Account/Usage plan info block** — verify "Starter Plan / Trial Period / N/A" removed
- [ ] **Search history zero state** — verify empty state message updated
- [ ] **Automation history zero state** — verify green background removed
- [ ] **Create Automation: Manual sync** — verify removed from frequency options
- [ ] **Create Automation: Field Mappings** — verify hidden section removed

---

## 🟡 Needs Live Verification

- [ ] **Usage cap** — trial should now allow 4,000 listings (was incorrectly capped at 500). Test after running a search.
- [ ] **API key generation** — test generating a key on account/api. Fixed getSession destructuring bug.
- [ ] **Search history View Results** — verify button opens SearchResultsPage with full table + clickable rows + listing modal
- [ ] **Street View** — verify loads in listing modal on a property with lat/lng
- [ ] **Favicon** — public/favicon.png placed. Verify shows in browser tab.
- [ ] **OG image** — public/og-image.png placed. Verify shows when link shared.
- [ ] **Page title** — verify browser tab shows "ListingBug"

---

## 🟡 Post-Stripe

- [ ] Billing history — real Stripe invoice data (currently empty state)
- [ ] Download invoice button
- [ ] Payment method display — pull real card details from Stripe post-subscription

---

## 🟡 Future / High Value

- [ ] PropertyRadar homeowner data — full implementation (teaser live)
- [ ] CSV Email Delivery backend execution
- [ ] Automation runner backend (scheduled execution)
- [ ] Integrations true status from Supabase

---

## ⚪ Deferred

- [ ] Light mode
- [ ] Facebook/Apple OAuth
- [ ] OAuth integrations — Mailchimp, HubSpot, Salesforce
- [ ] Namecheap CNAME → e53e829ee840f3ad.vercel-dns-017.com
- [ ] Search run history retention policy
- [ ] Saved listings photo grid view

---

## ✅ Completed This Session (March 22, 2026)

### Stripe Billing
- [x] Pricing: Starter $19/mo, Professional $49/mo (repriced from $49/$99)
- [x] Edge functions: create-checkout-session, stripe-webhook v17, stripe-portal
- [x] Webhook in Stripe Workbench, secrets in Supabase
- [x] BillingPage reads real plan/status from Supabase
- [x] ChangePlanModal + PlanComparisonModal wired to Stripe Checkout
- [x] 14-day free trial on Pro, no card required
- [x] Stripe Customer Portal configured
- [x] stripe_customer_id, stripe_subscription_id, stripe_subscription_end on users table

### Bug Fixes
- [x] Usage cap: trial now 4,000 (was incorrectly 500) — edge function v17
- [x] API key generation "not signed in" — fixed getSession destructuring bug
- [x] ChangePlanModal extra brace JSX error — fixed
- [x] ChangePlanModal proration language removed
- [x] ChangePlanModal Enterprise option removed

### Subscription Enforcement
- [x] SubscriptionGate inlined in App.tsx (no separate import)
- [x] Edge function v17 blocks all inactive plan states
- [x] TRIAL_EXPIRED/SUBSCRIPTION_INACTIVE toast in SearchListings

### Trial Abuse Prevention
- [x] Browser fingerprinting on signup
- [x] trial_abuse_flag column on users
- [x] signup_fingerprints table

### Critical Bug Fix
- [x] TDZ blank screen — fixed via rollback to d41b095 + wave reintroduction

### UI / Polish
- [x] Page title → "ListingBug"
- [x] favicon.png + og-image.png placed in public/
- [x] OG + Twitter card meta tags in index.html
- [x] Street View API key live
- [x] Search history cards clickable + View Results button
- [x] search_runs RLS policies
- [x] Tab blackout fix, usage padding, required text removed
- [x] IntegrationsPage available section expands by default
- [x] SavedListingsPage Supabase sync, debug button removed
- [x] CSV export tracking in automation_runs
- [x] Account/Profile subscription block removed
- [x] Account/Billing payment method zero state (null)
- [x] Account/Billing history zero state (empty array)
- [x] Account/Billing trial date label fix
- [x] Account/API integrations section removed
- [x] Account/Usage plan info block removed
- [x] Search history zero state text improved
- [x] Automation history green background removed
- [x] Create Automation: Manual sync removed
- [x] SignUpPage browser fingerprinting
- [x] PlanComparisonModal Starter price $19
