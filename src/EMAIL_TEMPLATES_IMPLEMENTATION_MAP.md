# Email Templates Implementation Map

**Last Updated:** March 20, 2026  
**Status:** 🔄 Ready for Backend Implementation  
**All email addresses unified to:** `support@thelistingbug.com` with optional aliases for Phase 2

---

## 📋 Implementation Quick Reference

| Category | Subject Prefix | SLA | Team | Priority | Template |
|----------|---|---|---|---|---|
| General Support | None / "General" | 24h | General Support | Medium | ✅ Ready |
| **Billing** | "Billing Support" | 2-4h | Finance | **HIGH** | ✅ Ready |
| **Integrations** | "Integration Request" | 24h | Platform | **HIGH** | ✅ Ready |
| **Privacy/GDPR** | "Privacy Rights Request" | 10 days | Legal | **CRITICAL** | ✅ Ready |
| Sales/Enterprise | "Sales Inquiry" | 2-4h | Sales | Medium | ✅ Ready |
| Technical Support | "Technical Support" | 2-4h | Engineering | **HIGH** | ✅ Ready |

---

## 🎯 Frontend Components Where Email Templates Are Referenced

### 1. **Contact & Support Pages** (User-Facing Email Links)

#### File: `src/components/ContactSupportPage.tsx`
- **Status**: ✅ Updated to support@thelistingbug.com
- **Email Links Present**: YES
- **Subjects Used**:
  - General support (no subject)
  - Billing Support
  - Integration Request
  - Technical Support
- **Action Needed**: Verify all `mailto:` links use correct subjects per routing table
- **Template Categories Needed**:
  - ⚙️ Generic response to all incoming support emails
  - 💰 Billing-specific auto-reply
  - 🔌 Integration-specific auto-reply
  - 🛠️ Technical-specific auto-reply

#### File: `src/components/ContactPage.tsx`
- **Status**: ✅ Updated domain migration
- **Email Links Present**: YES
- **Subject Lines**: Check if subjects are included
- **Action Needed**: Confirm email template mapping for contact form submissions
- **Template**: General support email template with form data

#### File: `src/components/PrivacyPolicyPage.tsx`
- **Status**: ✅ Updated domain
- **Email Links Present**: YES (Privacy Rights link)
- **Subject Required**: "Privacy Rights Request"
- **Action Needed**: ⚠️ **CRITICAL** - Ensure GDPR template is configured
- **Template Categories Needed**:
  - 📋 Privacy Rights Request acknowledgment (immediate, <1 hour)
  - 📊 GDPR data export confirmation (10-day legal deadline)
  - 🔐 Data deletion confirmation (10-day legal deadline)

#### File: `src/components/TermsOfServicePage.tsx`
- **Status**: ✅ Updated domain
- **Email Links Present**: YES
- **Subject**: "Privacy Rights Request" (likely)
- **Action Needed**: Map to Privacy Rights template
- **Template**: Privacy request handler template

#### File: `src/components/Footer.tsx`
- **Status**: ✅ Updated domain (support@thelistingbug.com)
- **Email Links Present**: YES (multiple footer support links)
- **Subjects**: Likely no subject on general support link
- **Action Needed**: Add appropriate subjects to differentiate link types
- **Templates Needed**:
  - General support response
  - Sales inquiry response (if separate CTA)

#### File: `src/components/HomePage.tsx`
- **Status**: ⚠️ Likely contains contact forms
- **Email Links Present**: YES
- **CTAs**: "Contact Sales", "Get Support", FAQ email links
- **Action Needed**: Map each CTA to correct email template
- **Template Categories Needed**:
  - 🎯 Sales inquiry auto-reply (with demo scheduling info)
  - 💬 General support auto-reply
  - 📞 Contact form submission handler

#### File: `src/components/APIDocumentationPage.tsx`
- **Status**: ⚠️ Check for technical support email
- **Email Links Present**: Likely YES (for "Report Bug", "Request Feature")
- **Subject Required**: "Technical Support"
- **Action Needed**: Ensure technical template is mapped
- **Template**: Technical support with issue categorization

