# ListingBug — Messaging Page Build Plan

**Document type:** Implementation reference for Claude Code  
**Last updated:** April 6, 2026  
**Scope:** `/messaging` route — Stage 1 (private admin) → Stage 2 (user-facing)

---

## Overview

A new `/messaging` route added to the ListingBug SPA. Stage 1 is a private, password-gated admin tool for Jack's personal outbound marketing use. Stage 2 promotes it to a full user-facing feature with integration platform support and automation triggers.

The page has four tabs rendered in this order: **Create → Contacts → Campaigns → Setup**

---

## Architecture Notes (Read Before Building)

- All routing lives in `src/App.tsx`. Add `/messaging` as a `lazy()` import — never a top-level import (TDZ risk from Supabase circular imports).
- All edge functions deploy with `verify_jwt: false`. Auth is validated manually inside the function using the anon key pattern.
- Never use `.single()` for optional lookups — use `.maybeSingle()`.
- Never use `.upsert()` on the `users` table — use `.update()`.
- Supabase silently drops INSERTs with unknown columns. Always destructure and check `const { error } = await supabase.from(...).insert(...)`.
- New tables must be added to the `supabase_realtime` publication if realtime is needed: `ALTER PUBLICATION supabase_realtime ADD TABLE <table>;`
- Radix UI dropdowns inside high-z-index modals need `className="z-[10000]"` on `DropdownMenuContent`.
- Stage 1 uses a **separate** SendGrid API key secret (`SENDGRID_ADMIN_KEY`) distinct from the existing `SENDGRID_API_KEY` used by `send-to-sendgrid`. This separation makes Stage 2 cleanup explicit.
- Functions marked `[STAGE 1 — REPLACE IN STAGE 2]` are intentionally simplified and will need rework before user-facing launch.

---

## Stage 1 — Private Admin Messaging

**Access:** Route exists at `/messaging` but is not linked in any nav, sidebar, or sitemap.  
**Auth:** Hardcoded password `spitonthatthang` checked on mount, stored in `localStorage` key `lb_msg_auth`. One-time entry — once set, the user is never prompted again on that device.  
**Sitemap:** Add `/messaging` to `robots.txt` as `Disallow`.  
**Stage 2 action:** Remove password gate entirely. Add to sidebar nav. Apply plan-based gating.

---

### Tab 1 — Create

**Purpose:** Compose and send a marketing email (or stub an SMS) to a selected contact list or manually entered recipients.

**Layout:**
- Top bar: page title left, template dropdown right (loads from `marketing_templates`)
- Form fields: To (recipient selector — pulls from Contacts tab selection or manual email entry), Subject, Body (rich text or textarea with basic toolbar)
- Channel toggle: Email / SMS — SMS is **stubbed in Stage 1**, renders greyed UI with "Coming in Stage 2" tooltip
- Action buttons below body: Save as Template, Send
- Footer (always visible): merge tag reference and SendGrid variable syntax example

**Merge tag footer example (always shown at bottom of Create tab):**
```
Available merge tags: {{first_name}}, {{last_name}}, {{city}}, {{company}}
SendGrid substitution syntax: -first_name-, or use Handlebars: {{first_name}}
Example subject: "New listings in {{city}}, {{first_name}}"
Example body opener: "Hi {{first_name}}, here are this week's new listings in {{city}}..."
```

**Send flow:**
1. Client substitutes merge tags per recipient from contact record
2. Calls `send-marketing-email` edge function with `{ recipients, subject, body, campaign_name, sender_id }`
3. Edge function loops `POST /v3/mail/send` per recipient (Email API quota — not Marketing Campaigns)
4. Writes one row to `marketing_campaigns`, one row per recipient to `marketing_sends`
5. Returns per-recipient result summary to UI; UI shows inline success/error count toast

**Sender identity selector:**
- Dropdown populated by calling SendGrid `GET /v3/senders` via the `get-marketing-config` edge function
- Returns list of verified sender identities (id, nickname, from email)
- Selected sender ID passed to `send-marketing-email`

