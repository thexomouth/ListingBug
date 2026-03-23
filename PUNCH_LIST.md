# ListingBug Punch List
**Last updated:** March 22, 2026
**How to use:** Jack adds items anytime. Claude reads this at the start of every session.

---

## 🔴 Critical (Human Action Required)

- [x] **Email verification** — Supabase → Auth → Email → Enable email confirmations. Code ready. this is working but we need to circle back later to write more thorough and specific, custom emails
- [ ] **Google OAuth consent screen** — submit at console.cloud.google.com. /privacy and /terms live.
- [ ] **Stripe checkout** — verify working end-to-end on test account. Was failing with "Could not start checkout." STRIPE_SECRET_KEY should be set in Supabase → Edge Functions → Secrets. exists in supa - still failing
- [ ] the usage stats on dashboard do not match usage stats in account/usage or listings/search. there was logic to use local storage when the search resulting in the 500 was run and that's been changed to use supa... but i'm wanting you to investigate why they don't match now and if they will match as it's written for other new accounts that search for listings
- [ ] the search form simplification is not complete
- [ ] the search function in listings/search is not working returning toast error: 'Internal server error' please diagnose and fix
- [ ] there is sample data in the account/profile page in the profile information section. introduce standard placeholders with grey color until input is given, then text color is white for the input "Profile Information
full name
Sarah Martinez
email
sarah.martinez@realestatepros.com
company
Martinez Realty Group
Save Changes"
- [ ] in account/usage theree's a section with 'Projected End-of-Month Usage' which is also not up to date with accurate usage. this could be due to the known previous issue with using localstorage rather than supa which has been changed. investigate and determine if the usage will be tracked as is going forward or if this needs fixing bc the dashboard reflects usage but this doesn't. it's a calculation as well so be sure logic is written that enables it to work
- [ ] stripe checkout fails to initialize when upgrading from starter to pro "Could not start checkout. Please try again."
- [ ] in the 'change your plan modal' trial users are shown starter plan as their 'current plan' but this is not accurate. they're on trial which shares the abilities of the starter plan, but must be a separate plan type so that trial users can be able to select starter from this 'change your plan' modal otherwise, everyone is forced to go from trial to pro then downgrade... in this same modal and page of it, the text "Could not start checkout. Please try again." should be white. right now it's grey or something
- [ ] cancel subscription modal loads the following information for trial users "Your Current Plan
Starter Plan
Active until Dec 15, 2024" but they are on a trial subscription. it HAS to be different plan type. check the logic for this and ensure we have either an account type or plan type or something built in to differentiate trial users and that after doing so, instances like this reflect proper information regarding accounts
- [ ] cancel subscription modal has the following information:"Before you cancel, here's what you'll lose:

Access to all your saved searches
Automated search scheduling
Historical data and analytics
CRM and email integrations" and we need to update this to "Before you cancel, here's what you'll lose:

Access to search
All automated imports and exports
Email delivery and integrations" feel free to word those three items differently if you find a more professional way to do so
- [ ] the update password tool in account/profile does not work. first, dim and block usage of the button until all fields reflect acceptable info. right now, it allows for new passwords to be different without catching the differing input fields immediately. it also does nothing when i use all acceptable info and press update password button
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 



---

## 🔴 Bugs (Needs QC)

- [ ] **Stripe checkout** — test upgrade flow on trial account to confirm it works - no it doesn't ""Could not start checkout. Please try again."
- [ ] **Search history empty** — verify after running a new search that history tab populates - nothing
- [ ] **Saved listings empty** — verify new saves persist to Supabase and show on reload - still empty

---

## 🔴 UI Cleanup (Needs QC After Latest Deploy)

