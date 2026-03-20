# Consent & Compliance System - Machine Artifacts

## 1. JSON Consent Ledger Schema

### Complete Schema Definition

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ConsentLedgerRecord",
  "type": "object",
  "required": [
    "contact_id",
    "email",
    "provenance_source",
    "provenance_method",
    "provenance_timestamp",
    "consent_flag",
    "consent_method",
    "consent_timestamp",
    "consent_ip"
  ],
  "properties": {
    "contact_id": {
      "type": "string",
      "description": "Unique identifier for the contact",
      "pattern": "^[a-zA-Z0-9_-]+$"
    },
    "email": {
      "type": "string",
      "format": "email",
      "description": "Contact's email address"
    },
    "phone": {
      "type": "string",
      "description": "Contact's phone number (optional)",
      "pattern": "^\\+?[1-9]\\d{1,14}$"
    },
    "provenance_source": {
      "type": "string",
      "enum": ["Form", "Phone", "In-person", "Imported", "API", "Manual"],
      "description": "Where the contact originated"
    },
    "provenance_method": {
      "type": "string",
      "description": "Detailed method of acquisition (e.g., 'Website contact form', 'Trade show booth')"
    },
    "provenance_timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "ISO8601 timestamp of when contact was acquired"
    },
    "consent_flag": {
      "type": "boolean",
      "description": "Whether contact has explicitly opted in"
    },
    "consent_method": {
      "type": "string",
      "description": "How consent was obtained (e.g., 'Email opt-in checkbox', 'Phone recording')"
    },
    "consent_timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "ISO8601 timestamp of when consent was given"
    },
    "consent_ip": {
      "type": "string",
      "format": "ipv4",
      "description": "IP address from which consent was given"
    },
    "owner_confirmation": {
      "type": "boolean",
      "description": "Whether business owner has manually confirmed this contact",
      "default": false
    },
    "suppression_flag": {
      "type": "boolean",
      "description": "Whether contact has unsubscribed or bounced",
      "default": false
    },
    "suppression_date": {
      "type": "string",
      "format": "date-time",
      "description": "ISO8601 timestamp of suppression event (if applicable)"
    },
    "suppression_reason": {
      "type": "string",
      "enum": ["unsubscribe", "bounce", "complaint", "manual"],
      "description": "Reason for suppression"
    }
  }
}
```

### Example Record

```json
{
  "contact_id": "cnt_7x8y9z10",
  "email": "jane.smith@example.com",
  "phone": "+14155551234",
  "provenance_source": "Form",
  "provenance_method": "Website contact form - /landing/buyer-guide",
  "provenance_timestamp": "2024-01-15T14:32:18Z",
  "consent_flag": true,
  "consent_method": "Email opt-in checkbox: 'Yes, send me market updates'",
  "consent_timestamp": "2024-01-15T14:32:18Z",
  "consent_ip": "192.168.1.100",
  "owner_confirmation": true,
  "suppression_flag": false
}
```

### Example Record - Suppressed Contact

```json
{
  "contact_id": "cnt_abc123",
  "email": "john.doe@example.com",
  "phone": "+14155559876",
  "provenance_source": "Imported",
  "provenance_method": "CSV upload from 2023 open house list",
  "provenance_timestamp": "2023-06-10T09:15:00Z",
  "consent_flag": false,
  "consent_method": "No explicit consent recorded",
  "consent_timestamp": "2023-06-10T09:15:00Z",
  "consent_ip": "10.0.0.1",
  "owner_confirmation": false,
  "suppression_flag": true,
  "suppression_date": "2024-02-20T16:45:00Z",
  "suppression_reason": "unsubscribe"
}
```

---

## 2. PreSync Validation Pseudocode

```python
# PreSync Validation Ruleset
# Called before every automation push to marketing destinations

