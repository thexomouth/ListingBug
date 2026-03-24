# ListingBug — Integrations Implementation Brief
**Version:** 1.0 — March 2026  
**Author:** For AI developer handoff  
**Scope:** 10 launch integrations — Google Sheets, Mailchimp, SendGrid, Constant Contact, Twilio, Zapier, HubSpot, Make.com, n8n, Zoho CRM

---

## 1. PROJECT OVERVIEW

ListingBug is a real estate data SaaS at `thelistingbug.com`. It pulls listing data from the RentCast API, caches it in Supabase, and exposes it to users through search, saved listings, and automations. The primary GTM target is **home staging companies** who need to monitor new listings and reach out to agents before anyone else does.

Integrations are the mechanism by which users push listing data out of ListingBug into their existing tools. An **automation** = saved search criteria + integration destination + sync schedule. When the automation runs, ListingBug re-executes the search and ships the results to the chosen destination.

---

## 2. TECH STACK

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS + Vite |
| Hosting | Vercel (`thelistingbug.com`) |
| Backend | Supabase (Postgres + Edge Functions in Deno/TypeScript) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Data source | RentCast API |
| Payments | Stripe |
| Existing edge functions | `search-listings`, `stripe-checkout`, `stripe-webhook`, `update-password`, `delete-user` |

**Project paths:**
- Frontend: `src/components/`
- Edge functions: `supabase/functions/<function-name>/index.ts`
- Supabase project ID: `ynqmisrlahjberhmlviz`

---

## 3. DATABASE SCHEMA (RELEVANT TABLES)

### `listings` table — the core data payload
All integration data originates from this table. Full column set:

```
id, formatted_address, address_line1, address_line2, city, state, zip_code,
county, state_fips, county_fips, latitude, longitude, listing_type,
listing_type_detail, status, mls_number, mls_name, price, price_reduced,
listed_date, removed_date, created_date, last_seen_date, days_on_market,
property_type, bedrooms, bathrooms, square_footage, lot_size, year_built,
garage, garage_spaces, pool, stories, hoa_fee, description, virtual_tour_url,
photo_count, agent_name, agent_phone, agent_email, agent_website,
office_name, office_phone, office_email, office_website,
broker_name, broker_email, broker_phone, broker_website,
history_json, photos_json, raw_json, fetched_at, updated_at
```

### `users` table
```
id (uuid, FK to auth.users), email, full_name, company,
plan (trial | starter | professional | enterprise),
plan_status (active | trialing | canceled | past_due),
trial_ends_at, created_at, updated_at
```

### `automations` table — CREATE THIS IF NOT EXISTS
```sql
CREATE TABLE automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  search_criteria jsonb NOT NULL,
  destination_type text NOT NULL,
  destination_config jsonb NOT NULL,
  field_mappings jsonb,
  schedule text NOT NULL DEFAULT 'daily',
  active boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own automations" ON automations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### `automation_runs` table — log every execution
```sql
CREATE TABLE automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid REFERENCES automations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  automation_name text,
  run_date timestamptz DEFAULT now(),
  status text NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  listings_sent integer DEFAULT 0,
  destination text,
  details text,
  error_message text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own runs" ON automation_runs
  FOR SELECT USING (auth.uid() = user_id);
```

### `integration_connections` table — stores credentials
```sql
CREATE TABLE integration_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id text NOT NULL,
  credentials jsonb,
  connected_at timestamptz DEFAULT now(),
  last_used_at timestamptz,
  UNIQUE(user_id, integration_id)
);
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own connections" ON integration_connections
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### `api_keys` table — already exists
```
id (uuid), user_id, name, key (plaintext stored), key_hash, key_preview,
last_used, last_used_at, created_at
```

---

## 4. AUTH MODEL FOR INTEGRATIONS

Three categories:

| Category | Integrations | Mechanism |
|---|---|---|
| ListingBug API key | Zapier, Make, n8n | User generates a `lb_live_...` key in Account → API. Pastes it into the third-party platform. ListingBug validates it on inbound webhook calls. |
| User's own API key | SendGrid, Twilio | User pastes their own platform API key. Stored in `integration_connections.credentials` (encrypt at rest). |
| OAuth | Mailchimp, Constant Contact, HubSpot, Zoho CRM, Google Sheets | OAuth 2.0 Authorization Code flow. ListingBug redirects user to provider, receives code, exchanges for tokens, stores access+refresh tokens in `integration_connections.credentials`. |

**OAuth is currently marked "coming soon" in the UI.** The `IntegrationConnectionModal` already shows the pending state. To activate:
1. Register a developer app with each OAuth provider
2. Set client ID/secret as Supabase secrets
3. Implement the OAuth edge function described in Section 6
4. Update `INTEGRATION_CONFIGS[id].authType` from `'oauth'` to the live value


---

## 5. THE LISTING DATA PAYLOAD

Every integration receives the same normalized listing object. This is what gets mapped and shipped.

