# ListingBug — Messaging Page Build Plan

**Document type:** Implementation reference for Claude Code  
**Last updated:** April 6, 2026  
**Scope:** `/messaging` route — Stage 1 (private admin) → Stage 2 (user-facing)

---

## Overview

A `/messaging` route added to the ListingBug SPA. Stage 1 is an admin-only outbound marketing tool accessible only to accounts with `is_admin = true`. Stage 2 promotes it to a full user-facing feature with plan gating, integration platform support, and scheduled automation triggers.

The page has five tabs rendered in this order: **Create → Contacts → Campaigns → Automate → Setup**

---

## Architecture Notes

- All routing lives in `src/App.tsx`. `/messaging` is a `lazy()` import — never a top-level import (TDZ risk from Supabase circular imports).
- All edge functions deploy with `verify_jwt: false`. Auth is validated manually inside the function using the anon key pattern. **Never change `verify_jwt` without asking** — `run-automation` and `run-due-automations` are intentionally `false`.
- Never use `.single()` for optional lookups — use `.maybeSingle()`.
- Never use `.upsert()` on the `users` table — use `.update()`.
- Supabase silently drops INSERTs with unknown columns. Always destructure and check `const { error } = await supabase.from(...).insert(...)`.
- Radix UI dropdowns inside high-z-index modals need `className="z-[10000]"` on `DropdownMenuContent`.
- `messaging_config` table stores per-user SendGrid API key and webhook secret as JSONB `config` field. Always read-before-write (merge pattern) to avoid overwriting sibling keys.
- Supabase URL is hardcoded: `https://ynqmisrlahjberhmlviz.supabase.co`. Do not use `import.meta.env.VITE_SUPABASE_URL` — these env vars are not set.

---

## Stage 1 — Complete

All items below are built and deployed as of April 6, 2026.

---

### Admin Access & Nav

- `users.is_admin` boolean column added (migration `004_add_is_admin.sql`)
- User `c7b3040c-941d-417a-b6a1-910b72c48e09` promoted to admin in same migration
- `App.tsx` fetches `is_admin` from `users` table on session load, passes to `Header` as prop
- `Header.tsx` shows Messaging nav link as last item only when `isAdmin = true` (both top nav and mobile hamburger)
- Dashboard removed from top nav and left sidebar nav entirely
- `/messaging` route is not linked for non-admin users — no sitemap entry needed yet

---

### Tab 1 — Create

- Recipient selector: contacts from Contacts tab, manual email entry
- Sender identity dropdown: loads verified senders via `get-marketing-config` → SendGrid `GET /v3/senders`
- Template dropdown: loads from `marketing_templates`, pre-fills subject and body on selection
- Subject and body fields with merge tag reference footer (`{{first_name}}`, `{{last_name}}`, `{{city}}`, `{{company}}`)
- Body supports full HTML (sent as `text/html` to SendGrid)
- **Pre-send validation** (`validate()` runs before any send attempt): checks recipients, sender ID, senders loaded, subject, body — shows inline red errors
- **Webhook warning**: if SendGrid webhook secret is not configured, shows amber warning block with "Setup is easy →" link navigating to Setup tab via `onGoToSetup` prop — does not block send
- **No platform SendGrid fallback** — send is blocked until user has their own SendGrid key configured in Setup
- **Email preview modal**: Eye icon button opens `EmailPreviewModal` before send
- Save as Template button: writes to `marketing_templates`
- Send flow: calls `send-marketing-email` edge function → server-side merge tag substitution → `POST /v3/mail/send` per recipient → writes `marketing_campaigns` + `marketing_sends` rows

---

### Email Preview Modal (`EmailPreviewModal.tsx`)

- Sandboxed iframe with `srcdoc` renders the actual email body (avoids React escaping issues)
- `buildEmailDocument()`: full DOCTYPE HTML shell with email-safe CSS, centered 600px container
- HTML detection: if body contains HTML tags, renders as-is; if plain text, wraps in basic HTML shell
- Merge tag substitution with first selected recipient's data, or sample data if none selected — badge indicates which
- Desktop (680px) / mobile (390px) viewport toggle
- From / To / Subject header chrome above iframe
- Footer note: "Body rendered as HTML" or "Body is plain text — will be wrapped in a basic HTML shell on send"

---

### Tab 2 — Contacts