def validate_presync_marketing_push(
    destination_type: str,
    destination_tier: str,  # 'low', 'medium', 'high'
    contact_ids: list[str],
    owner_id: str
) -> dict:
    """
    Validates consent compliance before syncing to marketing destinations.
    
    Returns:
        {
            'approved': bool,
            'consent_rate': float,
            'suppression_count': int,
            'blocked_reason': str | None,
            'requires_owner_confirmation': bool
        }
    """
    
    # Step 1: Fetch consent records for all contacts
    consent_records = fetch_consent_records(contact_ids)
    total_count = len(consent_records)
    
    # Step 2: Calculate consent metrics
    verified_count = sum(1 for r in consent_records if r['consent_flag'] == True)
    consent_rate = (verified_count / total_count) if total_count > 0 else 0.0
    
    # Step 3: Check suppression status
    suppressed = [r for r in consent_records if r['suppression_flag'] == True]
    suppression_count = len(suppressed)
    
    # Step 4: Apply tier-based validation rules
    if destination_tier == 'high':
        # High-risk marketing destinations (Mailchimp, ActiveCampaign, etc.)
        
        # BLOCK if consent rate < 80%
        if consent_rate < 0.80:
            return {
                'approved': False,
                'consent_rate': consent_rate,
                'suppression_count': suppression_count,
                'blocked_reason': 'Consent rate below 80% threshold',
                'requires_owner_confirmation': False,
                'requires_concierge': True
            }
        
        # REQUIRE owner confirmation if consent rate 80-90%
        if consent_rate < 0.90:
            owner_confirmation = check_owner_confirmation(owner_id, contact_ids)
            if not owner_confirmation:
                return {
                    'approved': False,
                    'consent_rate': consent_rate,
                    'suppression_count': suppression_count,
                    'blocked_reason': 'Owner confirmation required',
                    'requires_owner_confirmation': True,
                    'requires_concierge': False
                }
        
        # PASS with owner confirmation
        return {
            'approved': True,
            'consent_rate': consent_rate,
            'suppression_count': suppression_count,
            'blocked_reason': None,
            'requires_owner_confirmation': True,
            'requires_concierge': False
        }
    
    elif destination_tier == 'medium':
        # Medium-risk destinations (CRMs with email capabilities)
        
        # WARN if consent rate < 90% but allow
        if consent_rate < 0.90:
            log_warning(f"Medium consent rate {consent_rate} for {destination_type}")
        
        return {
            'approved': True,
            'consent_rate': consent_rate,
            'suppression_count': suppression_count,
            'blocked_reason': None,
            'requires_owner_confirmation': False,
            'requires_concierge': False
        }
    
    else:  # destination_tier == 'low'
        # Low-risk destinations (Sheets, webhooks, data storage)
        return {
            'approved': True,
            'consent_rate': consent_rate,
            'suppression_count': suppression_count,
            'blocked_reason': None,
            'requires_owner_confirmation': False,
            'requires_concierge': False
        }
    
    # Step 5: ALWAYS block suppressed contacts
    # (Remove them from the push list regardless of tier)
    if suppression_count > 0:
        contact_ids = [
            r['contact_id'] for r in consent_records 
            if not r['suppression_flag']
        ]
        log_suppression_filter(suppression_count)


def check_owner_confirmation(owner_id: str, contact_ids: list[str]) -> bool:
    """Check if owner has explicitly confirmed these contacts."""
    confirmations = fetch_owner_confirmations(owner_id, contact_ids)
    return len(confirmations) > 0 and all(c['consent_acknowledged'] for c in confirmations)


def fetch_consent_records(contact_ids: list[str]) -> list[dict]:
    """Fetch consent ledger records from database."""
    # GET /ledger/contacts?ids={contact_ids}
    return database.query("SELECT * FROM consent_ledger WHERE contact_id IN (?)", contact_ids)


def fetch_owner_confirmations(owner_id: str, contact_ids: list[str]) -> list[dict]:
    """Fetch owner confirmation records."""
    # GET /ledger/confirmations?owner_id={owner_id}&contact_ids={contact_ids}
    return database.query(
        "SELECT * FROM owner_confirmations WHERE owner_id = ? AND contact_id IN (?)",
        owner_id, contact_ids
    )