```typescript
interface ListingPayload {
  // Identity
  id: string;
  mls_number: string | null;
  mls_name: string | null;

  // Address
  formatted_address: string;
  address_line1: string;
  city: string;
  state: string;
  zip_code: string;
  county: string | null;
  latitude: number | null;
  longitude: number | null;

  // Listing details
  status: string;                // "Active", "Pending", "Sold"
  listing_type: string;          // "sale" | "rental"
  price: number;
  price_reduced: boolean;
  days_on_market: number;
  listed_date: string;           // ISO date
  removed_date: string | null;
  last_seen_date: string | null;

  // Property
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  square_footage: number;
  lot_size: number | null;
  year_built: number | null;
  garage: boolean | null;
  garage_spaces: number | null;
  pool: boolean | null;
  stories: number | null;
  hoa_fee: number | null;
  description: string | null;
  virtual_tour_url: string | null;

  // Agent
  agent_name: string | null;
  agent_phone: string | null;
  agent_email: string | null;
  agent_website: string | null;

  // Brokerage
  office_name: string | null;
  office_phone: string | null;
  office_email: string | null;
  office_website: string | null;

  // Meta
  photo_count: number;
  fetched_at: string;
}
```

**Default field mappings** (used as suggestions in the Create Automation UI):
```
address        → address / Address / ADDR
price          → price / Price / LIST_PRICE
bedrooms       → beds / Bedrooms / BEDS
bathrooms      → baths / Bathrooms / BATHS
square_footage → sqft / SquareFeet / SQ_FT
listed_date    → date_listed / ListDate / DATE
agent_name     → agent / AgentName / AGENT
agent_phone    → agent_phone / AgentPhone / PHONE
agent_email    → agent_email / AgentEmail / EMAIL
status         → status / ListingStatus / STATUS
```

---

## 6. EDGE FUNCTION ARCHITECTURE

All integration execution happens in Supabase Edge Functions (Deno/TypeScript). Do NOT put API secrets in the frontend.

### Pattern for every integration edge function:

```typescript
// supabase/functions/run-automation/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1. Auth — verify JWT from Authorization header
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  const userClient = createClient(SUPABASE_URL, token!);
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  // 2. Load automation + connection credentials
  const { automationId } = await req.json();
  const { data: automation } = await supabase.from("automations").select("*").eq("id", automationId).eq("user_id", user.id).single();
  const { data: connection } = await supabase.from("integration_connections").select("credentials").eq("user_id", user.id).eq("integration_id", automation.destination_type).single();

  // 3. Re-run the search to get current listings
  const listings = await fetchListings(automation.search_criteria);

  // 4. Apply field mappings
  const mapped = listings.map(l => applyMappings(l, automation.field_mappings));

  // 5. Send to destination (integration-specific)
  const result = await sendToDestination(automation.destination_type, connection.credentials, mapped);

  // 6. Log run
  await supabase.from("automation_runs").insert({
    automation_id: automationId, user_id: user.id,
    automation_name: automation.name, status: result.success ? "success" : "failed",
    listings_sent: result.count, destination: automation.destination_type,
    details: result.message, error_message: result.error || null
  });

  // 7. Update automation last_run_at
  await supabase.from("automations").update({ last_run_at: new Date().toISOString() }).eq("id", automationId);

  return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
```

### OAuth flow edge functions needed:
- `oauth-connect` — initiates redirect to provider authorization URL
- `oauth-callback` — handles the callback, exchanges code for tokens, stores in `integration_connections`
- `oauth-refresh` — refreshes expired access tokens before running automations

### Supabase secrets to set (via `supabase secrets set KEY=value`):
```
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
MAILCHIMP_OAUTH_CLIENT_ID
MAILCHIMP_OAUTH_CLIENT_SECRET
CONSTANT_CONTACT_CLIENT_ID
CONSTANT_CONTACT_CLIENT_SECRET
HUBSPOT_CLIENT_ID
HUBSPOT_CLIENT_SECRET
ZOHO_CLIENT_ID
ZOHO_CLIENT_SECRET
SENDGRID_API_KEY          (ListingBug's own account, for transactional)
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER
```


---

## 7. INTEGRATION SPECIFICATIONS

---

### 7.1 GOOGLE SHEETS

**Category:** Data export / spreadsheet  
**Auth type:** OAuth 2.0 (Google)  
**Provider app registration:** https://console.cloud.google.com/ → APIs & Services → Credentials  
**Required scopes:** `https://www.googleapis.com/auth/spreadsheets`  
**Current UI status:** Listed as "Future" (category: `future`) in `IntegrationsPage.tsx`  
**Priority:** HIGH — simplest integration, high user demand, good fallback for users not on a CRM

**What it does:**  
When an automation runs, append new listings as rows to a user-specified Google Sheet. Each listing = one row. Supports create-new-sheet or append-to-existing modes.

**OAuth flow:**
```
1. User clicks Connect in IntegrationsPage
2. Frontend calls /functions/v1/oauth-connect?provider=google
3. Edge function returns Google auth URL with scopes, state param = user_id
4. User authorizes, Google redirects to /functions/v1/oauth-callback?provider=google
5. Edge function exchanges code for tokens, stores in integration_connections:
   { access_token, refresh_token, scope, token_type, expiry_date }
6. User is redirected back to /integrations with success state
```