- [ ] **Search form simplification** — move zip, radius, lat, long, price/sqft to Additional Filters. On desktop: City and State join Address row (columns 3+4). Remove static beds/baths from Property Details as this already exists in additional filters and we're slimming down. this is not complete or even begun
- [x] **Account/Profile subscription block** — verify removed
- [x] **Account/Billing payment method** — verify shows zero state (no fake Visa 4242)
- [x] **Account/Billing history** — verify shows empty state (no sample invoices)
- [x] **Account/Billing trial date** — verify shows "Trial ends: MM/DD/YY" not "Invalid Date" it shows "Trial ends: Invalid Date" so it's not loading or formatting the date it loads correctly. it should display trial end date, calculated automatically at sign up by account creation date plus trial period
- [x] **ChangePlanModal** — verify no proration language, no Enterprise option, shows clean confirmation. YOU removed the entrprise option, but still need to center the two remaining options within the section as there's some ambigous blank space on the right where something used to be. there was text before "downgrades" about "upgrades take effect immediately", but you removed the full line 'upgrades to effect immediately AT A PRORATED AMOUNT' instead of editting the line to match the situation
- [x] **Account/API integrations section** — verify removed, only API keys + Browse Integrations button remains m- not done. remove all of this "Available Integrations (10)
Mailchimp
Sync contacts and trigger campaigns

Connect
Salesforce
Enterprise CRM integration

Connect
HubSpot
All-in-one CRM platform

Connect
Constant Contact
Email marketing made easy

Connect
Google Sheets
Spreadsheet automation

Connect
Airtable
Visual database platform

Connect
Twilio
SMS notifications

Connect
Zapier
Connect 5,000+ apps

Connect
Make
Advanced automation

Connect
Webhooks
Custom API endpoints

Connect
Future Integrations (6)
These integrations are planned for future releases. Vote for your favorites!

Slack
Coming Soon
Team notifications

Not Available
Notion
Coming Soon
All-in-one workspace

Not Available
Monday.com
Coming Soon
Work management

Not Available
Asana
Coming Soon
Project management

Not Available
Trello
Coming Soon
Visual task boards

Not Available
Pipedrive
Coming Soon
Sales CRM

Not Available
Don't see what you need?
Request a custom integration and we'll prioritize it in our roadmap.

Request an Integration"
- [x] **Account/Usage plan info block** — verify "Starter Plan / Trial Period / N/A" removed
- [ ] **Search history zero state** — verify empty state message updated - not complete still showing black screen
- [x] **Automation history zero state** — verify green background removed, yes but you put a white background and i want a black background on the table with white and grey text and icon
- [ ] **Create Automation: Manual sync** — verify removed from frequency options - no, not done
- [ ] **Create Automation: Field Mappings** — this is not done
- [ ] trying to upgrade my account in Confirm plan change' from starter to pro does not launch stripe it says "Could not start checkout. Please try again."
---

## 🟡 Needs Live Verification

- [ ] **Usage cap** — trial should now allow 4,000 listings (was incorrectly capped at 500). Test after running a search. 'it might but search isn't working right now'
- [ ] **API key generation** — test generating a key on account/api. Fixed getSession destructuring bug. not working 'Unable to generate API key: not signed in'
- [ ] **Search history View Results** — verify button opens SearchResultsPage with full table + clickable rows + listing modal i can't because search history has no items in it and no zero item state, it's a black empty page
- [ ] **Street View** — verify loads in listing modal on a property with lat/lng
- [x] **Favicon** — public/favicon.png placed. Verify shows in browser tab.
- [x] **OG image** — public/og-image.png placed. Verify shows when link shared.
- [x] **Page title** — verify browser tab shows "ListingBug"

---

## 🟡 Post-Stripe ( we need to create a test account with a paid plan and some figurative billing history for this)

- [ ] Billing history — real Stripe invoice data (currently empty state)
- [ ] Download invoice button
- [ ] Payment method display — pull real card details from Stripe post-subscription

---

## 🟡 Future / High Value

- [ ] PropertyRadar homeowner data — full implementation (teaser live) waiting on search functionality to return to check the teaser
- [ ] CSV Email formatting and Delivery backend execution
- [ ] Automation runner backend (scheduled execution)
- [ ] Integrations true status from Supabase

---

## ⚪ Deferred

- [ ] Light mode
- [ ] Facebook/Apple OAuth
- [ ] OAuth integrations — Mailchimp, HubSpot, Salesforce ( this is launch critical please move it up)
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
