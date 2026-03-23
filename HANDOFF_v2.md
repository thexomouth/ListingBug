# ListingBug — AI Session Handoff Document
**Date:** March 22, 2026
**Prepared by:** Claude (outgoing session)
**For:** Claude (incoming session)

---

## Project Overview

**ListingBug** — commercial SaaS for real estate service providers. Search MLS-style listing data via RentCast API, save listings, automate delivery to integrations, track usage against monthly plan cap.

**Owner:** Jack (Denver, CO)
**Live:** https://thelistingbug.com
**GitHub:** https://github.com/thexomouth/ListingBug
**Stack:** React + TypeScript + Tailwind (Vite) + Supabase + Vercel + RentCast + Stripe

---

## Credentials

| Item | Value |
|---|---|
| Supabase project ID | `ynqmisrlahjberhmlviz` |
| Supabase anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucW1pc3JsYWhqYmVyaG1sdml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTQ2MzksImV4cCI6MjA4OTUzMDYzOX0.dDZodNajIu6UVfSkMCYiX4B4yYEf7QtPot3mNy18yMg` |
| RentCast API key | `28c8bab516194c20a346b7db3d987bd6` |
| Stripe Starter Price ID | `price_1TDod6A3dmARSc7xs4IGkHwB` ($19/mo) |
| Stripe Pro Price ID | `price_1TDog0A3dmARSc7xuoR2gRUh` ($49/mo) |
| Street View API key | `AIzaSyBx4RH4XvtQWTRfIw4EW-g1VzwEAihe628` |
| Vercel project ID | `prj_4D3zdZgjjaRmUkDwzgOh3RvxhvSK` |
| Vercel team ID | `team_tvsjFBK7Xv5jiZhqdxEuhnUs` |
| Local project path | `C:\Users\User\Downloads\ListingBug FIGMA MVP` |

---

## Workflow Rules

1. **Git via cmd only** — never PowerShell for git (hangs). Give Jack the cmd command.
2. **File edits** — use `Desktop Commander:edit_block` for targeted changes. Use `Windows-MCP:FileSystem` write for full file rewrites.
3. **Patch scripts** — use `.cjs` extension (package.json has `"type": "module"`).
4. **Build before push** — always run `b.bat` (in project root) before committing. It runs `npm run build 2>&1 | findstr /i "error built"`. Must show `✓ built` with no errors.
5. **Verify deploy** — after every push, call `Vercel:list_deployments` to confirm READY not ERROR. Then test the preview URL before calling it done.
6. **CRLF problem** — Windows line endings break multi-line string replacements. Use `Desktop Commander:edit_block` for surgical edits.
7. **Large files** — SearchListings.tsx is 108KB+. Never rewrite whole file. Use edit_block or targeted .cjs scripts.

### Git Command Template
```
cd /d "C:\Users\User\Downloads\ListingBug FIGMA MVP" && "C:\Program Files\Git\bin\git.exe" add -A && "C:\Program Files\Git\bin\git.exe" commit -m "message" && "C:\Program Files\Git\bin\git.exe" push origin main
```

### Build Check
```
b.bat
```
(bat file in project root — runs npm run build and filters for errors)

---

## CRITICAL: TDZ Crash History

The site suffered a "Cannot access 'y' before initialization" crash that took all morning to fix. Root causes identified:

1. **Literal `\n` in JSX** — a patch script wrote a backslash-n as text inside a JSX div in SearchListings.tsx loading animation. This doesn't cause a build error but causes a runtime TDZ crash in Vite's bundled output.
2. **SubscriptionGate as a separate import** — importing SubscriptionGate from its own file caused a circular dependency TDZ. MUST be inlined directly in App.tsx as a function declaration AFTER all import statements.

**Rule:** Never create a new component file that App.tsx imports directly (non-lazy). Either inline it or use `lazy()`.

---

## Key Files

| File | Notes |
|---|---|
| `src/App.tsx` | Router, auth, SubscriptionGate inlined here after all imports |
| `src/components/SearchListings.tsx` | ~108KB — use edit_block only |
| `src/components/BillingPage.tsx` | Reads real plan from Supabase, Stripe portal wired |
| `src/components/ChangePlanModal.tsx` | Wired to Stripe Checkout, prices $19/$49 |
| `src/components/PlanComparisonModal.tsx` | Wired to Stripe Checkout, prices $19/$49 |
| `src/components/SignUpPage.tsx` | Browser fingerprinting on signup |
| `src/components/SearchResultsPage.tsx` | Loads results from search_runs on demand |
| `index.html` | Title "ListingBug", favicon, OG meta tags |
| `public/favicon.png` | Jack to place manually — not in git yet |
| `public/og-image.png` | Jack to place manually — not in git yet |
| `PUNCH_LIST.md` | Read this FIRST every session |
| `b.bat` | Build check shortcut |

---

## Supabase Tables

| Table | Purpose |
|---|---|
| `users` | plan, plan_status, trial_ends_at, stripe_customer_id, stripe_subscription_id, trial_abuse_flag |
| `searches` | saved searches (cross-device) |
| `saved_listings` | saved listing data (cross-device) |
| `search_runs` | full results JSON per search, permanent, RLS enabled |
| `automations` | automation configs |
| `automation_runs` | run history + CSV export tracking |
| `usage_tracking` | monthly listing usage per user |
| `notifications` | in-app notifications |
| `signup_fingerprints` | browser fingerprint hashes for trial abuse |

## Edge Functions (all ACTIVE)

| Function | Ver | Purpose |
|---|---|---|
| `search-listings` | v16 | RentCast proxy, usage tracking, plan enforcement, abuse check |
| `delete-user` | v1 | Account deletion |
| `create-checkout-session` | v3 | Stripe Checkout |
| `stripe-webhook` | v3 | Subscription lifecycle → updates users table |
| `stripe-portal` | v3 | Stripe Customer Portal redirect |

---

## What's Live Right Now

Site is live at thelistingbug.com on the latest deployment. All billing infrastructure is wired. The main open issues are:

1. **Stripe checkout failing** — "Could not start checkout" error. Likely STRIPE_SECRET_KEY not set correctly in Supabase secrets. Check first thing.
2. **Usage limit bug** — trial hitting 4,000 cap after 500 listings. Edge function usage tracking logic may have a bug.
3. **Large UI cleanup list** — Jack added ~15 items to PUNCH_LIST.md covering account page cleanup, form simplification, zero states, etc. See PUNCH_LIST.md 🔴 UI Cleanup section.

---

## What's NOT Done Yet (Next Session Priority Order)

1. Fix Stripe checkout error (verify secret key)
2. Fix usage limit bug (edge function audit)
3. Fix API key generation "not signed in" error
4. UI cleanup items (account pages, billing, automation wizard)
5. Search form simplification
6. Jack to manually place favicon.png and og-image.png in public/

---

## Session Notes for Incoming Claude

- Jack is fast, direct, and gets frustrated when responses are verbose or ask him to do things in multiple steps. Give him one command that does everything when possible.
- Read PUNCH_LIST.md first. Jack adds items inline. Don't miss them.
- Build and deploy verification are mandatory — a clean local build doesn't guarantee no runtime crash.
- The `b.bat` file in the project root is the build check shortcut. Use it.
- Desktop Commander defaultShell is set to `cmd`. PowerShell has `&&` separator issues.
- If Vercel deploy shows ERROR, get build logs immediately before touching anything else.