**Automation execution:**
```typescript
// google-sheets destination handler
async function sendToGoogleSheets(credentials: any, listings: any[], config: any) {
  // Refresh token if needed
  const accessToken = await refreshGoogleToken(credentials);
  
  const spreadsheetId = config.spreadsheet_id;
  const sheetName = config.sheet_name || 'ListingBug';
  
  // Build rows array — header row if sheet is empty
  const rows = listings.map(l => [
    l.formatted_address, l.price, l.bedrooms, l.bathrooms,
    l.square_footage, l.status, l.days_on_market, l.listed_date,
    l.agent_name, l.agent_phone, l.agent_email, l.city, l.state, l.zip_code
  ]);
  
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: rows })
    }
  );
  return res.ok ? { success: true, count: rows.length } : { success: false, error: await res.text() };
}
```

**UI config fields needed (in ActivateAutomationModal for this destination):**
- Spreadsheet ID (paste from Google Sheets URL) or "Create new spreadsheet"
- Sheet tab name (default: "ListingBug")
- Write mode: Append new rows / Overwrite sheet each run

**Default column headers for new sheets:**
`Address | Price | Beds | Baths | Sqft | Status | DOM | Listed Date | Agent | Agent Phone | Agent Email | City | State | ZIP`

---

### 7.2 MAILCHIMP

**Category:** Email marketing  
**Auth type:** OAuth 2.0  
**Provider app registration:** https://mailchimp.com/developer/ → Register an App  
**Required scopes:** (Mailchimp OAuth grants all scopes by default)  
**Current UI status:** Listed as "Available" in both `IntegrationsPage.tsx` and `AutomationsManagementPage.tsx`  
**Current connection modal status:** Shows "OAuth coming soon" message  

**What it does:**  
Sync agent contacts from listing results into a Mailchimp audience list. The use case is: stager runs a search → gets 50 new listings → 50 agents get added to a Mailchimp audience → stager triggers an email campaign to those agents.

**Key Mailchimp API concepts:**
- Audiences (formerly "lists") — identified by `list_id`
- Members — contacts within an audience
- Tags — used to segment (e.g., tag = "Denver-80202", "Listing-Active")
- Merge fields — custom data fields (FNAME, LNAME, PHONE, ADDRESS, etc.)

**Automation execution:**
```typescript
// Mailchimp uses datacenter-specific API URLs
// Datacenter is extracted from the access token or stored at connect time
async function sendToMailchimp(credentials: any, listings: any[], config: any) {
  const { access_token, api_endpoint } = credentials;
  // api_endpoint format: "https://usX.api.mailchimp.com"
  const listId = config.list_id;
  
  const members = listings
    .filter(l => l.agent_email)  // Only listings with agent email
    .map(l => ({
      email_address: l.agent_email,
      status: config.double_opt_in ? 'pending' : 'subscribed',
      merge_fields: {
        FNAME: l.agent_name?.split(' ')[0] || '',
        LNAME: l.agent_name?.split(' ').slice(1).join(' ') || '',
        PHONE: l.agent_phone || '',
        ADDRESS: l.formatted_address || '',
        BROKERAGE: l.office_name || '',
      },
      tags: config.auto_tag ? [l.city, l.zip_code, l.status].filter(Boolean) : [],
    }));
  
  const res = await fetch(`${api_endpoint}/3.0/lists/${listId}/members/batch-subscribe-or-unsubscribe`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ members, update_existing: config.update_existing ?? true })
  });
  const data = await res.json();
  return { success: res.ok, count: data.total_created + data.total_updated, error: data.errors?.[0]?.error };
}
```

**Mailchimp OAuth token structure (store in `integration_connections.credentials`):**
```json
{
  "access_token": "...",
  "expires_at": 0,
  "scope": "...",
  "token_type": "bearer",
  "api_endpoint": "https://us1.api.mailchimp.com",
  "login": { "email": "...", "login_id": "...", "account_name": "..." }
}
```

**UI config fields (ActivateAutomationModal for Mailchimp):**
- Audience/List (dropdown populated by GET /3.0/lists after OAuth)
- Double opt-in toggle (default: off)
- Auto-tag contacts toggle (default: on)
- Update existing contacts toggle (default: on)


---

### 7.3 SENDGRID

**Category:** Email delivery / transactional  
**Auth type:** User's own API key (already implemented in `IntegrationConnectionModal`)  
**Provider portal:** https://app.sendgrid.com/ → Settings → API Keys  
**Current UI status:** "Available" — connection modal shows API key input and is already wired  
**Priority:** HIGH — only integration that's partially implemented end-to-end

**What it does:**  
Two modes:
1. **Transactional send:** Send a formatted listing digest email directly from the automation (ListingBug composes it, SendGrid delivers it)
2. **Contact sync:** Add agent contacts from listings to a SendGrid Marketing list

**Important:** SendGrid requires sender domain verification. ListingBug should either use its own verified domain (`noreply@thelistingbug.com`) for sends on behalf of users, OR require users to verify their own domain. For launch, use ListingBug's domain for the send and allow users to configure reply-to.