**Template system:**
- Save as Template → writes to `marketing_templates` (name, channel, subject, body)
- Load template dropdown → reads from `marketing_templates` filtered by `user_id` and `channel`
- In Stage 1, templates are ListingBug-native only (no platform imports)

---

### Tab 2 — Contacts

**Purpose:** Upload, manage, and browse contacts. Organize into named lists. Select recipients for sends.

**Contact fields (normalized CSV schema):**

| Field | Required | Notes |
|---|---|---|
| `email` | Yes | Primary key, used for upsert dedup |
| `first_name` | Yes | Merge tag source. Fallback to "there" if blank on send |
| `last_name` | No | |
| `role` | No | Controlled vocab: Buyer, Seller, Agent, Broker, Investor, Landlord |
| `city` | No | Replaces "market" — used as field and tag. Matches automation geography |
| `phone` | No | E.164 format (+15551234567). For future Twilio sends |
| `company` | No | Brokerage or firm name |
| `tags` | No | Pipe-delimited string: `"vip\|q1\|open-house"` |

**System-managed fields (never in upload CSV):**

| Field | Notes |
|---|---|
| `unsubscribed` | Set true on bounce or unsubscribe event. Locked out of selection |
| `last_sent_at` | ISO timestamp of most recent send |
| `source` | Set on import: `"csv-upload"` in Stage 1 |
| `user_id` | Set to authenticated user on insert |

**CSV upload flow:**
1. Drag-drop or file picker → parse on client (no server round-trip for parse)
2. Validate: flag rows missing `email` or `first_name`, flag malformed emails
3. Preview table with error rows highlighted before committing
4. On confirm: POST to `import-marketing-contacts` edge function → upserts to `marketing_contacts` on `email`
5. User assigns upload to one or more lists (existing or new) during import

**List management:**
- Contacts belong to one or more named lists via `marketing_contacts_lists` join table
- Lists panel (left sidebar or top bar): shows all lists with contact count
- "New list" button → name input → creates row in `marketing_lists`
- Clicking a list filters the contact table to members of that list
- Contacts not assigned to any list visible under "All Contacts"
- Each contact row shows which lists they belong to (badge chips)
- Multi-select contacts → "Add to list" or "Remove from list" bulk actions

**Filtering:**
- Filter chips: role, city, tags, list membership, unsubscribed status
- Search by name or email
- "Select filtered" → passes selected contacts to Create tab as recipients

**Stage 2 addition:** Primary load will be agents from the Agents/Leaderboard page data. Integration audience loading (Mailchimp, HubSpot, SendGrid lists) added as a source switcher.

---

### Tab 3 — Campaigns

**Purpose:** History of all sends grouped by campaign. Selecting a campaign opens a full results detail page.

**Campaigns table columns:** Campaign name, Channel, Subject, Sent at, Recipients, Delivered, Bounced, Failed, Status

**Interaction:** Clicking any campaign row navigates to `/messaging/results/:campaign_id` — a dedicated results page (not a modal) showing the full per-recipient send table.

**Results page columns:** Email, First name, Status (delivered / bounced / failed), Error message, Sent at, Updated at

**Status data source:** SendGrid Event Webhook (`sendgrid-event-webhook` edge function) — SendGrid POSTs delivery events to this endpoint, which updates `marketing_sends.status` by matching `sg_message_id`. Status shown in UI reflects the most recent event received.

**Refresh:** Manual refresh button in Stage 1. No realtime subscription.

**Stage 2 addition:** Open/click rate columns once per-integration metrics are available.

---

### Tab 4 — Setup

**Purpose:** Configure the sending environment and test it.

**Sections:**

**SendGrid (Email):**
- API key status indicator (confirms `SENDGRID_ADMIN_KEY` secret is set — key value never exposed to client)
- Verified sender dropdown (loaded from `GET /v3/senders` via `get-marketing-config`)
- Send test email button → sends to a hardcoded admin address, shows raw response inline
- Webhook URL display (read-only): the public URL of `sendgrid-event-webhook` to register in SendGrid dashboard

**SMS (Stub):**
- Section rendered but greyed out with label "Coming in Stage 2"
- Placeholder text: "SMS sending will be available via SendGrid or Twilio. Configuration will appear here."

