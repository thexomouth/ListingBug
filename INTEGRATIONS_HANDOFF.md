# ListingBug — Integrations Connection Handoff
**Date:** March 25, 2026  
**Purpose:** Complete plan for implementing integration connection modals and flows.  
**Next session goal:** Execute modal builds and frontend wiring for all integrations below.

---

## WHAT IS ALREADY DONE (DO NOT REBUILD)

All backend edge functions are deployed and working:
- `run-automation` v10 — central dispatcher, runs search + routes to send functions
- `run-due-automations` v1 — scheduled runner (pg_cron target)
- `webhook-push` v2 — Zapier / Make / n8n
- `send-to-mailchimp` v2 — contacts only, no message sending
- `send-to-sheets` v2 — appends rows with auto-header
- `send-to-hubspot` v2 — batch upsert contacts by email
- `send-to-sendgrid` v3 — pushes to Marketing Contacts list only
- `send-to-twilio` v3 — pushes to Twilio Sync List only
- `oauth-connect` v6 — initiates OAuth for Google / Mailchimp / HubSpot
- `oauth-callback` v6 — exchanges code, stores tokens
- `oauth-refresh` v5 — refreshes expired tokens

Database tables confirmed correct:
- `integration_connections` (user_id, integration_id, credentials jsonb, config jsonb)
- `automations`, `automation_runs`, `saved_listings` (all correct schema + RLS)

Secrets confirmed set in Supabase:
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
- MAILCHIMP_CLIENT_ID, MAILCHIMP_CLIENT_SECRET
- HUBSPOT_CLIENT_ID, HUBSPOT_CLIENT_SECRET
- APP_URL = https://thelistingbug.com

---

## THE CORE PRINCIPLE (READ FIRST)

**ListingBug is a data delivery layer, never a messaging layer.**

We push agent contact data INTO the user's platforms. The user logs into their platform and decides what to do with those contacts. We never send emails, SMS, or messages on their behalf.

| What we push | What user does with it |
|---|---|
| Agent contacts → Mailchimp audience | User creates campaigns in Mailchimp |
| Agent contacts → SendGrid Marketing Contacts | User creates campaigns in SendGrid |
| Agent contacts → HubSpot CRM | User sets up sequences in HubSpot |
| Agent data → Twilio Sync List | User builds Studio flows in Twilio |
| Listing data → Google Sheet rows | User uses data however they want |
| Listing JSON → Webhook URL | Their Zapier/Make/n8n handles the rest |

---

## INTEGRATION GROUPS & MODAL PLANS

---

### GROUP 1: OAUTH INTEGRATIONS
**Platforms:** Google Sheets, Mailchimp, HubSpot  
**Auth:** OAuth 2.0 — user clicks button → redirect → callback → token stored  
**Backend:** `oauth-connect` → `oauth-callback` → stores in `integration_connections`

These three share the same OAuth flow but have different destination-config fields collected after connecting.

#### CONNECTION FLOW (same for all three):
1. User clicks "Connect [Platform]" button in modal
2. Frontend calls `GET /functions/v1/oauth-connect?integration={id}` with user JWT
3. Backend returns `{ url: "https://accounts.google.com/o/oauth2/..." }`
4. Frontend does `window.location.href = url` (full redirect)
5. User authorizes on the platform
6. Platform redirects to `https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/oauth-callback`
7. Callback stores tokens in `integration_connections`, redirects to `https://thelistingbug.com/integrations?connected={integration_id}`
8. Frontend detects `?connected=` param on load and shows success state

#### MODAL STRUCTURE (shared component, parameterized by integration):

```
┌─────────────────────────────────────────┐
│ 🟡 Connect {Platform Name}              │
│─────────────────────────────────────────│
│ {Platform description}                   │
│                                          │
│ What ListingBug will do:                 │
│ • Push agent contacts to your {audience} │
│ • Update existing contacts automatically │
│ • You decide what campaigns to send      │
│                                          │
│ [Connect with {Platform} →]              │   ← OAuth button, calls oauth-connect
│                                          │
│ 🔒 Your credentials stay in {Platform}  │
└─────────────────────────────────────────┘
```

After connect (second step — collect destination config):
```
┌─────────────────────────────────────────┐
│ ✅ {Platform} Connected                  │
│─────────────────────────────────────────│
│ Choose where to send your contacts:      │
│                                          │
│ {Platform-specific config fields}        │
│                                          │
│ [Save Settings]                          │
└─────────────────────────────────────────┘
```

---

#### GOOGLE SHEETS — Destination Config Fields

After OAuth connect, user needs to specify where to write data.

