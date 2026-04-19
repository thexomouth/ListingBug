# Custom Sender Email Addresses Implementation Plan

## Overview
Implement individual sender email addresses for each user (e.g., `mike.sandbox@listingping.com`) instead of using a shared mailbox.

## Current State (Option C)
- ✅ Shared email: `hello@listingping.com`
- ✅ Custom display names: "Mike @ Sandbox Realty"
- ⚠️ All replies go to the same shared inbox
- ⚠️ Users cannot have unique sender identities

## Goal State (Option A)
- ✅ Individual emails: `mike.sandbox@listingping.com`
- ✅ Custom display names: "Mike @ Sandbox Realty"
- ✅ Replies go to user-specific addresses
- ✅ Better email reputation per user
- ✅ More professional appearance

---

## Implementation Steps

### 1. Database Schema Updates

#### Migration: Add sender email fields to users table
```sql
-- File: supabase/migrations/027_custom_sender_emails.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS sender_name text,
  ADD COLUMN IF NOT EXISTS sender_email text,
  ADD COLUMN IF NOT EXISTS sender_email_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sender_email_generated_at timestamptz;

-- Create unique index to prevent duplicate sender emails
CREATE UNIQUE INDEX IF NOT EXISTS users_sender_email_unique_idx
  ON users (sender_email)
  WHERE sender_email IS NOT NULL;

-- Create index for lookups
CREATE INDEX IF NOT EXISTS users_sender_email_verified_idx
  ON users (sender_email_verified);
```

### 2. Email Generation Service

#### Create utility function to generate sender emails
```typescript
// File: src/lib/senderEmailGenerator.ts

export interface EmailGenerationResult {
  email: string;
  displayName: string;
  isAvailable: boolean;
}

/**
 * Generates a sender email from user's name and business
 * Format: firstname.businessname@listingping.com
 * Example: mike.sandboxrealty@listingping.com
 */
export function generateSenderEmail(
  firstName: string,
  businessName: string
): string {
  const sanitize = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, '') // Remove spaces
      .slice(0, 20); // Max 20 chars per part

  const first = sanitize(firstName);
  const business = sanitize(businessName);

  if (!first || !business) {
    throw new Error('Invalid name or business name');
  }

  return `${first}.${business}@listingping.com`;
}

/**
 * Check if sender email is available
 */
export async function checkSenderEmailAvailability(
  email: string
): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('sender_email', email)
    .maybeSingle();

  return data === null;
}

/**
 * Generate sender email with fallback for duplicates
 */
export async function generateUniqueSenderEmail(
  firstName: string,
  businessName: string,
  userId: string
): Promise<EmailGenerationResult> {
  let baseEmail = generateSenderEmail(firstName, businessName);
  let email = baseEmail;
  let attempts = 0;
  let isAvailable = false;

  // Try base email, then append numbers if taken
  while (attempts < 100) {
    isAvailable = await checkSenderEmailAvailability(email);
    if (isAvailable) break;

    attempts++;
    email = baseEmail.replace('@', `${attempts}@`);
  }

  if (!isAvailable) {
    // Fallback to UUID-based email
    email = `user.${userId.split('-')[0]}@listingping.com`;
  }

  return {
    email,
    displayName: `${firstName} @ ${businessName}`,
    isAvailable: true
  };
}
```

### 3. Email Provider Configuration (CRITICAL)

#### Option A: Resend with Custom Sender Addresses

**Requirements:**
1. Verify domain ownership: `listingping.com`
2. Configure DNS records:
   ```
   TXT  @  resend._domainkey  "v=DKIM1; k=rsa; p=[YOUR_PUBLIC_KEY]"
   TXT  @  "v=spf1 include:_spf.resend.com ~all"
   ```
3. Check Resend's policy on dynamic sender addresses
4. May need to verify each sender email or use wildcard verification

**Resend API Considerations:**
- Does Resend support dynamic sender addresses?
- Is there a limit on verified senders?
- Do we need to pre-verify each email?
- What's the impact on deliverability?

