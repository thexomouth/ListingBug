# ListingBug Punch List
**How to use:** Jack adds items anytime. Claude checks this file at the start of each session and marks items `[x]` when complete.
**Last updated:** March 21, 2026

---

## 🔴 Critical (Blocking Launch)

- [ ] Stripe billing — Starter $49/mo, Professional $99/mo, checkout edge function, webhook, BillingPage wiring
- [ ] Email verification — re-enable email confirmations in Supabase dashboard (Jack's action — code is ready)
- [ ] Google OAuth consent screen branding — submit for Google verification (unblocked now that /privacy and /terms exist)

---

## 🟡 Future / High Value

- [ ] PropertyRadar homeowner data enrichment — add "Get Homeowner Data" button on listing viewer modal. Calls PropertyRadar API per listing. Charge via credits or bill add-on. Deferred post-launch but high value — plan the integration now.
- [ ] Google Street View API key — free tier, drop into ListingDetailModal.tsx where it says AIzaSyD-placeholder to enable street view fallback photos

---

## 🟡 QC / Verify on Device

These are all code-complete — just need eyes on a real device to confirm:

- [ ] Dashboard automation card truncation — verify on iPhone 11 Pro Max
- [ ] Footer 2-col layout — verify on mobile (code: grid-cols-2 already applied)
- [ ] Input zoom fix — verify on iOS Safari (code: font-size 16px already applied)
- [ ] Left side nav MIME type error — verify automations link no longer errors (code: vercel.json fix deployed)
- [ ] Search page state dropdown — verify usable on mobile
- [ ] Search form required asterisks — verify visible on City and State fields
- [ ] Left side nav signed-out — verify items are white not purple (code: text-white confirmed)
- [ ] Change Plan modal back button — verify working on step 2 (code: handleBack wired)
- [ ] Sign in/up autofill — verify input bg doesn't change on autofill (code: -webkit-autofill fix deployed)
- [ ] Sample report homepage — verify 3-day listings return data for common ZIP codes

---

## 🟡 Post-Stripe (blocked)

- [ ] Account/Billing — billing history shows real Stripe data (blocked on Stripe setup)
- [ ] Account/Billing — download invoice button (blocked on Stripe setup)

---

## ⚪ Deferred (Post-Launch)

- [ ] Light mode — guide at src/LIGHT_MODE_IMPLEMENTATION_GUIDE.md
- [ ] Facebook OAuth (needs DBA registration)
- [ ] Apple OAuth (needs $99 dev account)
- [ ] OAuth integrations — Mailchimp, HubSpot, Salesforce etc (needs OAuth app registration per platform)
- [ ] Namecheap CNAME update to e53e829ee840f3ad.vercel-dns-017.com (recommended by Vercel)
- [ ] Search run history retention policy — currently stores forever; consider pruning runs older than 90 days or limiting per user

---

## ✅ Completed

- [x] Build fixed — Vercel exit 126 (vite binary permissions)
- [x] Missing @supabase/supabase-js dependency added
- [x] Google OAuth redirects to dashboard after auth
- [x] Auth state persists on page refresh
- [x] Dashboard hardcoded automation count fixed
- [x] vercel.json — SPA rewrite + cache headers
- [x] React Router — real URLs, browser back button
- [x] /privacy and /terms now directly accessible URLs
- [x] 19 VS Code AI prompts deployed (sample data zeroed, real data wiring, UI polish)
- [x] Notifications table created in Supabase, loads via realtime subscription
- [x] CURRENT_PLAN undefined error fixed in UsagePage
- [x] IntegrationsPage build error fixed
- [x] MIME type error fixed (vercel.json excludes /assets/ from SPA rewrite)
- [x] Mobile input zoom disabled (16px font-size global CSS)
- [x] Footer 2-column on mobile
- [x] Dashboard automation card truncates on small screens
- [x] Required field indicators on City and State in search form
- [x] Stale localStorage notifications cleared on login
- [x] Search edge function working — real RentCast data returning
- [x] Sample report uses maxDaysOnMarket=3 for fresh listings
- [x] Mailchimp defaults to not connected for new users
- [x] Disconnect button updates UI state immediately
- [x] Fake OAuth URLs replaced with honest coming-soon state
- [x] AccountIntegrationsTab connect button uses shared IntegrationConnectionModal
- [x] Sample API key and sample Mailchimp connection zeroed out
- [x] search-listings edge function v12 — all error details stripped
- [x] delete-user edge function v1 — account deletion live
- [x] AccountPage delete button wired to delete-user edge function
- [x] emailRedirectTo fixed — email verification links land on /dashboard
- [x] UsagePage column fix — was querying listings_processed, now listings_fetched
- [x] Search results "Showing X–Y of Z listings" count
- [x] Search loading overlay shows city/state being searched
- [x] Autofill background fix — correct colors light and dark mode
- [x] Password placeholder special char fix (iOS Safari)
- [x] Right side nav "API & Integrations" renamed to "API"
- [x] Agent field mapping fixed — RentCast nested l.agent.name/phone/email
- [x] Listing modal photo — no fake Unsplash fallback; hidden if no photo; Street View ready (needs key)
- [x] Listing modal agent section — "Not provided" fallbacks, no empty tel:/mailto: links, MLS shows "—"
- [x] Usage meter — loads real value from Supabase on mount, updates from edge function after each search
- [x] Cross-device sync — saved listings + searches write to Supabase, load from Supabase on mount
- [x] Dashboard saved listings — real RentCast photos, proper empty state, no fake Unsplash
- [x] Dashboard integrations section — permanent zero state, no hardcoded Mailchimp/Google Sheets
- [x] SMTP sender/username mismatch confirmed fixed by Jack
- [x] Search defaults prefilled — Single Family, Active, 1 day listed
- [x] Search validation relaxed — accepts address, lat/lng+radius, or zip alone; contextual errors
- [x] search_runs table created in Supabase — stores full results JSON per run permanently
- [x] Every search saves results to search_runs in Supabase (no localStorage, no re-fetch)
- [x] SearchResultsPage — new page, loads results from Supabase on demand
- [x] Search history loads from Supabase (metadata only), cards clickable when resultsCount > 0
- [x] search-results route added to App.tsx
- [x] Automation wizard field mapping step removed — goes 1→3→4 directly
- [x] CSV export tracking — writes to automation_runs so Listings Exported count is accurate
- [x] Dashboard Listings Exported count includes both automation runs and CSV downloads
- [x] CSV export improved — includes all key fields (agent, phone, email, status, sq ft)