| Field | Type | Label | Helper text |
|---|---|---|---|
| `spreadsheet_id` | text | Spreadsheet ID | "Find this in your Google Sheets URL between /d/ and /edit" — link to sheets.google.com |
| `sheet_name` | text | Sheet Tab Name | "Name of the tab to write to (default: Sheet1)" |
| `write_mode` | select | Write Mode | "Append (add new rows each run) or Overwrite (clear and rewrite)" |

**Columns written (pre-decided, no field mapping needed):**
Address, City, State, ZIP, Price, Beds, Baths, Sqft, Property Type, Status, Listed Date, DOM, MLS #, Agent Name, Agent Phone, Agent Email, Brokerage, Latitude, Longitude, Listing ID, Synced At

**Automation config stored in `destination_config`:**
```json
{ "spreadsheet_id": "...", "sheet_name": "Sheet1", "write_mode": "append" }
```

**Helper:** Show a link to sheets.google.com so users can create a sheet and find the ID. The ID is everything between `/d/` and `/edit` in the URL.

---

#### MAILCHIMP — Destination Config Fields

After OAuth connect, user needs to pick their audience and optional tags.

| Field | Type | Label | Helper text |
|---|---|---|---|
| `list_id` | select (fetched) | Audience / List | Dropdown populated by calling Mailchimp API to list user's audiences |
| `tags` | tag-input | Tags to apply | "Optional. Tags help you segment these contacts. e.g. 'ListingBug', 'Denver Agents'" |
| `double_opt_in` | toggle | Double opt-in | "If on, Mailchimp sends a confirmation email before subscribing the contact" |

**How to fetch audience list:**
After tokens are stored, call `GET https://{dc}.api.mailchimp.com/3.0/lists?count=100` with user's token (via a new edge function or via a frontend-safe approach).

**Recommended:** Build a `get-mailchimp-lists` edge function:
```
GET /functions/v1/get-integration-options?integration=mailchimp
Returns: [{ id: "abc123", name: "Roof Brokers Inc." }, ...]
```

**Fields pushed (pre-decided, no mapping):**
FNAME (first name), LNAME (last name), PHONE, ADDRESS, CITY, STATE, ZIP, PRICE (custom), PROPTYPE (custom), BROKERAGE (custom)

Note: PRICE, PROPTYPE, BROKERAGE are Mailchimp merge fields that must exist in the user's audience. Add a note: "Make sure your Mailchimp audience has merge fields for PRICE, PROPTYPE, and BROKERAGE, or these fields will be skipped."

**Automation config stored in `destination_config`:**
```json
{ "list_id": "abc123", "tags": ["ListingBug", "Denver"], "double_opt_in": false }
```

---

#### HUBSPOT — Destination Config Fields

After OAuth connect, minimal config needed. HubSpot upserts by email automatically.

| Field | Type | Label | Helper text |
|---|---|---|---|
| `object_type` | select | Add to | "Contacts (default) — agent contacts are created/updated in your HubSpot CRM" |

No list selection needed — HubSpot contacts go into the main CRM. Users manage lists/segments inside HubSpot.

**Properties pushed (pre-decided):**
firstname, lastname, email, phone, company (brokerage), address, city, state, zip, hs_lead_status: 'NEW', lifecyclestage: 'lead'

**Custom properties also attempted (HubSpot ignores if not created):**
listingbug_property_address, listingbug_list_price, listingbug_listed_date, listingbug_property_type, listingbug_mls_number

**Recommend showing:** "Want to see listing details in HubSpot? Create custom contact properties in your HubSpot portal under Settings > Properties."

**Automation config stored in `destination_config`:**
```json
{ "object_type": "contacts" }
```

---

### GROUP 2: API KEY INTEGRATIONS (USER BRINGS OWN KEY)
**Platforms:** SendGrid, Twilio  
**Auth:** User pastes their own API credentials  
**No OAuth, no redirect — credentials stored in `integration_connections.credentials`**

#### SENDGRID — Modal Fields

| Field | Type | Label | Helper text |
|---|---|---|---|
| `api_key` | password | SendGrid API Key | Link: "Find this at sendgrid.com → Settings → API Keys. Key needs 'Marketing' permissions." |
| `list_ids` | select (fetched after key entry) | Contact List | Populated by calling SendGrid API after key is entered. Optional — if blank, contacts go to global list. |

**How list_ids works:**
After user enters API key, show a "Load my lists" button that calls a small proxy or directly calls `GET https://api.sendgrid.com/v3/marketing/lists` with their key and populates a multi-select dropdown.

**Build `get-integration-options` edge function** to handle this:
```
POST /functions/v1/get-integration-options
Body: { integration: 'sendgrid', credentials: { api_key: '...' } }
Returns: { lists: [{ id: '...', name: 'My List' }] }
```

**Fields pushed (pre-decided, no mapping):**
email, first_name, last_name, phone_number, address_line_1, city, state_province_region, postal_code

**Automation config stored in `destination_config`:**
```json
{ "list_ids": ["abc123"] }
```