**Automation execution (contact sync mode):**
```typescript
async function sendToSendGrid(credentials: any, listings: any[], config: any) {
  const apiKey = credentials.apiKey;
  const listId = config.list_id;
  
  const contacts = listings
    .filter(l => l.agent_email)
    .map(l => ({
      email: l.agent_email,
      first_name: l.agent_name?.split(' ')[0] || '',
      last_name: l.agent_name?.split(' ').slice(1).join(' ') || '',
      phone_number: l.agent_phone || '',
      custom_fields: {
        e1_T: l.formatted_address,    // custom field: listing_address
        e2_T: l.office_name,          // custom field: brokerage
        e3_T: l.city,
        e4_T: l.zip_code,
      }
    }));
  
  const res = await fetch('https://api.sendgrid.com/v3/marketing/contacts', {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ list_ids: listId ? [listId] : [], contacts })
  });
  const data = await res.json();
  return { success: res.ok, count: contacts.length, job_id: data.job_id };
}
```

**Automation execution (email digest mode):**
```typescript
async function sendDigestEmail(credentials: any, listings: any[], config: any) {
  const apiKey = credentials.apiKey;
  
  const html = buildListingDigestHTML(listings); // Build a formatted HTML email
  
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: config.to_email }] }],
      from: { email: 'noreply@thelistingbug.com', name: 'ListingBug' },
      reply_to: { email: config.reply_to || config.to_email },
      subject: config.subject || `${listings.length} new listings — ${new Date().toLocaleDateString()}`,
      content: [{ type: 'text/html', value: html }]
    })
  });
  return { success: res.status === 202, count: listings.length };
}
```

**UI config fields (ActivateAutomationModal for SendGrid):**
- Mode toggle: "Add to contact list" / "Send email digest"
- [Contact list mode] Contact list (dropdown via GET /v3/marketing/lists)
- [Digest mode] To email address, Subject line, Reply-to email
- Send time (daily at HH:MM)

**Credential storage:** `{ apiKey: "SG.xxx..." }` — already storing this when user connects

---

### 7.4 CONSTANT CONTACT

**Category:** Email marketing  
**Auth type:** OAuth 2.0  
**Provider app registration:** https://developer.constantcontact.com/ → My Applications  
**Required scopes:** `contact_data`, `campaign_data`  
**Current UI status:** "Available" — OAuth pending state shown in modal  

**What it does:**  
Nearly identical to Mailchimp. Sync agent contacts from listings into a Constant Contact contact list. Target user: small staging businesses already on Constant Contact who don't want to switch to Mailchimp.

**Key Constant Contact API v3 concepts:**
- Contact lists — identified by `list_id`
- Contacts — created/updated via bulk import (async job)
- Custom fields — configurable per account

**Automation execution:**
```typescript
async function sendToConstantContact(credentials: any, listings: any[], config: any) {
  const { access_token } = credentials;
  
  const contacts = listings
    .filter(l => l.agent_email)
    .map(l => ({
      email_address: { address: l.agent_email, permission_to_send: 'implicit' },
      first_name: l.agent_name?.split(' ')[0] || '',
      last_name: l.agent_name?.split(' ').slice(1).join(' ') || '',
      phone_numbers: l.agent_phone ? [{ phone_number: l.agent_phone, kind: 'work' }] : [],
      list_memberships: [config.list_id],
      custom_fields: [
        { custom_field_id: config.address_field_id, value: l.formatted_address },
        { custom_field_id: config.brokerage_field_id, value: l.office_name || '' },
      ].filter(f => f.custom_field_id)
    }));
  
  // Constant Contact uses async bulk import
  const importRes = await fetch('https://api.cc.email/v3/activities/contacts_json_import', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ import_data: contacts, list_ids: [config.list_id] })
  });
  const job = await importRes.json();
  // Poll job.activity_id for completion if needed, or fire-and-forget
  return { success: importRes.ok, count: contacts.length, activity_id: job.activity_id };
}
```

