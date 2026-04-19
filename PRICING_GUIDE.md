# Pricing Change Guide

How to update plans, limits, prices, or add/remove tiers. Follow this in order — each section lists exactly which files to touch and why.

---

## Source of truth

`src/components/utils/planLimits.ts` is the single source of truth for plan definitions. **Start here for any pricing change.** Everything else reads from it or mirrors it.

### Current plans

| Key | Name | Price | Messages/mo | Cities |
|-----|------|-------|-------------|--------|
| `trial` | Trial | $0 | 100 | 1 |
| `city` | City | $19 | 2,500 | 1 |
| `market` | Market | $49 | 5,000 | 3 |
| `region` | Region | $99 | 10,000 | 10 |

### `PlanType` values stored in DB

The `users.plan` column holds the plan key. `normalizePlan()` maps legacy names to current keys — update it if you rename a plan or add migration aliases.

---

## Changing a price or limit

### 1. Update `planLimits.ts`

Edit `PLAN_CONFIG` — the `price`, `messagesPerMonth`, or `citiesAllowed` for the relevant plan.

### 2. Update the pricing page UI

`src/components/HomePage.tsx` — the pricing page is rendered when `page === 'pricing'`. Update:
- The card price display (search for the dollar amount)
- The feature list items (`messages/month`, `cities`)
- The plan comparison table (both desktop and mobile variants)
- The overage footnote if the overage rate changed

### 3. Update the in-app plan comparison modal

`src/components/PlanComparisonModal.tsx` — reads from `PLAN_CONFIG` automatically for limits, but the feature bullet list is hardcoded. Update it to match the pricing page.

### 4. Update Stripe

In the Stripe dashboard, update the product price. The Stripe price ID must match what your billing webhook uses to set `users.plan`. If you rename a plan key, update the mapping in your Stripe webhook handler.

Also update `src/V2_OPERATIONAL_CHECKLIST.md` to reflect the new plan structure.

---

## Adding a new plan tier

### 1. `planLimits.ts`
- Add the new key to `PlanType`
- Add an entry in `PLAN_CONFIG`
- Update `normalizePlan()` to handle the new key
- Update `getNextPlan()` so upgrade paths are correct

### 2. Pricing page — `src/components/HomePage.tsx`
- Add a new plan card in the 3-up grid (or expand to 4-up)
- Add a column to the plan comparison table (both mobile stacked cards and desktop table)

### 3. In-app modal — `src/components/PlanComparisonModal.tsx`
- Add the new plan key to the `PLANS` array at the top

### 4. `CityLimitModal.tsx` — `src/components/v2/CityLimitModal.tsx`
- No changes needed — it reads `getNextPlan()` dynamically

### 5. `V2Dashboard.tsx` — `src/components/v2/V2Dashboard.tsx`
- No changes needed — it reads `PLAN_CONFIG` via `normalizePlan()`

### 6. DB migration
- No schema changes needed for a new plan tier — `users.plan` is a free-text column
- If you add a new enforcement dimension (e.g. `teamsAllowed`), add the column to `plan_limits` in a new migration

---

## Changing the overage rate

The overage rate ($0.02/msg) is display-only today — actual overage billing happens in Stripe. Update the copy in:
- `src/components/HomePage.tsx` — overage footnote below the plan cards
- `src/components/PlanComparisonModal.tsx` — footnote at the bottom of the modal
- `src/V2_OPERATIONAL_CHECKLIST.md` — Stripe section

---

## How enforcement works end-to-end

### City limit (hard block)
- **Enforced in:** `src/components/v2/NewCampaign.tsx` — step 1 advance handler
- **Check function:** `canAddCity(plan, activeCityCount)` from `planLimits.ts`
- **Modal:** `src/components/v2/CityLimitModal.tsx`
- **Logic:** counts distinct cities across the user's active campaigns, compares to `citiesAllowed`
- To change the limit, update `citiesAllowed` in `PLAN_CONFIG`

### Message volume (metered, not blocked — overages billed via Stripe)
- **Logged by:** `supabase/functions/send-campaign-emails/index.ts` (one row per email sent) and `supabase/functions/run-sms-queue/index.ts` (one row per SMS sent)
- **Table:** `usage_logs` — columns: `user_id`, `campaign_id`, `send_id`, `channel`, `stripe_period_end`, `plan_type`, `logged_at`
- **Displayed in:** `src/components/v2/V2Dashboard.tsx` — queries `usage_logs` for the current billing period, compares to `planLimit` from `PLAN_CONFIG`
- To change the message limit, update `messagesPerMonth` in `PLAN_CONFIG`

### Plan data flow through edge functions
- `send-campaign-emails` reads `users.plan` and writes it to `usage_logs.plan_type`
- `send-campaign-sms` reads `users.plan` and `stripe_subscription_end`, stores both on `sms_queue` rows
- `run-sms-queue` reads those fields from `sms_queue` and writes them to `usage_logs` at actual send time
- If you add a new edge function that sends messages, follow this pattern: load `users.plan` + `stripe_subscription_end`, write a `usage_logs` row on successful send

---

## Legacy plan names

The old product used `starter / pro / enterprise` plan keys. `normalizePlan()` maps these to the new model so existing users aren't broken. If you retire a legacy alias, remove it from `normalizePlan()` only after confirming no `users.plan` rows still hold that value.

```
starter     → city
pro         → market
professional → market
home        → city
enterprise  → region
```
