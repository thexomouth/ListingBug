# Consent & Provenance Microcopy Pack

**Purpose:** Short, plain English lines for tooltips, warnings, CTAs, and modal copy.  
**Usage:** Paste these exact lines into relevant Figma text fields.

---

## PRIMARY INSTRUCTIONS

### Top Instruction
```
Only sync contacts who asked to hear from you. Choose how to confirm opt-in for each source.
```

---

## TOOLTIPS & HELP TEXT

### Badge Tooltip
```
Provenance shows where the contact came from and whether they already confirmed permission.
```

### Extended Tooltip (Why This Matters)
```
Provenance shows where the contact came from and whether they confirmed permission. This protects you from legal issues and ensures compliance with CAN-SPAM, GDPR, and CASL.
```

---

## MODAL COPY

### Modal Title (Required Exact Text)
```
Confirm Marketing Setup
```

### Modal Summary (Required Bold)
```
Only send marketing to contacts who asked to hear from you.
```

### Modal Checkbox (Required Exact Text)
```
I confirm these contacts have explicitly opted in to receive marketing from my business.
```

### Alternative Checkbox Text
```
Confirm contacts that have explicitly opted in to receive marketing.
```

### Checkbox Subtext / Legal Notice
```
By checking this box, I acknowledge that sending to contacts without consent may violate CAN-SPAM, GDPR, and CASL regulations.
```

---

## WARNINGS & ALERTS

### Low Consent Warning (Required)
```
Less than 80% of these contacts have verified opt-in. Sending marketing may violate laws and platform rules.
```

### Imported Contact Warning
```
Imported contacts are not considered opted in until you confirm or they complete a confirmation step.
```

### Blocking Message (Short)
```
Cannot proceed with consent rate below 80%
```

### Blocking Message (Alternative)
```
This automation cannot proceed due to insufficient consent verification
```

---

## CTAs & ACTION BUTTONS

### Concierge CTA (Required Exact Text)
```
Need help? We'll set this up for you — one call, we do the rest.
```

### Concierge CTA (Alternative)
```
Need help with consent? We'll review and clean your list — one call, we do the rest.
```

### Concierge Description (Expanded)
```
Our concierge team can review your contact list, help you collect missing consent, and ensure compliance with email marketing regulations.
```

---

## RADIO OPTIONS

### Option 1 Label (Required)
```
Mark selected contacts as opted in now
```

### Option 1 Description
```
Use this if you have offline consent records or verbal agreements. You'll need to provide a reason.
```

### Option 2 Label (Required)
```
Send opt-in confirmation message first
```

### Option 2 Description
```
We'll send a confirmation email to contacts missing consent, asking them to verify their opt-in.
```

---

## FORM LABELS & INPUTS

### Reason Input Label
```
Reason for marking as opted in (required):
```

### Reason Input Placeholder
```
e.g., Verbal consent during phone call, signed paper forms, etc.
```

### Link Text
```
View consent ledger
```

---

## DYNAMIC SUMMARY LINES

### Top Summary Line Template
```
X contacts · Y verified opt-in (Z%) · N missing consent
```

### Top Summary Line Example
```
65 contacts · 58 verified opt-in (89%) · 7 missing consent
```

### Sample Table Footer
```
Showing first 5 of X contacts. All contacts will be validated before sync.
```

---

## PROJECTION & ESTIMATION TEXT

### Delivery Estimate
```
Estimated delivery: Within 10 minutes
```

### Opt-In Projection
```
Expected opt-in projection: ~65% response rate
```

### Confirmation Timeline
```
Your automation will start syncing after contacts confirm their opt-in (typically 24-48 hours).
```

---

## BUTTON LABELS

### Primary Button
```
Confirm & Proceed
```

### Primary Button (Option 2)
```
Send Confirmations & Proceed
```

### Expand Button
```
View Details
```

### Collapse Button
```
Hide Details
```

### Concierge Button
```
Request Concierge Review
```

---

## BADGE ACTION MENU ITEMS

### Menu Item 1
```
Review
```

### Menu Item 2
```
Mark Opted In
```

### Menu Item 3
```
Send Confirmation
```

### Menu Item 4
```
Exclude
```

---

## PANEL HEADERS

### Panel Header
```
Consent & Provenance
```

### Sample Contacts Header
```
Sample Contacts (Max 5 Rows)
```

### Detailed Breakdown Header
```
Detailed Breakdown
```

---

## QUICK REFERENCE: ALL REQUIRED EXACT TEXT

Copy these 6 lines exactly as written:

1. **Top Instruction:** Only sync contacts who asked to hear from you. Choose how to confirm opt-in for each source.

2. **Badge Tooltip:** Provenance shows where the contact came from and whether they already confirmed permission.

3. **Modal Checkbox:** I confirm these contacts have explicitly opted in to receive marketing from my business.

4. **Warning:** Less than 80% of these contacts have verified opt-in. Sending marketing may violate laws and platform rules.

5. **Imported Warning:** Imported contacts are not considered opted in until you confirm or they complete a confirmation step.

6. **Concierge CTA:** Need help? We'll set this up for you — one call, we do the rest.

---

## USAGE NOTES

- All copy is production-ready and legally reviewed
- Use exact wording for required fields (marked "Required Exact Text")
- Alternative versions provided for flexibility
- Keep formatting: bullets (·), em dashes (—), tildes (~) for approximations
- Character limits: Reason input = 200 characters max

---

**Component Reference:**
- ConsentProvenancePanel: `/components/consent/ConsentProvenancePanel.tsx`
- PreSyncMarketingModal: `/components/consent/PreSyncMarketingModal.tsx`
- Interactive microcopy browser: `/components/ConsentMicrocopyPack.tsx`
