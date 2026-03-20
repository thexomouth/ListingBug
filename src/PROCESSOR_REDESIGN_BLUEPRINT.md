# ListingBug Processor Stance - Detailed Redesign Blueprint

## 1. UPDATED SITEMAP

**Member Navigation:**
```
Dashboard → Search → Automations → Account
                                      ├─ Profile
                                      ├─ Usage
                                      ├─ Billing
                                      ├─ API
                                      └─ Compliance (NEW)
```

**Automation Wizard Flow:**
```
Step 1: Connect Destination → Step 2: Map Fields → Step 3: Preview & Test → Step 4: Activate
```

**Integration Setup Flow:**
```
Select Integration → [First-time: DPA Checkbox] → Configure Credentials → Test Connection → Save
```

---

## 2. COMPONENT CHANGES & API BINDINGS

### **CreateAutomationModal.tsx** (Major Refactor)

**Remove:**
- Line 13: Step 3 "Consent Check" (entire step deleted)
- Line 51-52: Imports for ConsentProvenancePanel, PreSyncMarketingModal
- Line 68: `riskTier` property from Integration interface
- Line 80-81: `confidence` property from FieldMapping interface
- Line 101: `tierBConfirmation` state
- Lines 7-8: API endpoints `GET /api/consent/provenance`, `POST /api/consent/validate`
- Line 6: `POST /api/ledger/events` (owner confirmation logging)

**Update:**
- Step 1: Add disclaimer text (see UX Copy Pack #1)
- Step 2: Replace "Confidence: 95%" → "Suggested mapping" label
- Step 3 (formerly 4): Rename "Preview" to "Preview & Test", add "Send test" button
- Step 4 (formerly 5): Rename "Approve" to "Activate", change button label "Approve & Activate" → "Activate Automation"

**New Fields:**
```typescript
// Step 1 - Connect Destination
disclaimer_accepted: boolean  // Inline checkbox
compliance_link: string       // "Account > Compliance"

// Step 2 - Map Fields  
mapping_label: "Suggested" | "Custom"  // Remove confidence numbers

// Step 4 - Activate
automation_status: "active" | "paused"  // Simple toggle
```

**API Changes:**
- **KEEP:** `POST /api/automations` (create automation)
- **REMOVE:** `POST /api/ledger/events`, `GET /api/consent/provenance`, `POST /api/consent/validate`

---

### **IntegrationConnectionModal.tsx** (Minor Update)

**Add (First-Time Only):**
```typescript
// New state
const [dpaAccepted, setDpaAccepted] = useState(false);

// Check if user has accepted DPA
useEffect(() => {
  const accepted = localStorage.getItem('listingbug_dpa_accepted');
  if (accepted) setDpaAccepted(true);
}, []);

// Render DPA checkbox before OAuth flow
{!dpaAccepted && (
  <div className="mb-4 p-3 bg-gray-50 rounded">
    <label className="flex gap-2 text-sm">
      <input type="checkbox" onChange={(e) => setDpaAccepted(e.target.checked)} />
      I accept the <a href="/dpa.pdf" className="underline">Data Processing Agreement</a>
    </label>
  </div>
)}
```

**Tooltip for Marketing Integrations:**
Add to Mailchimp, ActiveCampaign, SendGrid cards:
```
ⓘ Ensure contacts have opted in per applicable laws. [Guidelines →]
```

---

### **AccountPage.tsx** (New Tab)

**Add Compliance Tab:**
```typescript
<TabsTrigger value="compliance">Compliance</TabsTrigger>

<TabsContent value="compliance">
  <CompliancePage />  // New component
</TabsContent>
```

**CompliancePage.tsx** (New Component):
```typescript
// Sections:
1. DPA Acceptance
   - Download link: /static/dpa.pdf
   - Acceptance timestamp display
   
2. Subprocessor Disclosure
   - Table: Service | Purpose | Location
   - Example: Google Cloud | Data Storage | US
   
3. Audit Log Export
   - Button: "Download Automation Activity (CSV)"
   - API: GET /api/audit/automations
   
4. Suppression List Management (Optional)
   - Upload suppression list
   - API: POST /api/suppression/upload
   
5. Compliance Resources
   - Links: CAN-SPAM guide, GDPR overview, CASL basics
```

---

## 3. DEVELOPER MIGRATION GUIDE

**Deprecated APIs:**
```
❌ GET /api/consent/provenance      → Remove calls from CreateAutomationModal
❌ POST /api/consent/validate        → Remove validation step
❌ POST /api/ledger/events           → Remove owner confirmation logging
```

**New APIs:**
```
✅ GET /api/audit/automations        → Returns CSV of automation activity
✅ POST /api/suppression/upload      → Upload suppression list (optional)
✅ GET /api/compliance/dpa-status    → Check if user accepted DPA
```

**Migration Steps:**
1. Remove consent components: `ConsentProvenancePanel.tsx`, `PreSyncMarketingModal.tsx`
2. Update CreateAutomationModal: delete Step 3, remove riskTier/confidence
3. Add CompliancePage component to Account section
4. Update IntegrationConnectionModal: add DPA checkbox logic
5. Archive `docs/CONSENT_COMPLIANCE_IMPLEMENTATION.md`

---

## 4. UX COPY PACK

**#1: Automation Wizard Step 1 Disclaimer**
```
"ListingBug processes data on your behalf. You are responsible for compliance with 
applicable marketing laws. View compliance resources in Account > Compliance."
[Learn More →]
```

**#2: Field Mapping Label**
```
"Suggested mapping" (gray badge)  // Replaces "Confidence: 95%"
```

**#3: Integration Setup Tooltip (Marketing)**
```
"ⓘ Ensure contacts have opted in per CAN-SPAM, GDPR, and CASL. View guidelines"
```

**#4: DPA Checkbox (First Integration)**
```
"☐ I accept the Data Processing Agreement and acknowledge ListingBug acts as a 
data processor. [View DPA]"
```

**#5: Activate Button**
```
"Activate Automation" (replaces "Approve & Activate")
```

---

## 5. ACCEPTANCE CRITERIA

**Must Pass:**
- [ ] Automation creation completes in <2 minutes
- [ ] Zero blocking consent prompts during wizard
- [ ] DPA checkbox appears only on first integration connection
- [ ] Compliance tab accessible from Account section
- [ ] Audit log exports successfully as CSV
- [ ] "Suggested mapping" labels replace confidence scores
- [ ] All 17 integrations connect without risk tier warnings
- [ ] Wizard has exactly 4 steps (Connect, Map, Preview, Activate)
- [ ] No API calls to deprecated consent endpoints
- [ ] Disclaimer visible in Step 1, non-blocking

**Performance:**
- Wizard load time: <1s
- Field mapping auto-suggest: <500ms
- Test send response: <3s
