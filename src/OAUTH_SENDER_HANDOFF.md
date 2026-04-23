# OAuth Sender Integration - Implementation Handoff

**Status:** Phase 1 Complete (OAuth flows), Phase 2 In Progress (Anonymous Auth), Phase 3 Pending (Send Pipeline)

---

## ✅ Phase 1: OAuth Flows (COMPLETED)

### What Was Built

**Backend (All Deployed):**
- Migration 029: OAuth-specific fields added to `integration_connections`
  - `provider_account_id`, `sending_email`, `is_primary_sender`
  - `daily_limit`, `emails_sent_today`, `last_reset_at`, `last_used_at`
  - `status` ('active', 'expired', 'revoked'), `connected_at`
- `supabase/functions/_shared/crypto.ts` - AES-256-GCM encryption for OAuth tokens
- `supabase/functions/gmail-oauth-exchange/index.ts` - Exchanges OAuth code, saves encrypted tokens
- `supabase/functions/outlook-oauth-exchange/index.ts` - Same for Outlook
- ENCRYPTION_KEY secret generated and set in Supabase

**Frontend:**
- `src/utils/gmailOAuth.ts` - Builds OAuth URLs with CSRF state
- `src/utils/outlookOAuth.ts` - Same for Outlook
- `src/components/v2/integrations/GmailCallbackPage.tsx` - Handles OAuth callback
- `src/components/v2/integrations/OutlookCallbackPage.tsx` - Handles Outlook callback
- Routes added to `App.tsx`: `/v2/integrations/{gmail,outlook}/callback`
- `V2Onboarding.tsx` step 0: Gmail/Outlook cards now functional, shows connected state

**Secrets Verified:**
- ✅ GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI
- ✅ OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET, OUTLOOK_REDIRECT_URI
- ✅ ENCRYPTION_KEY

**Commits:**
- `1980fb7c` - "feat: implement Gmail and Outlook OAuth sender integrations"

---

## 🚧 Phase 2: Anonymous Auth Onboarding (IN PROGRESS)

### Goal
Remove friction from onboarding by auto-creating anonymous accounts when users land on `/v2/onboarding`, allowing OAuth to work immediately without forcing account creation first.

### Current Problem
- Users must create account (step 5) before OAuth works (step 0)
- Creates confusing flow: click Gmail → "create account first" → jump to step 5 → create account → go back to step 0
- High friction, lots of context switches

### Proposed Solution
1. Auto-create anonymous Supabase session when `/v2/onboarding` loads
2. OAuth flows work immediately (user is authenticated)
3. Step 5 becomes "Complete Your Profile" - upgrades anonymous → permanent account
4. Gate campaign sending on email verification (not account creation)

### What's Been Done

**File:** `src/components/v2/V2Onboarding.tsx`

1. ✅ Added anonymous auth initialization in `useEffect`:
   ```typescript
   const initializeSession = async () => {
     let currentSession = (await supabase.auth.getSession()).data.session;

     if (!currentSession) {
       const { data, error } = await supabase.auth.signInAnonymously();
       if (error) {
         toast.error('Failed to initialize session');
         return;
       }
       currentSession = data.session;
     }
     return currentSession;
   };
   ```

2. ✅ Removed "create account first" redirect from OAuth handlers:
   ```typescript
   // OLD:
   if (!session) {
     toast.info('Create your account first...');
     setStep(5);
     return;
   }

   // NEW:
   if (!session) {
     toast.error('Session expired. Please refresh.');
     return;
   }
   ```

### What Still Needs to Be Done

**File:** `src/components/v2/V2Onboarding.tsx`