**Investigation needed:**
- [ ] Contact Resend support about wildcard sender support
- [ ] Test sending from `test.user@listingping.com`
- [ ] Check Resend dashboard for sender verification requirements
- [ ] Review Resend pricing for multiple senders

#### Option B: Alternative Email Providers

If Resend doesn't support this:
- **Amazon SES**: Supports verified domain with unlimited senders
- **SendGrid**: Supports domain authentication with dynamic senders
- **Postmark**: Supports sender signatures per domain

### 4. Backend Function Updates

Update all email-sending edge functions:

#### File: `supabase/functions/send-campaign-emails/index.ts`
```typescript
// Line ~200: Update user query to include sender_email
const { data: user, error: userErr } = await supabase
  .from("users")
  .select("id, email, business_name, contact_name, sender_name, sender_email, sender_email_verified, forward_to, stripe_subscription_end, plan, mailing_address")
  .eq("id", campaign.user_id)
  .single();

// Line ~206-207: Update fromName and fromEmail logic
const fromEmail = user.sender_email_verified && user.sender_email
  ? user.sender_email
  : "hello@listingping.com";

const fromName = user.sender_name
  ? user.sender_name
  : (user.business_name ? user.business_name : (user.contact_name || "ListingBug"));

// Line ~420: Update email_queue insert to use custom sender
const { error: qErr } = await supabase.from("email_queue").insert({
  campaign_id,
  send_id: sendRecord.id,
  user_id: campaign.user_id,
  to_email: agent.email,
  from_email: fromEmail,  // NEW: Add this field
  from_name: fromName,
  reply_to: replyTo,
  subject,
  body_html: bodyHtml,
  body_text: bodyTextWithUnsub,
  scheduled_at: scheduledAt,
  stripe_period_end: stripePeriodEnd,
  plan_type: planType,
});
```

#### File: `supabase/functions/run-email-queue/index.ts`
Update to use `from_email` field from queue:
```typescript
const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${RESEND_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: `${row.from_name} <${row.from_email}>`,  // Use from_email from queue
    to: [row.to_email],
    subject: row.subject,
    html: row.body_html,
    text: row.body_text,
    reply_to: row.reply_to,
  }),
});
```

#### File: `supabase/functions/send-test-email/index.ts`
Similar updates to use custom sender email.

### 5. Database Schema for email_queue

#### Migration: Add from_email column
```sql
-- File: supabase/migrations/028_email_queue_from_email.sql

ALTER TABLE email_queue
  ADD COLUMN IF NOT EXISTS from_email text DEFAULT 'hello@listingping.com';

-- Backfill existing rows
UPDATE email_queue
SET from_email = 'hello@listingping.com'
WHERE from_email IS NULL;
```

### 6. Frontend UI Components

#### Account Settings Page: Sender Email Management
```typescript
// File: src/components/SenderEmailSettings.tsx

export function SenderEmailSettings() {
  const [senderEmail, setSenderEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // UI to:
  // - Show current sender email and verification status
  // - Generate new sender email button
  // - Preview how emails will appear
  // - Send verification email (if needed)
  // - Test send functionality
}
```

Features:
- Display current sender identity
- Show verification status badge
- Button to regenerate sender email
- Preview card showing "From: Mike @ Sandbox <mike.sandbox@listingping.com>"
- Send test email to verify it works

#### Integration into existing pages:
- **V2AccountProfile.tsx**: Add sender email section
- **V2Onboarding.tsx**: Generate sender email during onboarding
- **NewCampaign.tsx**: Show sender preview in campaign creation

### 7. Email Verification Flow

If Resend requires per-sender verification:

```typescript
// File: supabase/functions/verify-sender-email/index.ts

/**
 * Sends verification email to user's sender address
 * User clicks link to verify they own the email
 */
export async function sendSenderVerificationEmail(
  userId: string,
  senderEmail: string
) {
  // Generate verification token
  const token = generateVerificationToken(userId);

  // Store token in database with expiry
  await supabase.from('sender_verification_tokens').insert({
    user_id: userId,
    sender_email: senderEmail,
    token,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  });

  // Send verification email
  const verifyUrl = `https://thelistingbug.com/verify-sender?token=${token}`;

  await sendEmail({
    to: senderEmail,
    subject: 'Verify your sender email',
    body: `Click here to verify: ${verifyUrl}`
  });
}
```

### 8. Monitoring & Deliverability

#### Bounce Handling
- Monitor bounces for custom sender addresses
- If sender email bounces, flag for user and fall back to shared email
- Track deliverability metrics per sender

#### Reputation Management
- Monitor spam complaints per sender
- Implement automatic fallback if sender gets flagged
- Add sender reputation score to dashboard

### 9. Migration Strategy

#### Phase 1: Soft Launch (Optional)
- Generate sender emails for all existing users
- Store in database but don't use yet
- Continue using shared email

#### Phase 2: Gradual Rollout
- Enable custom sender emails for new users only
- Monitor deliverability for 1 week
- Compare metrics: open rates, spam complaints, bounces

#### Phase 3: Full Migration
- Enable for all existing users
- Provide option to opt-out (use shared email)
- Monitor and support

### 10. Testing Checklist

Before going live:
- [ ] Test email delivery from custom sender
- [ ] Verify emails don't go to spam
- [ ] Test reply-to functionality
- [ ] Verify unsubscribe links work
- [ ] Test with multiple email clients (Gmail, Outlook, Apple Mail)
- [ ] Monitor first 100 sends for issues
- [ ] Check SPF/DKIM/DMARC records
- [ ] Test bounce handling
- [ ] Verify usage tracking still works

### 11. Rollback Plan

If custom senders cause deliverability issues:
1. Add feature flag: `custom_sender_emails_enabled`
2. Update functions to check flag before using custom email
3. Can disable immediately without code changes
4. Fall back to shared email for all users

---

## Estimated Timeline

- **Research & Setup (1-2 days)**
  - Contact Resend support
  - Configure DNS records
  - Test sender verification

- **Backend Implementation (2-3 days)**
  - Database migrations
  - Update edge functions
  - Email generation service
  - Verification system

- **Frontend Implementation (2-3 days)**
  - Sender email settings UI
  - Onboarding integration
  - Preview components
  - Testing interface

- **Testing & Monitoring (1-2 weeks)**
  - Deliverability testing
  - Gradual rollout
  - Monitor metrics
  - Adjust as needed

**Total: ~2-3 weeks**

---

## Risks & Mitigations

### Risk: Poor Deliverability
**Mitigation**:
- Start with opt-in only
- Monitor bounce/spam rates closely
- Provide fallback to shared email

### Risk: Resend Limitations
**Mitigation**:
- Research before implementation
- Have alternative provider ready (SES, SendGrid)
- Design system to be provider-agnostic

### Risk: User Confusion
**Mitigation**:
- Clear UI explanations
- Preview emails before sending
- Good onboarding flow
- Support documentation

### Risk: DNS/Configuration Issues
**Mitigation**:
- Test thoroughly in staging
- Have DNS expert review setup
- Document all configuration steps
- Monitor email authentication status

---

## Success Metrics

- Sender email generation: >95% success rate
- Email deliverability: >95% (same or better than shared email)
- Spam complaints: <0.1%
- Bounce rate: <2%
- User satisfaction: Positive feedback on professional appearance
- Reply rate: Increase of 10%+ vs shared email

---

## Cost Considerations

- **Email Provider**: May have per-sender fees or volume increases
- **Development**: ~80-120 hours of engineering time
- **Testing**: Additional QA time
- **Monitoring**: Deliverability tools/services

---

## Notes

- This is a significant feature that affects core email delivery
- Thorough testing is critical before full rollout
- Have a clear rollback plan
- Monitor metrics closely during rollout
- Consider A/B testing to compare shared vs custom senders
