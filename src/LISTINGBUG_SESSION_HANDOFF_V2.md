# ListingBug — Session Handoff Document
**Created:** March 21, 2026
**Purpose:** Bring next Claude session up to speed instantly
**Attach this file at the start of every new session**

---

## What Is ListingBug

Commercial SaaS for real-estate service providers to monitor new listings and agent contact info. Users search, save, export CSVs, and automate syncing to CRMs and email tools.

**Owner:** Jack (Denver, CO) — solo developer
**GitHub:** https://github.com/thexomouth/ListingBug
**Live site:** https://thelistingbug.com (and www.)
**Vercel project:** listing-bug
**Vercel team ID:** team_tvsjFBK7Xv5jiZhqdxEuhnUs
**Supabase project:** https://ynqmisrlahjberhmlviz.supabase.co
**Supabase project ID:** ynqmisrlahjberhmlviz
**Supabase anon key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucW1pc3JsYWhqYmVyaG1sdml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTQ2MzksImV4cCI6MjA4OTUzMDYzOX0.dDZodNajIu6UVfSkMCYiX4B4yYEf7QtPot3mNy18yMg
**RentCast API key:** 28c8bab516194c20a346b7db3d987bd6

---

## Stack

| Layer | Tool |
|-------|------|
| Frontend | React / TypeScript / Tailwind (Vite) |
| Backend | Supabase (auth + database + edge functions) |
| Deployment | Vercel (auto-deploy on GitHub push) |
| Version Control | GitHub — thexomouth/ListingBug |
| Code Editor | VS Code — project at C:\Users\User\Downloads\ListingBug FIGMA MVP |
| Data API | RentCast |
| Billing | Stripe (not yet set up) |
| Domain | thelistingbug.com (Namecheap) |

---

## Dev Environment

- **OS:** Windows 10
- **Node:** v24.13.0
- **Git path:** C:\Program Files\Git\bin\git.exe
- **Git auth:** logged in as thexomouth via HTTPS
- **npm scripts:** require PowerShell execution policy set — already done (RemoteSigned for CurrentUser)
- **Supabase CLI:** installed via npx, logged in
- **Dev server:** run `npm run dev` in cmd from project folder — serves on localhost:3000

**MCP tools available:**
- Desktop Commander — read/write files, run PowerShell
- Windows-MCP — screenshots, clipboard, notifications
- Vercel MCP — deployment logs (needs teamId: team_tvsjFBK7Xv5jiZhqdxEuhnUs)
- Supabase MCP — SQL queries (limited to non-DDL on free tier)
- Figma MCP — design context

---

## Current Build Status — BROKEN

### Problem
Multiple `.tsx` files were corrupted (flattened to 1 line) during light mode regex replacement attempts earlier in this session. The build has been failing on Vercel for the last 6+ deployments.

### Known corrupted files confirmed:
- `src/components/SearchListings.tsx` — was 1 line, restored via `git checkout HEAD~3`
- `src/components/HomePage.tsx` — was 1 line, restore attempted but build still failing

### Last error seen:
```
error during build:
[vite:esbuild] Transform failed with 1 error:
C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/HomePage.tsx:1:49658: ERROR: Unexpected end of file
Command "npm run build" exited with 126
```

### FIRST THING TO DO in next session:
Run a full audit of all TSX files for corruption, then restore any corrupted ones from git:

```
cd "C:\Users\User\Downloads\ListingBug FIGMA MVP"
```

Then run this PowerShell to find all corrupted files (1 line = corrupted):
```powershell
Get-ChildItem "C:\Users\User\Downloads\ListingBug FIGMA MVP\src" -Recurse -Filter "*.tsx" | ForEach-Object { $lines = (Get-Content $_.FullName).Count; if ($lines -le 3) { "$($_.Name): $lines lines" } }
```

Then restore each corrupted file:
```
git checkout HEAD~3 -- src/components/HomePage.tsx
```
(adjust HEAD~N as needed — HEAD~3 is the last known good commit before corruption)

After restoring all files, verify the build passes locally:
```
npm run build 2>&1 | findstr /i "error"
```

Then commit and push:
```
git add -A && git commit -m "restore corrupted files from light mode pass" && git push origin main
```

---

## What Was Completed This Session

### Infrastructure
- ✅ GitHub repo live: thexomouth/ListingBug
- ✅ Vercel deployed: thelistingbug.com and www.thelistingbug.com
- ✅ DNS configured in Namecheap (A record: 216.198.79.1, CNAME: cname.vercel-dns.com)
- ✅ Supabase project created with all database tables

### Database (Supabase)
All tables created with RLS and indexes:
- `users` — plan, trial tracking, auto-created on signup via trigger
- `searches` — saved search criteria
- `saved_listings` — bookmarked listings per user
- `automations` — automation configs
- `automation_runs` — execution history
- `integration_connections` — OAuth/API key connections
- `usage_tracking` — monthly listing fetch counts per user
- `api_keys` — user-generated API keys
- `listings` — RentCast listing cache (all fields)
- `property_records` — full public record data
- `property_valuations` — AVM results per user request
- `property_history` — listing/transaction history per user request
- `tax_assessments` — tax assessor data per user request
- `market_statistics` — zip-level market data cache