3. ❌ **Update Step 5 UI and Logic** - Change from "Create Account" to "Complete Your Profile"

   Current code location: Lines 1100-1200 (`renderStep5()` function)

   Changes needed:
   - Update heading: "Create your account" → "Complete your profile"
   - Update description: "You're almost there..." → "Finalize your account with email and password"
   - Update `handleSignupAndGoLive()` function (lines 427-511):
     ```typescript
     // BEFORE: Creates new account
     const { data: signupData, error: authErr } = await supabase.auth.signUp({
       email: signupEmail,
       password: signupPassword,
       options: { emailRedirectTo: `${window.location.origin}/v2/dashboard` },
     });

     // AFTER: Upgrade anonymous account
     const { data: updateData, error: authErr } = await supabase.auth.updateUser({
       email: signupEmail,
       password: signupPassword,
     });
     ```

   - Handle email verification:
     - After `updateUser()`, Supabase sends verification email
     - Check if email confirmed: `updateData.user?.email_confirmed_at`
     - If not confirmed, show verification step (already implemented)
     - Campaign creation should still happen, but sending is gated

4. ❌ **Add Email Verification Gate to Campaign Sending**

   Current code location: Lines 427-511 (`handleSignupAndGoLive()` function)

   Changes needed:
   - After campaign is created, check verification before sending:
     ```typescript
     const userId = updateData?.user?.id;

     // Create campaign (always allowed)
     const campaignId = await createCampaignRecord(userId);

     // Check if email is verified
     const { data: { user } } = await supabase.auth.getUser();

     if (user?.email_confirmed_at) {
       // Email verified - send immediately
       const sent = await sendCampaignEmails(userId, campaignId);
       setEmailsSent(sent);
     } else {
       // Email not verified - show verification prompt
       setIsVerificationStep(true);
       // Campaign exists, will send after verification via polling
     }
     ```

**File:** `src/components/v2/V2HomePage.tsx` (or wherever CTA button is)

5. ❌ **Update Home Page CTA**

   Find the "Get Started" or "Start Free Trial" button, add session check:
   ```typescript
   const handleGetStarted = async () => {
     const { data: { session } } = await supabase.auth.getSession();

     if (session && !session.user.is_anonymous) {
       // Existing user with real account
       navigate('/v2/newcampaign');
     } else {
       // New user or anonymous - start onboarding
       navigate('/v2/onboarding');
     }
   };
   ```

**File:** `src/components/SignUpPage.tsx`

6. ❌ **Update SignUpPage Post-Signup Redirect**

   After successful signup, check if first session:
   ```typescript
   const handleSignUp = async () => {
     // ... existing signup logic ...

     if (data?.user) {
       // Check if onboarding already completed
       const { data: profile } = await supabase
         .from('users')
         .select('onboarding_seen')
         .eq('id', data.user.id)
         .single();

       if (!profile?.onboarding_seen) {
         navigate('/v2/onboarding');
       } else {
         navigate('/v2/dashboard');
       }
     }
   };
   ```

### Testing Checklist

- [ ] Visit `/v2/onboarding` → Anonymous session created automatically
- [ ] Click Gmail at step 0 → OAuth works immediately (no "create account" message)
- [ ] Complete OAuth → Returns to onboarding with connected sender
- [ ] Fill steps 1-4, reach step 5
- [ ] Enter email/password → Account upgraded (not created)
- [ ] If email verification required → Shows verification UI
- [ ] Click verification link → Campaign sends automatically
- [ ] Visit homepage CTA → Existing users go to `/v2/newcampaign`
- [ ] Sign up via `/signup` → Redirects to onboarding if first session

### Edge Cases to Handle

1. **User abandons anonymous session** - Supabase auto-cleans after 60 days
2. **User already has account** - `updateUser()` with existing email should fail gracefully
3. **Multiple tabs** - Anonymous sessions are shared across tabs via localStorage

---

## 📋 Phase 3: Send Pipeline Integration (PENDING)

### Goal
Route emails through user-owned Gmail/Outlook accounts instead of shared mailbox, with token refresh and rate limiting.

### Architecture Overview

```
Campaign Created → email_queue rows inserted
                              ↓
                   run-email-queue (cron: every minute)
                              ↓
                   Fetch queue with sender join
                              ↓
                   Check daily_limit & refresh tokens
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
   sendViaGmail()      sendViaOutlook()      sendViaResend()
   (Gmail API)         (Graph API)            (Shared mailbox)
        ↓                     ↓                     ↓
   Increment counter    Increment counter     No limit
```

### Task 1: Create Gmail Send Function

**File to Create:** `supabase/functions/send-via-gmail/index.ts`