**Constant Contact OAuth token structure:**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "expires_at": 1700000000000
}
```

**UI config fields:**
- Contact list (dropdown via GET /v3/contact_lists after OAuth)
- Update existing contacts toggle

---

### 7.5 TWILIO

**Category:** SMS  
**Auth type:** User's own credentials (Account SID + Auth Token + from number)  
**Provider portal:** https://console.twilio.com/  
**Current UI status:** Listed as "Future" — move to "Available" for launch  
**Priority:** HIGH for the staging use case — "new listing in your ZIP" SMS alert is extremely high-value

**What it does:**  
Send SMS notifications when new listings match an automation's criteria. Two modes:
1. **Alert mode:** One SMS per new listing to a specified phone number
2. **Digest mode:** One SMS summary per automation run ("5 new listings in 80202 today — view them: [link]")

**Automation execution:**
```typescript
async function sendToTwilio(credentials: any, listings: any[], config: any) {
  const { accountSid, authToken, fromNumber } = credentials;
  const authHeader = btoa(`${accountSid}:${authToken}`);
  
  const toNumber = config.to_number;
  const mode = config.mode || 'digest';
  
  if (mode === 'digest') {
    const body = `ListingBug: ${listings.length} new listing${listings.length !== 1 ? 's' : ''} match your search in ${config.location || 'your area'}. View: https://thelistingbug.com/listings`;
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${authHeader}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ From: fromNumber, To: toNumber, Body: body })
    });
    return { success: res.ok, count: 1 };
  }
  
  // Alert mode — one SMS per listing (use carefully, rate limits apply)
  const results = await Promise.allSettled(
    listings.slice(0, config.max_sms || 5).map(l => {
      const body = `New listing: ${l.formatted_address} — $${l.price?.toLocaleString()} | ${l.bedrooms}bd ${l.bathrooms}ba | Agent: ${l.agent_name || 'unknown'} ${l.agent_phone || ''}`;
      return fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${authHeader}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ From: fromNumber, To: toNumber, Body: body.substring(0, 160) })
      });
    })
  );
  const sent = results.filter(r => r.status === 'fulfilled').length;
  return { success: sent > 0, count: sent };
}
```

**UI config fields (ActivateAutomationModal for Twilio):**
- Account SID (input)
- Auth Token (password input)
- From number (input — Twilio number, format: +1XXXXXXXXXX)
- To number (input — who receives the SMS)
- Mode: Digest (1 SMS summary) / Alert per listing
- Max SMS per run (for alert mode — default 5, max 20)

**Connection modal:** Show 3 input fields (SID, token, from number). No OAuth needed.


---

### 7.6 ZAPIER

**Category:** Automation platform  
**Auth type:** ListingBug API key (already partially implemented)  
**Current UI status:** "Available" — modal shows "Go to API Settings" button  
**Priority:** HIGHEST — enables users to connect to anything without ListingBug building direct integrations. This is the force multiplier.

**How it works (inbound webhook model):**  
Zapier does NOT poll ListingBug. Instead, ListingBug pushes to Zapier. When an automation runs:
1. ListingBug calls the Zapier webhook URL that the user pasted into their automation config
2. Zapier receives the payload and the user's Zap continues from there

**Alternatively, Zapier Trigger model (preferred for clean UX):**  
Build a proper Zapier integration (called a "Zapier App") that lets users authenticate with their ListingBug API key inside Zapier, then select "New Listing Match" as a Zapier trigger. This requires registering at https://developer.zapier.com/.

**For launch, implement the webhook push model (simpler):**

```typescript
async function sendToZapier(credentials: any, listings: any[], config: any) {
  // config.webhook_url = the Zapier webhook URL the user pasted
  const webhookUrl = config.webhook_url;
  
  // Send one POST per listing OR batch all listings in one payload
  // Zapier strongly prefers one event per payload for triggers
  const mode = config.send_mode || 'batch'; // 'per_listing' | 'batch'
  
  if (mode === 'batch') {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listings, count: listings.length, source: 'listingbug', run_at: new Date().toISOString() })
    });
    return { success: res.ok, count: listings.length };
  }
  
  // Per-listing mode
  const results = await Promise.allSettled(
    listings.map(l => fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing: l, source: 'listingbug', run_at: new Date().toISOString() })
    }))
  );
  return { success: true, count: results.filter(r => r.status === 'fulfilled').length };
}
```

**UI config fields (ActivateAutomationModal for Zapier):**
- Zapier webhook URL (input — user creates a "Catch Hook" Zap and pastes the URL here)
- Send mode: Batch all listings / One event per listing
- Link to Zapier integration docs (or "How to set this up" guide)

**API key validation for inbound requests from Zapier:**  
If ListingBug later builds a proper Zapier App where Zapier calls ListingBug APIs, validate the `lb_live_...` key from the Authorization header against the `api_keys` table (hash comparison).

---

### 7.7 HUBSPOT

**Category:** CRM  
**Auth type:** OAuth 2.0  
**Provider app registration:** https://developers.hubspot.com/ → Apps → Create App  
**Required scopes:** `crm.objects.contacts.write`, `crm.objects.contacts.read`, `crm.objects.deals.write`  
**Current UI status:** "Available" — OAuth pending state shown in modal  
**Priority:** HIGH — HubSpot is the most common CRM among real estate adjacent businesses

**What it does:**  
Create or update HubSpot contacts (for agents) and optionally create deals (for listings). The primary use case: each listing creates/updates a Contact record for the listing agent, tagged with the property address. Power users can also create a Deal record for each listing for pipeline tracking.

**HubSpot API v3 contacts:**
```typescript
async function sendToHubSpot(credentials: any, listings: any[], config: any) {
  const { access_token } = credentials;
  
  const inputs = listings
    .filter(l => l.agent_email)
    .map(l => ({
      properties: {
        email: l.agent_email,
        firstname: l.agent_name?.split(' ')[0] || '',
        lastname: l.agent_name?.split(' ').slice(1).join(' ') || '',
        phone: l.agent_phone || '',
        company: l.office_name || '',
        // Custom properties — must be created in HubSpot first
        listing_address: l.formatted_address,
        listing_price: l.price?.toString() || '',
        listing_status: l.status || '',
        listing_zip: l.zip_code || '',
        listing_dom: l.days_on_market?.toString() || '',
      }
    }));
  
  // Upsert contacts (create or update by email)
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: inputs.map(i => ({ ...i, idProperty: 'email' })) })
  });
  const data = await res.json();
  return { success: res.ok, count: data.results?.length || 0, error: data.message };
}
```

**Custom properties to create in HubSpot (document for users):**  
`listing_address`, `listing_price`, `listing_status`, `listing_zip`, `listing_dom`, `listing_brokerage`  
These should be created automatically via the HubSpot API during the connect flow:
```typescript
// During OAuth connect, create custom properties
await fetch('https://api.hubapi.com/crm/v3/properties/contacts', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'listing_address', label: 'Listing Address', type: 'string', fieldType: 'text', groupName: 'contactinformation' })
});
```

**HubSpot OAuth token structure:**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 1800,
  "expires_at": 1700000000000,
  "token_type": "Bearer",
  "hub_domain": "company.hubspot.com",
  "hub_id": 12345678
}
```

