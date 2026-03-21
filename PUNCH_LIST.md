# ListingBug Punch List
**How to use:** Jack adds items anytime. Claude checks this file at the start of each session and marks items `[x]` when complete.
**Last updated:** March 21, 2026

---

## 🔴 Critical (Blocking Launch)

- [ ] Stripe billing — Starter $49/mo, Professional $99/mo, checkout edge function, webhook, BillingPage wiring
- [ ] React Router — back button works, direct URLs functional ✅ DONE
- [ ] Search working ✅ DONE
- [ ] Fix SMTP sender/username mismatch (hello@ vs jake@ in Supabase Auth settings) — manual fix in Supabase dashboard
- [ ] Email verification landing page (after SMTP confirmed working)
- [ ] Google OAuth consent screen branding — needs Privacy + Terms URLs + Google verification (unblocked now that /privacy and /terms exist)
- [ ] Remove debug field from edge function search response before launch

---

## 🟡 QC / UI Bugs

- [ ] Search results page — verify listings are displaying correctly with all fields populated
- [ ] Search results page — agent contact info visible and correct
- [ ] Sample report on homepage — verify 3-day listings actually return data for common ZIP codes
- [ ] Dashboard "Listings Exported" count should reflect real automation run history not hardcoded 89
- [ ] Dashboard "Listings Imported" count should reflect real usage_tracking data not hardcoded 147
- [ ] Account/Usage — projected total still showing false numbers, needs real calculation or stay at 0
- [ ] Account/Billing — billing history section shows sample data, needs real Stripe data (post-Stripe)
- [ ] Account/Billing — download button on billing history doesn't work
- [ ] Account/Profile — delete account button needs edge function (delete-user) to be created and deployed
- [ ] Automations/History — verify sample run data is fully removed and empty state shows correctly
- [ ] Right side nav — notifications still showing sample data for some users (localStorage clear added, verify working)
- [ ] Integrations page — disconnect button leaves card on screen (fix deployed, verify working)
- [ ] Search listings — "search failed" toast now shows real error details (good for dev, remove details before launch)

---

## 🟠 Mobile Fixes

- [ ] Verify dashboard automation card truncation working on iPhone 11 Pro Max
- [ ] Verify footer 2-column layout on mobile
- [ ] Verify input zoom fix working on iOS Safari (font-size 16px applied)
- [ ] Left side nav — verify automations link no longer throws MIME type error (React Router + vercel.json fix deployed)
- [ ] Search page — state dropdown verify usable on mobile

---

## 🔵 Polish / UX

- [ ] Search results — standardize padding/margins with rest of member pages
- [ ] Search results — show "Showing X of Y listings" count
- [ ] Search results — loading state needs to be more descriptive (searching Denver, CO...)
- [ ] Search form — make it clearer which fields are required vs optional (asterisk added, verify visible)
- [ ] Left side nav (signed out) — verify items are white not purple
- [ ] Sign up page — verify password placeholder dots rendering correctly (not diamond/unknown chars)
- [ ] Sign in/up — verify input box bg does not change on autofill (CSS fix deployed)
- [ ] Change Plan modal — back button on step 2 (VS Code AI added, verify working)
- [ ] "Don't see what you need?" section — verify text is dark on white background (fix deployed)
- [ ] Footer — verify 2-column mobile layout not breaking desktop layout

---

## ⚪ Deferred (Post-Launch)

- [ ] Light mode — guide at src/LIGHT_MODE_IMPLEMENTATION_GUIDE.md
- [ ] Facebook OAuth (needs DBA registration)
- [ ] Apple OAuth (needs $99 dev account)
- [ ] OAuth integrations — Mailchimp, HubSpot, Salesforce etc (needs OAuth app registration per platform)
- [ ] Namecheap CNAME update to e53e829ee840f3ad.vercel-dns-017.com (recommended by Vercel)

---

## ✅ Completed This Session

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
- [x] IntegrationsPage build error fixed (useState array closing bracket)
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