def log_suppression_filter(count: int):
    """Log when suppressed contacts are filtered out."""
    # POST /ledger/events
    log_event({
        'event_type': 'suppression_filter',
        'count': count,
        'timestamp': current_timestamp()
    })
```

---

## 3. Make.com Scenario Blueprints

### Scenario 1: PreSyncValidator

**Purpose:** Validate consent before syncing to marketing destinations

**Trigger:** Webhook (automation execution request)

**Steps:**

```
1. Webhook Trigger
   - Method: POST
   - Path: /automation/execute
   - Payload: {
       automation_id: string,
       owner_id: string,
       destination_type: string,
       destination_tier: string,
       contact_ids: string[]
     }

2. HTTP Module: Fetch Consent Records
   - URL: {{BASE_URL}}/ledger/contacts
   - Method: GET
   - Query: ids={{contact_ids}}
   - Store as: consent_records

3. Aggregator: Calculate Consent Rate
   - Source: consent_records
   - Function: 
       total = count(consent_records)
       verified = count(consent_records where consent_flag = true)
       consent_rate = verified / total

4. Router: Risk Tier Branching
   - Route A: destination_tier == 'high'
   - Route B: destination_tier == 'medium'
   - Route C: destination_tier == 'low'

5A. [High Tier] Filter: Check Consent Threshold
   - Condition: consent_rate >= 0.80
   - If FALSE → Go to Step 6A
   - If TRUE → Go to Step 7

6A. [Blocked] HTTP Module: Notify Owner
   - URL: {{BASE_URL}}/notifications/owner
   - Method: POST
   - Body: {
       owner_id: {{owner_id}},
       message: "Automation blocked: consent rate below 80%",
       consent_rate: {{consent_rate}},
       action: "request_concierge"
     }
   - STOP execution

7. [All Routes] Filter: Remove Suppressed Contacts
   - Filter: suppression_flag != true
   - Store filtered list as: active_contacts

8. HTTP Module: Validate with Ledger API
   - URL: {{BASE_URL}}/ledger/validate
   - Method: POST
   - Body: {
       owner_id: {{owner_id}},
       destination_type: {{destination_type}},
       contact_ids: {{active_contacts}},
       consent_rate: {{consent_rate}},
       idempotency_key: {{uuid()}}
     }
   - Retry: 3 times with exponential backoff (2s, 4s, 8s)

9. Router: Validation Result
   - Route A: validation.approved == true → Go to Step 10
   - Route B: validation.approved == false → Go to Step 11

10. [Approved] HTTP Module: POST to Destination
    - URL: {{destination_webhook_url}}
    - Method: POST
    - Body: {
        contacts: {{active_contacts}},
        metadata: {
          automation_id: {{automation_id}},
          batch_id: {{uuid()}},
          timestamp: {{now()}},
          consent_validated: true
        }
      }
    - Idempotency Header: X-Idempotency-Key: {{idempotency_key}}
    - Retry: 3 times with backoff

11. HTTP Module: Log Audit Event
    - URL: {{BASE_URL}}/ledger/audit
    - Method: POST
    - Body: {
        event_id: {{uuid()}},
        owner_id: {{owner_id}},
        destination: {{destination_type}},
        batch_id: {{batch_id}},
        payload_hash: {{sha256(active_contacts)}},
        timestamp: {{now()}},
        result_status: {{result.status}},
        consent_rate: {{consent_rate}},
        contacts_sent: {{count(active_contacts)}}
      }

12. HTTP Module: Respond to Webhook
    - Status: 200
    - Body: {
        success: true,
        contacts_sent: {{count(active_contacts)}},
        consent_rate: {{consent_rate}},
        suppression_filtered: {{suppression_count}}
      }
```

**Error Handling:**
- All HTTP modules have retry logic (3 attempts, exponential backoff)
- Errors logged to POST /ledger/errors
- Owner notified on critical failures

---

### Scenario 2: SuppressionSync

**Purpose:** Sync unsubscribe/bounce events from ESPs back to consent ledger

**Trigger:** ESP Webhook (unsubscribe, bounce, complaint)

**Steps:**

```
1. Webhook Trigger (Mailchimp Example)
   - Method: POST
   - Path: /webhooks/mailchimp/events
   - Payload: {
       type: "unsubscribe" | "bounce" | "complaint",
       data: {
         email: string,
         timestamp: ISO8601,
         reason: string
       }
     }