**Note:** No API key input field in the UI. The `SENDGRID_ADMIN_KEY` is set directly in Supabase Edge Function Secrets, not stored in the database.

---

## New Supabase Tables (Stage 1)

### `marketing_contacts`
```sql
id            uuid primary key default gen_random_uuid()
user_id       uuid references auth.users
email         text not null
first_name    text
last_name     text
role          text  -- Buyer | Seller | Agent | Broker | Investor | Landlord
city          text
phone         text  -- E.164
company       text
tags          text  -- pipe-delimited: "vip|q1"
unsubscribed  boolean default false
last_sent_at  timestamptz
source        text  -- "csv-upload" in S1
created_at    timestamptz default now()

unique(user_id, email)
```

### `marketing_lists`
```sql
id          uuid primary key default gen_random_uuid()
user_id     uuid references auth.users
name        text not null
created_at  timestamptz default now()
```

### `marketing_contacts_lists`
```sql
contact_id  uuid references marketing_contacts(id) on delete cascade
list_id     uuid references marketing_lists(id) on delete cascade
primary key (contact_id, list_id)
```

### `marketing_campaigns`
```sql
id               uuid primary key default gen_random_uuid()
user_id          uuid references auth.users
name             text
subject          text
channel          text default 'email'  -- email | sms
sender_id        text  -- SendGrid sender identity ID
sent_at          timestamptz default now()
recipient_count  int default 0
template_id      uuid references marketing_templates(id)
```

### `marketing_sends`
```sql
id             uuid primary key default gen_random_uuid()
campaign_id    uuid references marketing_campaigns(id)
contact_id     uuid references marketing_contacts(id)
email          text
status         text default 'pending'  -- pending | delivered | bounced | failed
sg_message_id  text  -- SendGrid X-Message-Id, used for webhook matching
error          text
sent_at        timestamptz
updated_at     timestamptz default now()
```

### `marketing_templates`
```sql
id          uuid primary key default gen_random_uuid()
user_id     uuid references auth.users
name        text not null
channel     text default 'email'
subject     text
body        text
created_at  timestamptz default now()
updated_at  timestamptz default now()
```

**RLS:** Enable RLS on all tables. All policies: `user_id = auth.uid()`. Exception: `sendgrid-event-webhook` updates `marketing_sends` using the service role key (no user context on webhook calls).

**Realtime:** Add `marketing_sends` and `marketing_campaigns` to the publication if live status updates are needed in Stage 2:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE marketing_sends;
ALTER PUBLICATION supabase_realtime ADD TABLE marketing_campaigns;
```

---

## New Edge Functions (Stage 1)

### `send-marketing-email` — [STAGE 1 — REPLACE IN STAGE 2]

**Purpose:** Send a batch of marketing emails via SendGrid Email API (not Marketing Campaigns). One `POST /v3/mail/send` call per recipient.

**Auth:** `verify_jwt: false`. Validates JWT manually inside using anon key pattern.

**Secret used:** `SENDGRID_ADMIN_KEY` (separate from existing `SENDGRID_API_KEY`)

**Request body:**
```typescript
{
  recipients: Array<{
    email: string
    first_name?: string
    last_name?: string
    city?: string
    company?: string
  }>
  subject: string        // may contain {{merge_tags}}
  body: string           // may contain {{merge_tags}}
  campaign_name: string
  sender_id: string      // SendGrid verified sender ID
}
```

**Logic:**
1. Validate JWT
2. Insert row to `marketing_campaigns`, capture `campaign_id`
3. For each recipient:
   - Substitute `{{first_name}}`, `{{last_name}}`, `{{city}}`, `{{company}}` in subject and body (server-side, not client-side)
   - `POST https://api.sendgrid.com/v3/mail/send` with `from` set from sender_id lookup
   - Capture `X-Message-Id` from response header
   - Insert row to `marketing_sends` with `sg_message_id` and initial status `pending`
4. Return `{ campaign_id, sent: N, failed: N, errors: [...] }`

