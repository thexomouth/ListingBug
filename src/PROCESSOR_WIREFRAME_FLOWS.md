# ListingBug Processor Stance - Wireframe Flow Diagrams

## 1. AUTOMATION WIZARD FLOW (CreateAutomationModal.tsx)

```
┌─────────────────────────────────────────────────────────────┐
│  Create Automation                                    [X]   │
├─────────────────────────────────────────────────────────────┤
│  Progress: ●━━━○━━━○━━━○  Step 1 of 4                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  STEP 1: CONNECT DESTINATION                                │
│  ┌────────────────────────────────────────────────────┐    │
│  │ ⚠️ Disclaimer (dismissible)                        │    │
│  │ "ListingBug processes data on your behalf. You are │    │
│  │ responsible for compliance with applicable laws."   │    │
│  │ [Learn More →] links to /account?tab=compliance    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Select Destination:                                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                      │
│  │ 📧   │ │ 🌩️  │ │ 🟠   │ │ 📊   │                      │
│  │Email │ │Sales │ │Hub   │ │Sheet │   [NO RISK BADGES]  │
│  └──────┘ └──────┘ └──────┘ └──────┘                      │
│                                                              │
│  IF integration requires setup:                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Email Address: [________________]                  │    │
│  │ API: destinationConfig.email                        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│                              [Cancel]  [Next: Map Fields →] │
└─────────────────────────────────────────────────────────────┘

API: None (local state only)
Fields: selectedDestination, destinationConfig
Error: "❌ Email required" (inline validation)

---

┌─────────────────────────────────────────────────────────────┐
│  Create Automation                                    [X]   │
├─────────────────────────────────────────────────────────────┤
│  Progress: ●━━━●━━━○━━━○  Step 2 of 4                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  STEP 2: MAP FIELDS                                         │
│  Drag & drop or use suggested mappings                     │
│                                                              │
│  ┌──────────────────┐      ┌──────────────────┐           │
│  │ ListingBug       │  →   │ Email            │           │
│  │ agent_name       │ ═══→ │ [First Name]     │ [Suggested]│
│  │ agent_email      │ ═══→ │ [Email Address]  │ [Suggested]│
│  │ property_address │ ═══→ │ [Custom Field 1] │ [Custom]   │
│  └──────────────────┘      └──────────────────┘           │
│                                                              │
│  [NO CONFIDENCE SCORES]                                     │
│  Badge: "Suggested" (gray) or "Custom" (blue)              │
│                                                              │
│  ☐ Include all 25 listing fields in payload                │
│                                                              │
│                         [← Back]  [Next: Preview & Test →]  │
└─────────────────────────────────────────────────────────────┘

API: None (local state, auto-mapping logic)
Fields: fieldMappings: { source, destination, label: "Suggested"|"Custom" }
Error: "⚠️ Required field 'Email Address' not mapped"

---

┌─────────────────────────────────────────────────────────────┐
│  Create Automation                                    [X]   │
├─────────────────────────────────────────────────────────────┤
│  Progress: ●━━━●━━━●━━━○  Step 3 of 4                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  STEP 3: PREVIEW & TEST                                     │
│                                                              │
│  Sample Payload (JSON):                                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │ {                                                   │    │
│  │   "first_name": "John Smith",                      │    │
│  │   "email": "john.smith@example.com",               │    │
│  │   "property_address": "123 Main St"                │    │
│  │ }                                                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  [Send Test] → Sends 1 sample record to destination        │
│  ✅ "Test sent successfully to john@example.com"            │
│                                                              │
│  Schedule:                                                  │
│  ○ Daily at [08:00 ▾]   ○ Weekly   ○ On new listings       │
│                                                              │
│                              [← Back]  [Next: Activate →]   │
└─────────────────────────────────────────────────────────────┘

API: POST /api/automations/test (optional test send)
Fields: schedule, scheduleTime
Error: "❌ Test failed: Invalid API key"

---

┌─────────────────────────────────────────────────────────────┐
│  Create Automation                                    [X]   │
├─────────────────────────────────────────────────────────────┤
│  Progress: ●━━━●━━━●━━━●  Step 4 of 4                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  STEP 4: ACTIVATE                                           │
│                                                              │
│  Automation Name:                                           │
│  [New Listings to Email_____________________]              │
│                                                              │
│  Status:                                                    │
│  ● Active    ○ Paused                                       │
│                                                              │
│  Summary:                                                   │
│  • Destination: Email (john@example.com)                    │
│  • Schedule: Daily at 8:00 AM                              │
│  • Fields Mapped: 3                                         │
│                                                              │
│  [NO APPROVAL LANGUAGE, NO EVENT LOGGING]                   │
│                                                              │
│                      [Cancel]  [Activate Automation]        │
└─────────────────────────────────────────────────────────────┘

API: POST /api/automations
Payload: { name, destination, schedule, fieldMappings, status: "active"|"paused" }
Success: Toast "✅ Automation activated" + close modal
Error: "❌ Failed to create automation. Try again."
```

