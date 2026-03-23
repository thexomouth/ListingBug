# ListingBug Punch List
**Last updated:** March 22, 2026
**How to use:** Jack adds items anytime. Claude reads this at the start of every session.

---

## 🔴 Critical (Human Action Required)

- [ ] **Email verification** — Supabase → Auth → Email → Enable email confirmations. Code ready.
- [ ] **Google OAuth consent screen** — submit at console.cloud.google.com. /privacy and /terms live.
- [ ] **Stripe checkout failing** — "Could not start checkout. Please try again." Verify STRIPE_SECRET_KEY in Supabase → Project Settings → Edge Functions → Secrets starts with sk_live_ or sk_test_

---

## 🔴 Bugs (Code Fixes Needed)

- [ ] **Monthly listing limit error on trial** — shows "Monthly listing limit reached" after only 500 listings. Trial cap should be 4,000. Usage meter shows 0/4,000 but dashboard shows 500 imported. Audit edge function v16 usage tracking vs cap logic.
- [ ] **API key generation error** — "not signed in" error when generating API key. User IS signed in. Bug in API key creation handler — missing auth token in request.
- [ ] **Saved listings / search history empty** — may be localStorage vs Supabase sync timing issue. New searches should populate correctly. Verify after next search.

---

## 🔴 UI Cleanup (Code Fixes Needed)

- [ ] **Search form simplification** — move zip, radius, lat, lng, beds, baths, price/sqft to Additional Filters. On desktop: City and State join Address row (columns 3+4). Remove static beds/baths from Property Details (redundant).
- [ ] **Create Automation: remove Field Mappings** — hidden section after selecting destination. Remove entirely.
- [ ] **Create Automation: remove 'Manual'** from sync frequency options.
- [ ] **Account/Profile: remove Subscription block** — entire "Subscription / Professional Plan / Change Plan / Cancel" section. Lives in Billing tab only.
- [ ] **Account/Billing: payment method zero state** — remove fake Visa 4242 card. Show zero state until real payment method added via Stripe. Note: Stripe does return last4/brand/expiry — can display real data post-subscription.
- [ ] **Account/Billing: billing history zero state** — remove sample invoices. Show "No billing history yet" for new accounts.
- [ ] **Account/Billing: trial date fix** — "Next billing date: Invalid Date" → show "Trial ends: MM/DD/YY" using trial_ends_at from Supabase.
- [ ] **ChangePlanModal: remove proration language** — no proration logic exists. Replace with: "Your plan starts today. Billed $X/month from first payment."
- [ ] **ChangePlanModal: remove Enterprise option** — show only Starter + Professional. Below cards add: "For enterprise needs, contact sales@thelistingbug.com for custom solutions."
- [ ] **Account/API: remove integrations section** — remove entire Connected/Available/Future Integrations block. Keep only API key section + single centered "Browse Integrations" button above footer.
- [ ] **Account/Usage: remove plan info block** — remove "Starter Plan / 4,000 listings / Trial Period / N/A" from top of page.
- [ ] **Search history: zero state** — add empty state UI (consistent with "No saved listings yet").
- [ ] **Automation history: remove green background** from zero state section.

---

## 🟡 Needs Live Verification

- [ ] **Search history** — verify View Results button opens SearchResultsPage with full table + clickable rows + listing modal
- [ ] **Agent contact info** — run search, open listing. If blank: DevTools → Network → search-listings → inspect listings[0] agent keys
- [ ] **Street View** — verify loads in listing modal
- [ ] **Favicon** — requires public/favicon.png to be placed manually by Jack
- [ ] **Page title** — verify browser tab shows "ListingBug"

---

## 🟡 Post-Stripe

- [ ] Billing history — real Stripe invoice data
- [ ] Download invoice button
- [ ] Payment method — pull real card details from Stripe after subscription

---

## 🟡 Future / High Value

- [ ] PropertyRadar homeowner data — full implementation (teaser live)
- [ ] CSV Email Delivery backend execution
- [ ] Automation runner backend (scheduled execution)
- [ ] Integrations true status from Supabase
- [ ] OG social image — Jack places public/og-image.png (1200x630)

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
- [x] Pricing: Starter $19/mo, Professional $49/mo
- [x] Edge functions: create-checkout-session, stripe-webhook v16, stripe-portal
- [x] Webhook in Stripe Workbench, STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET in Supabase
- [x] BillingPage reads real plan/status from Supabase
- [x] ChangePlanModal + PlanComparisonModal wired to Stripe Checkout
- [x] 14-day free trial on Pro, no card required
- [x] Stripe Customer Portal configured
- [x] stripe_customer_id, stripe_subscription_id, stripe_subscription_end on users table

### Subscription Enforcement
- [x] SubscriptionGate inlined in App.tsx (no separate import — avoids TDZ crash)
- [x] Edge function blocks canceled/past_due/unpaid/trial_expired at API level
- [x] TRIAL_EXPIRED/SUBSCRIPTION_INACTIVE toast in SearchListings

### Trial Abuse Prevention
- [x] Browser fingerprinting on signup → signup_fingerprints table
- [x] trial_abuse_flag column on users

### Critical Bug Fix
- [x] TDZ crash / blank site all morning — literal backslash-n in JSX + broken import order. Fixed via clean rollback to d41b095 + systematic wave reintroduction.

### UI / Polish
- [x] Page title → "ListingBug"
- [x] Favicon wired (public/favicon.png — Jack places file)
- [x] OG + Twitter card meta tags in index.html
- [x] Street View API key live
- [x] Search history cards clickable + View Results button
- [x] search_runs RLS policies
- [x] Tab blackout fix, usage padding, required text removed
- [x] IntegrationsPage available section expands by default
- [x] SavedListingsPage Supabase sync, debug button removed
- [x] CSV export tracking in automation_runs
- [x] SignUpPage browser fingerprinting
- [x] PlanComparisonModal Starter price $19