**Stage 2 replacement scope:** Extend to support per-user SendGrid keys, Mailchimp sends, HubSpot sends, Twilio SMS. Factor into a dispatcher pattern similar to `run-automation` → `send-to-*`.

---

### `sendgrid-event-webhook` — [STAGE 1 — REPLACE IN STAGE 2]

**Purpose:** Receive SendGrid delivery event POSTs and update `marketing_sends` status.

**Auth:** `verify_jwt: false`. No JWT — this is called by SendGrid, not the browser. Validate using SendGrid webhook signature header (`X-Twilio-Email-Event-Webhook-Signature`).

**Secret used:** `SENDGRID_WEBHOOK_SECRET` (set in Supabase Edge Function Secrets)

**Endpoint must be registered in:** SendGrid Dashboard → Settings → Mail Settings → Event Webhook

**Handles events:** `delivered`, `bounce`, `dropped`, `spamreport`, `unsubscribe`

**Logic:**
```typescript
// For each event in the POST body array:
const statusMap = {
  delivered: 'delivered',
  bounce: 'bounced',
  dropped: 'failed',
  spamreport: 'failed',
  unsubscribe: 'delivered'  // still delivered, but also set unsubscribed = true
}

// Update marketing_sends where sg_message_id matches
// If event is 'unsubscribe', also set marketing_contacts.unsubscribed = true by email
```

**Stage 2 replacement scope:** Expand to handle per-user webhook routing when multiple users have individual SendGrid keys.

---

### `get-marketing-config` — [STAGE 1 — REPLACE IN STAGE 2]

**Purpose:** Load SendGrid sender identities for the sender dropdown in Setup and Create tabs.

**Auth:** `verify_jwt: false`. Validates JWT manually.

**Secret used:** `SENDGRID_ADMIN_KEY`

**Actions (query param `action`):**
- `senders` → `GET https://api.sendgrid.com/v3/senders` → returns `[{ id, nickname, from_email }]`

**Stage 2 replacement scope:** Replace with per-user key lookup. Add actions for Mailchimp template list, HubSpot template list, Twilio number lookup.

---

### `import-marketing-contacts` — [STAGE 1 — REPLACE IN STAGE 2]

**Purpose:** Upsert a batch of contacts parsed from CSV on the client.

**Auth:** `verify_jwt: false`. Validates JWT manually.

**Request body:**
```typescript
{
  contacts: Array<{
    email: string
    first_name?: string
    last_name?: string
    role?: string
    city?: string
    phone?: string
    company?: string
    tags?: string
  }>
  list_ids?: string[]   // existing list UUIDs to assign contacts to
  new_list_name?: string  // if provided, create a new list and assign
}
```

**Logic:**
1. Validate JWT, get `user_id`
2. Upsert contacts to `marketing_contacts` on `(user_id, email)` conflict — update all fields except `unsubscribed` and `last_sent_at`
3. Set `source = 'csv-upload'`
4. If `new_list_name` provided, insert to `marketing_lists`, capture `list_id`
5. Insert rows to `marketing_contacts_lists` for all `list_ids` (including new)
6. Return `{ imported: N, updated: N, skipped: N }`

**Stage 2 replacement scope:** Add source types for integration-pulled contacts (Mailchimp, HubSpot). Merge dedup logic across sources.

---

## Frontend Route & Component Structure

```
src/
  pages/
    MessagingPage.tsx          -- tab shell, password gate, lazy loaded
    MessagingResultsPage.tsx   -- /messaging/results/:campaign_id
  components/messaging/
    CreateTab.tsx
    ContactsTab.tsx
    CampaignsTable.tsx
    SetupTab.tsx
    TemplateDropdown.tsx
    ContactsListPanel.tsx
    CsvUploadZone.tsx
    MergeTagFooter.tsx         -- always-visible footer in Create tab
```

**Route additions in `App.tsx`:**
```typescript
const MessagingPage = lazy(() => import('./pages/MessagingPage'))
const MessagingResultsPage = lazy(() => import('./pages/MessagingResultsPage'))

// Inside router:
<Route path="/messaging" element={<MessagingPage />} />
<Route path="/messaging/results/:campaignId" element={<MessagingResultsPage />} />
```

