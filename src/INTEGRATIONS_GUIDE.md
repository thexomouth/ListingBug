# ListingBug Integrations Guide

**Last Updated:** March 19, 2026 (Phase 1 Complete)  
**Status:** ✅ 9 Confirmed Integrations - Production Ready

## Overview

ListingBug connects with leading CRM, email marketing, and automation platforms to help you streamline your real estate workflow. Automatically sync leads, send campaigns, and build custom workflows without manual data entry.

This guide covers the **9 confirmed integrations** available at launch. Additional integrations are planned for future releases.

---

## Table of Contents

1. [Supported Integrations](#supported-integrations)
2. [How to Connect](#how-to-connect)
3. [Integration Details](#integration-details)
4. [Best Practices](#best-practices)
5. [Troubleshooting](#troubleshooting)
6. [FAQs](#faqs)

---

## Supported Integrations

### CRM Platforms
- **Salesforce** - Sync leads and opportunities
- **HubSpot** - Manage contacts and deals
- **Zoho CRM** - Track leads and pipeline

### Email Marketing
- **Mailchimp** - Build audiences and campaigns
- **SendGrid** - Send transactional emails
- **Constant Contact** - Email marketing automation

### Automation & Workflows
- **Zapier** - Connect to 5,000+ apps
- **Make.com** - Advanced workflow automation
- **n8n** - Self-hosted automation

---

## How to Connect

### Step 1: Access Integrations

1. Log in to your ListingBug account
2. Click your avatar in the top right
3. Go to **Account Settings**
4. Click the **Integrations** tab

### Step 2: Select Integration

Browse available integrations by category or search for a specific service.

### Step 3: Connect

Click **Connect** on your chosen integration and follow the prompts:

**For OAuth Integrations** (Salesforce, HubSpot, Mailchimp):
- Click "Connect to [Service]"
- You'll be redirected to the service's login page
- Authorize ListingBug to access your account
- You'll be redirected back automatically

**For API Key Integrations** (SendGrid, Zapier, Make):
- Enter your API key
- Click "Connect [Service]"
- Your connection will be tested and saved

### Step 4: Configure Settings

Once connected:
- Enable auto-sync (optional)
- Set sync frequency (realtime, hourly, daily, manual)
- Configure email notifications
- Map custom fields (advanced)

---

## Integration Details

### Salesforce

**What Syncs**:
- New leads from your ListingBug reports
- Contact information (agent name, email, phone)
- Property details as custom fields
- Opportunities created for high-value listings

**How It Works**:
1. When your report runs, new properties are identified
2. ListingBug creates a Lead in Salesforce for each listing agent
3. Property details are added to custom fields
4. Leads are assigned to the owner specified in settings

**Setup Requirements**:
- Salesforce account with API access
- Admin permissions to authorize
- Custom fields (we'll help you create these):
  - `MLS_Number__c` (Text)
  - `Property_Type__c` (Picklist)
  - `Property_Value__c` (Currency)

**Best For**: Large real estate teams using Salesforce for lead management

---

### HubSpot

**What Syncs**:
- Contacts (listing agents and brokers)
- Companies (real estate agencies)
- Deals (properties as sales opportunities)
- Activity timeline

**How It Works**:
1. ListingBug creates or updates Contacts for agents
2. Companies are created for brokerages
3. Deals are created with property details
4. All activities are logged in timeline

**Setup Requirements**:
- HubSpot account (Starter or higher for custom properties)
- Super Admin access to authorize
- CRM module enabled

**Best For**: Teams using HubSpot's all-in-one sales & marketing platform

---

### Zoho CRM

**What Syncs**:
- Leads (listing agents)
- Contacts
- Deals (properties)
- Custom modules (if configured)

**How It Works**:
Similar to Salesforce integration with Zoho-specific field mapping

**Setup Requirements**:
- Zoho CRM account with API access
- Organization admin permissions
- API access enabled in Zoho settings

**Best For**: Teams using Zoho's ecosystem

---

### Mailchimp

**What Syncs**:
- Subscriber data to specified audience
- Tags based on report criteria
- Segments for targeted campaigns

**How It Works**:
1. Choose which audience(s) to sync to
2. ListingBug adds agent contacts with tags
3. Create segments based on property preferences
4. Trigger campaigns when new listings match criteria

**Setup Requirements**:
- Mailchimp account (any plan)
- At least one audience created
- Account owner or admin access

**Automation Ideas**:
- Weekly market update campaigns
- New listing alerts for specific areas
- Price reduction notifications

**Best For**: Regular email marketing to agent networks

---

### SendGrid

**What Syncs**:
- Transactional emails only (no audience management)

**How It Works**:
1. Get your SendGrid API key
2. Connect it in ListingBug
3. Enable email notifications in your reports
4. Receive beautifully formatted emails when reports run

**Setup Requirements**:
- SendGrid account (free or paid)
- API key with "Mail Send" permissions
- Verified sender identity

**Best For**: Reliable delivery of report notifications

---

### Constant Contact

**What Syncs**:
- Contact lists
- Email campaigns
- Campaign performance data

**How It Works**:
Similar to Mailchimp with Constant Contact's interface

**Setup Requirements**:
- Constant Contact account
- Account owner access to authorize

**Best For**: Teams already using Constant Contact

---

### Zapier

**What Syncs**:
- Triggers: New report created, report run complete, new property match
- Actions: Create report, run report, export data

**How It Works**:
1. Generate your ListingBug API key
2. In Zapier, search for "ListingBug"
3. Connect using your API key
4. Build Zaps with triggers and actions

**Popular Zaps**:
- New listing → Send Slack message
- Report complete → Add row to Google Sheets
- Price reduction → Create Trello card
- New lead → Add to email sequence

**Setup Requirements**:
- Zapier account (free or paid)
- ListingBug API key (generate in Integrations tab)

**Best For**: No-code automation between ListingBug and other apps

---

### Make.com (Integromat)

**What Syncs**:
Same triggers and actions as Zapier with more advanced options

**How It Works**:
1. Generate your ListingBug API key
2. In Make, add ListingBug as a connection
3. Build scenarios with visual workflow builder

**Advanced Features**:
- Multi-step workflows
- Data transformation
- Error handling
- Conditional logic

**Best For**: Power users who need advanced automation

---

### n8n

**What Syncs**:
Same as Zapier/Make with self-hosted option

**How It Works**:
1. Generate ListingBug API key
2. Add HTTP Request node or custom ListingBug node
3. Configure authentication and webhooks

**Setup Requirements**:
- n8n instance (self-hosted or cloud)
- ListingBug API key
- Webhook URL configured

**Best For**: Technical teams wanting self-hosted automation

---

## Best Practices

### Data Privacy

- **Only connect integrations you actively use**
- **Review permissions** before authorizing
- **Disconnect unused integrations** to minimize access
- **Don't share API keys** - generate separate keys for testing

### Sync Frequency

**Realtime** (0-5 min delay):
- Best for: Time-sensitive leads, hot market tracking
- Resource: Higher API usage
- Use when: You need immediate notifications

**Hourly**:
- Best for: Active market monitoring
- Balanced resource usage
- Use when: You check data multiple times per day

**Daily**:
- Best for: Weekly market reports, digest emails
- Minimal resource usage
- Use when: You need regular summaries

**Manual Only**:
- Best for: Occasional exports, testing
- No automatic syncing
- Use when: You prefer control

### Data Quality

**Keep Your Integrations Clean**:
- Use descriptive report names
- Tag leads appropriately in CRM
- Deduplicate contacts regularly
- Archive old synced data

**Field Mapping**:
- Map ListingBug fields to matching CRM fields
- Use custom fields for unique data (MLS numbers, property type)
- Keep field names consistent across integrations

### Security

**API Keys**:
- Store securely (never in code or public places)
- Regenerate periodically
- Use separate keys for different purposes
- Revoke immediately if compromised

**OAuth Connections**:
- Review permissions requested
- Revoke access if no longer needed
- Monitor sync activity regularly

---

## Troubleshooting

### Connection Issues

**Problem**: "Unable to connect to [Service]"

**Solutions**:
1. Check your internet connection
2. Verify your account has necessary permissions
3. Try disconnecting and reconnecting
4. Clear browser cache and cookies
5. Check service status page (e.g., status.salesforce.com)

---

### Sync Failures

**Problem**: "Sync failed" or "Last sync: Error"

**Solutions**:
1. Check Recent Activity in integration details
2. Verify API key is still valid (for API key integrations)
3. Ensure you haven't hit rate limits
4. Check that required fields are configured
5. Try manual sync to see specific error

**Common Errors**:
- **"Invalid credentials"**: Reconnect the integration
- **"Rate limit exceeded"**: Wait and try again later
- **"Missing required field"**: Check field mappings
- **"Permission denied"**: Update authorization permissions

---

### Missing Data

**Problem**: Data not appearing in connected service

**Solutions**:
1. Check sync status in integration details
2. Verify auto-sync is enabled
3. Ensure sync frequency is appropriate
4. Check filters - data might be filtered out
5. Look in archive or deleted items

---

### Duplicate Records

**Problem**: Multiple records for same agent/property

**Solutions**:
1. Check duplicate detection rules in CRM
2. Use unique identifier (email, MLS number)
3. Enable "Update existing" instead of "Create new"
4. Run CRM's dedupe tool
5. Contact support for bulk cleanup

---

## FAQs

### General

**Q: How many integrations can I connect?**
A: Unlimited! Connect as many services as you need.

**Q: Do integrations cost extra?**
A: No. All integrations are included in your ListingBug plan. However, you'll need active accounts with the services you want to connect.

**Q: Can I pause an integration without disconnecting?**
A: Yes. Disable auto-sync in the integration settings. Your connection stays active for manual syncs.

**Q: What happens if I disconnect an integration?**
A: Your credentials are removed from ListingBug. Existing synced data in the other service is not deleted - you'd need to remove it manually if desired.

---

### Data & Security

**Q: Where are my API keys stored?**
A: All credentials are encrypted and stored securely in our database. We never expose full keys in responses.

**Q: Can ListingBug delete data in my CRM?**
A: No. ListingBug only creates and updates records. We never delete data from your connected services.

**Q: How is my data used?**
A: Data is only synced to services you explicitly connect. We don't share data with third parties beyond the integrations you authorize.

**Q: Is my data backed up?**
A: Yes, but backup is for ListingBug data only. Always maintain backups of your CRM and email marketing data independently.

---

### Technical

**Q: What API does ListingBug use?**
A: We use REST APIs with OAuth 2.0 for most services and API keys for others. All communication is over HTTPS.

**Q: Can I build my own integration?**
A: Yes! Use our API with Zapier, Make, or n8n. Or contact us about building a custom integration.

**Q: What's the rate limit?**
A: Sync operations have generous limits (thousands per hour). If you hit limits, we'll automatically retry.

**Q: Can I sync historical data?**
A: When you first connect, we can backfill up to 30 days of report data (Enterprise plans). Contact support to configure.

---

### Billing & Plans

**Q: Do I need a specific plan for integrations?**
A: Basic integrations are available on all plans. Some advanced features (custom field mapping, higher sync frequency) may require Professional or Enterprise.

**Q: What if I downgrade my plan?**
A: Your integrations stay connected but may be limited (e.g., daily sync instead of hourly). You can still manually sync anytime.

---

## Integration Roadmap

**Coming Soon**:
- Google Sheets direct integration
- Airtable connector
- Monday.com boards
- Notion databases
- Slack direct notifications
- Microsoft Teams alerts

**Under Consideration**:
- ActiveCampaign
- Pipedrive
- Close CRM
- Intercom
- Custom webhooks

**Want to request an integration?** Contact support or vote on our feature board.

---

## Getting Help

### Support Channels

**Documentation**: Check our Help Center for guides
**Email**: integrations@listingbug.com
**Chat**: Live chat in your dashboard (M-F 9am-6pm EST)
**Community**: Join our Slack community for tips

### When Contacting Support

Include:
1. Integration name (e.g., "Salesforce")
2. What you're trying to accomplish
3. Error messages (full text or screenshots)
4. When the issue started
5. Your ListingBug plan

### Setup Assistance

Need help getting started?
- **Free**: Self-service guides and videos
- **Professional**: Email support within 24 hours
- **Enterprise**: Dedicated integration specialist

---

## Appendix

### Glossary

**API Key**: A secret token used to authenticate with a service
**OAuth**: An authorization protocol that lets you connect securely without sharing passwords
**Sync**: The process of transferring data between ListingBug and another service
**Webhook**: A way for one service to send real-time data to another
**Rate Limit**: The maximum number of API requests allowed in a time period
**Field Mapping**: Associating ListingBug data fields with fields in another service

---

### Integration Comparison

| Feature | Salesforce | HubSpot | Zoho CRM | Mailchimp | Zapier |
|---------|-----------|---------|----------|-----------|--------|
| Leads Sync | ✅ | ✅ | ✅ | - | Via Zap |
| Contacts Sync | ✅ | ✅ | ✅ | ✅ | Via Zap |
| Opportunities | ✅ | ✅ (Deals) | ✅ | - | Via Zap |
| Email Campaigns | - | ✅ | - | ✅ | Via Zap |
| Custom Fields | ✅ | ✅ | ✅ | ✅ (Tags) | Via Zap |
| Bi-directional | Optional | Optional | Optional | - | ✅ |
| Realtime Sync | ✅ | ✅ | ✅ | ✅ | ✅ |
| Self-hosted | - | - | - | - | ✅ (n8n) |

---

## Resources

### Video Tutorials
- How to Connect Salesforce (5 min)
- Building Your First Zapier Workflow (10 min)
- Mailchimp Campaign Setup (7 min)

### Sample Workflows
- New Listing Alert Email (Mailchimp + ListingBug)
- Lead Assignment Automation (Salesforce + ListingBug)
- Weekly Market Report (ListingBug + Google Sheets + Gmail)

### Integration Templates
- Salesforce Field Mapping Template
- HubSpot Import CSV Format
- Mailchimp Audience Segmentation Guide

---

**Last Updated**: November 23, 2024  
**Version**: 1.0  
**Questions?** Contact integrations@listingbug.com
