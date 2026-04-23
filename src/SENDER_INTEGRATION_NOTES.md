# Sender Integration - Remaining Work

## Completed ✅
- Database schema for sender identity tracking (migrations 027, 028)
- SMTPSetupModal component for custom SMTP configuration
- test-smtp-connection edge function
- Sender dropdown in NewCampaign
- Per-user drip scheduling with 2-5 min randomization
- send-campaign-emails tracks sender_id and user_drip_position

## TODO - Critical

### 1. Update run-email-queue to Route Through User-Owned Senders

**Current State:**
- `run-email-queue` always sends via Resend API (shared mailbox)
- Email queue has `sender_id` column but it's not used for routing

**Required Changes:**
1. Fetch sender details when processing queue:
   ```typescript
   const { data: emails } = await supabase
     .from('email_queue')
     .select(`
       *,
       sender:integration_connections!sender_id(
         integration_id,
         credentials,
         config,
         from_email,
         from_name
       )
     `)
     .eq('status', 'pending')
     .lte('scheduled_at', now)
     .limit(50);
   ```

2. Route based on `sender.integration_id`:
   ```typescript
   for (const email of emails) {
     switch (email.sender?.integration_id) {
       case 'gmail':
         await sendViaGmail(email, email.sender);
         break;
       case 'outlook':
         await sendViaOutlook(email, email.sender);
         break;
       case 'smtp':
         await sendViaSMTP(email, email.sender);
         break;
       default:
         // Fallback to Resend shared mailbox
         await sendViaResend(email);
     }
   }
   ```

3. Create new edge functions:
   - `send-via-gmail` - Use Gmail API with OAuth tokens
   - `send-via-outlook` - Use Microsoft Graph API
   - `send-via-smtp` - Use denomailer or similar SMTP library

### 2. OAuth Token Refresh Logic

**Affected Integrations:** Gmail, Outlook, Mailchimp, HubSpot

Add refresh interceptor:
```typescript
async function getValidAccessToken(supabase, userId, integrationId) {
  const { data: conn } = await supabase
    .from('integration_connections')
    .select('credentials')
    .eq('user_id', userId)
    .eq('integration_id', integrationId)
    .single();

  const { access_token, refresh_token, expires_at } = conn.credentials;

  // Check if expired (with 60s buffer)
  if (Date.now() < expires_at - 60000) {
    return access_token;
  }

  // Refresh token
  const newCreds = await refreshOAuthToken(integrationId, refresh_token);

  // Update database
  await supabase
    .from('integration_connections')
    .update({ credentials: newCreds })
    .eq('user_id', userId)
    .eq('integration_id', integrationId);

  return newCreds.access_token;
}
```

### 3. Daily Rate Limits per Sender

**Schema Addition:**
```sql
ALTER TABLE integration_connections
  ADD COLUMN daily_send_count INT DEFAULT 0,
  ADD COLUMN daily_send_date DATE;
```

**Rate Limits:**
- Gmail: 500/day per account
- Outlook: varies by account type
- SMTP: depends on provider
- Shared mailbox: unlimited (our Resend account)

**Enforcement in run-email-queue:**
- Check sender's daily count before sending
- Increment counter after successful send
- Reset counter when date changes
- If limit reached, defer email to next day

### 4. Error Handling & Notifications

- Log send failures with sender_id for debugging
- Notify user when OAuth token refresh fails
- Notify user when daily limit reached
- Fallback to shared mailbox if user's sender fails (optional)

## Future Enhancements

- Sender health dashboard (success rate, daily usage, errors)
- Multiple senders per user with load balancing
- A/B testing different sender identities
- Sender warmup sequences for new accounts
- SPF/DKIM/DMARC validation before allowing sender

## Related Files

- `supabase/functions/run-email-queue/index.ts` - Main queue processor (NEEDS UPDATE)
- `supabase/functions/send-campaign-emails/index.ts` - Already tracks sender_id ✅
- `src/components/SMTPSetupModal.tsx` - SMTP setup UI ✅
- `src/components/v2/NewCampaign.tsx` - Sender dropdown ✅
- `supabase/migrations/027_sender_identity_fields.sql` - Schema ✅
- `supabase/migrations/028_per_user_drip_scheduling.sql` - Queue fields ✅
