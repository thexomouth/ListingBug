# ListingBug — 3-Day Launch Sprint
**Fri March 28 → Sun March 30, 2026**
Target: production-ready by Sunday night.

---

## Guiding principle
Only ship what makes the product trustworthy to a paying user.
No new features — only fixes, polish, and launch blockers.

---

## FRIDAY — Stability & Core Flows

Goal: every page loads, every core user action works end-to-end.

### Morning — QA pass (Jack, ~2 hrs)
Work through the app as a new trial user. Note any crash, blank state, or confusing UX.
Priority pages to test:
- [ ] Sign up → welcome → dashboard
- [ ] Search listings → save a listing → view saved listings tab
- [ ] Create automation → activate → run now
- [ ] Account → update profile → update password
- [ ] Billing → upgrade from trial → Stripe checkout end-to-end (use test card)
- [ ] Integrations → connect Mailchimp → audience dropdown → send test

### Morning — Bug fixes (Claude, parallel)
- [ ] **Automations My Automations tab** — verify loads after today's push (d9c57ba8), fix any remaining crash
- [ ] **Stripe checkout end-to-end** — test checkout → webhook → plan upgrade → UI reflects new plan
- [ ] **Usage cap UI** — when trial user hits 1,000 listings in a search, show a clear message with upgrade CTA (not a silent fail)
- [ ] **API key generator** — check display bug, verify generate + copy works

### Afternoon — Integration config completeness (Claude)
These need to work before launch because they're in the UI:
- [ ] **SendGrid** — activate modal: load lists via get-integration-options (already supported), save list selection
- [ ] **Google Sheets** — activate modal: spreadsheet ID input + sheet name + "find your ID" helper link
- [ ] **HubSpot** — activate modal: object type select (Contact/Deal), no pipeline needed for launch
- [ ] **Twilio** — activate modal: from-number input with +E.164 format hint
- [ ] **Webhook/Zapier/Make/n8n** — already works, just verify

### Afternoon — Human actions (Jack)
- [ ] **Google Sheets OAuth secrets** — update GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in Supabase to "Listingbug sheets" client
- [ ] **Supabase email confirmations** — enable + configure confirmation email template
- [ ] **Stripe test run** — run checkout with test card 4242 4242 4242 4242, verify webhook fires, plan updates

### EOD Friday target
Every page loads. Core flows (search, save, automate, billing) work end-to-end. No console errors on main pages.

---

## SATURDAY — Polish & Launch Blockers

Goal: product feels polished. Paying user has no confusion about what they're getting.

### Morning — UX polish (Claude)
- [ ] **ChangePlanModal** — verify trial → Starter upgrade flow is clear and works
- [ ] **Billing page** — show correct plan limits (Starter: 4,000 listings / 1 automation, Pro: 10,000 / 3)
- [ ] **Dashboard** — verify all quick action buttons work (Saved Listings, History nav)
- [ ] **Empty states** — all empty states have a clear CTA (no blank grids)
- [ ] **Search form** — verify filters are clean, no broken inputs, foreclosure filter confirmed removed
- [ ] **History tab headings** — verify new runs show search/automation name

### Morning — Automation reliability (Claude)
- [ ] **run-automation edge fn** — verify scheduled runs work (test trigger a run via Supabase dashboard)
- [ ] **run-due-automations** — verify cron/scheduler is set up and firing (check Supabase cron or pg_cron)
- [ ] **Automation run history** — verify history tab shows real runs with correct status/counts
- [ ] **Notification bell** — verify automation success/failure notifications appear

### Afternoon — Mobile QA (Jack)
- [ ] Test all main flows on mobile (iPhone Safari + Android Chrome)
- [ ] Fix any layout breaks Claude identifies from bug reports

