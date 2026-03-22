# ListingBug Punch List
**How to use:** Jack adds items anytime. Claude checks this file at the start of each session and marks items `[x]` when complete.
**Last updated:** March 21, 2026

---

## 🔴 Critical (Blocking Launch)

- [ ] Stripe billing — Starter $49/mo, Professional $99/mo, checkout edge function, webhook, BillingPage wiring
- [ ] Email verification — re-enable email confirmations in Supabase dashboard (Jack's action — code is ready)
- [ ] Google OAuth consent screen branding — submit for Google verification (/privacy and /terms exist)

---

## 🟡 Automation Enhancements (pre-launch)

- [ ] Automation run frequency — add two dropdowns: "Run X times" + "per day/week/month" + time picker (15-min intervals, device local time). Show overage warning: "Automations are meant to provide automatic daily updates — more frequent runs can lead to overages."
- [ ] CSV automation delivery — on CSV destination: trigger download notification on run, allow view/download from automation history. Add "CSV - Email Delivery" as a second CSV option (builds CSV and delivers to user's email on run).
- [ ] Verify CSV generation is wired end-to-end in automation runs (not just manual export from search page)

---

## 🟡 Active Bugs (pending patches — run patches first)

- [ ] Chunk load errors (bug icon → dashboard, profile nav → account) — fixed by App.tsx type fix in patch-profilefix.cjs
- [ ] Footer layout — logo+description full-width, 2-col after, remove Dashboard section, add Privacy Policy + Terms to Resources — in patch-ui2.cjs
- [ ] Input zoom on mobile (Brave/Safari) doesn't reset after leaving field — viewport max-scale fix in patch-ux.cjs
- [ ] Dashboard "Listings Saved" directs to saved searches instead of saved listings tab — in patch-ux.cjs
- [ ] Search history cards not clickable — only Re-run button works, should be full card click — in patch-ux.cjs (onClick already on card from earlier patch, verify)
- [ ] Account page extra padding above tabs — in patch-ux.cjs
- [ ] Sign in/up gray placeholder text — in patch-ux.cjs + globals.css
- [ ] Contact support page gray placeholder text including dropdown — covered by globals.css in patch-ux.cjs
- [ ] Scroll position not resetting on page navigation (mobile) — in patch-ux.cjs
- [ ] Back button on ChangePlanModal — arrow only, no text, larger — in patch-ux.cjs
- [ ] Dashboard automation card — line break between "Active" and "Automations" — in patch-ui2.cjs
- [ ] Left side nav signed-out — white logo instead of dark logo — in patch-header.cjs
- [ ] Agent contact info not showing (100% blank) — broadened field fallbacks in patch-agent.cjs
- [ ] Email input not triggering iPhone autofill — autocomplete attrs — in patch-autocomplete.cjs
- [ ] PropertyRadar "Get Homeowner Data" teaser — verify landed in listing modal (file size confirmed 51.4KB ✓)

---

## 🟡 Future / High Value

- [ ] PropertyRadar homeowner data enrichment — full implementation post-launch
- [ ] Google Street View API key — drop real key into ListingDetailModal.tsx (AIzaSyD-placeholder)

---

## 🟡 Post-Stripe (blocked)

- [ ] Account/Billing — billing history shows real Stripe data
- [ ] Account/Billing — download invoice button

---

## 🟡 Verify on Device (code already deployed)

- [ ] Sample report homepage — verify 3-day listings return data for common ZIP codes
- [x] Left side nav MIME type error — confirmed fixed
- [x] Search page state dropdown — confirmed working on mobile
- [x] Sign in/up autofill background — confirmed working

---

## ⚪ Deferred (Post-Launch)

- [ ] Light mode — guide at src/LIGHT_MODE_IMPLEMENTATION_GUIDE.md
- [ ] Search lat/lng+radius freedom — readdress post-launch
- [ ] Facebook OAuth (needs DBA registration)
- [ ] Apple OAuth (needs $99 dev account)
- [ ] OAuth integrations — Mailchimp, HubSpot, Salesforce etc
- [ ] Namecheap CNAME update to e53e829ee840f3ad.vercel-dns-017.com
- [ ] Search run history retention policy — prune runs older than 90 days post-launch

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
- [x] 19 VS Code AI prompts deployed
- [x] Notifications table — Supabase, realtime subscription
- [x] CURRENT_PLAN undefined error fixed in UsagePage
- [x] IntegrationsPage build error fixed
- [x] MIME type error fixed (vercel.json)
- [x] Mobile input zoom disabled (16px font-size)
- [x] Footer 2-column on mobile
- [x] Dashboard automation card truncates on small screens
- [x] Required field indicators on City and State
- [x] Stale localStorage notifications cleared on login
- [x] Search edge function — real RentCast data
- [x] Sample report uses maxDaysOnMarket=3
- [x] Mailchimp defaults not connected for new users
- [x] Disconnect button updates UI immediately
- [x] Fake OAuth URLs replaced with honest coming-soon
- [x] AccountIntegrationsTab connect button uses shared modal
- [x] Sample API key and Mailchimp connection zeroed out
- [x] search-listings edge function v12 — error details stripped
- [x] delete-user edge function v1 — live
- [x] AccountPage delete button wired to edge function
- [x] emailRedirectTo → /dashboard
- [x] UsagePage column fix (listings_fetched)
- [x] Search results "Showing X–Y of Z" count
- [x] Search loading overlay shows city/state
- [x] Autofill background fix — light and dark
- [x] Password placeholder special char fix
- [x] Right side nav renamed "API"
- [x] Agent field mapping — RentCast nested l.agent.name/phone/email
- [x] Listing modal — no fake photo fallback, Street View ready
- [x] Listing modal agent section — "Not provided" fallbacks
- [x] Usage meter — real Supabase data, updates after search
- [x] Cross-device sync — saved listings + searches via Supabase
- [x] Dashboard saved listings — real photos, proper empty state
- [x] Dashboard integrations — zero state
- [x] Search defaults prefilled — Single Family, Active, 1 day
- [x] Search validation relaxed — address/lat-lng/zip all valid
- [x] search_runs table — full results stored in Supabase per run
- [x] SearchResultsPage — loads from Supabase on demand
- [x] Search history — Supabase metadata only, cards clickable
- [x] search-results route in App.tsx
- [x] Automation wizard — field mapping step removed
- [x] CSV export tracking via automation_runs
- [x] Dashboard Exported count includes CSV downloads
- [x] CSV export includes all key fields
- [x] PropertyRadar "Get Homeowner Data" teaser in listing modal