- Full contact table: Name, Email, Phone, Company, City, Source, Lists, Status
- Phone column populated from all three sources: local agent profiles, CSV uploads, Mailchimp
- **CSV upload zone** (complete rewrite):
  - `HEADER_ALIASES` map: normalizes 20+ column name variants (company_name→company, mobile→phone, email_address→email, firstname→first_name, full_name splits to first/last, brokerage→company, etc.)
  - `splitCSVRecords()`: character-level parser handles newlines inside quoted fields, double-quote escaping, CRLF — does not break on multiline fields
  - Strips BOM, lowercases and trims all header names before alias lookup
  - Validation: `full_name` + (`email` OR `phone`) required; remaining fields optional
  - Two-column layout: drop zone left, format guide right
  - Format guide: column name, badge (required/either/optional), description, "also: alias1, alias2" line for each alias group
  - Copy prompt button (clipboard) and Download template CSV button (4 example rows)
  - Preview table before confirm: Name, Email, Phone, Company, City, Status
- List management: create lists, assign contacts to lists, filter by list
- Contact source badges: `csv-upload`, `automation-run`, `mailchimp`, `hubspot`

---

### Tab 3 — Campaigns

- Table: Campaign name, Channel, Subject, Sent at, Recipients, Delivered, Bounced, Failed, Status
- Clicking a campaign row navigates to `/messaging/results/:campaign_id`
- Results page: per-recipient table — Email, Name, Status, Error, Sent at, Updated at
- Status sourced from `marketing_sends.status`, updated by SendGrid event webhook
- Manual refresh in Stage 1 (no realtime subscription)

---

### Tab 4 — Automate (`AutomateTab.tsx`)

- Lists active and paused messaging automations for the user
- **Create automation**: select list, select template (pre-fills subject/body), set schedule, activate
- **Schedule options**: On Sync (default), Manual, Daily, Weekly, Monthly
  - **On Sync**: fires automatically whenever a search automation updates the target list via `run-automation` or `run-due-automations`
  - Manual: user clicks "Run Now" button
  - Daily/Weekly/Monthly: intended for future cron execution (see Recommended Next)
- **Run Now**: loads list members, skips unsubscribed, calls `send-marketing-email`, updates `last_run_at` and `total_sent`
- Status toggle (active/paused), delete, stats per automation (list name, last run, total sent, schedule badge, status badge)
- `messaging_automations` table: `list_id`, `sender_id`, `subject`, `body`, `schedule` (on_sync/manual/daily/weekly/monthly), `status`, `last_run_at`, `total_sent`

---

### Tab 5 — Setup