**Purpose:** Send email using Gmail API with OAuth tokens

**Implementation:**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getValidAccessToken } from '../_shared/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Gmail API refresh function
async function refreshGmailToken(refreshToken: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GMAIL_CLIENT_ID')!,
      client_secret: Deno.env.get('GMAIL_CLIENT_SECRET')!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('GMAIL_REFRESH_FAILED');
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
    // Gmail does NOT return new refresh_token
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { emailQueueId, senderId } = await req.json();

    // Fetch email queue item and sender
    const { data: email } = await supabase
      .from('email_queue')
      .select('*, sender:integration_connections!sender_id(*)')
      .eq('id', emailQueueId)
      .single();

    if (!email?.sender) {
      throw new Error('Sender not found');
    }

    // Get valid access token (auto-refreshes if needed)
    const accessToken = await getValidAccessToken(
      email.sender,
      supabase,
      refreshGmailToken
    );

    // Build RFC 2822 email message
    const message = [
      `To: ${email.to_email}`,
      `From: ${email.from_name} <${email.from_email}>`,
      `Subject: ${email.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      email.body,
    ].join('\r\n');

    // Base64url encode
    const encodedMessage = btoa(message)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send via Gmail API
    const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    if (!sendResponse.ok) {
      const error = await sendResponse.text();
      throw new Error(`Gmail API error: ${error}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('[send-via-gmail] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### Task 2: Create Outlook Send Function

**File to Create:** `supabase/functions/send-via-outlook/index.ts`

**Purpose:** Send email using Microsoft Graph API with OAuth tokens

**Implementation:**

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getValidAccessToken } from '../_shared/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Outlook API refresh function
async function refreshOutlookToken(refreshToken: string) {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('OUTLOOK_CLIENT_ID')!,
      client_secret: Deno.env.get('OUTLOOK_CLIENT_SECRET')!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('OUTLOOK_REFRESH_FAILED');
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token, // Outlook MAY return new refresh token
    expires_in: data.expires_in,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { emailQueueId, senderId } = await req.json();

    // Fetch email queue item and sender
    const { data: email } = await supabase
      .from('email_queue')
      .select('*, sender:integration_connections!sender_id(*)')
      .eq('id', emailQueueId)
      .single();

    if (!email?.sender) {
      throw new Error('Sender not found');
    }

    // Get valid access token (auto-refreshes if needed)
    const accessToken = await getValidAccessToken(
      email.sender,
      supabase,
      refreshOutlookToken
    );

    // Send via Microsoft Graph API
    const sendResponse = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject: email.subject,
          body: {
            contentType: 'HTML',
            content: email.body,
          },
          toRecipients: [
            { emailAddress: { address: email.to_email } },
          ],
          from: {
            emailAddress: {
              name: email.from_name,
              address: email.from_email,
            },
          },
        },
        saveToSentItems: true,
      }),
    });

    if (!sendResponse.ok) {
      const error = await sendResponse.text();
      throw new Error(`Graph API error: ${error}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('[send-via-outlook] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### Task 3: Update run-email-queue

**File to Modify:** `supabase/functions/run-email-queue/index.ts`

**Current Behavior:** Sends all emails via Resend (shared mailbox)

**New Behavior:** Route based on sender's `integration_id`

**Changes:**

1. **Fetch sender with queue items:**
   ```typescript
   const { data: emails } = await supabase
     .from('email_queue')
     .select(`
       *,
       sender:integration_connections!sender_id(
         id,
         integration_id,
         sending_email,
         credentials,
         daily_limit,
         emails_sent_today,
         last_reset_at,
         status
       )
     `)
     .eq('status', 'pending')
     .lte('scheduled_at', new Date().toISOString())
     .limit(50);
   ```

2. **Reset daily counter if needed:**
   ```typescript
   for (const email of emails) {
     const sender = email.sender;
     if (!sender) continue;

     // Reset counter if last_reset_at is a previous day
     const lastReset = new Date(sender.last_reset_at || 0);
     const today = new Date();

     if (lastReset.toDateString() !== today.toDateString()) {
       await supabase
         .from('integration_connections')
         .update({
           emails_sent_today: 0,
           last_reset_at: today.toISOString(),
         })
         .eq('id', sender.id);

       sender.emails_sent_today = 0;
     }

     // Check daily limit
     if (sender.emails_sent_today >= sender.daily_limit) {
       console.log(`[run-email-queue] Sender ${sender.id} over daily limit`);
       // Mark email as deferred, will retry tomorrow
       await supabase
         .from('email_queue')
         .update({
           status: 'deferred',
           scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
         })
         .eq('id', email.id);
       continue;
     }

     // Route to appropriate sender
     try {
       await sendEmail(email, sender);

       // Increment counter atomically
       await supabase.rpc('increment_sender_count', { sender_id: sender.id });

     } catch (err) {
       console.error(`[run-email-queue] Send failed:`, err);
       // Mark as failed
     }
   }
   ```

3. **Create routing function:**
   ```typescript
   async function sendEmail(email: any, sender: any) {
     switch (sender.integration_id) {
       case 'gmail':
         await supabase.functions.invoke('send-via-gmail', {
           body: { emailQueueId: email.id, senderId: sender.id },
         });
         break;

       case 'outlook':
         await supabase.functions.invoke('send-via-outlook', {
           body: { emailQueueId: email.id, senderId: sender.id },
         });
         break;

       default:
         // Fallback to Resend (shared mailbox)
         await sendViaResend(email);
     }
   }
   ```

### Task 4: Create Atomic Counter Function

**File to Create:** `supabase/migrations/030_sender_increment_function.sql`

**Purpose:** Atomically increment `emails_sent_today` to prevent race conditions

```sql
CREATE OR REPLACE FUNCTION increment_sender_count(sender_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE integration_connections
  SET
    emails_sent_today = emails_sent_today + 1,
    last_used_at = NOW()
  WHERE id = sender_id;
END;
$$ LANGUAGE plpgsql;
```

### Testing Strategy

1. **Test Gmail Sending:**
   - Connect Gmail account in onboarding
   - Create campaign
   - Check `email_queue` has `sender_id` set
   - Trigger `run-email-queue` manually
   - Verify email sent via Gmail API
   - Check `emails_sent_today` incremented

2. **Test Outlook Sending:**
   - Same as Gmail but with Outlook account

3. **Test Daily Limit:**
   - Manually set `emails_sent_today` to `daily_limit - 1`
   - Queue 2 emails
   - Run queue
   - Verify 1 sent, 1 deferred

4. **Test Token Refresh:**
   - Manually set `expires_at` to past date
   - Queue email
   - Run queue
   - Verify token refreshed before sending
   - Check database updated with new token

5. **Test Fallback:**
   - Queue email with no `sender_id`
   - Run queue
   - Verify sent via Resend (shared mailbox)

### Deployment Checklist

- [ ] Deploy `send-via-gmail` function
- [ ] Deploy `send-via-outlook` function
- [ ] Run migration 030 (increment function)
- [ ] Update `run-email-queue` function
- [ ] Test with real Gmail account (jake@thelistingbug.com)
- [ ] Monitor logs for token refresh errors
- [ ] Set up alerts for `status = 'expired'` connections

---

## 📝 Reference Information

### Database Schema

**Table:** `integration_connections`

```sql
CREATE TABLE integration_connections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  integration_id TEXT,  -- 'gmail', 'outlook', 'smtp', etc.
  provider_account_id TEXT,  -- Unique provider ID
  sending_email TEXT,  -- Email address used for sending
  display_name TEXT,
  from_email TEXT,
  from_name TEXT,
  is_sender BOOLEAN DEFAULT false,
  is_primary_sender BOOLEAN DEFAULT false,
  credentials JSONB,  -- Encrypted tokens stored here
  config JSONB,
  daily_limit INTEGER DEFAULT 500,
  emails_sent_today INTEGER DEFAULT 0,
  last_reset_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active',  -- 'active', 'expired', 'revoked'

  UNIQUE (user_id, integration_id, provider_account_id)
);
```

**Credentials Structure:**
```json
{
  "access_token_encrypted": "hex_string_iv_plus_ciphertext",
  "refresh_token_encrypted": "hex_string_iv_plus_ciphertext",
  "expires_at": 1234567890000,
  "scope": "gmail.send gmail.readonly..."
}
```

### API Endpoints

**Gmail:**
- Token exchange: `POST https://oauth2.googleapis.com/token`
- Token refresh: `POST https://oauth2.googleapis.com/token`
- Send email: `POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send`
- User info: `GET https://www.googleapis.com/oauth2/v2/userinfo`

**Outlook:**
- Token exchange: `POST https://login.microsoftonline.com/common/oauth2/v2.0/token`
- Token refresh: `POST https://login.microsoftonline.com/common/oauth2/v2.0/token`
- Send email: `POST https://graph.microsoft.com/v1.0/me/sendMail`
- User info: `GET https://graph.microsoft.com/v1.0/me`

### Rate Limits

- **Gmail:** 500 emails/day per account (quota resets midnight PT)
- **Outlook Personal:** 300 emails/day
- **Outlook Business:** 10,000 emails/day (varies by license)

### Token Expiry

- **Gmail:** Access tokens expire after 1 hour, refresh tokens don't expire
- **Outlook:** Access tokens expire after 1 hour, refresh tokens expire after 90 days of inactivity

---

## 🐛 Known Issues & Edge Cases

1. **Anonymous account cleanup** - Supabase auto-cleans after 60 days, but we could add manual cleanup
2. **Gmail test mode** - Only jake@thelistingbug.com can connect until Google verifies app
3. **Outlook refresh token expiry** - Need to warn users after 60 days of inactivity
4. **Multiple senders per user** - Currently only one sender supported, but schema allows multiple
5. **Sender health monitoring** - No UI dashboard yet for tracking send success/failure rates

---

## 📚 Related Files

**OAuth Implementation:**
- `supabase/migrations/029_oauth_sender_fields.sql`
- `supabase/functions/_shared/crypto.ts`
- `supabase/functions/gmail-oauth-exchange/index.ts`
- `supabase/functions/outlook-oauth-exchange/index.ts`
- `src/utils/gmailOAuth.ts`
- `src/utils/outlookOAuth.ts`
- `src/components/v2/integrations/GmailCallbackPage.tsx`
- `src/components/v2/integrations/OutlookCallbackPage.tsx`

**Onboarding:**
- `src/components/v2/V2Onboarding.tsx` - Main onboarding flow
- `src/components/v2/V2HomePage.tsx` - Homepage CTA
- `src/components/SignUpPage.tsx` - Signup redirect logic

**Send Pipeline:**
- `supabase/functions/run-email-queue/index.ts` - Email queue processor (needs update)
- `supabase/functions/send-campaign-emails/index.ts` - Creates queue rows
- `src/SENDER_INTEGRATION_NOTES.md` - Previous implementation notes

---

## 🚀 Quick Start for Next Agent

1. **Complete Phase 2 (Anonymous Auth):**
   ```bash
   # Edit src/components/v2/V2Onboarding.tsx
   # Update handleSignupAndGoLive() to use updateUser() instead of signUp()
   # Test at http://localhost:3000/v2/onboarding
   ```

2. **Start Phase 3 (Send Pipeline):**
   ```bash
   # Create supabase/functions/send-via-gmail/index.ts
   # Create supabase/functions/send-via-outlook/index.ts
   # Deploy both functions
   npx supabase functions deploy send-via-gmail --project-ref ynqmisrlahjberhmlviz
   npx supabase functions deploy send-via-outlook --project-ref ynqmisrlahjberhmlviz

   # Update run-email-queue
   # Deploy changes
   npx supabase functions deploy run-email-queue --project-ref ynqmisrlahjberhmlviz
   ```

3. **Test End-to-End:**
   - Sign in as jake@thelistingbug.com
   - Go to `/v2/onboarding`
   - Connect Gmail
   - Create campaign
   - Verify email sent via Gmail API (not Resend)

---

**Last Updated:** 2026-04-23
**Commit Hash:** 1980fb7c
**Agent:** Claude Sonnet 4.5
