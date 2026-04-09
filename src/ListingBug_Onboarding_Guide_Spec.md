# ListingBug — Onboarding Guide Spec

**Document type:** Implementation reference for Claude Code  
**Created:** April 7, 2026  
**Updated:** April 9, 2026  
**Scope:** New user onboarding — Full-screen welcome → guided sequential flow → persistent Dashboard checklist

---

## Overview

New users land in an app with a lot of surface area (Search, Automations, Integrations, Messaging). Without guidance, the messaging page is functionally dead until setup occurs, and automations don't make sense without a search or destination. This spec defines a guided onboarding flow that opens with a full-screen welcome and threads users through the right sequence without forcing a rigid flow.

**Chosen format:** Full-screen welcome overlay (first login only) → Dashboard checklist card (persistent, collapsible) + contextual post-action modals at natural "what's next?" moments + inline empty states on dead pages.

**Step order rationale:** Automations are the core value loop of the product — users should understand search automations and messaging automations before being routed to the standalone Messaging setup. Messaging comes last as an optional deepening step.

---

## The Five Steps

| # | Step | Completion signal | Required? |
|---|------|------------------|-----------|
| 0 | Welcome screen | Dismissed (localStorage flag) | Yes — shown once |
| 1 | Run your first search | Any row in `search_runs` for this user | Yes |
| 2 | Connect a destination | Any row in `integration_connections` | Yes |
| 3 | Create your first automation | Any row in `automations` for this user | Yes |
| 4 | Set up ListingBug Messaging | Sender configured in messaging setup | Optional |

---

## Step-by-Step Flow

### Step 0 — Full-screen welcome (first login only)

**Trigger:** First time a new user lands on the Dashboard (detect via `lb_onboarding_welcomed: true` absent from localStorage).

**Design:** Full-screen overlay (not a modal) — dark background, centered content, no escape except the CTA. Feels like a landing moment, not a popup.

**Content:**
- Headline: **"Welcome to ListingBug"**
- Subtext: "Let's get you started. We'll load local listings you can export, automate, and message — right from here."
- CTA (primary, prominent): **"Run Your First Search →"**
- Secondary link (small, below CTA): "Skip for now" — dismisses overlay, sets `lb_onboarding_welcomed: true`, starts checklist from Step 1

**On CTA click:** Dismiss overlay, set `lb_onboarding_welcomed: true`, navigate to Search page with the search subcomponent focused.

---

### Step 1 — Run your first search
- User arrives on Search page from the welcome CTA.
- Highlight the city input and show a prompt: "Start by entering a city to find listings."
- Once a valid city is entered, optionally prompt user to adjust price range, then guide them to submit the search.
- **After results load:** highlight the first row in the results table, prompting the user to click it to preview a listing in the detail modal. After they close the modal, highlight the **Export** button and guide them toward connecting a destination.
- **On first successful search result:** show **Modal A** (post-search) — see below.
- Step auto-completes when `search_runs` row exists for this user.

### Step 2 — Connect a destination
- Triggered by Modal A (post-search) or by user returning to Dashboard.
- CTA navigates to Integrations page: "Choose a platform below to export new listings and agents to."
- This step waits for any integration to be connected — no specific platform is required.
- After connecting, show **Modal B**: guide user back to Search → History tab to select their recent search and use the Export button with their newly connected integration.
- After a successful export, **Modal C** fires: "Ready to automate this search?" → navigates to Automations.
- Step auto-completes when `integration_connections` has any row.

### Step 3 — Create your first automation
- CTA navigates to **Automations → Create tab**.
- Explain that the Automations page has two types of automations:
  - **Search automations** — run a saved search on a schedule and export results to your connected destination automatically
  - **Messaging automations** — send automated emails to agents in your list on a schedule or when contacts are added
- Prompt is pre-filled with the city from the user's first search if available (pass via `sessionStorage`).
- Step auto-completes when any row exists in `automations` for this user.
- On completion, surface the optional messaging step via **Modal D**: "Want to set up automated messaging to the agents in [city]?" — with a CTA to Messaging setup and a "Not now" dismiss.

### Step 4 — Set up ListingBug Messaging *(optional)*
- Only surfaced after Step 3 completes (via Modal D), or visible on the checklist with an "Optional" badge.
- CTA deep-links directly to **Messaging → Setup tab**.
- Step auto-completes when a valid sender identity is saved in messaging setup.
- **Inline empty state on Messaging page** (see Empty States section) handles users who arrive here without guidance.
- This is the finish line. On completion (or explicit dismissal), checklist card shows a success state for a few seconds, then collapses/dismisses permanently.

---

## Modal A — Post-Search Success

**Trigger:** First time a search returns results (detect via `search_runs` count going from 0 → 1, or a `sessionStorage` flag set by the search component on first save).

**Content:**
- Headline: "You've got listings — now where do you want to send them?"
- Body: "Connect an integration to sync listings to Mailchimp, Google Sheets, a webhook, or more."
- CTA primary: "Connect a destination →" → navigates to Integrations
- CTA secondary: "I'll do this later" → dismisses, marks as seen in localStorage

**Do not show again once dismissed or Step 2 is complete.**

---

## Modal B — Post-Integration "Now let's export"

**Trigger:** After a user successfully connects their first integration on the Integrations page.

**Content:**
- Headline: "Connected. Let's export your first batch of listings."
- Body: "Head back to your search history and export the results to your new integration."
- CTA primary: "Go to Search History →" → navigates to Search → History tab
- CTA secondary: "I'll do this later" → dismisses

