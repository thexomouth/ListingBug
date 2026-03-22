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

- [ ] Dashboard automation card truncation — verify on iPhone 11 Pro Max - This works but i would like to add a line break after the word active and before automation with the truncation logic still active
- [ ] Footer 2-col layout — verify on mobile (code: grid-cols-2 already applied) this is working now, but we din't leave the logo and description beneath it in a one column format, beginning the two column format AFTER the description. let's also go ahead and and remove Dashboard, Overview, and Search Listings from the footer and just have the two sections 'resources' and 'account' please add privacy plicy and terms of service as two items two the resources footer section
- [ ] Input zoom fix — verify on iOS Safari (code: font-size 16px already applied) - this issue persists on mobile via Brave browser. i don't use safari and can only assume it would happent there aswell. to clarify it zooms in and doesn't zoom back out when leaving the text entry keyboard
- [x] Left side nav MIME type error — verify automations link no longer errors (code: vercel.json fix deployed) - this is good to go
- [x] Search page state dropdown — verify usable on mobile-yes good to go
- [x] Search form required asterisks — verify visible on City and State fields - asterisks are displayed, but i woanted to discuss the issue about people wanting to use long/lat and radius instead of individual cities and that perhaps we could create logic that enables users to have more freedom in the search. perthaps we can readdress this post launch
- [ ] Left side nav signed-out — verify items are white not purple (code: text-white confirmed) this is good - except we failed to add the white logo from the footer in place of the logo atop this left side nav menu
- [ ] Change Plan modal back button — verify working on step 2 (code: handleBack wired)-it's there. let's remove the word Back and just have the arrow. with the extra space we can increase the sizing of the back arrow
- [ ] Sign in/up autofill — verify input bg doesn't change on autofill (code: -webkit-autofill fix deployed) - this is working
- [ ] Sample report homepage — verify 3-day listings return data for common ZIP codes
- [ ] clicking 'listings saved' container on member dashboard returns error: Failed to fetch dynamically imported module: https://www.thelistingbug.com/assets/SearchListings-BuKHAF00.js - this is no longer erroring, but it is performing wrong. it's directing to saves searches instead of saved listings
- [ ] clicking the recent search containers doesn't do anything. there's a 'rerun' button, but i'm wanting to be able to click anywhere else in the container to open it and view the results. i had said earlier i wanted you to create a page for viewing past search results that would reuse or use a duplicate version of the search results table and have the search information above the results table. this is important for launch. it's important to have the listing detail modal here too.
- [ ] clicking the profile item nav,error:importing module failed or something
- [ ] agent contact info is regularly not showing up which leads me to assume either we had bad code before that didn't catch it in the earlier search or that we're failing to field map correctly. about 10% of listings returned wont have the contact info, but the rest should and i'm seeing 100% without it. so we have an issue there in the listing detail modal
- [ ] if i am scrolled down in a page on mobile, then navigate to a new page, my scroll position is kept from the previous page instead of resetting to the top. this appears to be site wide
- [ ] for some reason there's some extra padding above the tabs in account page. between the divider under page header Account Settings and the tabs
- [ ] sign in and sign up pages need gray placeholder text in the input fields until there is some kind of input at which point the existing white is fine
- [ ] contact support page has input fields with all whtie placeholder text. this should be grey until input text exists even for the dropdown.

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