**UI config fields:**
- Object to create: Contacts / Deals / Both
- [Deal mode] Pipeline (dropdown via GET /crm/v3/pipelines/deals)
- [Deal mode] Stage (dropdown based on selected pipeline)
- Update existing contacts toggle

---

### 7.8 MAKE.COM (formerly Integromat)

**Category:** Automation platform  
**Auth type:** ListingBug API key  
**Current UI status:** "Available" — modal shows "Go to API Settings" button (same as Zapier)  
**Priority:** HIGH — Make.com users are typically more technical and want complex multi-step scenarios

**How it works:**  
Same webhook push model as Zapier. Make.com has a "Custom Webhook" module that receives HTTP POST requests.

```typescript
async function sendToMake(credentials: any, listings: any[], config: any) {
  // Identical to Zapier webhook push
  const webhookUrl = config.webhook_url;
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      listings,
      count: listings.length,
      automation_name: config.automation_name,
      source: 'listingbug',
      run_at: new Date().toISOString()
    })
  });
  return { success: res.ok, count: listings.length };
}
```

**Future — Make.com native app:**  
Make.com has a partner integration program at https://www.make.com/en/partners. A native ListingBug app would let users select it from the Make.com module library without needing API keys. For launch, the webhook approach is sufficient.

**UI config fields (ActivateAutomationModal for Make):**
- Make.com webhook URL (custom webhook trigger URL from Make scenario)
- Link to "How to set this up in Make.com"

---

### 7.9 n8n

**Category:** Automation platform (self-hosted / cloud)  
**Auth type:** ListingBug API key  
**Current UI status:** "Available" — modal shows "Go to API Settings" button  

**How it works:**  
n8n has a "Webhook" node that can receive HTTP POST requests. ListingBug pushes to that URL exactly like Zapier and Make.

```typescript
// Identical implementation to Zapier/Make webhook push
async function sendToN8n(credentials: any, listings: any[], config: any) {
  const webhookUrl = config.webhook_url;
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-ListingBug-Source': 'automation' },
    body: JSON.stringify({ listings, metadata: { count: listings.length, run_at: new Date().toISOString() } })
  });
  return { success: res.ok, count: listings.length };
}
```

**n8n also supports a "ListingBug HTTP Request" node using the API key:**  
Users can alternatively build n8n workflows that pull from ListingBug's REST API using their `lb_live_` key in the Authorization header. The public API endpoint to document:

```
GET https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/public-listings
Authorization: Bearer lb_live_XXXXXXX
Query params: city, state, zip_code, status, limit (max 100)
```

This public listings endpoint needs to be built as a new edge function that validates `lb_live_` keys.

**UI config fields:** Same as Zapier/Make — webhook URL input.


---

### 7.10 ZOHO CRM

**Category:** CRM  
**Auth type:** OAuth 2.0  
**Provider app registration:** https://api-console.zoho.com/ → Add Client → Server-based App  
**Required scopes:** `ZohoCRM.modules.contacts.ALL`, `ZohoCRM.modules.leads.ALL`  
**Current UI status:** "Available" — OAuth pending state shown in modal  
**Note:** Zoho has datacenter-specific API domains (US: `zohoapis.com`, EU: `zohoapis.eu`, etc.) — must capture and store the correct domain at OAuth time

**What it does:**  
Create or update Lead/Contact records in Zoho CRM for listing agents. The staging company target persona is likely already using Zoho CRM for their sales pipeline.

**Zoho OAuth specifics:**  
Zoho requires capturing which datacenter the user's account is on during the OAuth flow. The authorization URL varies:
- US: `https://accounts.zoho.com/oauth/v2/auth`
- EU: `https://accounts.zoho.eu/oauth/v2/auth`
- Let users select their region during connect, or detect from the OAuth callback.

