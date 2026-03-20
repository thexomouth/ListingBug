# Consent Ledger Schema - Developer Reference

## Purpose
Exact schema for consent ledger records. Use this for component annotations, API bindings, and Figma dev notes.

---

## 📋 Core Contact Record Schema

### **JSON Schema**
```json
{
  "contact_id": "string",
  "email": "string",
  "phone": "string",
  "provenance_source": "string",
  "provenance_method": "string",
  "provenance_timestamp": "ISO8601",
  "consent_flag": true,
  "consent_method": "string",
  "consent_timestamp": "ISO8601",
  "consent_ip": "string",
  "owner_confirmation": true,
  "owner_confirmation_reason": "string",
  "suppression_flag": false
}
```

---

## 📖 Field Definitions

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `contact_id` | string | ✅ Yes | Unique identifier for contact | `"cnt_7x9k2m4p"` |
| `email` | string | ✅ Yes | Contact email address | `"jane.smith@example.com"` |
| `phone` | string | No | Contact phone number | `"+1-555-0123"` |
| `provenance_source` | string | ✅ Yes | Where contact originated | `"Form"`, `"Phone"`, `"In-person"`, `"Imported"` |
| `provenance_method` | string | ✅ Yes | How contact was captured | `"web_form"`, `"phone_call"`, `"event_signup"`, `"csv_import"` |
| `provenance_timestamp` | ISO8601 | ✅ Yes | When contact was captured | `"2024-11-15T14:23:00Z"` |
| `consent_flag` | boolean | ✅ Yes | Whether contact has opt-in | `true` or `false` |
| `consent_method` | string | Conditional | How consent was obtained | `"checkbox"`, `"verbal"`, `"email_confirmation"`, `"owner_confirmation"` |
| `consent_timestamp` | ISO8601 | Conditional | When consent was obtained | `"2024-11-15T14:23:00Z"` |
| `consent_ip` | string | No | IP address of consent action | `"192.168.1.1"` |
| `owner_confirmation` | boolean | No | Owner manually confirmed | `true` or `false` |
| `owner_confirmation_reason` | string | Conditional | Reason for manual confirmation | `"Verbal consent during phone call"` |
| `suppression_flag` | boolean | ✅ Yes | Whether contact is suppressed | `true` or `false` |

---

## 🎯 Field Rules & Validation

### **Provenance Source Values**
Must be one of:
- `"Form"` - Web form submission
- `"Phone"` - Phone call/text
- `"In-person"` - Event, meeting, or in-person signup
- `"Imported"` - CSV import or bulk upload

### **Provenance Method Values**
Examples (not exhaustive):
- `"web_form"` - Website contact form
- `"landing_page"` - Marketing landing page
- `"phone_call"` - Inbound/outbound call
- `"sms_opt_in"` - Text message opt-in
- `"event_signup"` - Event registration
- `"csv_import"` - Bulk CSV upload
- `"crm_import"` - Import from CRM
- `"manual_entry"` - Manually entered by owner

### **Consent Method Values**
Must be one of:
- `"checkbox"` - Web form checkbox
- `"verbal"` - Verbal consent (phone/in-person)
- `"email_confirmation"` - Email opt-in confirmation
- `"sms_confirmation"` - SMS opt-in confirmation
- `"owner_confirmation"` - Owner manually marked as opted in
- `"double_opt_in"` - Confirmed via follow-up email

### **Conditional Fields**
- `consent_method` - Required if `consent_flag = true`
- `consent_timestamp` - Required if `consent_flag = true`
- `owner_confirmation_reason` - Required if `owner_confirmation = true`

### **Validation Rules**
- `email` must be valid email format
- `phone` must match E.164 format (if provided)
- `provenance_timestamp` must be ISO 8601 format
- `consent_timestamp` must be ISO 8601 format
- `consent_timestamp` must be >= `provenance_timestamp`
- `owner_confirmation_reason` max length: 200 characters

---

## 📊 Complete Example Records

### **Example 1: Form Submission with Consent**
```json
{
  "contact_id": "cnt_7x9k2m4p",
  "email": "jane.smith@example.com",
  "phone": "+1-555-0123",
  "provenance_source": "Form",
  "provenance_method": "web_form",
  "provenance_timestamp": "2024-11-15T14:23:00Z",
  "consent_flag": true,
  "consent_method": "checkbox",
  "consent_timestamp": "2024-11-15T14:23:00Z",
  "consent_ip": "192.168.1.1",
  "owner_confirmation": false,
  "owner_confirmation_reason": null,
  "suppression_flag": false
}
```

### **Example 2: Phone Call without Consent**
```json
{
  "contact_id": "cnt_3m8n1k5r",
  "email": "john.doe@example.com",
  "phone": "+1-555-0456",
  "provenance_source": "Phone",
  "provenance_method": "phone_call",
  "provenance_timestamp": "2024-10-22T09:15:00Z",
  "consent_flag": false,
  "consent_method": null,
  "consent_timestamp": null,
  "consent_ip": null,
  "owner_confirmation": false,
  "owner_confirmation_reason": null,
  "suppression_flag": false
}
```

