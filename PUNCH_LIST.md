# ListingBug Punch List
**How to use:** Jack adds items anytime. Claude checks this file at the start of each session and marks items `[x]` when complete.
**Last updated:** March 21, 2026

---

## 🔴 Critical (Blocking Launch)

- [ ] Stripe billing — Starter $49/mo, Professional $99/mo, checkout edge function, webhook, BillingPage wiring
- [ ] Email verification — re-enable email confirmations in Supabase dashboard (SMTP confirmed working, emailRedirectTo fixed to /dashboard)
- [ ] Google OAuth consent screen branding — needs Google verification (unblocked now that /privacy and /terms exist)

---

## 🟡 Search / Data Accuracy

- [ ] Search — listing detail modal (right-side viewer) — Google Street View fallback needs real API key (free tier, drop into placeholder in ListingDetailModal.tsx)
- [ ] Search history — make history cards clickable only if they have results. Clicking opens a new "Search Results" page showing search info + full results table + listing viewer modal
- [ ] Search Results page — new page (no nav entry), accessed from search history. Shows search criteria header + results table. Listing viewer modal on row click

---

## 🟡 Dashboard / Usage

- [ ] Dashboard — Listings Imported should count all listings received through search AND automations (currently search only via usage_tracking)
- [ ] Dashboard — Listings Exported should count all listings exported via CSV, email, or integrations (currently automation_runs only)
- [ ] Account/Usage — verify projected overage stats are calculating correctly now that column name is fixed

---

## 🟡 QC / UI Bugs

- [ ] Sample report on homepage — verify 3-day listings actually return data for common ZIP codes
- [ ] Account/Billing — billing history section shows sample data (post-Stripe)
- [ ] Account/Billing — download button on billing history doesn't work (post-Stripe)
- [ ] Automations/History — verify empty state shows correctly, no sample run data
- [ ] Right side nav — notifications still showing sample data for some users (verify localStorage clear working)
- [ ] Integrations page — disconnect button verify fix working
- [ ] Automation creation — consider removing field mapping step

---

## 🟠 Mobile Fixes

- [ ] Verify dashboard automation card truncation working on iPhone 11 Pro Max
- [ ] Verify footer 2-column layout on mobile
- [ ] Verify input zoom fix working on iOS Safari (font-size 16px applied)
- [ ] Left side nav — verify automations link no longer throws MIME type error
- [ ] Search page — state dropdown verify usable on mobile

---

## 🔵 Polish / UX

- [ ] Search form — verify required field asterisks visible
- [ ] Left side nav (signed out) — verify items are white not purple
- [ ] Change Plan modal — back button on step 2 (verify working)
- [ ] Footer — verify 2-column mobile layout not breaking desktop layout

---

## ⚪ Deferred (Post-Launch)

- [ ] Light mode — guide at src/LIGHT_MODE_IMPLEMENTATION_GUIDE.md
- [ ] Facebook OAuth (needs DBA registration)
- [ ] Apple OAuth (needs $99 dev account)
- [ ] OAuth integrations — Mailchimp, HubSpot, Salesforce etc
- [ ] Namecheap CNAME update to e53e829ee840f3ad.vercel-dns-017.com (recommended by Vercel)
- [ ] Google Street View API key — drop real key into ListingDetailModal.tsx to enable street view fallback photos

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
- [x] Notifications table created in Supabase
- [x] CURRENT_PLAN undefined error fixed in UsagePage
- [x] IntegrationsPage build error fixed
- [x] MIME type error fixed (vercel.json excludes /assets/ from SPA rewrite)
- [x] Mobile input zoom disabled (16px font-size)
- [x] Footer 2-column on mobile
- [x] Dashboard automation card truncates on small screens
- [x] Required field indicators on City and State in search
- [x] Stale localStorage notifications cleared on login
- [x] Search edge function working — real RentCast data returning
- [x] Sample report uses maxDaysOnMarket=3 for fresh listings
- [x] Mailchimp defaults to not connected for new users
- [x] Disconnect button updates UI state immediately
- [x] Fake OAuth URLs replaced with honest coming-soon state
- [x] AccountIntegrationsTab connect button uses shared IntegrationConnectionModal
- [x] Sample API key and sample Mailchimp connection zeroed out
- [x] search-listings edge function v12 — error details stripped from all responses
- [x] delete-user edge function v1 deployed — account deletion live
- [x] AccountPage delete button wired to delete-user edge function
- [x] emailRedirectTo fixed — email verification links land on /dashboard
- [x] UsagePage listings_fetched column fix deployed
- [x] Search results "Showing X–Y of Z listings" count added
- [x] Search loading overlay shows city/state being searched
- [x] Autofill background fix — correct colors in light and dark mode
- [x] Input component autofill shadow override added
- [x] Search defaults prefilled — Single Family, Active, 1 day listed
- [x] Search validation relaxed — accepts address, lat/lng+radius, or zip alone; contextual error messages
- [x] Password placeholder special char fix (iOS Safari)
- [x] Right side nav "API & Integrations" renamed to "API"
- [x] Agent field mapping fixed — RentCast nested l.agent.name/phone/email now correctly read
- [x] Listing modal photo — no fake Unsplash fallback; hidden if no photo; Street View option ready (needs API key)
- [x] Listing modal agent section — "Not provided" fallbacks, no empty tel:/mailto: links, MLS shows "—"
- [x] Usage meter — loads real value from Supabase on mount, updates from edge function response after each search
- [x] Cross-device sync — saved listings write to Supabase on save, load from Supabase on mount in both SearchListings and Dashboard
- [x] Dashboard saved listings section — real RentCast photos, no fake Unsplash, proper empty state
- [x] Dashboard integrations section — permanent zero state, no hardcoded Mailchimp/Google Sheets
- [x] SMTP sender/username mismatch confirmed fixed by Jack
