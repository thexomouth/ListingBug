# ListingBug Punch List
**How to use:** Jack adds items anytime. Claude checks this file at the start of each session and marks items `[x]` when complete.
**Last updated:** March 21, 2026

---

## 🔴 Critical (Blocking Launch)

- [ ] Stripe billing — Starter $49/mo, Professional $99/mo, checkout edge function, webhook, BillingPage wiring
- [ ] Email verification — re-enable in Supabase dashboard (Jack's action — code ready)
- [ ] Google OAuth consent screen — submit for Google verification

---

## 🟡 Remaining Code Work

- [ ] Agent contact info 100% blank — broadened field fallbacks deployed (fix2.cjs) — needs live verification after next search. RentCast may use `listingAgent` key instead of `agent`. If still blank after deploy, need to log raw API response to confirm key names.
- [ ] Sample report homepage — verify 3-day listings return data for common ZIP codes
- [ ] Automation overage warning — deploying now in fix2.cjs
- [ ] CSV Email Delivery option in automation wizard — deploying now in fix2.cjs
- [ ] Verify CSV generation is wired end-to-end for automation runs (currently frontend-only)

---

## 🟡 Future / High Value

- [ ] PropertyRadar homeowner data — full implementation post-launch
- [ ] Google Street View API key — drop real key into ListingDetailModal.tsx (AIzaSyD-placeholder)

---

## 🟡 Post-Stripe (blocked)

- [ ] Account/Billing — billing history (real Stripe data)
- [ ] Account/Billing — download invoice button

---

## 🟡 Verify on Device

- [ ] Search history cards — verify full card click opens SearchResultsPage (not just Re-run button)
- [ ] Dashboard automation card line break — verify "Active / Automations" renders with break
- [ ] White logo in signed-out mobile sidebar — verify renders correctly
- [ ] Gray placeholders on sign in/up and contact support — verify in browser

---

## ⚪ Deferred (Post-Launch)

- [ ] Light mode — guide at src/LIGHT_MODE_IMPLEMENTATION_GUIDE.md
- [ ] Search lat/lng+radius — readdress post-launch
- [ ] Facebook OAuth, Apple OAuth
- [ ] OAuth integrations — Mailchimp, HubSpot, Salesforce
- [ ] Namecheap CNAME → e53e829ee840f3ad.vercel-dns-017.com
- [ ] Search run history retention policy

---

## ✅ Completed This Session

- [x] Viewport maximum-scale=1.0 — zoom no longer locks on mobile
- [x] AccountPage pt-0 — extra padding above tabs removed
- [x] App.tsx accountDefaultTab type — added 'usage' to union (fixes profile/dashboard chunk errors)
- [x] Scroll reset on navigation — documentElement.scrollTop = 0 (mobile compatible)
- [x] globals.css — gray placeholder text site-wide via CSS
- [x] Footer signed-in — logo+description full-width, 2-col grid after (Resources + Account only), Privacy Policy + Terms added to Resources, Dashboard/Overview/Search Listings removed
- [x] Header — white logo imported and used in signed-out mobile sidebar
- [x] Header — X button in sidebar changed to white (dark background)
- [x] ChangePlanModal — back button arrow only (no text), arrow enlarged to w-6 h-6
- [x] Dashboard — Listings Saved card now uses 'listings' session key
- [x] SearchListings — open tab logic handles 'listings' key → opens Listings tab
- [x] LoginPage — autocomplete="email" + name attrs for iOS autofill
- [x] SignUpPage — autocomplete="email"/"new-password" + name attrs for iOS autofill
- [x] PropertyRadar "Get Homeowner Data" teaser in listing modal
- [x] SearchResultsPage — loads from Supabase on demand, no re-fetch
- [x] search_runs table — persists full results per run permanently
- [x] Automation wizard — field mapping step removed (1→3→4)
- [x] CSV export improved — all key fields, tracks in automation_runs
- [x] Dashboard Exported count includes CSV downloads
- [x] search-results route in App.tsx
- [x] search history loads from Supabase, cards clickable

---

## ✅ Completed Previous Sessions

- [x] Build, auth, router, MIME type, mobile zoom, footer 2-col, autofill, nav renames
- [x] Edge functions: search-listings v12, delete-user v1
- [x] Cross-device sync: saved listings + searches via Supabase
- [x] Usage meter: real Supabase data, updates after search
- [x] Agent field mapping: RentCast nested l.agent.name/phone/email
- [x] Listing modal: no fake photos, proper agent fallbacks
- [x] Dashboard: real photos, zero-state integrations, real usage counts
- [x] Search defaults, relaxed validation, loading overlay with city/state
- [x] Notifications: Supabase-backed with realtime subscription
- [x] All prior bug fixes documented in git history