```typescript
async function sendToZohoCRM(credentials: any, listings: any[], config: any) {
  const { access_token, api_domain } = credentials;
  // api_domain example: "https://www.zohoapis.com"
  
  const module = config.module || 'Leads'; // Leads or Contacts
  
  const records = listings
    .filter(l => l.agent_email)
    .map(l => ({
      Last_Name: l.agent_name?.split(' ').slice(-1)[0] || 'Unknown',
      First_Name: l.agent_name?.split(' ').slice(0, -1).join(' ') || '',
      Email: l.agent_email,
      Phone: l.agent_phone || '',
      Company: l.office_name || '',
      Description: `Listing: ${l.formatted_address} — $${l.price?.toLocaleString()} | ${l.bedrooms}bd ${l.bathrooms}ba`,
      Lead_Source: 'ListingBug',
      // Custom fields (must be created in Zoho CRM layout editor first)
      Listing_Address: l.formatted_address,
      Listing_Price: l.price,
      Listing_Status: l.status,
      Listing_ZIP: l.zip_code,
    }));
  
  // Use upsert to avoid duplicates (match on Email)
  const res = await fetch(`${api_domain}/crm/v3/${module}/upsert`, {
    method: 'POST',
    headers: { 'Authorization': `Zoho-oauthtoken ${access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: records, duplicate_check_fields: ['Email'] })
  });
  const data = await res.json();
  const created = data.data?.filter((r: any) => r.code === 'SUCCESS').length || 0;
  return { success: res.ok, count: created, error: data.data?.find((r: any) => r.code !== 'SUCCESS')?.message };
}
```

**Zoho OAuth token structure:**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "api_domain": "https://www.zohoapis.com",
  "token_type": "Bearer",
  "expires_in": 3600,
  "expires_at": 1700000000000
}
```

**UI config fields:**
- CRM module: Leads / Contacts
- Zoho region (US / EU / AU / IN / JP) — sets the API domain
- Update existing records toggle

---

## 8. THE `run-automation` EDGE FUNCTION

This is the central execution engine. All 10 integrations funnel through it.

**Trigger mechanisms (both needed for launch):**
1. **Manual:** User clicks "Run Now" button in the Automations tab → calls edge function directly
2. **Scheduled:** Supabase pg_cron job fires daily/weekly → calls the edge function for all active automations due to run