2. Data Transformer: Normalize Event
   - Extract: email, event_type, timestamp, reason
   - Map to standard format:
       {
         email: {{data.email}},
         suppression_type: {{type}},
         suppression_timestamp: {{data.timestamp}},
         suppression_reason: {{data.reason}},
         esp_source: "mailchimp"
       }

3. HTTP Module: Find Contact by Email
   - URL: {{BASE_URL}}/ledger/contacts/by-email
   - Method: GET
   - Query: email={{email}}
   - Store as: contact

4. Filter: Contact Exists
   - Condition: contact.contact_id exists
   - If FALSE → Go to Step 9 (Skip)

5. HTTP Module: Update Suppression Flag
   - URL: {{BASE_URL}}/ledger/contacts/{{contact.contact_id}}
   - Method: PATCH
   - Body: {
       suppression_flag: true,
       suppression_date: {{suppression_timestamp}},
       suppression_reason: {{suppression_type}}
     }

6. HTTP Module: Log Suppression Event
   - URL: {{BASE_URL}}/ledger/events
   - Method: POST
   - Body: {
       event_id: {{uuid()}},
       contact_id: {{contact.contact_id}},
       event_type: "suppression",
       timestamp: {{now()}},
       source: {{esp_source}},
       metadata: {
         original_event: {{type}},
         reason: {{suppression_reason}}
       }
     }

7. Router: Propagate to Downstream Systems
   - Route A: Sync to HubSpot (if connected)
   - Route B: Sync to Salesforce (if connected)
   - Route C: Sync to Google Sheets (if configured)

7A. [HubSpot] HTTP Module: Update HubSpot Contact
    - URL: https://api.hubapi.com/contacts/v1/contact/email/{{email}}/profile
    - Method: POST
    - Body: {
        properties: [{
          property: "hs_email_optout",
          value: "true"
        }]
      }
    - Headers: Authorization: Bearer {{hubspot_token}}

7B. [Salesforce] HTTP Module: Update Salesforce Lead/Contact
    - URL: {{salesforce_instance}}/services/data/v58.0/sobjects/Contact/Email/{{email}}
    - Method: PATCH
    - Body: {
        HasOptedOutOfEmail: true,
        Email_Opt_Out_Date__c: {{suppression_timestamp}}
      }

7C. [Sheets] Google Sheets Module: Update Row
    - Spreadsheet: Consent Ledger
    - Sheet: Contacts
    - Search Column: Email
    - Search Value: {{email}}
    - Update Columns:
        Suppression_Flag: TRUE
        Suppression_Date: {{suppression_timestamp}}

8. HTTP Module: Respond to Webhook
   - Status: 200
   - Body: { success: true, contact_id: {{contact.contact_id}} }

9. [Skip] HTTP Module: Log Unknown Email
   - URL: {{BASE_URL}}/ledger/unknown-suppressions
   - Method: POST
   - Body: {
       email: {{email}},
       event_type: {{type}},
       timestamp: {{now()}}
     }
   - Status: 200
   - Body: { success: true, action: "logged" }
```

**Error Handling:**
- Retry failed updates 3 times
- Log all errors to /ledger/errors
- Continue to next downstream system even if one fails

---

### Scenario 3: OneClickApproval

**Purpose:** Execute automation with one-click approval for Tier A (low-risk) destinations

**Trigger:** Owner webhook (button click from UI)

**Steps:**

```
1. Webhook Trigger
   - Method: POST
   - Path: /automation/one-click-approve
   - Payload: {
       automation_id: string,
       owner_id: string,
       destination_type: string
     }

2. HTTP Module: Fetch Automation Details
   - URL: {{BASE_URL}}/automations/{{automation_id}}
   - Method: GET
   - Store as: automation