**Password gate logic (in `MessagingPage.tsx`):**
```typescript
const GATE_KEY = 'lb_msg_auth'
const GATE_PASS = 'spitonthatthang'

const [authed, setAuthed] = useState(() => localStorage.getItem(GATE_KEY) === '1')

const handlePassword = (input: string) => {
  if (input === GATE_PASS) {
    localStorage.setItem(GATE_KEY, '1')
    setAuthed(true)
  }
}

if (!authed) return <PasswordGate onSubmit={handlePassword} />
```

**Sitemap exclusion — add to `public/robots.txt`:**
```
Disallow: /messaging
Disallow: /messaging/
```

---

## SendGrid Setup Checklist (One-Time, Before Stage 1 Build)

1. Create a new SendGrid API key scoped to: Mail Send, Senders — Read. Name it "ListingBug Admin Marketing".
2. Add to Supabase Edge Function Secrets as `SENDGRID_ADMIN_KEY`.
3. After deploying `sendgrid-event-webhook`, register its public URL in SendGrid Dashboard → Settings → Mail Settings → Event Webhook. Enable events: Delivered, Bounce, Dropped, Spam Report, Unsubscribe.
4. Copy the SendGrid webhook signing key into Supabase secrets as `SENDGRID_WEBHOOK_SECRET`.
5. Confirm at least one verified sender identity exists in SendGrid (Settings → Sender Authentication → Sender Management).

---

## Stage 2 — User-Facing Messaging Page

**Access:** Added to sidebar nav. Plan-gated (pro+ tier). Password gate removed entirely.

**All `[STAGE 1 — REPLACE IN STAGE 2]` functions are refactored or replaced.**

---

### Tab 1 — Create (Stage 2 additions)

