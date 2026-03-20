# 📦 Figma Handoff Package - Consent System

## Overview
Complete package for Figma → Dev handoff with acceptance criteria, schemas, and microcopy.

---

## 📄 Files Created

### **1. Acceptance Criteria (3 Versions)**

#### **Full Version** - `/ACCEPTANCE_CRITERIA_FIGMA.txt`
- **Use for:** Complete project documentation, Figma page notes
- **Contains:** All 10 sections with detailed acceptance criteria
- **Format:** Structured with checkboxes, field definitions, API specs
- **Size:** ~600 lines
- **Best for:** Project leads, comprehensive reference

#### **Short Version** - `/ACCEPTANCE_CRITERIA_SHORT.txt`
- **Use for:** Quick reference, team handoff documents
- **Contains:** Condensed acceptance criteria with key points
- **Format:** Bullet points with essential details
- **Size:** ~150 lines
- **Best for:** Sprint planning, team meetings

#### **Quick Reference** - `/QUICK_FIGMA_NOTE.txt`
- **Use for:** Individual Figma component annotations
- **Contains:** Ultra-condensed schema + microcopy + behaviors
- **Format:** Single-block text, easy copy/paste
- **Size:** ~50 lines
- **Best for:** Attaching to Figma frames/components

---

### **2. Developer Schema Documentation**

#### **Complete Schema** - `/CONSENT_LEDGER_SCHEMA.md`
- **Use for:** Backend development, API implementation
- **Contains:**
  - JSON schema with all field definitions
  - TypeScript interfaces
  - 4 complete example records
  - All API endpoint documentation with request/response
  - Validation rules
  - SQL database schema
  - Usage examples
- **Best for:** Backend devs, full-stack devs

#### **Figma Dev Notes** - `/FIGMA_DEV_NOTES.txt`
- **Use for:** Adding to Figma as dev mode notes
- **Contains:**
  - Core schema in copy/paste format
  - Field values and validation rules
  - API endpoints with examples
  - TypeScript interfaces
  - Usage examples
- **Best for:** Designers adding dev notes to Figma

---

### **3. Microcopy Resources**

#### **Microcopy Pack (Markdown)** - `/MICROCOPY_PACK.md`
- **Use for:** Copywriting reference, content reviews
- **Contains:** 50+ microcopy snippets organized by category
- **Format:** Markdown with headers and categories
- **Best for:** Writers, designers, product managers

#### **Interactive Microcopy Browser** - `/components/ConsentMicrocopyPack.tsx`
- **Use for:** In-app reference, click-to-copy functionality
- **Route:** `/microcopy-pack`
- **Contains:** Interactive UI with toast notifications on copy
- **Best for:** Developers, designers working in-app

---

### **4. Integration Guides**

#### **Component Integration** - `/CONSENT_COMPONENT_INTEGRATION.md`
- **Use for:** Understanding where components are used
- **Contains:**
  - Integration map (where each component lives)
  - Trigger points (when components appear)
  - Complete user flow diagrams
  - API call sequences
  - Test scenarios
- **Best for:** Frontend devs, QA engineers

#### **Complete Summary** - `/COMPLETE_INTEGRATION_SUMMARY.md`
- **Use for:** High-level project overview
- **Contains:**
  - All deliverables summary
  - Integration points
  - User flow walkthrough
  - Access instructions
  - Verification checklist
- **Best for:** Product managers, stakeholders

---

## 🎯 Quick Start Guide

### **For Designers (Adding Figma Notes)**

1. **Copy Schema to Figma:**
   - Open `/QUICK_FIGMA_NOTE.txt`
   - Copy entire contents
   - Paste into Figma component note or page note

2. **Add to Specific Components:**
   - **ConsentProvenancePanel:** Add full schema + API endpoints
   - **PreSyncMarketingModal:** Add schema + microcopy lines 4-6
   - **Field Mappings:** Add individual field definitions

3. **Reference Full Docs:**
   - Link to `/FIGMA_DEV_NOTES.txt` in Figma page description
   - Share `/ACCEPTANCE_CRITERIA_SHORT.txt` in project brief

---

### **For Developers (Implementation)**

1. **Read Integration Guide First:**
   - Start with `/CONSENT_COMPONENT_INTEGRATION.md`
   - Understand where components are integrated
   - Review complete user flow

2. **Use Schema for Backend:**
   - Reference `/CONSENT_LEDGER_SCHEMA.md`
   - Implement TypeScript interfaces
   - Build API endpoints with documented request/response

3. **Verify Microcopy:**
   - Check `/MICROCOPY_PACK.md` for exact text
   - Browse `/microcopy-pack` in app for click-to-copy

4. **Test Against Acceptance Criteria:**
   - Use `/ACCEPTANCE_CRITERIA_FIGMA.txt` as checklist
   - Test all 10 scenarios
   - Verify all checkboxes

---

### **For Product Managers (Handoff)**

1. **Share Complete Package:**
   - `/COMPLETE_INTEGRATION_SUMMARY.md` - Overview
   - `/ACCEPTANCE_CRITERIA_SHORT.txt` - Requirements
   - `/CONSENT_COMPONENT_INTEGRATION.md` - Technical details

2. **Review Acceptance Criteria:**
   - Walk through `/ACCEPTANCE_CRITERIA_FIGMA.txt`
   - Ensure all stakeholders understand requirements
   - Get sign-offs (section 10)