### Afternoon — Error handling (Claude)
- [ ] **Trial expired** — verify expired trial redirects to billing with clear message
- [ ] **Subscription inactive** — verify canceled plan shows upgrade prompt
- [ ] **RentCast errors** — verify network/API errors show friendly message not spinner
- [ ] **Auth edge cases** — verify session expiry shows login prompt not crash

### EOD Saturday target
Product is demo-ready. You could walk a prospective customer through every feature without embarrassment.

---

## SUNDAY — Pre-Launch Hardening

Goal: ready for real users, real money.

### Morning — Security & limits (Claude)
- [ ] **Row Level Security** — verify all Supabase tables have RLS policies (run get_advisors check)
- [ ] **Trial abuse** — verify fingerprint check is working, can't create multiple trials
- [ ] **Webhook security** — outbound webhooks use HTTPS, auth header stored encrypted
- [ ] **API keys** — verify generated keys are scoped correctly, can't access other users' data

### Morning — Human final checks (Jack)
- [ ] **Google OAuth consent screen** — submit for verification (takes days, start now)
- [ ] **Stripe live mode** — switch from test to live keys when ready
- [ ] **Domain/SSL** — verify thelistingbug.com has valid SSL, no mixed content warnings
- [ ] **Supabase backups** — enable point-in-time recovery or daily backups

### Afternoon — Launch prep (Jack + Claude)
- [ ] **OG image + meta tags** — verify sharing preview on Twitter/LinkedIn looks right
- [ ] **Pricing page** — verify Starter ($19) and Pro ($49) match Stripe products exactly
- [ ] **Sign up flow** — test full flow as a brand new user (incognito) end-to-end
- [ ] **Support email** — verify support@thelistingbug.com and sales@thelistingbug.com work
- [ ] **Error monitoring** — add Sentry or basic error logging (optional but recommended)

### Final smoke test (both)
Run through this checklist as a real user in incognito:
1. Land on homepage → click Get Started
2. Sign up with new email → receive confirmation email → confirm
3. See trial dashboard → run a search (Denver, CO) → results load
4. Save a listing → go to Saved Listings → listing appears
5. Create automation → Mailchimp → select audience → activate
6. Click Billing → upgrade to Starter → Stripe checkout → complete
7. Plan shows Starter → limits update

### EOD Sunday target
Ship it. First paying customer can sign up, search listings, and run automations without hitting you for help.

---

## What's NOT in scope this weekend
These are post-launch (week 1+):
- PropertyRadar enrichment
- SEO (sitemap, JSON-LD, blog)
- Per-integration config for Airtable/Salesforce (low usage at launch)
- Google Sheets OAuth (pending Jack updating secrets — unblock Saturday)
- HubSpot pipeline dropdown (basic object type select is enough for launch)

---

## Human action summary (Jack only)
| Action | When | Time |
|---|---|---|
| Update Google Sheets OAuth secrets in Supabase | Friday AM | 5 min |
| Configure Supabase email confirmations | Friday AM | 15 min |
| Run Stripe checkout end-to-end test | Friday PM | 20 min |
| Mobile QA | Saturday PM | 1–2 hrs |
| Submit Google OAuth consent screen | Sunday AM | 30 min |
| Switch Stripe to live mode | Sunday PM | 10 min |
| Final smoke test (incognito) | Sunday PM | 30 min |

---

## Launch criteria checklist
Do not go live until all of these are checked:
- [ ] No crash on any main page (/listings, /automations, /account, /billing, /integrations)
- [ ] Sign up → confirmation email → login works
- [ ] Search returns real listings
- [ ] Stripe checkout completes and plan updates
- [ ] Trial enforcement works (expired trial blocked)
- [ ] At least one automation runs successfully end-to-end
- [ ] No hardcoded sample data visible to real users
- [ ] RLS enabled on all user-facing tables
- [ ] All pages render correctly on mobile

---

## Priority order if time runs short
1. No crashes (already mostly fixed)
2. Stripe billing works
3. Search works
4. Account / password
5. Automation runs
6. Integrations config polish
7. Everything else