3. HTTP Module: Fetch Saved Search Contacts
   - URL: {{BASE_URL}}/search/execute
   - Method: POST
   - Body: {
       search_id: {{automation.search_id}},
       return_fields: ["contact_id", "email", "phone"]
     }
   - Store as: search_results

4. HTTP Module: Capture Ledger Snapshot
   - URL: {{BASE_URL}}/ledger/snapshot
   - Method: POST
   - Body: {
       automation_id: {{automation_id}},
       contact_ids: {{search_results.contact_ids}},
       timestamp: {{now()}},
       owner_id: {{owner_id}}
     }
   - Store as: snapshot
   - Purpose: Audit trail of exact state at approval time

5. Data Transformer: Generate Idempotency Key
   - Function: idempotency_key = uuid()
   - Purpose: Prevent duplicate submissions

6. Filter: Validate Destination is Tier A
   - Condition: automation.destination.tier == 'low'
   - If FALSE → Reject (should not reach here)

7. HTTP Module: POST to Destination
   - URL: {{automation.destination.webhook_url}}
   - Method: POST
   - Headers:
       X-Idempotency-Key: {{idempotency_key}}
       X-ListingBug-Automation-Id: {{automation_id}}
   - Body: {
       contacts: {{search_results.contacts}},
       metadata: {
         automation_id: {{automation_id}},
         snapshot_id: {{snapshot.id}},
         approved_by: {{owner_id}},
         timestamp: {{now()}}
       }
     }
   - Retry: 3 times with exponential backoff

8. HTTP Module: Log Audit Event
   - URL: {{BASE_URL}}/ledger/audit
   - Method: POST
   - Body: {
       event_id: {{uuid()}},
       owner_id: {{owner_id}},
       automation_id: {{automation_id}},
       destination: {{automation.destination.type}},
       batch_id: {{idempotency_key}},
       payload_hash: {{sha256(search_results.contacts)}},
       timestamp: {{now()}},
       result_status: {{result.status_code}},
       approval_method: "one_click",
       snapshot_id: {{snapshot.id}}
     }

9. Router: Success/Failure Handling
   - Route A: status_code == 200 → Success
   - Route B: status_code >= 400 → Failure

9A. [Success] HTTP Module: Update Automation Stats
    - URL: {{BASE_URL}}/automations/{{automation_id}}/stats
    - Method: POST
    - Body: {
        last_run: {{now()}},
        last_run_status: "success",
        contacts_sent: {{count(search_results.contacts)}}
      }

9B. [Failure] HTTP Module: Notify Owner of Failure
    - URL: {{BASE_URL}}/notifications/owner
    - Method: POST
    - Body: {
        owner_id: {{owner_id}},
        automation_id: {{automation_id}},
        message: "Automation failed",
        error: {{result.error}}
      }

10. HTTP Module: Respond to Webhook
    - Status: 200
    - Body: {
        success: {{result.status_code == 200}},
        batch_id: {{idempotency_key}},
        contacts_sent: {{count(search_results.contacts)}},
        snapshot_id: {{snapshot.id}}
      }
