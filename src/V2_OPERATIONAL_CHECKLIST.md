# V2 Operational Checklist — Manual steps required

These cannot be completed by code. Work through these in parallel with frontend development.

## SendGrid — listingping.com (new account)
- [ ] Create a new separate SendGrid account for listingping.com
- [ ] Authenticate listingping.com as a sending domain — add CNAMEs to Namecheap
- [ ] Verify domain authentication after DNS propagation (~30 min)
- [ ] Generate API key and add to Supabase secrets as SENDGRID_LISTINGPING_API_KEY
- [ ] Configure Inbound Parse: set MX record for listingping.com, paste handle-sendgrid-inbound URL
- [ ] Configure Event Webhook: paste handle-sendgrid-events URL, enable open/bounce/spamreport/unsubscribe
- [ ] Enable open tracking on listingping.com sender domain

## Zoho Mail — listingping.com
- [ ] Enable IMAP at individual mailbox level for outreach@listingping.com
- [ ] Enable catch-all for listingping.com domain

## Warmbox
- [ ] Connect outreach@listingping.com to Warmbox
- [ ] Begin warming — minimum 3 weeks before sending any real campaign emails
- [ ] Monitor Warmbox dashboard daily during warm-up

## Stripe
- [ ] Create products and prices for all three plans:
      Home — $19/mo — 2,500 messages — 1 city
      Market — $49/mo — 5,000 messages — 3 cities
      Region — $99/mo — 10,000 messages — 10 cities
- [ ] Confirm stripe_period_end is stored/accessible on the user record
      (usage_logs.stripe_period_end must be populated at send time)

## Environment variables
- [ ] SENDGRID_LISTINGPING_API_KEY → Supabase secrets
- [ ] VITE_USE_V2=true → .env.local (activates V2 routing locally)
- [ ] Confirm RENTCAST_API_KEY is accessible to send-campaign-emails
- [ ] Confirm TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN accessible to send-campaign-sms

## DNS — Namecheap (listingping.com)
- [ ] Zoho MX records set and verified
- [ ] Zoho SPF record set
- [ ] Zoho DKIM record set
- [ ] SendGrid CNAME records for domain authentication set
- [ ] SendGrid Inbound Parse MX record set
- [ ] No conflicts between Zoho and SendGrid DNS records

## Before first real campaign send
- [ ] Warmbox warming period complete (3 weeks minimum)
- [ ] SendGrid domain authenticated and verified
- [ ] Test send-campaign-emails with a single manually-inserted test campaign
- [ ] Confirm emails_sent count returns correctly to frontend
- [ ] Reply to a test send and confirm it arrives at forward_to address
- [ ] Confirm bounce suppression writes to user_suppressions correctly

## Frontend dev notes
- [ ] Activity cards in V1 Dashboard hero (lines 366–398 of Dashboard.tsx) are inline,
      not exported components — V2Dashboard uses its own stat cards querying campaign_sends.
      If V1 activity cards are needed in V2, extract them from Dashboard.tsx into a shared
      component first (requires explicit approval before touching Dashboard.tsx).
- [ ] send-campaign-emails currently reads SENDGRID_API_KEY from env — update to
      SENDGRID_LISTINGPING_API_KEY once the listingping.com SendGrid account is set up.
      The variable name in the edge function must match the Supabase secret name exactly.
- [ ] run-campaign-schedule cron is set to 14:00 UTC (6am PST). Confirm this is the
      right send time for your target market before first campaign goes live.
- [ ] V2 routes are registered under /v2/ prefix. To promote V2 to default production
      routes, remove the /v2/ prefix from PAGE_TO_PATH and PATH_TO_PAGE in App.tsx.