- Channel toggle fully wired: Email and SMS both functional
- SMS send routed through existing `send-to-twilio` edge function
- Per-integration send: user selects which platform to send through (SendGrid / Mailchimp / HubSpot / Twilio) via a platform selector
- Template dropdown becomes a dynamic search across all connected integrations by `user_id`:
  - ListingBug native templates (from `marketing_templates`)
  - Mailchimp templates: `GET /3.0/templates` filtered by user's Mailchimp connection in `integration_connections`
  - HubSpot templates: HubSpot Marketing Email API (requires Marketing Hub on user's account — **confirm availability before building**)
  - Templates grouped by platform in dropdown
  - Mailchimp and HubSpot templates return HTML body — render preview before send

**Open question:** HubSpot Marketing Email API requires Marketing Hub subscription. Need to verify whether ListingBug users will have this, or whether HubSpot sends should route through contact property updates only (i.e., add email to a HubSpot workflow rather than sending directly).

---

### Tab 2 — Contacts (Stage 2 additions)

**Primary data source:** Agents from the Agents/Leaderboard page — the `search_runs` table populated by `run-automation` and `run-due-automations`.

**Auto-population from automations:** When `run-automation` or `run-due-automations` completes a run, each listing agent contact found should be upserted into `marketing_contacts` with `source = 'automation-run'`. This mirrors how the Agents page is populated but persists contacts for messaging use.

**Implementation:** Add a post-run step in `run-automation` and `run-due-automations` that upserts agent contacts (name, email, phone, city) to `marketing_contacts` for the run's `user_id`. Tag with the automation name.

**Integration audience loading:** Source switcher above the contact table lets users toggle between:
- ListingBug contacts (default — agents + CSV uploads)
- Mailchimp: load audience via `GET /3.0/lists/{id}/members`, filter by tags/segment
- HubSpot: load contact lists via `GET /crm/v3/lists`, map fields
- SendGrid: load contact lists via `GET /v3/marketing/lists` (partially handled by existing `get-integration-options`)

**Unified view:** Contacts from all sources merged into a single table, deduplicated by email, with a `source` badge per row.

**Open question:** Field mapping between integration-native fields (HubSpot lifecycle stage, Mailchimp merge fields) and ListingBug's contact schema. Define a mapping layer before building.

---

### Tab 3 — Campaigns (Stage 2 additions)

- Open rate and click rate columns (sourced from SendGrid event webhook — add `open` and `click` event handling)
- Mailchimp campaign stats: `GET /3.0/campaigns/{id}/report` — requires storing Mailchimp campaign ID at send time
- HubSpot email performance stats (requires Marketing Hub — same open question as Create tab)

---

### Tab 4 — Setup (Stage 2 additions)

- SMS section fully wired: Twilio from-number configuration
- SMS from-number: either a shared ListingBug number or per-user provisioned number — **provisioning flow TBD**
- Trigger-based automation config:
  - Rule builder: "When a new automation run completes for automation [X], send campaign [Y] to contacts matching city [Z]"
  - Frequency cap: minimum days between sends to the same contact
  - Platform selector per trigger
  - Stored in new `messaging_triggers` table (schema defined in Stage 2 planning)
- Per-user API key management (users input their own SendGrid / Mailchimp / Twilio keys if not using OAuth-connected integrations)

**Open question:** SMS from-number strategy. Options: (a) one shared ListingBug Twilio number for all users' sends, (b) per-user Twilio sub-account provisioning, (c) user provides their own Twilio number. Decision needed before Stage 2 SMS build.

---

## Integration API Reference — Stage 2 Calls Needed

| Integration | Action | API Call | Notes |
|---|---|---|---|
| SendGrid | List sender identities | `GET /v3/senders` | Already in `get-marketing-config` (S1) |
| SendGrid | Send email | `POST /v3/mail/send` | Already in `send-marketing-email` (S1) |
| SendGrid | Load contact lists | `GET /v3/marketing/lists` | Partially in `get-integration-options` |
| SendGrid | Delivery events | Webhook POST | Already in `sendgrid-event-webhook` (S1) |
| Mailchimp | Load audiences | `GET /3.0/lists` | Already in `get-integration-options` |
| Mailchimp | Load audience members | `GET /3.0/lists/{id}/members` | New in S2 |
| Mailchimp | Load templates | `GET /3.0/templates` | New in S2 |
| Mailchimp | Campaign stats | `GET /3.0/campaigns/{id}/report` | New in S2 — requires campaign ID stored at send time |
| Mailchimp | Send campaign | `POST /3.0/campaigns` + send | New in S2 — or push contacts + trigger existing campaign |
| HubSpot | Load contact lists | `GET /crm/v3/lists` | New in S2 |
| HubSpot | Load contacts from list | `GET /crm/v3/lists/{id}/memberships` | New in S2 |
| HubSpot | Load email templates | HubSpot Marketing Email API | New in S2 — **requires Marketing Hub** |
| HubSpot | Send marketing email | HubSpot Marketing Email API | New in S2 — **confirm user plan** |
| Twilio | Send SMS | Already in `send-to-twilio` | Wire to Create tab in S2 |
| Twilio | From-number config | Twilio Numbers API or manual | Provisioning strategy TBD |

---

## Open Questions (Must Resolve Before Building)

| # | Question | Blocks |
|---|---|---|
| 1 | Is `SENDGRID_API_KEY` already set in Supabase secrets for the existing `send-to-sendgrid` function? | Naming `SENDGRID_ADMIN_KEY` correctly in S1 |
| 2 | How many verified sender identities exist in SendGrid, and which should be default? | Setup tab sender dropdown |
| 3 | Does the existing `send-to-twilio` function send arbitrary body text, or is it listing-data-specific? | SMS wiring in S2 |
| 4 | Do ListingBug users have HubSpot Marketing Hub subscriptions? | HubSpot template load and send in S2 |
| 5 | SMS from-number strategy: shared number, per-user provisioning, or user-supplied? | Twilio SMS in S2 Setup tab |
| 6 | Field mapping spec for HubSpot and Mailchimp contacts → ListingBug contact schema | Contacts tab unified view in S2 |
| 7 | Should `run-automation` / `run-due-automations` upsert agent contacts immediately on run, or on a separate background job? | S2 Contacts auto-population |

---

*End of document. Pass to Claude Code to begin Stage 1 implementation.*
