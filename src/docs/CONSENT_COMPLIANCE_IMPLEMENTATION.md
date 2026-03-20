# ListingBug Consent & Compliance System - Implementation Guide

## Overview

This document provides complete implementation instructions for the consent management and compliance system in ListingBug. The system ensures legal compliance with CAN-SPAM, GDPR, and CASL regulations by tracking contact provenance, consent, and suppression across all automation destinations.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Component Overview](#component-overview)
3. [Integration Points](#integration-points)
4. [API Endpoints](#api-endpoints)
5. [Make.com Scenarios](#makecom-scenarios)
6. [Testing & Validation](#testing--validation)
7. [Deployment Checklist](#deployment-checklist)

---

## System Architecture

### Data Flow

```
Contact Acquisition → Consent Ledger → Validation → Destination
         ↓                    ↓             ↓            ↓
   Provenance            Owner Review   PreSync     Audit Log
   Tracking              Confirmation   Check       & Rollback
```

### Risk Tier Classification

**Tier A (Low Risk)** - One-click approval, no consent validation required
- Google Sheets, Google Drive, Airtable, Notion, Microsoft Excel, Webhooks (data storage)

**Tier B (Medium Risk)** - Consent validation recommended, owner confirmation if <90%
- HubSpot, Salesforce, Pipedrive, Follow Up Boss, LionDesk

**Tier C (High Risk)** - Strict validation, block if <80% consent
- Mailchimp, ActiveCampaign, SendGrid, Constant Contact, Klaviyo

---

## Component Overview

### 1. ConsentProvenancePanel

**File:** `/components/consent/ConsentProvenancePanel.tsx`

**Purpose:** Auto-filled panel showing contact provenance and consent status

**Key Features:**
- One-line summary: "X contacts; Y% with verified opt-in"
- Provenance badges (Form, Phone, In-person, Imported)
- Expandable details drawer
- Warning for low consent (<80%)
- Concierge CTA hook

**Data Bindings:**
```typescript
interface ConsentSummary {
  total_contacts: number;
  verified_opt_in_count: number;
  verified_opt_in_percentage: number;
  provenance_breakdown: {
    [key: string]: number; // { "Form": 45, "Phone": 12 }
  };
}
```

**API Endpoint:** `GET /ledger/summary`

**Usage:**
```tsx
import { ConsentProvenancePanel } from './consent/ConsentProvenancePanel';

<ConsentProvenancePanel
  summary={consentSummary}
  onViewLedger={() => navigate('/settings/consent-ledger')}
  showConciergeButton={consentSummary.verified_opt_in_percentage < 80}
  onConciergeClick={() => createConciergeTask()}
/>
```

---

### 2. PreSyncMarketingModal

**File:** `/components/consent/PreSyncMarketingModal.tsx`

**Purpose:** Required confirmation modal for high-risk marketing destinations (Tier C)

**Trigger Conditions:**
- `destination.risk_tier === 'high'`
- User clicks "Approve" or "Create Automation"

**Behavior:**
- **Block** if `consent_percentage < 80%` → Show concierge CTA
- **Warn** if `consent_percentage >= 80% && < 90%` → Require checkbox
- **Allow** if `consent_percentage >= 90%` → Require checkbox confirmation

**Required Checkbox Text (exact):**
> "I confirm these contacts have explicitly opted in to receive marketing from my business."

**Data Bindings:**
```typescript
interface ValidationResult {
  consent_percentage: number;
  suppression_count: number;
  total_contacts: number;
  verified_count: number;
  sample_contacts: ContactSample[]; // max 5 rows
  risk_assessment: 'low' | 'medium' | 'high';
}
```

**API Endpoints:**
- `POST /ledger/validate` - Validate consent before push
- `POST /ledger/confirmations` - Log owner confirmation with `owner_id`, `timestamp`, `IP`

**Confirmation Data Logged:**
```typescript
{
  owner_id: string;
  confirmation_timestamp: string; // ISO8601
  confirmation_ip: string;
  idempotency_key: string; // UUID
  consent_acknowledged: boolean;
}
```

**Usage:**
```tsx
import { PreSyncMarketingModal } from './consent/PreSyncMarketingModal';

<PreSyncMarketingModal
  isOpen={showPreSyncModal}
  onClose={() => setShowPreSyncModal(false)}
  destinationName="Mailchimp"
  destinationType="mailchimp"
  riskTier="high"
  validationResult={validationResult}
  onConfirm={(confirmationData) => {
    // Log confirmation and proceed with automation
    proceedWithAutomation(confirmationData);
  }}
  onRequestConcierge={() => {
    // Create concierge task
    createConciergeTask();
  }}
  ownerId={currentUser.id}
/>
```

---

### 3. ConsentLedgerTable

**File:** `/components/consent/ConsentLedgerTable.tsx`

**Purpose:** Full audit table with filtering, export, and detail views

**Columns:**
- `contact_id` - Unique identifier
- `email` - Contact email
- `phone` - Contact phone (optional)
- `provenance_source` - Where contact came from (Form, Phone, In-person, Imported, API, Manual)
- `consent_method` - How they opted in
- `consent_timestamp` - When they opted in (ISO8601)
- `consent_ip` - IP address of consent
- `owner_confirmation` - Owner manually confirmed
- `suppression_flag` - Unsubscribed or bounced

**Features:**
- Search by email, phone, contact_id
- Filter by provenance_source, consent_method, suppression_flag
- Export to CSV (calls `POST /ledger/export`)
- Click row to view full event history (calls `GET /ledger/contacts/{contact_id}`)

**Data Bindings:**
```typescript
interface ConsentLedgerRecord {
  contact_id: string;
  email: string;
  phone: string;
  provenance_source: 'Form' | 'Phone' | 'In-person' | 'Imported' | 'API' | 'Manual';
  consent_method: string;
  consent_timestamp: string; // ISO8601
  consent_ip: string;
  owner_confirmation: boolean;
  suppression_flag: boolean;
}

interface ConsentEventHistory {
  event_id: string;
  event_type: 'consent' | 'suppression' | 'update' | 'confirmation';
  timestamp: string; // ISO8601
  source: string;
  ip_address: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}
```

**API Endpoints:**
- `GET /ledger/contacts` - Fetch paginated contact list (with filters)
- `GET /ledger/contacts/{contact_id}` - Fetch contact event history
- `POST /ledger/export` - Export filtered contacts to CSV

**Usage:**
```tsx
import { ConsentLedgerTable } from './consent/ConsentLedgerTable';

<ConsentLedgerTable
  records={consentRecords}
  onExport={(filters) => {
    // Call API to export CSV
    fetch('/ledger/export', {
      method: 'POST',
      body: JSON.stringify(filters)
    });
  }}
  onLoadContactHistory={async (contactId) => {
    const res = await fetch(`/ledger/contacts/${contactId}`);
    return res.json();
  }}
/>
```

---

### 4. ConsentLedgerPage

**File:** `/components/consent/ConsentLedgerPage.tsx`

**Purpose:** Full-page view of consent ledger (accessible from Settings)

**Features:**
- Summary stats dashboard
  - Total Contacts
  - Verified Opt-in (count & percentage)
  - Suppressed (unsubscribed/bounced)
  - Missing Consent (needs review)
- Complete consent ledger table
- Info banner explaining compliance importance

**Navigation Path:** Settings → Compliance → Consent Ledger

---

## Integration Points

### 1. Automation Creation Wizard (CreateAutomationModal)

**File:** `/components/CreateAutomationModal.tsx`

**Current Steps:** 3 steps (Search & Schedule → Destination → Review)

**Enhanced Steps (to implement):** 5 steps
1. **Select Search & Schedule** (existing Step 1)
2. **Connect Destination** (existing Step 2)
3. **Map Fields** (NEW) - Auto-map with confidence scores
4. **Consent Check** (NEW) - ConsentProvenancePanel
5. **Preview & Approve** (enhanced Step 3) - Risk assessment, consent rate, suppression count

**Step 3: Map Fields - NEW**
```tsx
{step === 3 && (
  <div>
    <h3>Map Fields</h3>
    <p>We've automatically suggested field mappings with confidence scores.</p>
    
    {/* Auto-mapping suggestions */}
    <div className="space-y-2">
      <FieldMapping
        sourceField="listing_address"
        destinationField="property_address"
        confidence={0.95}
        autoMapped={true}
      />
      <FieldMapping
        sourceField="listing_price"
        destinationField="price"
        confidence={1.0}
        autoMapped={true}
      />
    </div>
    
    <LBButton onClick={() => acceptAllMappings()}>
      <Sparkles className="w-4 h-4 mr-2" />
      Accept All Suggestions
    </LBButton>
  </div>
)}
```

**Step 4: Consent Check - NEW**
```tsx
{step === 4 && (
  <div>
    <h3>Consent Validation</h3>
    <p className="text-sm text-gray-600 mb-4">
      Only sync contacts who asked to hear from you. We'll show how they opted in.
    </p>
    
    <ConsentProvenancePanel
      summary={mockConsentSummary}
      onViewLedger={() => window.open('/settings/consent-ledger', '_blank')}
      showConciergeButton={mockConsentSummary.verified_opt_in_percentage < 80}
      onConciergeClick={() => {
        // Create concierge task
        toast.info('Concierge review requested');
      }}
    />
  </div>
)}
```

**Step 5: Preview & Approve - ENHANCED**
```tsx
{step === 5 && (
  <div>
    {/* Risk Badge */}
    <div className={`p-4 rounded-lg border ${
      riskTier === 'low' ? 'bg-green-50 border-green-200' :
      riskTier === 'medium' ? 'bg-yellow-50 border-yellow-200' :
      'bg-red-50 border-red-200'
    }`}>
      <p className="font-bold">Risk Assessment: {riskTier.toUpperCase()}</p>
      <p className="text-sm">
        Consent Rate: {consentRate}% | Suppressed: {suppressionCount}
      </p>
    </div>
    
    {/* Sample Payload */}
    <div className="mt-4">
      <h4 className="font-bold mb-2">Sample Payload Preview</h4>
      <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
        {JSON.stringify(samplePayload, null, 2)}
      </pre>
    </div>
    
    {/* Concierge CTA */}
    <button
      onClick={() => createConciergeTask()}
      className="w-full mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
    >
      <Info className="w-4 h-4 inline mr-2" />
      Need help? Concierge setup — we'll do the rest.
    </button>
  </div>
)}
```

**Final Approval Logic:**
```tsx
const handleFinalApprove = () => {
  const tier = getDestinationTier(selectedDestination);
  
  if (tier === 'high') {
    // Trigger PreSyncMarketingModal
    setShowPreSyncModal(true);
  } else if (tier === 'medium' && consentRate < 90) {
    // Show warning, allow proceed with confirmation
    setShowPreSyncModal(true);
  } else {
    // Tier A or high consent - proceed directly
    createAutomation();
  }
};
```

---

### 2. Concierge Flow Hook

**Purpose:** Low-friction CTA for users who need help with compliance setup

**Trigger Points:**
- ConsentProvenancePanel (when consent < 80%)
- PreSyncMarketingModal (when blocked)
- Automation Preview step (always visible)

**Concierge Task Creation:**
```typescript
const createConciergeTask = async () => {
  await fetch('/onboarding/tasks', {
    method: 'POST',
    body: JSON.stringify({
      owner_email: currentUser.email,
      destination: destinationName,
      sample_count: totalContacts,
      reason: 'low_consent_percentage',
      consent_percentage: consentRate,
      requested_at: new Date().toISOString()
    })
  });
  
  // For Google Sheets destination, auto-create template
  if (destinationType === 'sheets') {
    await createSheetsTemplate();
  }
  
  // Send scheduling link
  toast.success('Concierge setup requested! Check your email for scheduling link.');
  
  // Set account flag
  await updateAccount({ concierge_enabled: true });
};
```

---

### 3. Audit, Suppression, and Rollback

**Recent Pushes Panel** (to add to Automations page)

```tsx
<div className="mt-8">
  <h3 className="font-bold text-lg mb-4">Recent Pushes</h3>
  <div className="space-y-2">
    {recentPushes.map(push => (
      <div key={push.batch_id} className="border p-3 rounded-lg flex justify-between">
        <div>
          <p className="font-medium">{push.automation_name}</p>
          <p className="text-xs text-gray-600">
            {push.contacts_sent} contacts → {push.destination}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(push.timestamp).toLocaleString()}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => rollbackPush(push.batch_id)}
        >
          Rollback
        </Button>
      </div>
    ))}
  </div>
</div>
```

**Rollback Logic:**
```typescript
const rollbackPush = async (batchId: string) => {
  // Call destination delete API
  await fetch(`/automation/rollback`, {
    method: 'POST',
    body: JSON.stringify({ batch_id: batchId })
  });
  
  // Log rollback event
  await fetch('/ledger/audit', {
    method: 'POST',
    body: JSON.stringify({
      event_id: uuid(),
      event_type: 'rollback',
      batch_id: batchId,
      timestamp: new Date().toISOString(),
      owner_id: currentUser.id
    })
  });
  
  toast.success('Batch rolled back successfully');
};
```

**Suppression Webhook (ESP Integration):**

See `/docs/consent-compliance-artifacts.md` → Make Scenario 2: SuppressionSync

---

## API Endpoints

### Ledger Management

| Endpoint | Method | Purpose | Request Body | Response |
|----------|--------|---------|--------------|----------|
| `/ledger/contacts` | GET | Fetch paginated contacts | Query: `page`, `limit`, filters | `{ contacts: ConsentLedgerRecord[], total: number }` |
| `/ledger/contacts/{id}` | GET | Fetch contact history | - | `{ contact: ConsentLedgerRecord, history: ConsentEventHistory[] }` |
| `/ledger/contacts` | POST | Create contact record | `ConsentLedgerRecord` | `{ contact_id: string }` |
| `/ledger/contacts/{id}` | PATCH | Update contact | Partial `ConsentLedgerRecord` | `{ success: boolean }` |
| `/ledger/export` | POST | Export to CSV | `{ filters: FilterState }` | CSV file download |
| `/ledger/events` | POST | Log consent event | `{ contact_id, event_type, timestamp, source, ip_address, metadata }` | `{ event_id: string }` |
| `/ledger/validate` | POST | Validate before push | `{ owner_id, destination_type, contact_ids, consent_percentage }` | `{ approved: boolean, blocked_reason?: string }` |
| `/ledger/confirmations` | POST | Log owner confirmation | `{ owner_id, confirmation_timestamp, confirmation_ip, idempotency_key, consent_acknowledged }` | `{ confirmation_id: string }` |
| `/ledger/summary` | GET | Get consent summary | Query: `search_id` or `contact_ids[]` | `ConsentSummary` |
| `/ledger/snapshot` | POST | Create audit snapshot | `{ automation_id, contact_ids, timestamp, owner_id }` | `{ snapshot_id: string }` |
| `/ledger/audit` | POST | Log audit event | `{ event_id, owner_id, destination, batch_id, payload_hash, timestamp, result_status }` | `{ success: boolean }` |

### Onboarding & Concierge

| Endpoint | Method | Purpose | Request Body | Response |
|----------|--------|---------|--------------|----------|
| `/onboarding/tasks` | POST | Create concierge task | `{ owner_email, destination, sample_count, reason, consent_percentage }` | `{ task_id: string, scheduling_link: string }` |

### Automation Execution

| Endpoint | Method | Purpose | Request Body | Response |
|----------|--------|---------|--------------|----------|
| `/automation/execute` | POST | Execute automation | `{ automation_id, owner_id }` | `{ success: boolean, contacts_sent: number }` |
| `/automation/rollback` | POST | Rollback batch | `{ batch_id }` | `{ success: boolean }` |

---

## Make.com Scenarios

See complete scenario blueprints in `/docs/consent-compliance-artifacts.md`

### Scenario 1: PreSyncValidator
- Webhook trigger → Fetch consent → Calculate rate → Route by tier → Validate → POST or block → Log audit

### Scenario 2: SuppressionSync
- ESP webhook → Normalize event → Find contact → Update suppression flag → Log event → Propagate to downstream (HubSpot, Salesforce, Sheets)

### Scenario 3: OneClickApproval
- Owner webhook → Fetch automation → Execute search → Snapshot ledger → Generate idempotency key → POST destination → Log audit

---

## Testing & Validation

### Test Cases

**1. Consent Validation - Block Scenario**
- Create automation with mock contacts (consent_rate = 70%)
- Destination: Mailchimp (high tier)
- **Expected:** PreSyncMarketingModal blocks, shows concierge CTA
- **Verify:** No automation created, concierge task logged

**2. Consent Validation - Warning Scenario**
- Create automation with mock contacts (consent_rate = 85%)
- Destination: Mailchimp (high tier)
- **Expected:** PreSyncMarketingModal shows warning, requires checkbox
- **Verify:** Automation created only after checkbox confirmation
- **Verify:** Confirmation logged with owner_id, timestamp, IP

**3. One-Click Approval - Sheets**
- Create automation with any consent rate
- Destination: Google Sheets (low tier)
- **Expected:** No PreSyncMarketingModal, immediate approval
- **Verify:** Automation created without consent validation

**4. Suppression Filter**
- Create automation with 10 contacts (2 suppressed)
- **Expected:** Only 8 contacts sent to destination
- **Verify:** Suppressed contacts excluded from payload

**5. Idempotency Check**
- Execute same automation twice within 5 minutes
- **Expected:** Second execution prevented by idempotency_key
- **Verify:** Only one batch sent to destination

**6. Rollback**
- Execute automation, send 10 contacts
- Click "Rollback" on recent push
- **Expected:** Destination API called to delete batch
- **Verify:** Rollback event logged to audit table

---

## Deployment Checklist

### Backend

- [ ] Implement all `/ledger/*` API endpoints
- [ ] Implement PreSync validation logic (pseudocode in artifacts doc)
- [ ] Set up database tables:
  - `consent_ledger` (contact records)
  - `consent_events` (event history)
  - `owner_confirmations` (confirmation logs)
  - `audit_log` (automation runs)
- [ ] Implement idempotency checking (UUID-based)
- [ ] Implement IP address capture
- [ ] Implement CSV export generator
- [ ] Set up ESP webhooks (Mailchimp, ActiveCampaign)
- [ ] Configure CORS for API endpoints

### Frontend

- [ ] Install dependencies: `@radix-ui/react-tooltip`, `@radix-ui/react-checkbox`, `uuid`
- [ ] Add ConsentLedgerPage to Settings navigation
- [ ] Update CreateAutomationModal to 5 steps
- [ ] Integrate ConsentProvenancePanel in Step 4
- [ ] Add PreSyncMarketingModal trigger in final approval
- [ ] Add "Recent Pushes" panel to Automations page
- [ ] Add Rollback functionality
- [ ] Add Concierge CTAs throughout flows
- [ ] Test all consent validation scenarios

### Make.com

- [ ] Create PreSyncValidator scenario
- [ ] Create SuppressionSync scenario
- [ ] Create OneClickApproval scenario
- [ ] Configure ESP webhook URLs
- [ ] Test retry/backoff logic
- [ ] Set up error notifications

### Documentation

- [ ] Update API documentation with new endpoints
- [ ] Create user-facing help docs for consent compliance
- [ ] Add tooltips/help text throughout UI
- [ ] Document concierge setup process

### Compliance & Legal

- [ ] Legal review of consent language
- [ ] Review checkbox confirmation text
- [ ] Verify CAN-SPAM, GDPR, CASL compliance
- [ ] Document data retention policies
- [ ] Set up privacy policy updates

---

## Microcopy Reference

All microcopy is documented in `/docs/consent-compliance-artifacts.md` Section 4.

Key messages:
- **Consent Summary:** "Only sync contacts who asked to hear from you. We'll show how they opted in."
- **Warning (Low Consent):** "Less than 80% of these contacts have verified opt-in. Sending marketing may violate laws and platform rules."
- **Concierge CTA:** "We'll set this up for you — one call, we do the rest."
- **Checkbox (exact text):** "I confirm these contacts have explicitly opted in to receive marketing from my business."

---

## Support & Questions

For implementation questions, contact:
- **Technical Lead:** [Your Name]
- **Compliance Officer:** [Legal Team]
- **Product Manager:** [PM Name]

**Documentation:**
- `/docs/consent-compliance-artifacts.md` - Machine artifacts (JSON schemas, pseudocode, Make scenarios)
- `/docs/CONSENT_COMPLIANCE_IMPLEMENTATION.md` - This file

---

**Version:** 1.0.0  
**Last Updated:** 2024-12-06  
**Status:** Ready for Implementation
