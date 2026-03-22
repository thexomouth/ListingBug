# ListingBug Punch List
**How to use:** Jack adds items anytime. Claude checks this file at the start of each session and marks items `[x]` when complete.
**Last updated:** March 21, 2026

---

## 🔴 Critical (Blocking Launch)

- [ ] Stripe billing — Starter $49/mo, Professional $99/mo, checkout edge function, webhook, BillingPage wiring
- [ ] Email verification landing page — re-enable email confirmations in Supabase dashboard (SMTP confirmed working, emailRedirectTo fixed)
- [ ] Google OAuth consent screen branding — needs Google verification (unblocked now that /privacy and /terms exist)

---

## 🟡 Search / Data Accuracy

- [ ] Password placeholder — special characters rendering on sign in / sign up pages, pick a safe character
- [ ] Search — prefill "Single Family" property type and "Active" status and "1" days listed as defaults
- [ ] Search — relax required field validation: city+state not always needed (address-only or lat/lng+radius are valid), show contextual "search too vague, try adding X" message instead of hard block
- [ ] Search — listing detail modal (right-side viewer) needs all fields populated accurately from the row. Remove photo if none came from RentCast. Show photo if it did. Evaluate Google Street View as cheap fallback. This is a high-priority UX surface.
- [ ] Search — usage/activity meter not updating when listings are received from search. Row counts need to track in Supabase and reflect in the meter.
- [ ] Search — saved listings not syncing across devices (desktop saves not appearing on mobile). Data events should be visible everywhere the user is signed in — needs to move from localStorage to Supabase.
- [ ] Search history — make history cards clickable only if they have results. Clicking opens a new "Search Results" page showing search info + full results table + listing viewer modal.
- [ ] Search Results page — new page (no nav entry), accessed from search history. Shows search criteria header + results table. Listing viewer modal should open on row click with enriched data.

---

## 🟡 Dashboard / Usage

- [ ] Dashboard — Listings Imported should count all listings received through search AND automations
- [ ] Dashboard — Listings Exported should count all listings exported via CSV, email, or integrations
- [ ] Dashboard — usage meter not reflecting listings received
- [ ] Dashboard — saved listings section showing sample photos instead of RentCast photos
- [ ] Dashboard — integrations section shows sample connected integrations (Mailchimp, Google Sheets) for new accounts — should be zero state
- [ ] Account/Usage — not reflecting proper usage stats or projected overage

---

## 🟡 QC / UI Bugs

- [ ] Search results page — verify all fields populated correctly including agent contact info
- [ ] Sample report on homepage — verify 3-day listings actually return data for common ZIP codes
- [ ] Account/Billing — billing history section shows sample data (post-Stripe)
- [ ] Account/Billing — download button on billing history doesn't work (post-Stripe)
- [ ] Automations/History — verify empty state shows correctly, no sample run data
- [ ] Right side nav — notifications still showing sample data for some users (verify localStorage clear working)
- [ ] Integrations page — disconnect button verify fix working
- [ ] Right side nav — rename "API & Integrations" to just "API"
- [ ] Automation creation — consider removing field mapping step; users expect this to be handled automatically

---

## 🟠 Mobile Fixes

- [ ] Verify dashboard automation card truncation working on iPhone 11 Pro Max
- [ ] Verify footer 2-column layout on mobile
- [ ] Verify input zoom fix working on iOS Safari (font-size 16px applied)
- [ ] Left side nav — verify automations link no longer throws MIME type error
- [ ] Search page — state dropdown verify usable on mobile

---

## 🔵 Polish / UX

- [ ] Search results — standardize padding/margins with rest of member pages
- [ ] Search form — verify required field asterisks visible
- [ ] Left side nav (signed out) — verify items are white not purple
- [ ] Sign in/up — verify input box bg does not change on autofill (CSS fix deployed)
- [ ] Change Plan modal — back button on step 2 (verify working)
- [ ] Footer — verify 2-column mobile layout not breaking desktop layout

---

## ⚪ Deferred (Post-Launch)

- [ ] Light mode — guide at src/LIGHT_MODE_IMPLEMENTATION_GUIDE.md
- [ ] Facebook OAuth (needs DBA registration)
- [ ] Apple OAuth (needs $99 dev account)
- [ ] OAuth integrations — Mailchimp, HubSpot, Salesforce etc
- [ ] Namecheap CNAME update to e53e829ee840f3ad.vercel-dns-017.com (recommended by Vercel)

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
- [x] search-listings edge function v12 deployed — error details stripped from all responses
- [x] delete-user edge function v1 deployed — account deletion live
- [x] AccountPage delete button wired to delete-user edge function
- [x] emailRedirectTo fixed — email verification links now land on /dashboard
- [x] UsagePage listings_fetched column fix deployed
- [x] Search results "Showing X–Y of Z listings" count added
- [x] Search loading overlay now shows city/state being searched
- [x] Autofill background fix — correct colors in light and dark mode
- [x] Input component autofill shadow override added
