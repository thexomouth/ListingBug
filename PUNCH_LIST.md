# ListingBug Punch List
Last updated: 2026-03-27 (session 2)

---

## ✅ FIXED THIS SESSION (58c79587)

- [x] /listings page crash — `React is not defined` — added React import to SearchListings, ActivateAutomationModal, IntegrationConnectionModal, IntegrationsPage, Header, ChangePlanModal
- [x] /automations page crash — `handleAutomationUpdated is not defined` — re-inserted all missing handler functions (handleToggleAutomation, handleRunNow, handleDeleteAutomation, handleDuplicateAutomation, handleAutomationUpdated, handleAutomationCreated) that were lost during file repair
- [x] AutomationsManagementPage — `formatDate is not defined` — added formatDate helper
- [x] AccountPage — `full_name column not found` — fixed all 3 references (select, read, update) from `full_name` → `name`
- [x] Password updater — "Failed to update password" — replaced dead edge function call with native `supabase.auth.signInWithPassword` (verify) + `supabase.auth.updateUser` (update)
- [x] Integration detail modal — "Connected Dec 1, 2024" hardcoded — now reads real `connectedAt` from `connectedInfo` DB data
- [x] Integration detail modal — "Last Sync 2 hours ago" hardcoded — now reads real `last_used_at` from `connectedInfo.config`
- [x] Integration detail modal — "Not connected" account — now shows real email/account_name from config
- [x] View vs Settings button inconsistency — desktop "Settings" button now opens same integration detail modal as mobile "View" button (using Eye icon). Disconnect button retained separately
- [x] Webhook integration — moved from `future` → `available` in IntegrationsPage with proper description
- [x] Webhook integration — added `webhook` config entry to IntegrationConnectionModal with setup instructions, generic URL placeholder, and optional Authorization header field
- [x] ActivateAutomationModal — audience dropdown is now a real dynamic dropdown (calls get-integration-options edge fn), auto-loads on open, refresh button
- [x] ActivateAutomationModal — tags field marked optional
- [x] ActivateAutomationModal — test button now calls real send-to-mailchimp, only shows success when Mailchimp confirms. Error codes ERR_01–ERR_13 for triage

---

## 🔴 REQUIRES HUMAN INTERVENTION

### Google Sheets OAuth not persisting
**Root cause:** `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` Supabase secrets point to the sign-in OAuth client, not the "Listingbug sheets" client.
**Action:** Supabase Dashboard → Project Settings → Edge Function Secrets → update:
- `GOOGLE_CLIENT_ID` → Client ID from "Listingbug sheets" (ends `-obpm...`)
- `GOOGLE_CLIENT_SECRET` → `GOCSPX-lk5XhZ0ks...` (from the OAuth dialog screenshot)

### Google OAuth Consent Screen
**Action:** Submit for verification to allow >100 test users.

---

## 🟡 QA NEEDED

- [ ] /automations My Automations tab — verify loads without crash after handler fix
- [ ] /automations History tab — verify run history loads
- [ ] Account page profile update — verify "name" saves correctly (no more full_name error)
- [ ] Account page password update — verify correct password accepted, wrong password rejected with clear error
- [ ] Integration detail modal — verify Connected date shows real date, not Dec 1 2024
- [ ] Integration detail modal — verify Account shows email for OAuth integrations
- [ ] Webhook integration — verify Connect flow saves URL + optional auth header to integration_connections
- [ ] Webhook integration — verify automation runs dispatch to saved webhook URL
- [ ] ActivateAutomationModal Mailchimp — verify audience dropdown populates from real account
- [ ] ActivateAutomationModal Mailchimp test — verify ERR_* codes display on failure
- [ ] Listings page — verify no more React crash

---

## 🔵 OPEN / IN PROGRESS

### Per-integration config in ActivateAutomationModal
Currently done: Mailchimp (audience dropdown + tags)
Remaining: each needs real dynamic config UI:
- [ ] **Google Sheets** — spreadsheet ID input + optional sheet name. Could add "Open Google Drive" link to help user find their spreadsheet ID
- [ ] **HubSpot** — pipeline dropdown (load from HubSpot API) + object type (Contact/Deal)
- [ ] **SendGrid** — list dropdown (get-integration-options already supports sendgrid)
- [ ] **Twilio** — from-number input with E.164 validation
- [ ] **Zapier/Make/n8n/Webhook** — webhook URL input (already works in getFields())
- [ ] **Airtable** — base ID + table ID inputs

### Other open items
- [ ] API key generator — may be display bug; needs QA
- [ ] Billing history — needs real Stripe data to verify
- [ ] Usage cap enforcement in UI — show toast/modal when trial user hits 1,000 listing cap
- [ ] SearchListings history — old runs show location (not name); only new runs show search name
- [ ] Google OAuth consent screen verification

---

## PLAN LIMITS REFERENCE
| Plan         | Listings/mo | Automations | Price |
|---|---|---|---|
| Trial        | 1,000       | 3           | $0    |
| Starter      | 4,000       | 1           | $19   |
| Professional | 10,000      | 3           | $49   |
| Enterprise   | Unlimited   | Unlimited   | TBD   |

## KEY EDGE FUNCTIONS
| Function | Version | Notes |
|---|---|---|
| search-listings | v34 | trial cap 1,000 |
| run-automation | v12 | passes user_id, service key dispatch |
| send-to-mailchimp | v3 | verify_jwt: false, user_id body auth |
| send-to-sheets | v3 | verify_jwt: false, user_id body auth |
| send-to-hubspot | v3 | verify_jwt: false, user_id body auth |
| send-to-sendgrid | v4 | verify_jwt: false, user_id body auth |
| send-to-twilio | v4 | verify_jwt: false, user_id body auth |
| webhook-push | v3 | verify_jwt: false, no credentials needed |
| get-integration-options | v1 | mailchimp + sendgrid audience/list load |
