# Clean & Drip Tools — Context for Future Agents

## Why These Tools Exist

Jake is running cold email outreach to ~14,000 real estate contacts (agents, buyers, FSBOs, etc.) using SendGrid's transactional API. The goal is to send personalized emails from thelistingbug.com at a controlled pace that doesn't damage the domain's sender reputation.

Two problems needed solving:

1. **List quality** — raw lead CSVs have bad emails (disposable addresses, no MX records, role-based inboxes, duplicates across files). Sending to these tanks deliverability.
2. **Sending automation** — once lists are clean, someone needs to drip them out daily at a safe pace, auto-pause if things go wrong, and hand off to the next list when one finishes — without manual intervention.

Both tools are admin-only, gated behind the password `spitonthatthang` (stored in `sessionStorage`).

---

## Tool 1: `/clean` — CSV List Cleaner

**File:** `src/components/CleanPage.tsx`  
**Route:** `/clean` (added in `src/App.tsx`, listed in `isMinimalPage`)  
**Session key:** `lb_clean_auth`

### What it does

- Accepts multiple CSV uploads (drag-and-drop or file picker)
- Parses each file client-side (no library — custom CSV parser)
- Classifies every email row into one of these risk buckets:
  - `consumer_domain` — gmail, yahoo, hotmail, etc. (low deliverability for B2B)
  - `disposable` — throwaway domains (mailinator, guerrilla, etc.)
  - `blocked_domain` — known spam trap domains
  - `role_based` — info@, admin@, support@, noreply@, etc.
  - `invalid_syntax` — malformed email address
  - `no_email` — row has no email at all
  - `no_mx` — domain has no mail server (verified via DNS)
  - `duplicate` — seen in a previous file in this session
- Batches unique domains to the `check-mx-records` edge function (500 domains/call, up to 2000/batch) to verify MX records via Google DNS over HTTPS
- Shows per-file expandable summary: risk breakdown, top 8 domains, 8-row preview
- Shows global summary: total files, clean count, risky count, send-ready batches (auto-splits rows > 1000 into chunks)
- Downloads: `cleaned_FILENAME.csv` (safe rows only) and `risky_FILENAME.csv` (with `risk_reason` column)

### Edge function: `check-mx-records`

**File:** `supabase/functions/check-mx-records/index.ts`  
`verify_jwt = false`

Accepts `{ domains: string[] }`, deduplicates, batches in groups of 50, queries `https://dns.google/resolve?name=DOMAIN&type=MX` for each, returns `{ results: Record<string, boolean> }`.

---

## Tool 2: `/drip` — Set-and-Forget Drip Sender

**File:** `src/components/DripPage.tsx`  
**Route:** `/drip` (added in `src/App.tsx`, listed in `isMinimalPage`)  
**Session key:** `lb_drip_auth`

### What it does

- Admin uploads cleaned CSVs, assigns each a saved campaign (from `messaging_automations` table), then queues them all
- Runs fire sequentially — when one finishes, the next activates automatically
- Sends daily from 6am PST at a configurable daily limit (default 500)
- Human-like spacing: 4–18 second random delay between sends, ±20% batch size jitter per interval
- Batch size is calculated as `ceil(remaining_today / intervals_left) * jitter`, capped at 20 per call

### UI — unified table view

Single table card with three inline sections:

| Section | Contents |
|---|---|
| **Running** | Active/paused runs with inline progress bars (overall + today), pause/resume/stop controls |
| **Queue** | Queued runs numbered in order, remove button |
| **Uploaded** | CSVs just added — campaign dropdown per row, `needs campaign` / `ready` badge, Queue button in footer |

History (completed/stopped runs) lives in a collapsed accordion below the table.

### Database tables (migration 013 + 014)

- `drip_runs` — one row per send campaign run. Key fields: `status` (active/paused/queued/completed/stopped), `queue_position` (integer, determines queue order), `sends_today`, `sends_today_date`, `total_sent`, `total_failed`, `total_contacts`, `daily_limit`, `pause_reason`
- `drip_contacts` — one row per email recipient. Fields: `run_id`, `email`, `first_name`, `last_name`, `business_name`, `city`, `state`, `status` (pending/sent/failed), `error_message`, `sg_message_id`, `list_name`, `list_order`
- `drip_notifications` — event log per run (info/warning/error/critical). Shown in the notifications bell in the UI.

### Edge function: `run-drip`

**File:** `supabase/functions/run-drip/index.ts`  
`verify_jwt = false` — called by pg_cron every 15 minutes  
**pg_cron job:** defined in migration 013, fires `net.http_post` to the function URL

Key behaviors:

- **Time gate** — skips entirely before 6am PST
- **Daily reset** — resets `sends_today` to 0 when `sends_today_date` changes
- **Daily limit gate** — skips run if `sends_today >= daily_limit`
- **Merge tags** — resolves `{{first_name}}`, `{{last_name}}`, `{{city}}`, `{{company}}` in subject and body
- **Error classification** (`classifySendGridError`) — maps SendGrid HTTP errors to actions:
  - 429 → pause run, notify warning
  - 401 → stop run, notify critical (bad API key)
  - 403 → stop run, notify critical (suspended/access revoked)
  - 400 monthly limit → stop run, notify critical
  - 400 daily limit → pause run, notify error
  - 400 sender unverified → pause run, notify error
  - 554/spam → stop run immediately, notify critical
  - 550–553 permanent bounce → mark contact failed, continue
  - 5xx transient → mark contact failed, continue
- **Safety checks** (`checkSafety`) — runs after each batch, inspects last 50 contacts:
  - Spam report in error messages → stop run
  - Bounce rate > 15% (min 20 sends) → pause run
  - Bounce rate > 8% (min 20 sends) → pause run with warning
  - 3+ domain block events → pause run
  - 10 consecutive failures → pause run
- **Queue activation** — when a run completes (no pending contacts), looks up the next `status = 'queued'` run ordered by `queue_position ASC`, sets it to `active`, creates an info notification

### SendGrid sender resolution

The function pulls the SendGrid API key from `messaging_config` (platform = `sendgrid`) then fetches `/v3/verified_senders`. It matches `run.sender_id` against sender IDs. If no match, falls back to `senders[0]`. This means the sender configured in Messaging Setup is what gets used — per-campaign sender selection is inherited from the campaign's `sender_id` field.

### Merge tag format

Use `{{first_name}}`, `{{last_name}}`, `{{city}}`, `{{company}}` in campaign subject and body. These are resolved per-contact at send time from `drip_contacts` fields.

---

## Shared config dependencies

- **`messaging_automations`** — campaigns are saved here from the Messaging tab. The drip tool reads `name`, `subject`, `body`, `sender_id`, `unsubscribe_url`.
- **`messaging_config`** (platform = `sendgrid`) — SendGrid API key lives here. Both the drip sender and the main messaging system share this.
- **Supabase project:** `ynqmisrlahjberhmlviz`