---

## Modal C — Post-Export "Automate this"

**Trigger:** After a user's first successful export from the Search History or results page.

**Content:**
- Headline: "Nice work. Want to automate that search?"
- Body: "Set up a daily automation and ListingBug will run this search and export new listings for you — automatically."
- CTA primary: "Set up an automation →" → navigates to Automations → Create tab
- CTA secondary: "Maybe later" → dismisses

---

## Modal D — Post-Automation "Set up messaging"

**Trigger:** After a user creates their first automation (any row inserted to `automations`).

**Content:**
- Headline: "Want to set up automated messaging for agents in [city]?"
- Body: "ListingBug Messaging lets you send automated emails directly to agents in your list — from your own sender address."
- CTA primary: "Set up messaging →" → navigates to Messaging → Setup tab
- CTA secondary: "Not now" → dismisses, marks messaging step as skipped in localStorage

**`[city]` is pulled from the user's first search if available in `search_runs`; fall back to "your area" if not.**

**Implementation note:** The current Mailchimp integration stores API key + `list_id` + tags. This is sufficient for contact sync only — it does not and cannot trigger Mailchimp campaigns. Do not imply otherwise in UI copy. Users who want to send campaigns via Mailchimp do so entirely within Mailchimp after contacts are synced.

---

## Dashboard Checklist Card

**Location:** Top of Dashboard, below the page header, above stats cards. Collapses to a small "Setup guide (2/4 done)" pill once any step is complete. Not shown at all until the welcome overlay (Step 0) has been dismissed.

**Structure:**
```
[✓] Run your first search              Done
[ ] Connect a destination              → Go to Integrations
[ ] Create your first automation       → Create automation
[ ] Set up ListingBug Messaging        Optional · Go to Setup

                              [Dismiss guide]
```

**Behavior:**
- Each row shows a checkmark if auto-detected as complete (query Supabase on Dashboard load).
- Steps are clickable — each CTA navigates to the right page/tab.
- Messaging row always shown with an "Optional" badge; it is never hidden entirely.
- "Dismiss guide" permanently hides it (set `lb_onboarding_dismissed: true` in localStorage).
- The card does not re-appear after dismissal, even if steps are incomplete.
- After all required steps complete, show a brief "You're all set!" state for 3 seconds, then auto-dismiss.

**Completion detection (on Dashboard load):**
```ts
const welcomed = localStorage.getItem('lb_onboarding_welcomed') === 'true';
const { data: searchRuns } = await supabase.from('search_runs').select('id').eq('user_id', user.id).limit(1);
const { data: integrations } = await supabase.from('integration_connections').select('id').eq('user_id', user.id).limit(1);
const { data: automations } = await supabase.from('automations').select('id').eq('user_id', user.id).limit(1);
// Messaging setup: check for a configured sender (verify exact table/column at build time)
```

---

## Inline Empty States

These are **independent of the checklist** — they handle users who arrive at a dead page without completing setup, whether they skipped onboarding or are returning users.

### Messaging page — no sender configured
- Show in place of the normal Send/Contacts UI (or as an overlay banner).
- Content: "Before you can send emails, you'll need to connect a sender. It takes about 2 minutes."
- CTA: "Go to Setup" — deep-links to the Setup tab within the Messaging page.

### Automations page — no search saved yet
- Show a soft prompt above the New automation form.
- Content: "You haven't run a search yet. Run a search first, then come back to automate it."
- CTA: "Run a search →"
- Note: The Automations page supports **two types of automations**: search automations (scheduled listing exports) and messaging automations (scheduled emails to contacts). The empty state should mention both so new users understand the full scope of the page.

### Integrations page — nothing connected
- Already likely has an empty state. If not, add: "Connect your first integration to start exporting listings."

---

## What NOT to build (scope guard)

- No full-page walkthrough or overlay tooltips — the old `WalkthroughContext` / `QuickStartGuidePage` system is deprecated and should not be re-enabled.
- No forced flows — every modal and CTA has a "skip / do this later" escape.
- No goal-first branching at login — that's a future iteration once the universal guide is validated.

---

## Files the implementing agent should read first

- `src/components/Dashboard.tsx` — where the checklist card lives
- `src/components/SearchListings.tsx` — where Modal A is triggered (post-save hook)
- `src/components/IntegrationsPage.tsx` — where Modal B is triggered (post-connect hook)
- `src/components/MessagingPage.tsx` — where the messaging empty state lives
- `src/components/AutomationsManagementPage.tsx` — where the automations empty state lives
- `src/components/WalkthroughContext.tsx` — do not re-enable, but read to avoid conflicts
- `src/App.tsx` — routing/navigation reference (`onNavigate` pattern used throughout)

---

## Open questions (resolve at build time)

1. What table/column indicates messaging sender is configured? Verify exact schema before writing completion detection logic.
2. Does `SearchListings` already fire any event on first save/search? If so, hook into that instead of adding a new one.
3. Should the checklist card be a new component or a section added to `Dashboard.tsx`? Recommend new component `OnboardingChecklist.tsx` imported into Dashboard.
4. Is there an existing first-login detection mechanism (e.g., profile `created_at` within the last 60 seconds, or a `profiles` column like `onboarding_complete`)? If so, use it rather than relying solely on localStorage for the welcome overlay trigger — localStorage can be cleared.
5. The welcome overlay (Step 0) should be skipped entirely for existing users who already have `search_runs` rows. Verify this guard at build time so returning users are never shown the welcome screen.