**Supabase pg_cron setup (run in SQL editor):**
```sql
-- Run all due automations every hour
SELECT cron.schedule(
  'run-due-automations',
  '0 * * * *',  -- every hour
  $$
  SELECT net.http_post(
    url := 'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1/run-due-automations',
    headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

**`run-due-automations` edge function** (separate from `run-automation`):
```typescript
// Finds all automations due to run and calls run-automation for each
serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  const { data: dueAutomations } = await supabase
    .from('automations')
    .select('id, user_id, schedule')
    .eq('active', true)
    .or('next_run_at.is.null,next_run_at.lte.now()');
  
  const results = await Promise.allSettled(
    (dueAutomations || []).map(a => 
      fetch(`${SUPABASE_URL}/functions/v1/run-automation`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ automationId: a.id, userId: a.user_id })
      })
    )
  );
  
  return new Response(JSON.stringify({ ran: results.length }), { headers: corsHeaders });
});
```

---

## 9. FRONTEND CHANGES NEEDED

### 9.1 `IntegrationConnectionModal.tsx`
Current state: Shows "OAuth coming soon" for all OAuth integrations; shows "Go to API Settings" for Zapier/Make/n8n; shows API key input for SendGrid.

Changes needed:
- For Google Sheets, Mailchimp, Constant Contact, HubSpot, Zoho: Replace "coming soon" state with actual OAuth button once edge functions are live
- For Twilio: Add Account SID / Auth Token / From Number inputs (3 fields)
- For Zapier, Make, n8n: Add a second step after API key — show "Webhook URL" input for the destination webhook they want ListingBug to push to

### 9.2 `IntegrationsPage.tsx`
- Move Google Sheets and Twilio from `category: 'future'` to `category: 'available'`
- Add connected state management tied to real `integration_connections` table data

### 9.3 `ActivateAutomationModal.tsx`
This modal is launched from `CreateAutomationPage` when user clicks "Continue to Preview." It needs destination-specific config panels based on `selectedDestination`:

```typescript
// Destination-specific config panels
const CONFIG_PANELS = {
  sheets:          <GoogleSheetsConfig />,   // spreadsheet_id, sheet_name, write_mode
  mailchimp:       <MailchimpConfig />,       // list_id, double_opt_in, auto_tag
  sendgrid:        <SendGridConfig />,        // mode, list_id/to_email, subject
  constantcontact: <ConstantContactConfig />, // list_id
  twilio:          <TwilioConfig />,          // to_number, mode, max_sms
  zapier:          <WebhookConfig />,         // webhook_url, send_mode
  make:            <WebhookConfig />,         // webhook_url
  n8n:             <WebhookConfig />,         // webhook_url
  hubspot:         <HubSpotConfig />,         // object_type, pipeline_id
  'zoho-crm':      <ZohoConfig />,            // module, region
};
```

### 9.4 `CreateAutomationPage.tsx`
The `Field Mappings` section is currently visible UI. Per punch list: **remove Field Mappings section entirely** from this page. Add note: "Field mappings are configured per integration at implementation time." The field mappings are pre-baked into each integration handler.

### 9.5 New: `IntegrationStatusBadge` component
After connecting an integration, show a green "Connected" badge on the card with the connected account's email/name pulled from `integration_connections`.

---

## 10. SECURITY REQUIREMENTS

1. **Never expose integration credentials to the frontend.** All API calls to third-party services happen in edge functions only. The frontend only stores and retrieves the fact that an integration is connected, not the actual keys/tokens.

2. **Encrypt sensitive credentials at rest.** Use `pgcrypto` or Supabase Vault to encrypt the `credentials` JSONB column in `integration_connections`. At minimum, never log credentials.

3. **Validate API key ownership on every run-automation call.** Confirm `automations.user_id === authenticated_user.id` before accessing `integration_connections.credentials`.

4. **Token refresh before every automation run.** OAuth access tokens expire (HubSpot: 30min, Google: 1hr, Mailchimp: does not expire). Always check `expires_at` and refresh if within 5 minutes of expiry.

5. **Rate limiting.** Each integration has different rate limits:
   - Google Sheets: 100 requests/100 seconds/user
   - Mailchimp: 10 simultaneous connections, 10 req/sec
   - SendGrid: 600 requests/minute (Marketing Contacts API)
   - Constant Contact: 10,000 req/day
   - Twilio: varies by account tier
   - HubSpot: 100 req/10 sec (Free/Starter), 150 req/10 sec (Pro+)
   - Zoho CRM: 5,000 credits/day (each API call = 1 credit)
   Implement exponential backoff + retry in edge functions.

6. **Webhook URL validation.** For Zapier/Make/n8n webhook URLs, validate that the URL is HTTPS before storing.

---

## 11. IMPLEMENTATION ORDER (RECOMMENDED)

Given that this is a self-funded solo project prioritizing speed and user value:

| # | Integration | Why This Order |
|---|---|---|
| 1 | **Zapier** | Zero OAuth complexity, webhook model, unblocks 5,000+ apps for users, API key already exists |
| 2 | **Make.com** | Identical to Zapier, 30 minutes of work |
| 3 | **n8n** | Identical to Zapier/Make, 30 minutes of work |
| 4 | **Google Sheets** | High demand, OAuth is straightforward, Google's OAuth library is well-documented |
| 5 | **SendGrid** | API key auth already partially wired, high value for email digests |
| 6 | **Twilio** | Simple credential auth, SMS alerts are the highest-impact feature for the staging use case |
| 7 | **Mailchimp** | Most popular email marketing tool, OAuth complexity worth it |
| 8 | **HubSpot** | Most popular CRM, upsert API is clean |
| 9 | **Constant Contact** | Similar to Mailchimp, lower priority |
| 10 | **Zoho CRM** | Datacenter complexity makes it slightly harder, lower user demand |

Zapier + Make + n8n can be shipped as a single PR in one session. They share ~95% of the same code.

---

## 12. DESIGN RULES

The existing design system must be respected in all new UI:

- **Colors:** Navy `#0d1b2a` and amber `#FFCE0A` / `#FFD447` only. No red or blue for branding.
- **Dark mode:** All new components must support `dark:` Tailwind variants. Dark background: `#0F1115`, card: `#2F2F2F`.
- **Typography:** All buttons use `font-bold`. Labels use `text-[14px]`.
- **Borders:** `border-gray-200 dark:border-white/10`
- **Cards:** `bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-xl`
- **Primary button:** `bg-[#FFCE0A] hover:bg-[#FFCE0A]/90 text-[#0F1115] font-bold`
- **Toast:** Use `toast` from `react-toastify` OR `sonner` (both are imported in the project — be consistent within a file)
- **No emojis in nav or buttons.** Lucide React icons only for UI elements.

---

## 13. KEY FILE LOCATIONS

```
src/components/IntegrationsPage.tsx          — Integration cards UI, connect/disconnect
src/components/IntegrationConnectionModal.tsx — Auth flow modals (OAuth pending / API key input)
src/components/AutomationsManagementPage.tsx  — Automations list, run history, integration list
src/components/CreateAutomationPage.tsx       — Automation creation wizard
src/components/ActivateAutomationModal.tsx    — Final activation with destination-specific config
src/components/AccountPage.tsx               — Integrations tab (shows APIKeysSection)
src/components/APIKeysSection.tsx            — API key generation and management
supabase/functions/search-listings/          — Main data fetching edge function (reference)
supabase/functions/run-automation/           — TO BE BUILT: automation execution
supabase/functions/run-due-automations/      — TO BE BUILT: scheduled job runner
supabase/functions/oauth-connect/            — TO BE BUILT: OAuth initiation
supabase/functions/oauth-callback/           — TO BE BUILT: OAuth token exchange
supabase/functions/oauth-refresh/            — TO BE BUILT: Token refresh
supabase/functions/public-listings/          — TO BE BUILT: API key authenticated public endpoint
```

---

*This document covers the full integration surface for ListingBug's launch. Questions: review the source files listed in Section 13. The codebase is at github.com/thexomouth/ListingBug on the `main` branch.*