---

## 2. INTEGRATION SETUP FLOW (IntegrationConnectionModal.tsx)

```
┌─────────────────────────────────────────────────────────────┐
│  Connect to Mailchimp                               [X]     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [IF FIRST INTEGRATION + !dpaAccepted]                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │ ☐ I accept the Data Processing Agreement and      │    │
│  │   acknowledge ListingBug acts as a data processor. │    │
│  │   [View DPA →] opens /static/dpa.pdf               │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ⓘ Ensure contacts have opted in per applicable laws.      │
│     [View Guidelines →] links to /account?tab=compliance    │
│                                                              │
│  API Key: [________________________________]                │
│  Audience ID: [________________________________]            │
│                                                              │
│  [Test Connection] → API: POST /api/integrations/test       │
│  ✅ "Connection successful"                                 │
│                                                              │
│                         [Cancel]  [Save & Connect]          │
└─────────────────────────────────────────────────────────────┘

API: POST /api/integrations/connect
Payload: { integration_id, credentials, dpa_accepted: true }
Success: Store dpa_accepted in localStorage, close modal
Error States:
  • "❌ Invalid API key. Please check credentials."
  • "⚠️ Re-authentication required" → Show [Reconnect] button
```

---

## 3. ACCOUNT SECTION - COMPLIANCE TAB (New Component)

```
┌─────────────────────────────────────────────────────────────┐
│  Account Settings                                           │
├─────────────────────────────────────────────────────────────┤
│  [Profile] [Usage] [Billing] [API] [Compliance] ← NEW TAB  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  COMPLIANCE                                                 │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. Data Processing Agreement (DPA)                   │  │
│  │ ───────────────────────────────────────────────────  │  │
│  │ Status: ✅ Accepted on Dec 6, 2025 at 10:30 AM      │  │
│  │ [Download DPA (PDF)] → /static/dpa.pdf               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 2. Subprocessor Disclosure                           │  │
│  │ ───────────────────────────────────────────────────  │  │
│  │ Service       Purpose         Location               │  │
│  │ ────────────────────────────────────────────────────  │  │
│  │ Google Cloud  Data Storage    United States          │  │
│  │ AWS           Infrastructure  United States          │  │
│  │ Mailchimp     Email Delivery  United States          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 3. Audit Log Export                                  │  │
│  │ ───────────────────────────────────────────────────  │  │
│  │ Download complete activity history for automations   │  │
│  │ [Download CSV] → API: GET /api/audit/automations     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 4. Suppression List Management (Optional)            │  │
│  │ ───────────────────────────────────────────────────  │  │
│  │ Upload list of emails to exclude from automations    │  │
│  │ [Upload CSV] → API: POST /api/suppression/upload     │  │
│  │ Current list: 234 emails                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 5. Compliance Resources                              │  │
│  │ ───────────────────────────────────────────────────  │  │
│  │ • [CAN-SPAM Compliance Guide]                        │  │
│  │ • [GDPR Overview for Processors]                     │  │
│  │ • [CASL Basics for Real Estate]                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Component: CompliancePage.tsx (new)
APIs:
  • GET /api/compliance/dpa-status → { accepted: true, timestamp }
  • GET /api/audit/automations → CSV download
  • POST /api/suppression/upload → { file: File }
Fields: dpaAccepted, dpaTimestamp, subprocessors[], auditLog[], suppressionCount
```

---

## NAVIGATION FLOW

```
Automations Page → [Create Automation] → Wizard Step 1
                                             ↓ (disclaimer link)
                                        Account > Compliance

Integration Setup → [Connect] → DPA Checkbox (first time)
                                    ↓ (guidelines link)
                               Account > Compliance

Account > Compliance → View DPA, Subprocessors, Export Logs
```