#### File: `src/components/BillingPage.tsx`
- **Status**: ⚠️ Check for billing contact options
- **Email Links Present**: Likely YES (for "Billing Support", "Invoice Issues")
- **Subject Required**: "Billing Support"
- **Action Needed**: **HIGH PRIORITY** - Ensure billing template configured
- **Template Categories Needed**:
  - 💳 Invoice/payment issue auto-reply
  - 📊 Billing inquiry auto-reply with account reference
  - ⚖️ Billing dispute handler

#### File: `src/components/APISetupPage.tsx`
- **Status**: ⚠️ Check for integration support email
- **Email Links Present**: YES (for setup help, authentication issues)
- **Subject Required**: "Integration Request"
- **Action Needed**: Map to integration template
- **Template**: Integration setup assistant template

---

## 🔧 Backend Implementation Checklist

### Email Service Configuration
- [ ] Email service provider selected (SendGrid, Mailgun, Postmark, AWS SES)
- [ ] `support@thelistingbug.com` inbox created and monitored
- [ ] Reply-to address configured correctly
- [ ] DKIM/SPF/DMARC records configured
- [ ] Bounce handling configured

### Email Template System
- [ ] Template engine selected (Handlebars, Liquid, custom)
- [ ] EmailTemplate model created with fields:
  - `templateId` (category identifier)
  - `subject_prefix` (for filtering)
  - `html_template` (HTML version)
  - `text_template` (plain text fallback)
  - `sla_hours` (for ticket tracking)
  - `assigned_team` (for routing)

### Email Routing Logic Implementation
- [ ] `emailRouter.ts` module created
- [ ] Subject line parsing implemented
- [ ] Team assignment logic (routing rules)
- [ ] SLA tracking enabled
- [ ] Fallback handling (unknown subjects → General Support)

### Email Content Templates

#### 1. Auto-Reply Template (Immediate - Sent to customers)
```
✅ READY - Created in EMAIL_TEMPLATES_CONFIGURATION.md
- Includes ticket confirmation number
- Includes expected response time
- Includes help center link
- Includes alternative contact methods
```

#### 2. Billing Auto-Reply Template
```
✅ READY - Created in EMAIL_TEMPLATES_CONFIGURATION.md
- Includes account reference
- Includes billing question FAQ
- Includes common payment methods
- 2-4 hour SLA stated
```

#### 3. Integration Auto-Reply Template
```
✅ READY - Created in EMAIL_TEMPLATES_CONFIGURATION.md
- Includes API documentation link
- Includes common integration issues
- Includes authentication troubleshooting
- 24-hour SLA stated
```

#### 4. Privacy Rights Auto-Reply Template
```
✅ READY - Created in EMAIL_TEMPLATES_CONFIGURATION.md
- Includes legal compliance notice
- Includes 10-day deadline
- Includes required user verification
- Includes request tracking number
```

#### 5. Sales Auto-Reply Template
```
✅ READY - Created in EMAIL_TEMPLATES_CONFIGURATION.md
- Includes demo scheduling link
- Includes pricing information link
- Includes case studies
- 2-4 hour SLA stated
```

#### 6. Technical Support Auto-Reply Template
```
✅ READY - Created in EMAIL_TEMPLATES_CONFIGURATION.md
- Includes error documentation
- Includes troubleshooting steps
- Includes bug report form link
- 2-4 hour SLA stated
```

### Integration with Forms & Features

#### Contact Form Submission Handler
**File**: `src/components/ContactPage.tsx` / Backend API  
**Action**: When form submitted → Send email to support@  
**Template**: General support + auto-reply  
**Fields to Include in Email**:
- User name
- User email (for reply)
- Subject (from form)
- Message content
- Timestamp
- Browser/device info (optional)

#### Billing Page Contact Options
**File**: `src/components/BillingPage.tsx` / Backend  
**Action**: Billing-related inquiries → Route to billing template  
**Template**: Billing auto-reply  
**Context to Include**:
- Current plan
- Account number
- Recent invoice reference (if applicable)

