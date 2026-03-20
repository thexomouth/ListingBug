# ListingBug Processor Stance Redesign Plan

## 1. CURRENT SITE CONDITION

**Sitemap:**
- Non-member: Home, How It Works, Data Sets, Use Cases, Integrations, Pricing
- Member: Dashboard, Search, Automations, Billing, Settings (Profile/Usage/Billing/API)
- Automation Wizard: 5-step flow with heavy compliance gating

**Key Pain Points:**
- **Automation Wizard (CreateAutomationModal.tsx)** contains 5 steps including "Consent Check" with ConsentProvenancePanel, PreSyncMarketingModal, risk tier validation, and approval gates
- **Integration definitions** include riskTier classification (low/medium/high) corresponding to Tier A/B/C
- **Field mapping** shows confidence scores implying validation responsibility
- **Heavy legal prompts** during everyday automation creation slows SMB workflows
- **Consent compliance system** (docs/CONSENT_COMPLIANCE_IMPLEMENTATION.md) assumes data holder responsibilities with provenance tracking, validation APIs, and ledger events

**Current Automation Flow:**
Step 1: Connect Destination → Step 2: Map Fields (with confidence scores) → Step 3: Consent Check (ConsentProvenancePanel) → Step 4: Preview → Step 5: Approve (owner confirmation + event logging)

---

## 2. REDESIGN SUMMARY

**New Stance:** ListingBug is a **data processor**, not data holder. We provide conduit services; customers own compliance.

**Core Changes:**
- Remove all consent validation, risk tiers, and provenance tracking from automation flows
- Move legal/compliance elements (DPA, subprocessors, audit logs) to Account Settings
- Simplify automation wizard to 3-4 core steps
- Add lightweight compliance reminders in integration setup screens, not blocking flows
- Eliminate confidence scores, risk labels, consent panels from UI

---

## 3. AUTOMATION WIZARD CHANGES

**New Flow (3-4 Steps):**
1. **Connect Destination** - Select integration, basic config (remove risk tier badges)
2. **Map Fields** - Auto-mapping UI (remove confidence scores, keep drag-drop functionality)
3. **Preview & Test** - Sample payload review, test send option
4. **Activate** - Simple on/off toggle (remove "Approve" language and event logging)

**Removals:**
- Step 3: Consent Check (entire step deleted)
- ConsentProvenancePanel component (no longer used in wizard)
- PreSyncMarketingModal (validation modal deleted)
- riskTier property from integration definitions
- Confidence scores from field mapping
- Owner confirmation language ("approve" → "activate")
- API calls: POST /api/consent/validate, GET /api/consent/provenance, POST /api/ledger/events

**Additions:**
- Lightweight disclaimer in Step 1: "You are responsible for compliance with applicable marketing laws. [Learn more]"
- Link to Account > Compliance section for DPA/subprocessor details

---

## 4. INTEGRATION SETUP CHANGES

**Current:** Integration connections in Account > Integrations tab (IntegrationsPage shows public integrations)

**Changes Needed:**
- Add compliance tooltip/link when connecting marketing destinations (Mailchimp, ActiveCampaign): "Ensure contacts have opted in per CAN-SPAM/GDPR. [View guidelines]"
- Remove risk tier classifications from integration cards
- Add one-time DPA acceptance during first integration connection (non-blocking, checkbox + link)

---

## 5. ACCOUNT SECTION CHANGES

**New Tab: "Compliance" (Account > Compliance)**

Add section containing:
- **Data Processing Agreement (DPA):** View/download DPA, acceptance timestamp
- **Subprocessor Disclosure:** List of third-party services (Google Cloud, AWS, integration partners)
- **Audit Log Access:** Download automation activity logs (who created what, when)
- **Compliance Resources:** Links to CAN-SPAM, GDPR, CASL guidelines; best practices

**Implementation:**
- Create new tab in AccountPage.tsx
- Simple static page with document links and table of subprocessors
- Audit log = CSV export of automation creation/edit/deletion events

---

## 6. USER EXPERIENCE PRIORITIES

**Goals:**
- SMB users see automation wizard in <2 minutes, zero blocking prompts
- Legal/compliance info available but not intrusive
- One-time DPA acceptance (first integration only)
- Everyday automation edits have zero legal friction

**Simplification:**
- Remove 15+ consent-related components/modals from flows
- Reduce wizard from 5 steps to 3-4
- Replace blocking validation with passive disclaimers
- Move all legal docs/logs to dedicated Account section

---

## 7. DELIVERABLES CHECKLIST

**Code Changes:**
- [ ] Simplify CreateAutomationModal.tsx: remove Step 3, confidence scores, risk tiers
- [ ] Remove ConsentProvenancePanel, PreSyncMarketingModal from imports
- [ ] Update integration definitions: delete riskTier property
- [ ] Add Compliance tab to AccountPage.tsx
- [ ] Add DPA acceptance checkbox to IntegrationConnectionModal.tsx (first use only)
- [ ] Add lightweight disclaimer to wizard Step 1
- [ ] Remove consent validation API endpoints from documentation

**Documentation Updates:**
- [ ] Archive CONSENT_COMPLIANCE_IMPLEMENTATION.md
- [ ] Create PROCESSOR_COMPLIANCE_GUIDE.md (customer-facing)
- [ ] Update API docs to remove consent endpoints
- [ ] Add DPA document to static assets

**Testing:**
- [ ] Verify automation creation completes in <2 min
- [ ] Test all 17 integrations work without blocking prompts
- [ ] Confirm DPA appears once per account
- [ ] Validate audit log export functionality
