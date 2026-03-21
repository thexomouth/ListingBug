# Email Templates & Support Routing Configuration

**Last Updated:** March 20, 2026  
**Status:** ✅ Unified Support Domain - All emails consolidated to support@thelistingbug.com

---

## Overview

All customer-facing email addresses are now consolidated under `support@thelistingbug.com` with custom email templates and routing based on subject line prefixes. This reduces domain complexity while maintaining dedicated handling for each support category.

---

## Email Domain Architecture

### Primary Support Address
- **Email**: `support@thelistingbug.com`
- **Purpose**: Single unified customer contact point
- **Routing Method**: Subject line prefixes trigger automated email template handlers
- **Status**: ✅ Active & Primary

### Optional Alias Channels (Phase 2 - Can add later for specialization)
These aliases are **OPTIONAL** and can be implemented if desired for better end-user experience and separate team inboxes:

| Alias | Purpose | Team | Forward Pattern |
|-------|---------|------|-----------------|
| `billing@thelistingbug.com` | Billing inquiries, invoices, payment issues | Billing Team | → support@ with [BILLING] prefix |
| `integrations@thelistingbug.com` | Integration setup, API issues, webhooks | Integration Team | → support@ with [INTEGRATION] prefix |
| `privacy@thelistingbug.com` | GDPR, data requests, privacy concerns | Legal/Compliance | → support@ with [PRIVACY] prefix (10-day SLA) |
| `sales@thelistingbug.com` | Enterprise inquiries, partnerships, demos | Sales Team | → support@ with [SALES] prefix |
| `technical@thelistingbug.com` | Bug reports, feature requests, technical issues | Technical Support | → support@ with [TECHNICAL] prefix |

**Alias Strategy:**
- ✅ **MVP Phase (Now)**: Use only `support@thelistingbug.com` with subject-line routing
- 🔄 **Phase 2 (Later)**: Add aliases as separate inboxes if team scales
- All aliases route through same template system
- Unified dashboard view enables all team members to reply from any inbox name

### Internal Team Address (Non-Customer Facing)
- **Email**: `team@thelistingbug.com`
- **Usage**: Internal communications, status updates, team notifications
- **Who Has Access**: Product, Design, Engineering, Management only

---

## Email Template Categories & Subject Line Routing

### 1. General Support Template
**Subject Prefix**: `[SUPPORT]` or just open text  
**Route To**: Support Team / Ticketing System  
**Use Cases**:
- General platform questions
- Feature requests
- Account issues
- How-to questions

**Email Template**:
```
From: support@thelistingbug.com
Subject: Re: Your Support Request
Priority: Standard (24-hour response SLA)

Template:
---
Hi [Name],

Thank you for reaching out to ListingBug support!

[Support agent response]

If you need further assistance, reply to this email or visit our help center at:
https://thelistingbug.com/help-center

Best regards,
The ListingBug Support Team
support@thelistingbug.com
---
```

---

### 2. Billing & Subscription Template
**Subject Prefix**: `[BILLING]` or "Billing Support" or "Billing Issue"  
**Route To**: Billing Team / Finance  
**Use Cases**:
- Invoice inquiries
- Payment issues
- Subscription changes
- Refund requests
- Plan downgrades/upgrades

**Email Template**:
```
From: support@thelistingbug.com
Subject: Re: Billing Support - [Issue Type]
Priority: High (2-4 hour response SLA)

Template:
---
Hi [Name],

Thank you for contacting our billing team.

[Billing team response with specific instructions]

**Your Account Details:**
- Current Plan: [Plan Name]
- Billing Cycle: [Next Billing Date]
- Amount: [Amount]

**Next Steps:**
[Action items or confirmation needed]

If you have other questions, reply to this email.

Best regards,
ListingBug Billing Support
support@thelistingbug.com
---
```

---

### 3. Integration Support Template
**Subject Prefix**: `[INTEGRATION]` or "Integration Request"  
**Route To**: Integrations / API Team  
**Use Cases**:
- Integration setup help
- API key issues
- OAuth connection problems
- Webhook configuration
- Integration requests for new platforms