### **Example 3: Imported Contact with Owner Confirmation**
```json
{
  "contact_id": "cnt_9p2k7m1x",
  "email": "sarah.johnson@example.com",
  "phone": null,
  "provenance_source": "Imported",
  "provenance_method": "csv_import",
  "provenance_timestamp": "2024-09-05T16:45:00Z",
  "consent_flag": true,
  "consent_method": "owner_confirmation",
  "consent_timestamp": "2024-12-06T10:30:00Z",
  "consent_ip": "10.0.1.15",
  "owner_confirmation": true,
  "owner_confirmation_reason": "Verbal consent during phone call on 2024-12-05",
  "suppression_flag": false
}
```

### **Example 4: Suppressed Contact**
```json
{
  "contact_id": "cnt_5k9m3p7r",
  "email": "unsubscribe@example.com",
  "phone": "+1-555-0789",
  "provenance_source": "Form",
  "provenance_method": "web_form",
  "provenance_timestamp": "2024-08-10T11:20:00Z",
  "consent_flag": true,
  "consent_method": "checkbox",
  "consent_timestamp": "2024-08-10T11:20:00Z",
  "consent_ip": "192.168.1.50",
  "owner_confirmation": false,
  "owner_confirmation_reason": null,
  "suppression_flag": true
}
```

---

## 🔗 API Endpoints

### **1. Fetch Consent Summary**
```http
GET /api/consent/provenance?search_id={searchId}

Response:
{
  "summary": {
    "total_contacts": 100,
    "verified_opt_in_count": 85,
    "verified_opt_in_percentage": 85.0,
    "missing_consent_count": 15,
    "suppressed_count": 2
  },
  "by_source": {
    "Form": { "total": 60, "consented": 58, "consent_rate": 96.7 },
    "Phone": { "total": 25, "consented": 20, "consent_rate": 80.0 },
    "Imported": { "total": 15, "consented": 7, "consent_rate": 46.7 }
  },
  "sample_contacts": [ /* Array of contact records */ ]
}
```

### **2. Log Owner Action**
```http
POST /api/ledger/events

Request:
{
  "event_type": "owner_action",
  "action": "mark_opted_in" | "send_confirmation" | "exclude" | "review",
  "contact_ids": ["cnt_001", "cnt_002"],
  "provenance_source": "Form",
  "owner_id": "owner_123",
  "reason": "Verbal consent during phone calls",
  "timestamp": "2024-12-06T10:30:00Z",
  "ip": "192.168.1.1",
  "idempotency_key": "uuid-v4-here"
}

Response:
{
  "success": true,
  "event_id": "evt_7x9k2m4p",
  "contacts_affected": 2
}
```

### **3. Mark Contacts as Opted In**
```http
POST /api/consent/mark-opted-in

Request:
{
  "contact_ids": ["cnt_004", "cnt_005"],
  "owner_id": "owner_123",
  "reason": "Verbal consent during phone call",
  "consent_method": "owner_confirmation",
  "consent_timestamp": "2024-12-06T10:30:00Z",
  "consent_ip": "192.168.1.1",
  "idempotency_key": "uuid-v4-here"
}

Response:
{
  "success": true,
  "contacts_updated": 2,
  "ledger_event_id": "evt_3m8n1k5r"
}
```

### **4. Send Opt-In Confirmation Campaign**
```http
POST /api/campaigns/confirmation

Request:
{
  "contact_ids": ["cnt_004", "cnt_005"],
  "owner_id": "owner_123",
  "campaign_type": "opt_in_confirmation",
  "destination_name": "Mailchimp",
  "idempotency_key": "uuid-v4-here"
}

Response:
{
  "success": true,
  "campaign_id": "cmp_9p2k7m1x",
  "contacts_queued": 2,
  "estimated_delivery": "Within 10 minutes",
  "expected_response_rate": 0.65
}
```

### **5. Validate Pre-Sync**
```http
POST /api/ledger/validate

Request:
{
  "destination_type": "mailchimp",
  "consent_percentage": 85,
  "total_contacts": 100,
  "verified_count": 85,
  "owner_id": "owner_123"
}

Response:
{
  "can_proceed": true,
  "risk_level": "medium",
  "warnings": ["15 contacts missing consent"],
  "requires_owner_action": false
}
```

---

## 💾 TypeScript Interfaces

### **Contact Record Interface**
```typescript
interface ConsentRecord {
  contact_id: string;
  email: string;
  phone?: string | null;
  provenance_source: 'Form' | 'Phone' | 'In-person' | 'Imported';
  provenance_method: string;
  provenance_timestamp: string; // ISO 8601
  consent_flag: boolean;
  consent_method?: 'checkbox' | 'verbal' | 'email_confirmation' | 'sms_confirmation' | 'owner_confirmation' | 'double_opt_in' | null;
  consent_timestamp?: string | null; // ISO 8601
  consent_ip?: string | null;
  owner_confirmation?: boolean;
  owner_confirmation_reason?: string | null;
  suppression_flag: boolean;
}
```

