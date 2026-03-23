# ListingBug — AI Session Handoff
**Date:** March 22, 2026 (end of day)

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
| Local path | `C:\Users\User\Downloads\ListingBug FIGMA MVP` |

---

## Workflow Rules

1. **Read PUNCH_LIST.md first** — Jack adds items inline, don't miss them
2. **Git via cmd** — never PowerShell for git (use cmd with the full git path)
3. **Build before push** — run `b.bat` in project root. Must show `✓ built` with no errors
4. **Verify deploy** — check Vercel after every push. Test preview URL before calling it done
5. **edit_block for surgical changes** — use Windows-MCP:FileSystem write mode for full rewrites
6. **Patch scripts = .cjs** — package.json has `"type": "module"`
7. **Give Jack one command** — don't make him run multiple steps separately

### Git Command Template
```
cd /d "C:\Users\User\Downloads\ListingBug FIGMA MVP" && "C:\Program Files\Git\bin\git.exe" add -A && "C:\Program Files\Git\bin\git.exe" commit -m "message" && "C:\Program Files\Git\bin\git.exe" push origin main
```

### Build Check
```
b.bat
```

---

## TDZ Crash — Known Issue History

The site had a `Cannot access 'y' before initialization` crash. Two confirmed causes:
1. **Literal `\n` in JSX** — patch scripts can write backslash-n as text inside JSX. This builds but crashes at runtime.
2. **Direct import of SubscriptionGate** — importing it as a separate file caused circular TDZ. It MUST be inlined as a function declaration in App.tsx AFTER all imports.

**Rule:** Never add a new top-level import to App.tsx for a component that itself imports from supabase or other shared modules. Use `lazy()` or inline it.

---

## Key Files

| File | Notes |
|---|---|
| `src/App.tsx` | Router, SubscriptionGate inlined here after all imports |
| `src/components/SearchListings.tsx` | ~108KB — surgical edits only |
| `src/components/BillingPage.tsx` | Real plan data from Supabase, Stripe portal wired |
| `src/components/ChangePlanModal.tsx` | Stripe Checkout, $19/$49, no proration, no Enterprise |
| `src/components/PlanComparisonModal.tsx` | Stripe Checkout, $19/$49 |
| `src/components/APIKeysSection.tsx` | getSession destructuring fixed |
| `src/components/SearchResultsPage.tsx` | Loads results from search_runs |
| `index.html` | Title "ListingBug", favicon.png, og-image.png, OG meta tags |
| `public/favicon.png` | ✅ In place |
| `public/og-image.png` | ✅ In place |
| `b.bat` | Build check shortcut |

---

## Edge Functions (all ACTIVE)

| Function | Ver | Notes |
|---|---|---|
| `search-listings` | v17 | Trial cap fixed to 4,000. Blocks inactive plans. |
| `delete-user` | v1 | Account deletion |
| `create-checkout-session` | v3 | Stripe Checkout |
| `stripe-webhook` | v3 | Subscription lifecycle |
| `stripe-portal` | v3 | Customer Portal redirect |

---

## Supabase Tables

users, searches, saved_listings, search_runs, automations, automation_runs, usage_tracking, notifications, api_keys, signup_fingerprints

Key columns on `users`: plan, plan_status, trial_ends_at, stripe_customer_id, stripe_subscription_id, trial_abuse_flag

---

## What Needs QC Next Session

Jack is doing QC. Likely findings will include:
- Search form simplification (not yet done — big task, in punch list)
- Create Automation: Field Mappings section may still appear (cleanup script may have missed it)
- Any remaining sample data in account pages
- Stripe checkout end-to-end test

Start next session by reading PUNCH_LIST.md and asking Jack what QC findings he has.