3. **Plan Sprints:**
   - Use acceptance criteria sections as sprint goals
   - Section 1-2: Sprint 1 (Core components)
   - Section 3-4: Sprint 2 (Ledger & pushes)
   - Section 6: Sprint 3 (Testing & verification)

---

## 📋 Acceptance Criteria Summary

### **✓ Core Requirements**

1. **ConsentProvenancePanel**
   - Interactive with per-source actions and expandable sample rows
   - Badge menus, per-row actions, concierge CTA
   - API: `GET /api/consent/provenance`, `POST /api/ledger/events`

2. **PreSyncMarketingModal**
   - Requires explicit owner checkbox and choice between marking or sending
   - Two options: (1) Mark as opted in, (2) Send confirmations
   - Blocking logic for consent < 80%
   - API: `POST /api/consent/mark-opted-in`, `POST /api/campaigns/confirmation`

3. **ConsentLedgerTable**
   - Export and row details bound to ledger endpoints
   - Filters, search, pagination, CSV export
   - API: `GET /api/ledger/records`, `GET /api/ledger/export`

4. **RecentPushesPanel**
   - Shows push events and supports rollback
   - Rollback enabled within 24 hours
   - API: `GET /api/pushes/recent`, `POST /api/pushes/{id}/rollback`

5. **Component Annotations**
   - All components annotated with exact field names and API endpoints
   - Schema references in dev notes
   - Idempotency keys in all POST requests

---

## 🔑 The 6 Required Microcopy Lines

**These MUST match exactly in all components:**

1. "Only sync contacts who asked to hear from you. Choose how to confirm opt-in for each source."

2. "Provenance shows where the contact came from and whether they already confirmed permission. This protects you from legal issues and ensures compliance with CAN-SPAM, GDPR, and CASL."

3. "Less than 80% of these contacts have verified opt-in. Sending marketing may violate laws and platform rules."

4. "Confirm Marketing Setup"

5. "Only send marketing to contacts who asked to hear from you."

6. "Confirm contacts that have explicitly opted in to receive marketing."

**Bonus:** "Need help? We'll set this up for you — one call, we do the rest."

---

## 📊 Core Data Schema

```json
{
  "contact_id": "string",
  "email": "string",
  "phone": "string",
  "provenance_source": "Form" | "Phone" | "In-person" | "Imported",
  "provenance_method": "string",
  "provenance_timestamp": "ISO8601",
  "consent_flag": boolean,
  "consent_method": "checkbox" | "verbal" | "email_confirmation" | "owner_confirmation",
  "consent_timestamp": "ISO8601",
  "consent_ip": "string",
  "owner_confirmation": boolean,
  "owner_confirmation_reason": "string (max 200 chars)",
  "suppression_flag": boolean
}
```

**Conditional Fields:**
- `consent_method` → required if `consent_flag = true`
- `consent_timestamp` → required if `consent_flag = true`
- `owner_confirmation_reason` → required if `owner_confirmation = true`

---

## 🔌 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/consent/provenance` | GET | Fetch consent data for search |
| `/api/ledger/events` | POST | Log owner actions |
| `/api/consent/mark-opted-in` | POST | Mark contacts as opted in |
| `/api/campaigns/confirmation` | POST | Send opt-in confirmations |
| `/api/ledger/records` | GET | Fetch consent ledger |
| `/api/ledger/export` | GET | Export ledger to CSV |
| `/api/pushes/recent` | GET | Fetch recent push events |
| `/api/pushes/{id}` | GET | Get push details |
| `/api/pushes/{id}/rollback` | POST | Rollback a push |

**All POST requests require `idempotency_key` (UUID v4)**

---

## ✅ Verification Checklist

Use this to verify implementation:

- [ ] All components built and integrated
- [ ] All 6 microcopy lines match exactly
- [ ] Schema fields match in all components
- [ ] API endpoints implemented with documented request/response
- [ ] Idempotency keys generated for all POST requests
- [ ] Blocking logic works (consent < 80%)
- [ ] Two-option flow works in PreSyncMarketingModal
- [ ] Badge and per-row actions work
- [ ] Toast notifications display
- [ ] All 10 test scenarios pass
- [ ] Documentation reviewed by all teams
- [ ] Stakeholder sign-offs obtained

---

## 📚 File Reference Quick Links

### **Copy to Figma:**
- `/QUICK_FIGMA_NOTE.txt` - Single component note
- `/FIGMA_DEV_NOTES.txt` - Full dev notes
- `/ACCEPTANCE_CRITERIA_SHORT.txt` - Project brief

### **Implementation:**
- `/CONSENT_LEDGER_SCHEMA.md` - Backend schema
- `/CONSENT_COMPONENT_INTEGRATION.md` - Frontend integration
- `/MICROCOPY_PACK.md` - Copywriting reference

### **Project Management:**
- `/ACCEPTANCE_CRITERIA_FIGMA.txt` - Full requirements
- `/COMPLETE_INTEGRATION_SUMMARY.md` - Executive summary

### **Interactive Tools:**
- `/microcopy-pack` - Browse microcopy in app
- `/consent-panel-demo` - Demo ConsentProvenancePanel
- `/consent-modal-demo` - Demo PreSyncMarketingModal

---

## 🎉 Status

**✅ COMPLETE & READY FOR HANDOFF**

All acceptance criteria documented, schemas defined, microcopy finalized, and components integrated.

---

**Package Created:** December 6, 2024  
**Version:** 1.0  
**Maintained By:** ListingBug Engineering Team  
**Next Steps:** Design review → Dev handoff → Sprint planning