**Email Template**:
```
From: support@thelistingbug.com
Subject: Re: Integration Request - [Service Name]
Priority: Standard (24-hour response SLA)

Template:
---
Hi [Name],

Thanks for your integration request!

**Integration Details:**
- Service: [Service Name]
- Status: [In Development / Planned / Available]
- Timeline: [If applicable]

[Specific integration setup instructions or status update]

**Resources:**
- Integration Guide: https://thelistingbug.com/docs/integrations
- API Documentation: https://docs.thelistingbug.com/api

For technical questions, feel free to reply to this email.

Best regards,
ListingBug Integrations Team
support@thelistingbug.com
---
```

---

### 4. Privacy & Data Requests Template
**Subject Prefix**: `[PRIVACY]` or "Privacy Rights Request" or "CCPA" or "GDPR"  
**Route To**: Legal / Privacy Officer  
**Use Cases**:
- GDPR data subject access requests (DSARs)
- CCPA consumer rights requests
- Child privacy concerns
- Data deletion requests
- Privacy policy questions

**Email Template**:
```
From: support@thelistingbug.com
Subject: Re: Privacy Rights Request - [Request Type]
Priority: Critical (10-day legal response SLA)

Template:
---
Hi [Name],

We received your privacy rights request and take it very seriously.

**Request Type:** [GDPR DSAr / CCPA / Data Deletion / Other]
**Request ID:** [Unique ID for tracking]
**Received Date:** [Date]
**Response Deadline:** [Legal deadline date]

[Specific handling instructions and next steps]

**Your Rights:**
- You can withdraw this request at any time by replying to this email
- You will not be charged a fee for this request
- The requested action will be completed by [deadline date]

For urgent privacy concerns, please reply immediately.

Best regards,
ListingBug Legal / Privacy Team
support@thelistingbug.com
---
```

---

### 5. Sales & Enterprise Inquiries Template
**Subject Prefix**: `[SALES]` or "Sales Inquiry"  
**Route To**: Sales Team  
**Use Cases**:
- Enterprise plan inquiries
- High-volume custom pricing
- Sales questions
- Partnership opportunities
- Pre-sales consultations

**Email Template**:
```
From: support@thelistingbug.com
Subject: Re: Sales Inquiry - [Inquiry Type]
Priority: High (2-4 hour response SLA)

Template:
---
Hi [Name],

Thanks for your interest in ListingBug!

[Sales team personalized response with relevant pricing/features]

**Let's Schedule a Demo**
We'd love to show you how ListingBug can help your team.
Schedule a 30-minute call: [Calendly Link]

**Enterprise Options:**
- Volume discounts available
- Custom integrations
- Dedicated support
- SLA guarantees

Best regards,
ListingBug Sales Team
support@thelistingbug.com
---
```

---

### 6. Technical Support Template
**Subject Prefix**: `[TECH]` or "Technical Support"  
**Route To**: Technical Support / Engineering  
**Use Cases**:
- Platform bugs / errors
- Performance issues
- Feature troubleshooting
- API errors
- Sync failures

**Email Template**:
```
From: support@thelistingbug.com
Subject: Re: Technical Support - [Error Type]
Priority: High (2-4 hour response SLA)

Template:
---
Hi [Name],

Thanks for reporting this issue. Our technical team is investigating.

**Issue Details:**
- Error Type: [Error Type]
- Status: [Investigating / Identified / Resolved]
- Ticket ID: [Support Ticket #]

[Technical troubleshooting steps or resolution]

**Debug Information Needed:**
```
Browser/OS: [Auto-collected]
Account ID: [Account Info]
Time of Issue: [Time]
Steps to Reproduce: [Steps]
```

[Specific technical guidance or resolution]

If the issue persists, please reply with:
1. Browser console errors (F12 Developer Tools)
2. Screenshot of the error
3. Your account email

Best regards,
ListingBug Technical Support
support@thelistingbug.com
---
```

---

## Backend Implementation Guide

### Email Routing Logic

