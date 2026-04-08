# ListingBug — Onboarding Guide Spec

**Document type:** Implementation reference for Claude Code  
**Created:** April 7, 2026  
**Scope:** New user onboarding — Dashboard checklist + contextual modals + inline empty states

---

## Overview

New users land in an app with a lot of surface area (Search, Automations, Integrations, Messaging). Without guidance, the messaging page is functionally dead until setup occurs, and automations don't make sense without a search or destination. This spec defines a lightweight, non-blocking onboarding guide that threads users through the right sequence without forcing a rigid flow.

**Chosen format:** Dashboard checklist card (persistent, collapsible) + contextual post-action modals at natural "what's next?" moments + inline empty states on dead pages.

---

## The Four Steps

| # | Step | Completion signal | Required? |
|---|------|------------------|-----------|
| 1 | Run your first search | Any row in `search_runs` for this user | Yes |
| 2 | Connect a destination | Any row in `integration_connections` OR messaging setup complete | Yes |
| 3 | Set up ListingBug Messaging | Sender configured in messaging setup (SendGrid key + sender identity) | Optional — see branching below |
| 4 | Create your first automation | Any row in `automations` for this user | Yes |

---

## Step-by-Step Flow

### Step 1 — Run your first search
- User lands on Dashboard, sees checklist card with Step 1 highlighted.
- CTA navigates to Search page.
- **On first successful search result:** show a post-search modal (see Modal A below).
- Step auto-completes on next Dashboard load when `search_runs` row exists.

### Step 2 — Connect a destination
- Triggered by Modal A (post-search) or by user returning to Dashboard.
- CTA navigates to Integrations page.
- After connecting at least one integration, **Modal B** appears: "Want to connect more, or are you ready to move on?"
- Also ask: **"How do you want to handle emailing your contacts?"** — with clarifying copy that sets the right expectation (see Modal B below).
  - → "Sync to Mailchimp / my integration, I'll send from there" — skip Step 3, go straight to Step 4
  - → "Send directly from ListingBug" — Step 3 becomes active
  - → "Both" — Step 3 becomes active
- Step auto-completes when `integration_connections` has any row (even if messaging is chosen, an integration is still recommended for exports).

### Step 3 — Set up ListingBug Messaging *(conditional)*
- Only shown if user answered "Through ListingBug" or "Both" in Step 2.
- If skipped in Step 2, this step is shown with a muted "optional" label on the checklist.
- CTA deep-links directly to **Messaging → Setup tab**.
- Step auto-completes when a valid sender identity is saved in messaging setup (check for a non-empty sender record for this user in `messaging_automations` sender config, or a dedicated `messaging_setup` table if one exists — verify at build time).
- **Inline empty state on Messaging page** (see Empty States section) handles users who arrive here without guidance.

### Step 4 — Create your first automation
- CTA navigates to Automations → opens New automation form.
- Step auto-completes when any row exists in `automations` for this user.
- This is the finish line. On completion, checklist card shows a success state for a few seconds, then collapses/dismisses permanently.

---

## Modal A — Post-Search Success

**Trigger:** First time a search returns results (detect via `search_runs` count going from 0 → 1, or a `sessionStorage` flag set by the search component on first save).

**Content:**
- Headline: "You've got listings — now where do you want to send them?"
- Body: Brief (1-2 sentences) — "Connect an integration to sync listings to Mailchimp, Google Sheets, a webhook, or more. Or set up ListingBug Messaging to send directly from your own sender address."
- CTA primary: "Connect a destination →" → navigates to Integrations
- CTA secondary: "I'll do this later" → dismisses, marks as seen in localStorage

**Do not show again once dismissed or Step 2 is complete.**

---

## Modal B — Post-Integration "More or Continue?"

**Trigger:** After a user successfully connects their first integration on the Integrations page.

**Content:**
- Headline: "Connected. Want to add more, or keep going?"
- Subtext: "You can always connect more integrations later."
- Question: "How do you want to handle emailing your contacts?"
- Clarifying note (shown beneath the options, small text): *"Connecting Mailchimp syncs your contacts to an audience — you send the campaign from Mailchimp. Sending through ListingBug means we handle delivery directly using your own sender address."*
  - Radio/button group:
    - "Sync contacts to Mailchimp / my integration — I'll send from there"
    - "Send emails directly from ListingBug"
    - "Both"
- CTA: "Continue setup →" — records answer, navigates to Step 3 or Step 4 accordingly

**Answer is stored in localStorage** as `lb_onboarding_email_method: 'integration' | 'listingbug' | 'both'` so Step 3 visibility is consistent across sessions.

**Implementation note:** The current Mailchimp integration stores API key + `list_id` + tags. This is sufficient for contact sync only — it does not and cannot trigger Mailchimp campaigns. Do not imply otherwise in UI copy. Users who want to send campaigns via Mailchimp do so entirely within Mailchimp after contacts are synced.

---

## Dashboard Checklist Card

**Location:** Top of Dashboard, below the page header, above stats cards. Collapses to a small "Setup guide (2/4 done)" pill once any step is complete.

**Structure:**
```
[ ] Run your first search              → Go to Search
[✓] Connect a destination              Done
[ ] Set up ListingBug Messaging        Optional · Go to Setup   ← only shown if relevant
[ ] Create your first automation       → Create automation

                              [Dismiss guide]
```

**Behavior:**
- Each row shows a checkmark if auto-detected as complete (query Supabase on Dashboard load).
- Steps are clickable — each CTA navigates to the right page/tab.
- Step 3 row is either hidden (if user chose "through integration") or shown with an "Optional" badge.
- "Dismiss guide" permanently hides it (set `lb_onboarding_dismissed: true` in localStorage).
- The card does not re-appear after dismissal, even if steps are incomplete.
- After all applicable steps complete, show a brief "You're all set! 🎉" state for 3 seconds, then auto-dismiss.

**Completion detection (on Dashboard load):**
```ts
const { data: searchRuns } = await supabase.from('search_runs').select('id').limit(1);
const { data: integrations } = await supabase.from('integration_connections').select('id').limit(1);
const { data: automations } = await supabase.from('automations').select('id').limit(1);
// Messaging setup: check for a configured sender (verify exact table/column at build time)
const emailMethod = localStorage.getItem('lb_onboarding_email_method');
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
- Content: "You haven't saved a search yet. Run a search first, then come back to automate it."
- CTA: "Run a search →"

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
2. Does `SearchListings` already fire any event on first save? If so, hook into that instead of adding a new one.
3. Should the checklist card be a new component or a section added to `Dashboard.tsx`? Recommend new component `OnboardingChecklist.tsx` imported into Dashboard.