---

#### TWILIO — Modal Fields

| Field | Type | Label | Helper text |
|---|---|---|---|
| `account_sid` | text | Account SID | Link: "Find at console.twilio.com — starts with AC" |
| `auth_token` | password | Auth Token | "Found on your Twilio console dashboard" |

No phone number needed — we push to Sync Lists, not send messages.

**How it works:**
ListingBug pushes agent contacts to a Twilio Sync List called `listingbug_contacts` in their account. Users access this from Twilio console → Sync → Lists, or use it in Studio flows.

**What is stored in the Sync List per contact:**
agent_name, agent_phone, agent_email, agent_website, office_name, listing_address, city, state, zip, price, bedrooms, bathrooms, property_type, listed_date, days_on_market, mls_number, added_at

**Automation config stored in `destination_config`:**
```json
{ "list_unique_name": "listingbug_contacts" }
```
(Optional: user can customize the list name)

---

### GROUP 3: WEBHOOK INTEGRATIONS (LISTINGBUG API KEY)
**Platforms:** Zapier, Make.com, n8n  
**Auth:** User provides a webhook URL from the platform, not our API key  
**No OAuth, no login — user creates a webhook trigger in Zapier/Make/n8n and pastes the URL**

These three share one modal and one edge function (`webhook-push`).

#### UNIFIED WEBHOOK MODAL — Fields

| Field | Type | Label | Helper text |
|---|---|---|---|
| `webhook_url` | url | Webhook URL | Platform-specific instructions (see below) |
| `send_mode` | select | Delivery Mode | "Batch: one request with all listings. Individual: one request per listing." |

**Platform-specific instructions shown based on which integration is selected:**

**Zapier:**
> 1. In Zapier, create a new Zap
> 2. Choose "Webhooks by Zapier" as the trigger
> 3. Select "Catch Hook"
> 4. Copy the webhook URL Zapier gives you and paste it here
> 5. Run your automation — Zapier will detect the data shape and you can map fields to any action

**Make.com:**
> 1. In Make, create a new scenario
> 2. Add a "Webhooks" module as the trigger
> 3. Select "Custom Webhook" and create a new webhook
> 4. Copy the URL and paste it here
> 5. Run your automation — Make will capture the data structure

**n8n:**
> 1. In n8n, create a workflow with a "Webhook" trigger node
> 2. Set Method to POST
> 3. Copy the webhook URL and paste it here
> 4. Run your automation — n8n will receive listing data

**Payload delivered (batch mode):**
```json
{
  "source": "listingbug",
  "event": "new_listings",
  "automation_name": "Daily Denver Listings",
  "run_id": "uuid",
  "count": 42,
  "listings": [{
    "id": "...",
    "formatted_address": "...",
    "city": "Denver",
    "state": "CO",
    "zip_code": "80202",
    "price": 450000,
    "bedrooms": 3,
    "bathrooms": 2,
    "square_footage": 1800,
    "property_type": "Single Family",
    "status": "Active",
    "listed_date": "2026-03-20",
    "days_on_market": 5,
    "agent_name": "...",
    "agent_phone": "...",
    "agent_email": "...",
    "office_name": "...",
    ...
  }]
}
```

**Automation config stored in `destination_config`:**
```json
{ "webhook_url": "https://hooks.zapier.com/...", "send_mode": "batch" }
```

---

### GROUP 4: SPREADSHEET — GOOGLE SHEETS
Already covered in Group 1 (OAuth). Included here for reference.

---

## THE `get-integration-options` EDGE FUNCTION (NEEDS TO BE BUILT)

This function is needed by Mailchimp (fetch audience list) and SendGrid (fetch contact lists).

```
POST /functions/v1/get-integration-options
Auth: user JWT (same as all other functions)
Body: { integration: 'mailchimp' | 'sendgrid', credentials?: { api_key: '...' } }

For mailchimp: reads stored OAuth token from integration_connections, calls Mailchimp /lists
For sendgrid: uses provided api_key (or stored if already connected), calls SendGrid /marketing/lists

Returns:
{
  options: [
    { id: "abc123", name: "Roof Brokers Inc." },
    { id: "def456", name: "My Second List" }
  ]
}
```

---

## FRONTEND COMPONENTS TO BUILD

### 1. `IntegrationConnectionModal.tsx` — FULL REWRITE

Current state: shows "OAuth coming soon" for all OAuth integrations, API key input for SendGrid, "Go to API settings" for Zapier/Make/n8n.

New behavior by integration:

| Integration | Modal Type | Steps |
|---|---|---|
| `google` | OAuth | Connect button → redirect → return → collect spreadsheet_id + sheet_name |
| `mailchimp` | OAuth | Connect button → redirect → return → fetch + select audience → optional tags |
| `hubspot` | OAuth | Connect button → redirect → minimal config |
| `sendgrid` | API Key | Paste API key → load lists button → select list |
| `twilio` | API Key | Paste Account SID + Auth Token |
| `zapier` | Webhook URL | Paste webhook URL + instructions + send mode |
| `make` | Webhook URL | Paste webhook URL + instructions + send mode |
| `n8n` | Webhook URL | Paste webhook URL + instructions + send mode |

### 2. `IntegrationsPage.tsx` — Connected State

Currently shows mock "Connected" badges for everything. Needs to:
- Load real `integration_connections` rows for current user on mount
- Show real connected/disconnected state per integration
- Show connected account info (email for OAuth, masked key for API key)
- "Disconnect" button that deletes row from `integration_connections`

### 3. OAuth Return Handler (in `App.tsx` or `IntegrationsPage.tsx`)

On page load, check `window.location.search` for `?connected={integration_id}`:
```typescript
const params = new URLSearchParams(window.location.search);
const justConnected = params.get('connected');
if (justConnected) {
  // Show success toast
  // Open the destination config step for that integration
  // Clean URL: window.history.replaceState({}, '', '/integrations')
}
```

### 4. `CreateAutomationModal.tsx` — Destination Config Panel

After user selects a destination and proceeds to step 2, show destination-specific config:
- Google Sheets: spreadsheet_id input, sheet_name, write_mode
- Mailchimp: audience dropdown (from get-integration-options), tags input
- HubSpot: no config needed (just confirm)
- SendGrid: list dropdown (from get-integration-options)
- Twilio: optional list name customization
- Zapier/Make/n8n: webhook URL input + send mode

---

## WHAT DESTINATION CONFIG IS STORED PER INTEGRATION

When user creates an automation, `destination_config` in the `automations` table should contain:

```
Google Sheets: { spreadsheet_id, sheet_name, write_mode }
Mailchimp:     { list_id, tags, double_opt_in }
HubSpot:       { object_type: 'contacts' }
SendGrid:      { list_ids: [] }
Twilio:        { list_unique_name: 'listingbug_contacts' }
Zapier/Make:   { webhook_url, send_mode }
n8n:           { webhook_url, send_mode }
```

---

## WHAT THE NEXT SESSION SHOULD DO (IN ORDER)

1. **Build `get-integration-options` edge function** — needed by Mailchimp + SendGrid list pickers
2. **Rewrite `IntegrationConnectionModal.tsx`** — grouped modal with correct flow per integration type
3. **Add OAuth return handler** — detect `?connected=` on integrations page load
4. **Update `IntegrationsPage.tsx`** — real connected state from DB, disconnect button
5. **Update `CreateAutomationModal.tsx`** — destination config panels per integration
6. **Test end-to-end** for each integration type:
   - Google Sheets: connect → create automation → run → verify rows in sheet
   - Mailchimp: connect → create automation → run → verify contacts in audience
   - HubSpot: connect → create automation → run → verify contacts in CRM
   - SendGrid: API key → create automation → run → verify contacts in list
   - Twilio: credentials → create automation → run → verify Sync List
   - Zapier: webhook URL → create automation → run → verify Zap triggered

---

## DESIGN RULES REMINDER

- **Primary button:** `bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#0F1115] font-bold`
- **Dark mode backgrounds:** `#0F1115` (page), `#2F2F2F` (card)
- **Border:** `border-gray-200 dark:border-white/10`
- **Lucide icons only** — no emojis in buttons/nav
- **Toast:** use `toast` from `sonner@2.0.3` (consistent with rest of app)
- **No field mapping UI** — all field mappings are pre-decided in edge functions

---

## KEY FILE LOCATIONS

```
src/components/IntegrationConnectionModal.tsx  — FULL REWRITE needed
src/components/IntegrationsPage.tsx            — connected state from DB needed
src/components/CreateAutomationModal.tsx       — destination config panels needed
src/App.tsx                                    — OAuth return param handler needed
supabase/functions/get-integration-options/    — NEW function needed
supabase/functions/send-to-*/                  — all deployed, do not rebuild
supabase/functions/oauth-*/                    — all deployed, do not rebuild
```

---

## SUPABASE CREDENTIALS (FOR REFERENCE)

| Item | Value |
|---|---|
| Project ID | ynqmisrlahjberhmlviz |
| Anon key | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucW1pc3JsYWhqYmVyaG1sdml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTQ2MzksImV4cCI6MjA4OTUzMDYzOX0.dDZodNajIu6UVfSkMCYiX4B4yYEf7QtPot3mNy18yMg |
| OAuth callback URL | https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/oauth-callback |
| App URL | https://thelistingbug.com |
| Local path | C:\Users\User\Downloads\ListingBug FIGMA MVP |

---

*Generated: March 25, 2026 — End of integration planning session*