### Auth
- ✅ Email/password auth wired via Supabase
- ✅ Google OAuth configured (credentials in Google Cloud Console, wired to Supabase)
- ✅ Apple — skipped (needs $99 dev account)
- ✅ Facebook — hidden (needs DBA registration first)
- ✅ Phone verification removed from signup flow
- ✅ Supabase URL config: site URL = https://thelistingbug.com, redirect URLs set
- ✅ LoginPage.tsx — Google only, real Supabase auth
- ✅ SignUpPage.tsx — Google only, real Supabase auth

### RentCast Integration
- ✅ RENTCAST_API_KEY stored in Supabase Edge Function secrets
- ✅ `search-listings` edge function deployed — handles auth, plan limits, usage tracking, RentCast API call, upserts to listings table
- ✅ SearchListings.tsx — handleSearch replaced with real edge function call (but file was then corrupted — see above)
- ✅ `src/lib/supabase.ts` created with client config

---

## What Still Needs To Be Done

### Immediate (fix build)
- [ ] Find and restore all corrupted .tsx files
- [ ] Verify `npm run build` passes locally
- [ ] Push clean build to GitHub/Vercel

### QC Testing (after build is fixed)
Test these 8 flows end-to-end:
1. Sign up with email → confirm user row in Supabase users table
2. Log in → confirm session persists on refresh
3. Google OAuth → confirm redirect works
4. Search (try Denver, CO) → confirm real RentCast listings return
5. Save a listing → confirm persists
6. Save a search → confirm persists
7. Check usage_tracking table updates after search
8. Verify trial cap (500 listings) enforced

### Phase 6 — Stripe Billing
- [ ] Create Stripe account
- [ ] Create two products: Starter $49/mo, Professional $99/mo
- [ ] Write Stripe Checkout edge function
- [ ] Write Stripe webhook handler (updates user plan in DB)
- [ ] Update BillingPage.tsx with real Stripe links
- [ ] Enterprise = contact form only

### Phase 7 — Integration Wiring
Tier 1 (API key, MVP): Zapier, Make.com, n8n, SendGrid
Tier 2 (OAuth, week 2): Mailchimp, HubSpot, Constant Contact
Tier 3 (complex OAuth, 30 days): Salesforce, Zoho

### Phase 8 — QA and Launch
Five flows to verify end-to-end before launch.

### Post-Launch
- Google OAuth verification (lift 100 user cap — needs live privacy policy URL)
- Facebook OAuth (after DBA registration)
- Apple OAuth (after $99 dev account)
- Light mode implementation (guide exists at src/LIGHT_MODE_IMPLEMENTATION_GUIDE.md)
- DNS: update Namecheap CNAME to e53e829ee840f3ad.vercel-dns-017.com (Vercel recommended)

---

## Pricing

| Plan | Price | Listings/mo |
|------|-------|-------------|
| Starter | $49/mo | 4,000 |
| Professional | $99/mo | 10,000 |
| Enterprise | Contact Us | Unlimited |
| Trial | Free 14 days | 500 |

---

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | All routing and page-level state |
| `src/lib/supabase.ts` | Supabase client + UserProfile type |
| `src/components/LoginPage.tsx` | Real Supabase auth, Google only |
| `src/components/SignUpPage.tsx` | Real Supabase auth, Google only |
| `src/components/SearchListings.tsx` | Search UI + RentCast edge function call |
| `src/components/Dashboard.tsx` | Main dashboard |
| `src/components/BillingPage.tsx` | Subscription management (Stripe needed) |
| `supabase/functions/search-listings/index.ts` | RentCast edge function |
| `src/LIGHT_MODE_IMPLEMENTATION_GUIDE.md` | VS Code AI guide for light mode |

---

## Important Notes for Next Session

1. **Do not run bulk regex replacements on .tsx files** — this caused the corruption issue. Any file edits must be done with line-range replacement using the PowerShell array method demonstrated this session.

2. **Vercel team ID:** team_tvsjFBK7Xv5jiZhqdxEuhnUs — required for all Vercel MCP tool calls

3. **Git PATH in PowerShell:** Always add `$env:PATH += ";C:\Program Files\Git\bin"` before running git commands in PowerShell tool

4. **LoginPage still showing Apple/Facebook on live site** — because the "hide Apple Facebook" commit deployed correctly but subsequent broken commits rolled it back. Fix will resolve automatically once build is restored.

5. **Light mode is deferred** — do not attempt until after Stripe and QC are complete

6. **Namecheap URL Redirect Record** — there is a stuck URL Redirect Record on @ that cannot be deleted. It coexists with the A Record and does not block Vercel routing.
