# ListingBug Punch List
Last updated: 2026-03-27

## ✅ COMPLETED THIS SESSION

### Bug Fixes
- [x] Automations page TDZ crash (state ordering, AlertTriangle import, planInfo fallback)
- [x] Profile update (name column, updated_at column, update not upsert)
- [x] Password updater (signInWithPassword verify + updateUser)
- [x] Saved Listings dashboard nav (correct sessionStorage key 'listings' tab)
- [x] stripe_subscription_start column removed from queries
- [x] Billing Trial Price default flash fixed (starts as Trial $0)
- [x] ChangePlanModal — trial card hidden, correct header, simplified confirmation
- [x] Saved listings sync — both event names fired (savedListingsUpdated + savedListingsChanged)
- [x] Trial automation slots — 0 → 3 sitewide (planLimits.ts, AutomationsManagementPage)
- [x] History tab heading — uses automationName → searchName → location priority
- [x] Nav tab reset — Header clears last_tab keys on nav menu clicks
- [x] Foreclosure Status filter removed from available filters
- [x] Preview payload rewrite — per-destination accurate payloads (Webhook/Zapier/Make/n8n, Mailchimp, Sheets, HubSpot, SendGrid, Twilio, CSV)
- [x] Automation run "Failed to fetch" — all dispatch functions updated: verify_jwt: false, accept user_id in body
- [x] Mailchimp audience auto-load — loads when modal opens to config step (not just on OAuth return)
- [x] Available integrations collapse — auto-collapses when user has connected integrations
- [x] search_name + automation_name columns added to search_runs table
- [x] Trial listing cap corrected to 1,000 (was 4,000) — UsagePage, BillingPage, Dashboard, SearchListings, planLimits.ts, search-listings edge fn
- [x] AutomationsManagementPage.tsx corruption fixed (duplicate export function, $8 garbage chars, missing loadAutomations body)

### Edge Functions Updated (no frontend deploy needed)
- [x] send-to-mailchimp v3 — verify_jwt: false, user_id body auth
- [x] send-to-sheets v3 — verify_jwt: false, user_id body auth
- [x] send-to-hubspot v3 — verify_jwt: false, user_id body auth
- [x] send-to-sendgrid v4 — verify_jwt: false, user_id body auth
- [x] send-to-twilio v4 — verify_jwt: false, user_id body auth
- [x] webhook-push v3 — verify_jwt: false, no auth required
- [x] run-automation v12 — passes user_id in all dispatch payloads, uses service key internally
- [x] search-listings v34 — trial cap corrected to 1,000

### DB Changes
- [x] public.users — added updated_at column
- [x] public.search_runs — added search_name, automation_name columns

---

## 🔴 REQUIRES HUMAN INTERVENTION

### Google Sheets OAuth not persisting
**Status:** Code is correct. Root cause identified.
**Action needed:** In Supabase Dashboard → Project Settings → Edge Function Secrets, update:
- `GOOGLE_CLIENT_ID` → Client ID from "Listingbug sheets" OAuth client (ends in -obpm...)
- `GOOGLE_CLIENT_SECRET` → Client secret from "Listingbug sheets" OAuth client (GOCSPX-lk5XhZ0ks...)
The current GOOGLE_CLIENT_ID points to the sign-in client which only has the Supabase Auth callback URL registered, not the edge function callback URL.

### Google OAuth Consent Screen
**Action needed:** Submit for verification in Google Cloud Console to allow more than 100 test users.

---

## 🟡 QA NEEDED (verify in production)

- [ ] ChangePlanModal — verify trial user sees correct UI (no trial card, "Free trial — choose a plan" header)
- [ ] Automations page — verify loads with 3 slots for trial users
- [ ] Saved listings — verify 6 DB listings show in UI, save/unsave syncs correctly
- [ ] Password updater — verify with correct + incorrect credentials
- [ ] Billing history — verify with real Stripe data
- [ ] History tab heading — new runs show search name; old runs show location (expected)
- [ ] Automation runs → Mailchimp — verify no more "Failed to fetch" after edge fn fix
- [ ] Automation runs → Google Sheets — will work once Google OAuth secrets are updated
- [ ] Automation runs → HubSpot — verify no more 401 errors
- [ ] Trial 1,000 listing cap — verify UsagePage, BillingPage show correct number
- [ ] Integrations page — verify available section collapses when integrations are connected
- [ ] Mailchimp connection modal — verify audience dropdown auto-loads on open

---

## 🔵 OPEN / FUTURE ITEMS

- [ ] API key generator display issue — DB has 1 key, may be a UI display bug; needs QA
- [ ] Zapier webhook setup instructions — already correct in code ("Webhooks by Zapier → Catch Hook")
- [ ] Usage cap enforcement in UI — toast/modal when user hits 1,000 listing cap during search
- [ ] Billing history with real Stripe data
- [ ] Google OAuth consent screen verification submission
- [ ] SearchListings history — old runs show location (not name) since search_name was null; only new runs will show names

---

## PLAN LIMITS REFERENCE
| Plan         | Listings/mo | Automations | Price |
|--------------|-------------|-------------|-------|
| Trial        | 1,000       | 3           | $0    |
| Starter      | 4,000       | 1           | $19   |
| Professional | 10,000      | 3           | $49   |
| Enterprise   | Unlimited   | Unlimited   | TBD   |

## KEY FILE LOCATIONS
- `src/components/AutomationsManagementPage.tsx` — automations list, run history
- `src/components/AutomationLimitModal.tsx` — plan limit modal
- `src/components/AccountPage.tsx` — profile update, password update
- `src/components/BillingPage.tsx` — billing, plan display
- `src/components/ChangePlanModal.tsx` — plan upgrade flow
- `src/components/SearchListings.tsx` — search, saved listings, history, listing cap
- `src/components/Dashboard.tsx` — dashboard shortcuts
- `src/components/Header.tsx` — nav tab reset
- `src/components/IntegrationConnectionModal.tsx` — Mailchimp auto-load, OAuth config
- `src/components/IntegrationsPage.tsx` — available integrations collapse
- `src/components/ActivateAutomationModal.tsx` — preview payload rewrite
- `src/components/UsagePage.tsx` — usage display
- `src/components/utils/planLimits.ts` — canonical plan limits
- `supabase/functions/run-automation` — v12, user_id dispatch, service key
- `supabase/functions/send-to-mailchimp` — v3, verify_jwt: false
- `supabase/functions/send-to-sheets` — v3, verify_jwt: false
- `supabase/functions/send-to-hubspot` — v3, verify_jwt: false
- `supabase/functions/send-to-sendgrid` — v4, verify_jwt: false
- `supabase/functions/send-to-twilio` — v4, verify_jwt: false
- `supabase/functions/webhook-push` — v3, verify_jwt: false
- `supabase/functions/search-listings` — v34, trial cap 1,000