### **Consent Summary Interface**
```typescript
interface ConsentSummary {
  total_contacts: number;
  verified_opt_in_count: number;
  verified_opt_in_percentage: number;
  missing_consent_count: number;
  suppressed_count: number;
  by_source?: {
    [source: string]: {
      total: number;
      consented: number;
      consent_rate: number;
    };
  };
}
```

### **Owner Action Event Interface**
```typescript
interface OwnerActionEvent {
  event_type: 'owner_action';
  action: 'mark_opted_in' | 'send_confirmation' | 'exclude' | 'review';
  contact_ids: string[];
  provenance_source?: string;
  owner_id: string;
  reason?: string;
  timestamp: string; // ISO 8601
  ip: string;
  idempotency_key: string;
}
```

### **Validation Result Interface**
```typescript
interface ValidationResult {
  can_proceed: boolean;
  risk_level: 'low' | 'medium' | 'high';
  warnings: string[];
  requires_owner_action: boolean;
  consent_percentage: number;
  total_contacts: number;
  verified_count: number;
  missing_count: number;
  suppressed_count: number;
}
```

---

## 📝 Database Schema (SQL Reference)

### **contacts_ledger Table**
```sql
CREATE TABLE contacts_ledger (
  contact_id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  provenance_source VARCHAR(50) NOT NULL,
  provenance_method VARCHAR(100) NOT NULL,
  provenance_timestamp TIMESTAMP NOT NULL,
  consent_flag BOOLEAN NOT NULL DEFAULT FALSE,
  consent_method VARCHAR(50),
  consent_timestamp TIMESTAMP,
  consent_ip VARCHAR(45),
  owner_confirmation BOOLEAN DEFAULT FALSE,
  owner_confirmation_reason TEXT,
  suppression_flag BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_provenance_source (provenance_source),
  INDEX idx_consent_flag (consent_flag),
  INDEX idx_suppression_flag (suppression_flag)
);
```

### **ledger_events Table**
```sql
CREATE TABLE ledger_events (
  event_id VARCHAR(50) PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  action VARCHAR(50),
  owner_id VARCHAR(50) NOT NULL,
  contact_ids JSON,
  provenance_source VARCHAR(50),
  reason TEXT,
  timestamp TIMESTAMP NOT NULL,
  ip VARCHAR(45),
  idempotency_key VARCHAR(100) UNIQUE,
  
  INDEX idx_owner_id (owner_id),
  INDEX idx_event_type (event_type),
  INDEX idx_timestamp (timestamp),
  INDEX idx_idempotency_key (idempotency_key)
);
```

---

## 🎨 Figma Dev Note Format

### **Copy/Paste for Figma Annotations**

```
📋 CONTACT RECORD SCHEMA

{
  "contact_id":"string",
  "email":"string",
  "phone":"string",
  "provenance_source":"string",
  "provenance_method":"string",
  "provenance_timestamp":"ISO8601",
  "consent_flag":true,
  "consent_method":"string",
  "consent_timestamp":"ISO8601",
  "consent_ip":"string",
  "owner_confirmation":true,
  "owner_confirmation_reason":"string",
  "suppression_flag":false
}

FIELD NOTES:
• provenance_source: "Form" | "Phone" | "In-person" | "Imported"
• consent_method: "checkbox" | "verbal" | "email_confirmation" | "owner_confirmation"
• All timestamps: ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
• owner_confirmation_reason: Max 200 chars, required if owner_confirmation=true

API ENDPOINT:
GET /api/consent/provenance?search_id={searchId}

COMPONENT BINDINGS:
• ConsentProvenancePanel.tsx
• PreSyncMarketingModal.tsx
• CreateAutomationModal.tsx (Step 3)
```

---

## 🔍 Usage in Components

### **ConsentProvenancePanel**
```tsx
// Fetch consent data
const fetchConsentData = async (searchId: string) => {
  const response = await fetch(`/api/consent/provenance?search_id=${searchId}`);
  const data = await response.json();
  
  // data.summary: ConsentSummary
  // data.sample_contacts: ConsentRecord[]
  
  return data;
};
```

### **PreSyncMarketingModal**
```tsx
// Log owner action
const logOwnerAction = async (action: string, contactIds: string[], reason?: string) => {
  const event: OwnerActionEvent = {
    event_type: 'owner_action',
    action,
    contact_ids: contactIds,
    owner_id: ownerId,
    reason,
    timestamp: new Date().toISOString(),
    ip: await getUserIP(),
    idempotency_key: crypto.randomUUID()
  };
  
  await fetch('/api/ledger/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  });
};
```

---

## ✅ Checklist for Implementation

- [ ] All fields match exact schema
- [ ] Timestamps in ISO 8601 format
- [ ] Conditional fields properly validated
- [ ] Idempotency keys generated (UUID v4)
- [ ] API endpoints match documentation
- [ ] TypeScript interfaces defined
- [ ] Error handling for missing required fields
- [ ] Console logging for debugging
- [ ] Field length limits enforced (200 chars for reason)
- [ ] Email/phone validation before save

---

**Schema Version:** 1.0  
**Last Updated:** December 6, 2024  
**Maintained By:** ListingBug Engineering Team  
**Related Components:** ConsentProvenancePanel, PreSyncMarketingModal, CreateAutomationModal
