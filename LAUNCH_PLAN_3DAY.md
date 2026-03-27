# ListingBug — 3-Day Launch Sprint
**Fri March 28 → Sun March 30, 2026**

Pricing confirmed: Starter $19/mo (4k listings, 1 automation) · Pro $49/mo (10k, 3 automations) · 14-day trial, no card

---

## FRIDAY — Fix Everything That's Broken

**Theme: no page crashes, all core flows work**

### Claude — morning
- [ ] Verify automations now saves to DB (301275b0 fix) — create test automation, confirm it appears in My Automations and dashboard
- [ ] Stripe checkout end-to-end — trace the full flow: trial → click Upgrade → Stripe checkout → webhook fires → plan updates in DB → UI reflects new plan. Fix any broken step
- [ ] Usage cap UI — when trial user hits 1,000 listing search, show upgrade modal (not silent fail or generic error)
- [ ] Dashboard — verify "Run Automation" and "Saved Listings" quick actions navigate correctly
- [ ] API key generator — check if display bug exists, fix generate + copy

### Claude — afternoon
- [ ] Per-integration config in ActivateAutomationModal for remaining integrations:
  - **SendGrid** — load lists via get-integration-options (already works), show dropdown, save selection
  - **Google Sheets** — spreadsheet ID input + sheet name + link "How to find your spreadsheet ID"
  - **HubSpot** — object type dropdown (Contact / Deal), no pipeline needed
  - **Twilio** — from-number input with E.164 hint (+1XXXXXXXXXX)
- [ ] Verify webhook automation creates a run record and dispatches correctly

### Jack — Friday (all human actions)
- [ ] **Update Google Sheets OAuth secrets** in Supabase → Project Settings → Edge Function Secrets:
  - `GOOGLE_CLIENT_ID` = Client ID from "Listingbug sheets" OAuth client (ends -obpm...)
  - `GOOGLE_CLIENT_SECRET` = GOCSPX-lk5XhZ0ks... (from the dialog you screenshotted)
- [ ] **Enable Supabase email confirmations** — Auth → Email Templates → enable confirm email, customize template
- [ ] **Stripe end-to-end test** — use card 4242 4242 4242 4242, confirm plan upgrades correctly

### Friday EOD gate
Every page loads. Creating an automation, running a search, and upgrading a plan all work without errors.

---

## SATURDAY — Polish & Reliability

**Theme: feels like a real product, not a beta**

### Claude — morning
- [ ] Automation run reliability:
  - Verify `run-due-automations` cron is configured in Supabase (check pg_cron or scheduled jobs)
  - Test trigger a manual run via Supabase dashboard → confirm run record created + notification fired
  - History tab shows real runs with status, listings found/sent, destination
- [ ] Notification bell — verify automation success/failure notifications appear in-app
- [ ] Trial enforcement — expired trial shows upgrade prompt, not crash or blank page
- [ ] Canceled/past_due subscription — shows reactivate prompt
- [ ] RentCast errors — bad location shows friendly "No results" not a spinner forever

### Claude — afternoon
- [ ] Empty states — every empty list (no automations, no saved listings, no history) has a clear CTA
- [ ] Billing page — confirm correct limits shown per plan (Trial: 1k, Starter: 4k, Pro: 10k)
- [ ] ChangePlanModal — trial → Starter upgrade flow works cleanly
- [ ] Search filters — confirm foreclosure removed, no broken inputs
- [ ] Mobile layout — run through main flows on mobile viewport in browser devtools, fix obvious breaks

### Jack — Saturday
- [ ] Mobile QA on real device (iPhone Safari + Android Chrome if available)
- [ ] Review copy on pricing page — confirm $19 Starter and $49 Pro match Stripe products exactly

### Saturday EOD gate
You could demo the product to a potential customer without hitting anything embarrassing.

---

## SUNDAY — Hardening & Launch

**Theme: safe to take real money**

### Claude — morning
- [ ] RLS audit — run Supabase security advisor, verify all user-facing tables have RLS policies
- [ ] Verify users can only access their own data (automations, saved_listings, search_runs, usage_tracking)
- [ ] Final smoke test of sign up → search → automate → upgrade flow in incognito
- [ ] Clean up any remaining hardcoded sample data visible to users
- [ ] Error boundaries — verify the global error boundary shows a helpful page, not a blank white screen

### Jack — Sunday
- [ ] **Submit Google OAuth consent screen** for verification (takes days to approve, start now)
- [ ] **Switch Stripe to live mode** when ready — update STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in Supabase
- [ ] Verify thelistingbug.com SSL is valid, no mixed content warnings
- [ ] Confirm support@thelistingbug.com and sales@thelistingbug.com receive email
- [ ] Enable Supabase point-in-time recovery or daily backups

### Launch checklist (both — Sunday PM)
Do not go live until every box is checked:
- [ ] No crash on /listings, /automations, /account, /billing, /integrations
- [ ] Sign up → confirmation email → login works
- [ ] Search returns real RentCast listings
- [ ] Automation saves to DB and appears in My Automations
- [ ] Automation Run Now works and creates a run record
- [ ] Stripe checkout completes and plan updates in UI
- [ ] Trial enforcement blocks expired accounts
- [ ] No hardcoded "Dec 1, 2024" or "owner_123" visible to users
- [ ] RLS on all user tables
- [ ] Mobile renders without obvious layout breaks

---

## What's NOT in scope this weekend
Post-launch week 1+:
- PropertyRadar enrichment
- SEO (sitemap, JSON-LD, blog)
- Google Sheets OAuth (unblocked once Jack updates secrets Saturday)
- Airtable / Salesforce in ActivateModal
- HubSpot pipeline dropdown
- run-due-automations cron infrastructure (manual "Run Now" is enough for launch)

---

## If time runs short — priority order
1. No page crashes ✅ (mostly done)
2. Automations save to DB ✅ (just fixed)
3. Stripe billing works
4. Search works ✅
5. Account / password ✅
6. Integration config polish (SendGrid, Sheets, HubSpot)
7. Mobile polish
8. Everything else

---

## Human actions summary
| Action | Day | Est. time |
|---|---|---|
| Update Google Sheets OAuth secrets in Supabase | Friday AM | 5 min |
| Enable Supabase email confirmations | Friday AM | 15 min |
| Stripe end-to-end test | Friday PM | 20 min |
| Mobile QA on real device | Saturday | 1 hr |
| Submit Google OAuth consent screen | Sunday AM | 30 min |
| Switch Stripe to live mode | Sunday PM | 10 min |
| Final smoke test incognito | Sunday PM | 30 min |