- Per-user SendGrid API key input → stored in `messaging_config` JSONB (read-before-write merge)
- SendGrid webhook secret input → stored in `messaging_config`
- Verified sender dropdown (loads from user's own SendGrid key via `get-marketing-config`)
- Webhook URL display (read-only): `sendgrid-event-webhook` public URL for registering in SendGrid dashboard
- Webhook configured status indicator (checked by CreateTab on mount for amber warning logic)
- SMS section: greyed out with "Coming in Stage 2" label

---

### Automation Destinations — Create Automation Modal

- **Send to New List**: adds `messaging-list-new` as a destination in `CreateAutomationModal`
  - Setup field: `list_name` (text input, creates new `marketing_lists` row)
- **Send to Existing List**: adds `messaging-list-existing` as a destination
  - Setup field: `list_id` (list-select dropdown populated from `marketing_lists`)
  - Shows amber warning if no lists exist yet
- Both destinations appear after "Export to CSV Download" in the destination list

---

### On Sync Trigger — Edge Functions

- `run-automation` and `run-due-automations` both contain:
  - `sendToMessagingList(userId, listings, listId?, listName?)`: extracts agents with emails from listings, upserts to `marketing_contacts` with `source = 'automation-run'`, adds to `marketing_contacts_lists`, then calls `triggerOnSyncMessagingAutomations`
  - `triggerOnSyncMessagingAutomations(userId, listId, supabase)`: queries `messaging_automations` for `schedule = 'on_sync'`, `status = 'active'`, matching `list_id`; resolves SendGrid key from `messaging_config`; loads list members; sends via SendGrid API; writes `marketing_campaigns` + `marketing_sends` rows; updates `last_run_at` and `total_sent`
  - Switch cases added: `messaging-list-new` and `messaging-list-existing` both call `sendToMessagingList`
- Server-side merge tag substitution (`applyMergeTags()`) runs in both edge functions and in `send-marketing-email`

---

### Database Migrations Applied

| Migration | Description |
|---|---|
| `001_create_marketing_tables.sql` | `marketing_contacts`, `marketing_lists`, `marketing_contacts_lists`, `marketing_campaigns`, `marketing_sends`, `marketing_templates` |
| `002_create_messaging_config.sql` | `messaging_config` table with JSONB config field |
| `003_sendgrid_webhook.sql` | `sendgrid-event-webhook` function and delivery event handling |
| `004_add_is_admin.sql` | `users.is_admin` boolean; promotes admin user |
| `005_create_messaging_automations.sql` | `messaging_automations` table with RLS |
| `006_messaging_automations_on_sync.sql` | Adds `on_sync` to schedule constraint; sets as default |

---

### Edge Functions Deployed

| Function | Purpose |
|---|---|
| `send-marketing-email` | Per-recipient SendGrid send, server-side merge tags, campaign/send rows. No platform fallback — requires user's own SendGrid key. |
| `sendgrid-event-webhook` | Receives SendGrid delivery events, updates `marketing_sends.status`. ECDSA P-256/SHA-256 signature verification. |
| `get-marketing-config` | Loads sender identities from user's SendGrid key. Actions: `senders`. |
| `import-marketing-contacts` | Upserts contacts from client-parsed CSV. Assigns to lists. |
| `run-automation` | Includes `sendToMessagingList` + `triggerOnSyncMessagingAutomations` for messaging list destinations. |
| `run-due-automations` | Same messaging additions as `run-automation` (functions are self-contained copies). |

---

## Recommended Next (Pre-Stage 2)

These are improvements to existing Stage 1 features that should be addressed before Stage 2 expansion begins.

### 1 — Scheduled Automation Execution (Cron)

Automations with `schedule = 'daily'`, `'weekly'`, or `'monthly'` are created and saved but **not yet executed on schedule**. A cron edge function or pg_cron job needs to:

- Query `messaging_automations` where `schedule IN ('daily','weekly','monthly')` and `status = 'active'`
- Check `last_run_at` against the current time to determine which are due
- Fire `send-marketing-email` for each due automation's list members
- Update `last_run_at` and `total_sent`

**Approach:** Either a Supabase pg_cron job calling a new `run-due-messaging-automations` edge function, or extending `run-due-automations` to also process messaging automations.

---

### 2 — Campaign Results Page

`/messaging/results/:campaignId` is referenced from `CampaignsTable` but not fully built. Build `MessagingResultsPage.tsx`:

- Route already defined in `App.tsx`
- Loads `marketing_sends` rows for campaign, joined with `marketing_contacts`
- Per-recipient table: Email, Name, Status, Error, Sent at, Updated at
- Campaign summary header: name, subject, sent at, total delivered/bounced/failed counts

---

### 3 — Open/Click Event Handling in Webhook

`sendgrid-event-webhook` currently handles `delivered`, `bounce`, `dropped`, `spamreport`, `unsubscribe`. Add:

- `open` event → update `marketing_sends` with `opened_at` timestamp
- `click` event → update `marketing_sends` with `clicked_at` timestamp
- Requires adding `opened_at` and `clicked_at` columns to `marketing_sends`
- Campaigns tab then shows open rate and click rate columns

---

### 4 — Test Send in Setup Tab

Setup tab currently shows SendGrid connection status but has no test send flow. Add:

- "Send test email" button → prompts for recipient email (defaults to logged-in user's email)
- Calls `send-marketing-email` with a fixed test subject and body
- Shows raw response inline (success or error message)

---

### 5 — Bulk Contact Actions

Contacts tab multi-select exists in plan but is not implemented:

- Checkbox per row + "Select all" header checkbox
- Action bar appears when 1+ contacts selected: "Add to list", "Remove from list", "Export selected", "Delete"
- Passes selected contacts to Create tab via shared state or query param

---

### 6 — Filter Chips in Contacts Tab

Currently contacts load unfiltered. Add:

- Filter chips above the table: Role, City, Source, List, Unsubscribed
- Search bar: name or email substring
- Chips stack horizontally, each dismissible individually
- "Clear all" link when any filter is active

---

### 7 — Unsubscribe Link Handling

Sends currently go out without any unsubscribe mechanism. Before using at scale:

- Add an `{{unsubscribe_url}}` merge tag that resolves to a Supabase edge function URL with a signed token
- Build `handle-unsubscribe` edge function: validates token, sets `marketing_contacts.unsubscribed = true`, renders a simple "You've been unsubscribed" page
- Add a reminder in CreateTab body footer if `{{unsubscribe_url}}` is absent from the body

---

## Stage 2 — User-Facing Messaging Page

**Access:** Added to sidebar nav for pro+ plan users. `is_admin` gate replaced with plan-based gating.  
**Password gate:** Already removed — replaced with `is_admin` check. Stage 2 replaces that with plan gating.

---

### Tab 1 — Create (Stage 2)

- Channel toggle fully wired: Email and SMS both functional
- SMS send routed through `send-to-twilio` edge function (already exists for automation sends)
- Per-integration send: platform selector (SendGrid / Mailchimp / HubSpot / Twilio) based on user's connected integrations
- Template dropdown becomes cross-platform:
  - ListingBug native templates (`marketing_templates`)
  - Mailchimp templates: `GET /3.0/templates`
  - HubSpot email templates: HubSpot Marketing Email API (**requires Marketing Hub — confirm user plan**)
  - Templates grouped by platform in dropdown

**Open question:** HubSpot Marketing Email API requires Marketing Hub subscription. If users don't have it, HubSpot sends may need to route through contact enrollment in a workflow rather than direct send.

---

### Tab 2 — Contacts (Stage 2)

- Integration audience loading: source switcher toggles between ListingBug contacts, Mailchimp audience members, HubSpot contact lists, SendGrid marketing lists
- Field mapping layer: maps integration-native fields (HubSpot lifecycle stage, Mailchimp merge fields) to ListingBug contact schema before display and send
- Unified view: contacts from all sources merged, deduplicated by email, with `source` badge per row
- Agents from `run-automation` / `run-due-automations` already auto-populate via `sendToMessagingList` (done in Stage 1)

---

### Tab 3 — Campaigns (Stage 2)

- Open rate and click rate columns (requires Stage 1 Recommended #3 — webhook open/click events)
- Mailchimp campaign stats: `GET /3.0/campaigns/{id}/report` — requires `mailchimp_campaign_id` stored at send time
- HubSpot email performance stats (requires Marketing Hub)

---

### Tab 4 — Automate (Stage 2)

- Scheduled automations execute on actual schedule (cron) — not just On Sync and Manual
- Frequency cap: minimum days between sends to the same contact, configurable per automation
- `messaging_triggers` table for rule-based automation: "When automation X completes a run, send campaign Y to contacts in city Z"
- Realtime subscription on `messaging_automations` for live status updates

---

### Tab 5 — Setup (Stage 2)

- SMS section fully wired: Twilio from-number configuration
- Per-user Twilio account: either shared ListingBug number, per-user sub-account provisioning, or user-supplied number — **provisioning strategy TBD**
- Per-user API key management UI for integrations not connected via OAuth

---

### Nav & Access (Stage 2)

- Messaging link visible to all users with qualifying plan (pro+), not just admins
- Plan gate enforced in `App.tsx` using existing `plan_status` field
- `/messaging` added to public nav in sidebar and mobile menu with plan badge if user is on free tier

---

## Integration API Reference — Stage 2

| Integration | Action | API Call | Notes |
|---|---|---|---|
| SendGrid | List sender identities | `GET /v3/senders` | Done in Stage 1 (`get-marketing-config`) |
| SendGrid | Send email | `POST /v3/mail/send` | Done in Stage 1 (`send-marketing-email`) |
| SendGrid | Delivery/open/click events | Webhook POST | Done S1; open/click columns recommended next |
| SendGrid | Load contact lists | `GET /v3/marketing/lists` | New in S2 |
| Mailchimp | Load audiences | `GET /3.0/lists` | In `get-integration-options` |
| Mailchimp | Load audience members | `GET /3.0/lists/{id}/members` | New in S2 |
| Mailchimp | Load templates | `GET /3.0/templates` | New in S2 |
| Mailchimp | Campaign stats | `GET /3.0/campaigns/{id}/report` | New in S2 — store campaign ID at send time |
| Mailchimp | Send campaign | `POST /3.0/campaigns` + send | New in S2 |
| HubSpot | Load contact lists | `GET /crm/v3/lists` | New in S2 |
| HubSpot | Load contacts from list | `GET /crm/v3/lists/{id}/memberships` | New in S2 |
| HubSpot | Load/send email templates | HubSpot Marketing Email API | New in S2 — **requires Marketing Hub** |
| Twilio | Send SMS | `send-to-twilio` already exists | Wire to Create tab in S2 |
| Twilio | From-number config | Twilio Numbers API or manual | Provisioning strategy TBD |

---

## Open Questions

| # | Question | Blocks |
|---|---|---|
| 1 | SMS from-number strategy: shared ListingBug number, per-user sub-account, or user-supplied? | S2 Twilio SMS setup tab |
| 2 | Do ListingBug users have HubSpot Marketing Hub? | HubSpot template load and direct send in S2 |
| 3 | Field mapping spec for HubSpot/Mailchimp contact fields → ListingBug schema | S2 unified contacts view |
| 4 | Frequency cap granularity: per-contact across all automations, or per-contact per-automation? | S2 `messaging_triggers` schema |
| 5 | Plan gating threshold: which plan tier unlocks messaging for regular users? | S2 nav and access |

---

*End of document.*