#### Integration Setup Issues
**File**: `src/components/APISetupPage.tsx` / Backend  
**Action**: Integration errors → Route to integration handler  
**Template**: Integration auto-reply  
**Context to Include**:
- API endpoint attempted
- Error code/message
- Integration platform (Zapier, Make, etc.)
- Last successful sync (if applicable)

#### Privacy/GDPR Requests
**File**: `src/components/PrivacyPolicyPage.tsx` / Backend  
**Action**: Privacy link → Route to privacy handler  
**Template**: Privacy Rights auto-reply (CRITICAL FOR COMPLIANCE)  
**Context to Include**:
- Request type (access, deletion, portability, etc.)
- User email verification
- Legal tracking number
- 10-day deadline prominently stated

---

## 📊 Email Template Status Dashboard

### Auto-Reply Templates Ready for Implementation
| Category | Template Ready | Subject Pattern | SLA | Status |
|----------|---|---|---|---|
| General Support | ✅ YES | (none) | 24h | 📋 Ready to Deploy |
| Billing | ✅ YES | "Billing Support" | 2-4h | 📋 Ready to Deploy |
| Integrations | ✅ YES | "Integration Request" | 24h | 📋 Ready to Deploy |
| Privacy/GDPR | ✅ YES | "Privacy Rights Request" | 10 days | 🔴 **CRITICAL** |
| Sales | ✅ YES | "Sales Inquiry" | 2-4h | 📋 Ready to Deploy |
| Technical | ✅ YES | "Technical Support" | 2-4h | 📋 Ready to Deploy |

### Implementation Priority

🔴 **CRITICAL (Priority 1 - Legal/Compliance)**:
- Privacy/GDPR email handler (10-day legal requirement)
- Unsubscribe/consent tracking if applicable

🟠 **HIGH (Priority 2 - Revenue)**:
- Billing auto-reply (invoice/payment issues)
- Sales inquiry auto-reply (lead generation)

🟡 **MEDIUM (Priority 3 - Operations)**:
- Technical support auto-reply
- General support auto-reply
- Integration support auto-reply

---

## 🚀 Deployment Steps

### Phase 1: Foundation (Week 1)
1. [ ] Select email service provider
2. [ ] Create support@thelistingbug.com inbox
3. [ ] Implement email routing module
4. [ ] Deploy auto-reply template system
5. [ ] Test with internal emails

### Phase 2: Templates (Week 2)
1. [ ] Deploy all 6 auto-reply templates
2. [ ] Set up billing template handler
3. [ ] Set up privacy/GDPR template handler
4. [ ] Configure SLA tracking

### Phase 3: Integration (Week 3)
1. [ ] Connect contact forms to email system
2. [ ] Test all email workflows
3. [ ] Verify alias forwarding (if using Phase 2)
4. [ ] Monitor for bounces/errors

### Phase 4: Optimization (Week 4+)
1. [ ] Add analytics/tracking
2. [ ] Implement response time monitoring
3. [ ] Create team dashboards
4. [ ] Add optional aliases if needed

---

## 🔗 Related Documentation

- 📄 `EMAIL_TEMPLATES_CONFIGURATION.md` - Complete email templates & content
- 🔧 `BACKEND_INTEGRATION.md` - Backend API requirements
- 📝 `CONSENT_LEDGER_SCHEMA.md` - Privacy/consent tracking schema

---

## 📞 Quick Email Reference

```
Customer Support: support@thelistingbug.com

Subject Lines for Routing:
- (no subject) → General Support (24h)
- "Billing Support" → Billing Team (2-4h)
- "Integration Request" → Integration Team (24h)
- "Privacy Rights Request" → Legal (10 days)
- "Sales Inquiry" → Sales Team (2-4h)
- "Technical Support" → Engineering (2-4h)

Future Aliases (Phase 2):
- billing@thelistingbug.com
- integrations@thelistingbug.com
- privacy@thelistingbug.com
- sales@thelistingbug.com
- technical@thelistingbug.com
```

---

**Next Steps**: 
1. Review this map with backend team
2. Prioritize Privacy/GDPR handler (compliance requirement)
3. Begin Phase 1 implementation
4. Start with general auto-reply, then add specialized templates