```javascript
// Pseudocode for email routing system
function routeIncomingEmail(emailData) {
  const subject = emailData.subject?.toUpperCase() || '';
  const body = emailData.body || '';
  
  // Determine category based on subject line or content
  let category = 'general'; // default
  
  if (subject.includes('[BILLING]') || 
      subject.includes('BILLING') ||
      subject.includes('REFUND') ||
      subject.includes('INVOICE')) {
    category = 'billing';
  } 
  else if (subject.includes('[INTEGRATION]') || 
           subject.includes('INTEGRATION')) {
    category = 'integration';
  } 
  else if (subject.includes('[PRIVACY]') || 
           subject.includes('PRIVACY') ||
           subject.includes('GDPR') ||
           subject.includes('CCPA') ||
           subject.includes('DATA DELETE')) {
    category = 'privacy';
  } 
  else if (subject.includes('[SALES]') || 
           subject.includes('SALES') ||
           subject.includes('ENTERPRISE')) {
    category = 'sales';
  } 
  else if (subject.includes('[TECH]') || 
           subject.includes('TECHNICAL') ||
           subject.includes('BUG') ||
           subject.includes('ERROR')) {
    category = 'technical';
  }
  
  // Route to appropriate handler
  return routeToHandler(category, emailData);
}

// Handler routing
function routeToHandler(category, emailData) {
  switch(category) {
    case 'billing':
      return sendToSystem('billing-team', emailData);
    case 'integration':
      return sendToSystem('integration-team', emailData);
    case 'privacy':
      return sendToSystem('legal-privacy', emailData); // Higher SLA
    case 'sales':
      return sendToSystem('sales-team', emailData);
    case 'technical':
      return sendToSystem('technical-support', emailData);
    default:
      return sendToSystem('general-support', emailData);
  }
}
```

### Auto-Reply System

All incoming emails to support@thelistingbug.com receive an immediate auto-reply:

```
Subject: Re: [ORIGINAL_SUBJECT]

---
Thank you for contacting ListingBug!

We've received your message and a member of our team will respond shortly.

**Support Category**: [Detected Category]
**Reference #**: [Ticket ID]
**Expected Response Time**: [SLA Time]

If this is urgent, you can:
- Call us: 1-800-555-1234 (Business Hours)
- Visit Help Center: https://thelistingbug.com/help-center

Best regards,
ListingBug Support
https://thelistingbug.com
---
```

---

## Service Level Agreements (SLAs)

| Category | Priority | Response Time | Resolution Time |
|----------|----------|------------------|------------------|
| **General Support** | Standard | 24 hours | 5 business days |
| **Billing** | High | 2-4 hours | 1 business day |
| **Integration** | Standard | 24 hours | 3 business days |
| **Privacy/Legal** | Critical | 24 hours | 10 days (legal requirement) |
| **Sales** | High | 2-4 hours | 24 hours |
| **Technical** | High | 2-4 hours | 2 business days |

---

## User-Facing Email Links

### In Frontend Components

All user-facing email links now follow this format:

```
Mailto links with subject prefixes:
- General: mailto:support@thelistingbug.com (no prefix)
- Billing: mailto:support@thelistingbug.com?subject=Billing Support
- Integration: mailto:support@thelistingbug.com?subject=Integration Request
- Privacy: mailto:support@thelistingbug.com?subject=Privacy Rights Request
- Sales: mailto:support@thelistingbug.com?subject=Sales Inquiry
- Technical: mailto:support@thelistingbug.com?subject=Technical Support
```

---

## Internal Emails (team@thelistingbug.com)

Used for:
- Status updates
- Internal announcements
- Team communications
- System alerts
- System status notifications

**Not customer-facing** - never share externally

---

## Migration Checklist

- [x] Update all React components with new email addresses
- [x] Update ContactSupportPage.tsx with consolidated emails
- [x] Update domain from listingbug.com to thelistingbug.com
- [x] Create email template documentation
- [ ] Implement backend email routing logic
- [ ] Set up email template system (SendGrid, Mailgun, etc.)
- [ ] Configure auto-reply system
- [ ] Train support team on new routing system
- [ ] Update help center documentation
- [ ] Set up monitoring/analytics for email categories
- [ ] Create support team dashboard for categorized tickets

---

## Benefits of This Consolidated Approach

✅ **Single brand email** - thelistingbug.com only  
✅ **Automated routing** - No manual sorting needed  
✅ **Better SLAs** - Appropriate response times per category  
✅ **Scalability** - Easy to add new categories  
✅ **Professional** - Unified, consistent communications  
✅ **Analytics-ready** - Track support volume by category  
✅ **Customer-friendly** - One email to remember  
✅ **Cheaper** - Fewer email addresses to maintain  

---

## Contact

For questions about this routing system, contact: team@thelistingbug.com