```

**Error Handling:**
- Idempotency prevents duplicate sends
- Snapshot preserves audit trail
- All steps logged to audit table
- Owner notified on failure

---

## 4. Microcopy Pack (Plain English)

### Consent Summary
"Only sync contacts who asked to hear from you. We'll show how they opted in."

### Tooltip - "Why this matters"
"Provenance shows where the contact came from and when they agreed. This protects you from legal issues and ensures compliance with email marketing laws (CAN-SPAM, GDPR, CASL)."

### Warning - Low Consent
"Less than 80% of these contacts have verified opt-in. Sending marketing may violate laws and platform rules."

### Concierge CTA
"We'll set this up for you — one call, we do the rest."

### Pre-Sync Confirmation Checkbox (exact text)
"I confirm these contacts have explicitly opted in to receive marketing from my business."

### Blocked Message
"This automation cannot proceed due to insufficient consent verification. Request a concierge review to get help collecting proper consent."

### Success Message
"Automation approved and running. All contacts have verified opt-in and are compliant."

### Export Ledger
"Download complete audit trail of consent and provenance for all contacts."

### Suppression Notice
"[N] contacts will be automatically excluded (previously unsubscribed or bounced)."

### One-Click Approval (Sheets)
"Approve with one click. Google Sheets syncs don't require marketing consent."

### Concierge Setup CTA (Preview Step)
"Need help? Concierge setup available — we'll handle the technical details and ensure compliance."

---

## 5. Destination Risk Tiers

### Tier A (Low Risk) - One-Click Approval
- Google Sheets
- Google Drive
- Airtable
- Notion
- Microsoft Excel
- Custom Webhooks (data storage)

**Rules:** No consent validation required; optional provenance tracking

---

### Tier B (Medium Risk) - Owner Confirmation
- HubSpot CRM
- Salesforce
- Pipedrive
- Follow Up Boss
- LionDesk

**Rules:** Consent validation recommended; owner confirmation if consent < 90%

---

### Tier C (High Risk) - Strict Validation
- Mailchimp
- ActiveCampaign
- SendGrid
- Constant Contact
- Klaviyo

**Rules:**
- BLOCK if consent < 80%
- REQUIRE owner confirmation if consent 80-90%
- REQUIRE PreSyncMarketingModal confirmation
- LOG all confirmations with owner_id, timestamp, IP

---

## 6. API Endpoint Summary

### Ledger Endpoints

| Endpoint | Method | Purpose | Payload |
|----------|--------|---------|---------|
| `/ledger/contacts` | GET | Fetch paginated contact list | Query: `page`, `limit`, `filters` |
| `/ledger/contacts/{id}` | GET | Fetch single contact with history | Path: `contact_id` |
| `/ledger/contacts` | POST | Create new contact record | Body: ConsentLedgerRecord |
| `/ledger/contacts/{id}` | PATCH | Update contact record | Body: Partial ConsentLedgerRecord |
| `/ledger/export` | POST | Export filtered contacts to CSV | Body: FilterState |
| `/ledger/events` | POST | Log consent/suppression event | Body: EventRecord |
| `/ledger/validate` | POST | Validate consent before push | Body: ValidationRequest |
| `/ledger/confirmations` | POST | Log owner confirmation | Body: ConfirmationRecord |
| `/ledger/snapshot` | POST | Create audit snapshot | Body: SnapshotRequest |
| `/ledger/audit` | POST | Log audit event | Body: AuditEvent |

### Onboarding Endpoints

| Endpoint | Method | Purpose | Payload |
|----------|--------|---------|---------|
| `/onboarding/tasks` | POST | Create concierge task | Body: TaskRequest |

---

## 7. Implementation Checklist

### Frontend Components
- [x] ConsentProvenancePanel - Auto-filled summary panel
- [x] PreSyncMarketingModal - Confirmation modal for high-risk destinations
- [x] ConsentLedgerTable - Full audit table with filters and export

### Backend APIs
- [ ] Implement all `/ledger/*` endpoints
- [ ] Implement validation logic (PreSync pseudocode)
- [ ] Implement idempotency checking
- [ ] Implement IP address capture
- [ ] Implement CSV export generator

### Make.com Scenarios
- [ ] Create PreSyncValidator scenario
- [ ] Create SuppressionSync scenario  
- [ ] Create OneClickApproval scenario
- [ ] Configure ESP webhooks (Mailchimp, etc.)
- [ ] Test retry/backoff logic

### UI Integration
- [ ] Add ConsentProvenancePanel to Create Automation wizard
- [ ] Add PreSyncMarketingModal to approval flow
- [ ] Add ConsentLedgerTable to Settings/Compliance page
- [ ] Add Concierge CTA buttons
- [ ] Add "Recent Pushes" panel with Rollback

### Testing
- [ ] Test consent validation (80% threshold)
- [ ] Test owner confirmation flow
- [ ] Test suppression filtering
- [ ] Test idempotency (duplicate prevention)
- [ ] Test concierge task creation
- [ ] Test ledger export (CSV)
- [ ] Test ESP suppression sync webhooks

---

**End of Machine Artifacts Document**
