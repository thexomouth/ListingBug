# 🚀 ListingBug - Airtable + Xano Implementation Guide

**Date:** December 19, 2024  
**Project Status:** 92% Complete Prototype  
**Current Platform:** Figma Make (React + TypeScript)  
**Recommended Backend:** Airtable (Database) + Xano (API/Auth)  
**Developer Profile:** Front-end experienced vibe coder (AI-assisted development)  
**Timeline:** 2-3 weeks to production launch

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Why Airtable + Xano](#why-airtable--xano)
3. [Complete Airtable Schema](#complete-airtable-schema)
4. [Complete Xano API Endpoints](#complete-xano-api-endpoints)
5. [Week-by-Week Implementation Checklist](#week-by-week-implementation-checklist)
6. [Integration Details (17 Destinations)](#integration-details-17-destinations)
7. [RentCast API Integration](#rentcast-api-integration)
8. [Data Enrichment Fields](#data-enrichment-fields)
9. [Component-to-API Mapping](#component-to-api-mapping)
10. [Testing Checklist](#testing-checklist)

---

## 🎯 Project Overview

### What is ListingBug?

**ListingBug** is a comprehensive real estate listing management and automation platform designed for service providers who need to connect with listing agents.

### Core Features (92% Complete)
- ✅ **Search:** 25+ filter parameters for finding listings
- ✅ **Automation:** 3-step wizard connecting to 17 destinations
- ✅ **Dashboard:** Analytics, metrics, and activity tracking
- ✅ **Billing:** Stripe-ready subscription system (3 tiers)
- ✅ **Integrations:** 17 third-party destinations
- ✅ **Onboarding:** 9-step interactive tutorial

### What We Need to Add
- ❌ Backend database (Airtable)
- ❌ API layer (Xano)
- ❌ Authentication system
- ❌ Real data from RentCast API
- ❌ Integration OAuth flows
- ❌ Stripe payment processing

---

## 💡 Why Airtable + Xano?

### Advantages for Vibe Coders

✅ **You already have Airtable tables** - Reuse existing work  
✅ **Visual database interface** - No SQL required  
✅ **Xano is no-code backend** - Visual API builder  
✅ **Faster timeline** - 2-3 weeks vs 6-8 weeks  
✅ **Pattern familiarity** - You've done similar projects  
✅ **Lower learning curve** - Click and configure vs code  

### Cost Comparison

**Airtable + Xano:**
- Airtable Free: $0/mo (1,200 records/base)
- Airtable Pro: $20/user/mo (50,000 records/base)
- Xano Launch: $25/mo (1M API calls, 10GB bandwidth)
- **Total: $25-45/mo**

**For Production (Year 1):**
- Airtable Pro: $20/mo = $240/year
- Xano Launch: $85/mo = $1,020/year
- **Total: $1,260/year**

### Migration Path

When you scale beyond 10,000 users or need real-time features, you can:
1. Export Airtable data to PostgreSQL
2. Migrate Xano functions to Node.js/Supabase
3. Keep frontend code 100% unchanged

---

## 🗄️ Complete Airtable Schema

### Base Structure

Create one Airtable base called **"ListingBug Production"** with the following tables:

---

### Table 1: **Users**

| Field Name | Field Type | Options | Required | Notes |
|------------|-----------|---------|----------|-------|
| `user_id` | Single line text | Primary field | ✅ | Auto-generated UUID |
| `email` | Email | | ✅ | Unique, used for login |
| `password_hash` | Single line text | | ✅ | Bcrypt hash (Xano handles) |
| `name` | Single line text | | ✅ | Full name |
| `company` | Single line text | | ❌ | Company name |
| `role` | Single line text | | ❌ | Job title/role |
| `phone` | Phone number | | ❌ | For 2FA |
| `phone_verified` | Checkbox | | ✅ | Default: unchecked |
| `avatar_url` | URL | | ❌ | Profile photo |
| `plan` | Single select | Starter, Professional, Enterprise | ✅ | Default: Starter |
| `status` | Single select | Trial, Active, Inactive, Cancelled | ✅ | Default: Trial |
| `trial_ends_at` | Date | Include time | ❌ | 14 days from signup |
| `stripe_customer_id` | Single line text | | ❌ | Stripe customer ID |
| `stripe_subscription_id` | Single line text | | ❌ | Stripe subscription ID |
| `email_notifications` | Checkbox | | ✅ | Default: checked |
| `sms_notifications` | Checkbox | | ✅ | Default: unchecked |
| `onboarding_completed` | Checkbox | | ✅ | Default: unchecked |
| `onboarding_step` | Number | Integer | ✅ | Default: 0 (0-9) |
| `created_at` | Date | Include time | ✅ | Auto on creation |
| `updated_at` | Date | Include time | ✅ | Auto on update |
| `last_login_at` | Date | Include time | ❌ | Updated on login |
| `saved_searches` | Link to another record | Links to Saved Searches | ❌ | Relationship |
| `automations` | Link to another record | Links to Automations | ❌ | Relationship |
| `integrations` | Link to another record | Links to User Integrations | ❌ | Relationship |

**Record Count Estimate:** 100-1,000 users (Year 1)

**Sample Record:**
```
user_id: usr_a1b2c3d4e5f6
email: john@example.com
password_hash: $2b$10$N9qo8uLOickgx2ZMRZoMye...
name: John Doe
company: Real Estate Pros
role: Agent
phone: +1 (555) 123-4567
phone_verified: ☑
plan: Professional
status: Active
trial_ends_at: null
email_notifications: ☑
sms_notifications: ☐
onboarding_completed: ☑
onboarding_step: 9
created_at: 2024-12-01 10:30 AM
last_login_at: 2024-12-19 09:15 AM
```

---

### Table 2: **Saved Searches**

| Field Name | Field Type | Options | Required | Notes |
|------------|-----------|---------|----------|-------|
| `search_id` | Single line text | Primary field | ✅ | Auto-generated UUID |
| `user` | Link to another record | Links to Users | ✅ | Foreign key |
| `name` | Single line text | | ✅ | Search name (user-defined) |
| `description` | Long text | | ❌ | Auto-generated summary |
| `status` | Single select | Active, Paused, Deleted | ✅ | Default: Active |
| **Location Filters** | | | | |
| `location_address` | Single line text | | ❌ | Street address |
| `location_city` | Single line text | | ❌ | City |
| `location_state` | Single line text | | ❌ | State (2-letter) |
| `location_zip` | Single line text | | ❌ | ZIP code |
| `location_latitude` | Number | Decimal | ❌ | Latitude coordinate |
| `location_longitude` | Number | Decimal | ❌ | Longitude coordinate |
| `location_radius` | Number | Integer | ✅ | Default: 10 miles |
| **Property Filters** | | | | |
| `property_type` | Multiple select | Single Family, Condo, Townhouse, Multi-Family, Land, Commercial | ❌ | Can select multiple |
| `bedrooms_min` | Number | Integer | ❌ | Minimum bedrooms |
| `bedrooms_max` | Number | Integer | ❌ | Maximum bedrooms |
| `bathrooms_min` | Number | Decimal (0.5 precision) | ❌ | Minimum bathrooms |
| `bathrooms_max` | Number | Decimal (0.5 precision) | ❌ | Maximum bathrooms |
| `sqft_min` | Number | Integer | ❌ | Minimum square feet |
| `sqft_max` | Number | Integer | ❌ | Maximum square feet |
| `lot_size_min` | Number | Integer | ❌ | Minimum lot size (sqft) |
| `lot_size_max` | Number | Integer | ❌ | Maximum lot size (sqft) |
| `year_built_min` | Number | Integer (1800-2025) | ❌ | Minimum year built |
| `year_built_max` | Number | Integer (1800-2025) | ❌ | Maximum year built |
| **Price Filters** | | | | |
| `price_min` | Currency | USD | ❌ | Minimum price |
| `price_max` | Currency | USD | ❌ | Maximum price |
| `price_per_sqft_min` | Number | Decimal | ❌ | Min price/sqft |
| `price_per_sqft_max` | Number | Decimal | ❌ | Max price/sqft |
| **Market Filters** | | | | |
| `status` | Multiple select | Active, Pending, Sold, Off Market, Relisted | ❌ | Listing status |
| `days_on_market_min` | Number | Integer | ❌ | Minimum DOM |
| `days_on_market_max` | Number | Integer | ❌ | Maximum DOM |
| **Advanced Filters (25+ total)** | | | | |
| `hoa_fees_min` | Currency | USD | ❌ | Min HOA/month |
| `hoa_fees_max` | Currency | USD | ❌ | Max HOA/month |
| `tax_amount_min` | Currency | USD | ❌ | Min annual tax |
| `tax_amount_max` | Currency | USD | ❌ | Max annual tax |
| `garage_spaces_min` | Number | Integer | ❌ | Min garage spaces |
| `pool_type` | Single select | Any, In-Ground, Above-Ground, None | ❌ | Pool requirement |
| `waterfront` | Checkbox | | ❌ | Waterfront property |
| `new_construction` | Checkbox | | ❌ | New construction |
| `foreclosure_status` | Single select | Any, Pre-Foreclosure, Foreclosure, REO | ❌ | Foreclosure filter |
| `distressed_property` | Checkbox | | ❌ | Distressed property |
| `vacancy_status` | Single select | Any, Vacant, Occupied | ❌ | Vacancy filter |
| `open_house_scheduled` | Checkbox | | ❌ | Has open house |
| `virtual_tour_available` | Checkbox | | ❌ | Has virtual tour |
| `school_rating_min` | Number | Integer (1-10) | ❌ | Min school rating |
| `walk_score_min` | Number | Integer (0-100) | ❌ | Min walk score |
| `price_reduction` | Checkbox | | ❌ | Price reduced |
| `relisted_property` | Checkbox | | ❌ | Relisted property |
| **Metadata** | | | | |
| `last_run_at` | Date | Include time | ❌ | Last search execution |
| `last_result_count` | Number | Integer | ❌ | Results from last run |
| `created_at` | Date | Include time | ✅ | Auto on creation |
| `updated_at` | Date | Include time | ✅ | Auto on update |
| `automations` | Link to another record | Links to Automations | ❌ | Related automations |

**Record Count Estimate:** 500-5,000 searches (Year 1)

**Sample Record:**
```
search_id: srch_x7y8z9a0b1c2
user: usr_a1b2c3d4e5f6 (John Doe)
name: LA Single Family Homes - Under $1M
description: Los Angeles, CA · Single Family · $500K-$1M · 3+ bed · 2+ bath
status: Active
location_city: Los Angeles
location_state: CA
location_radius: 10
property_type: [Single Family]
bedrooms_min: 3
bathrooms_min: 2
price_min: $500,000
price_max: $1,000,000
pool_type: Any
new_construction: ☐
last_run_at: 2024-12-19 08:00 AM
last_result_count: 247
created_at: 2024-12-01 11:00 AM
```

---

### Table 3: **Automations**

| Field Name | Field Type | Options | Required | Notes |
|------------|-----------|---------|----------|-------|
| `automation_id` | Single line text | Primary field | ✅ | Auto-generated UUID |
| `user` | Link to another record | Links to Users | ✅ | Foreign key |
| `saved_search` | Link to another record | Links to Saved Searches | ✅ | Which search to run |
| `name` | Single line text | | ✅ | Automation name |
| `description` | Long text | | ❌ | Auto-generated |
| `status` | Single select | Active, Paused, Deleted | ✅ | Default: Active |
| **Destination Configuration** | | | | |
| `destination_type` | Single select | See Integration List Below | ✅ | Where to send data |
| `destination_config` | Long text | JSON | ❌ | Config (API keys, etc) |
| **Schedule Configuration** | | | | |
| `schedule_frequency` | Single select | Realtime, Hourly, Daily, Weekly, Manual | ✅ | Default: Daily |
| `schedule_time` | Single line text | | ❌ | Time (HH:MM format) |
| `schedule_days` | Multiple select | Mon, Tue, Wed, Thu, Fri, Sat, Sun | ❌ | For weekly schedule |
| **Field Mapping** | | | | |
| `field_mappings` | Long text | JSON | ✅ | Source → Destination mapping |
| `mapped_fields_count` | Number | Integer | ✅ | Number of mapped fields |
| **Stats & Metadata** | | | | |
| `total_runs` | Number | Integer | ✅ | Default: 0 |
| `successful_runs` | Number | Integer | ✅ | Default: 0 |
| `failed_runs` | Number | Integer | ✅ | Default: 0 |
| `last_run_at` | Date | Include time | ❌ | Last execution time |
| `last_run_status` | Single select | Success, Failed, Running | ❌ | Last run result |
| `last_run_record_count` | Number | Integer | ❌ | Records sent in last run |
| `next_run_at` | Date | Include time | ❌ | Next scheduled run |
| `created_at` | Date | Include time | ✅ | Auto on creation |
| `updated_at` | Date | Include time | ✅ | Auto on update |
| `runs` | Link to another record | Links to Automation Runs | ❌ | Run history |

**Destination Types (17 Total):**
1. ListingBug CSV Download
2. Salesforce
3. HubSpot
4. Pipedrive
5. Zoho CRM
6. Mailchimp
7. Constant Contact
8. ActiveCampaign
9. SendGrid
10. Google Sheets
11. Airtable
12. Dropbox
13. Google Drive
14. Slack
15. Microsoft Teams
16. Asana
17. Trello
18. Monday.com
19. Custom Webhook

**Record Count Estimate:** 200-2,000 automations (Year 1)

**Sample Record:**
```
automation_id: auto_m3n4o5p6q7r8
user: usr_a1b2c3d4e5f6 (John Doe)
saved_search: srch_x7y8z9a0b1c2 (LA Single Family Homes)
name: Daily LA Listings to Google Sheets
status: Active
destination_type: Google Sheets
destination_config: {"spreadsheet_id":"1A2B3C...", "sheet_name":"Listings"}
schedule_frequency: Daily
schedule_time: 08:00
field_mappings: [{"source":"formattedAddress","destination":"Address"}, ...]
mapped_fields_count: 15
total_runs: 45
successful_runs: 43
failed_runs: 2
last_run_at: 2024-12-19 08:00 AM
last_run_status: Success
last_run_record_count: 247
next_run_at: 2024-12-20 08:00 AM
created_at: 2024-12-05 02:30 PM
```

---

### Table 4: **Automation Runs**

| Field Name | Field Type | Options | Required | Notes |
|------------|-----------|---------|----------|-------|
| `run_id` | Single line text | Primary field | ✅ | Auto-generated UUID |
| `automation` | Link to another record | Links to Automations | ✅ | Foreign key |
| `user` | Link to another record | Links to Users | ✅ | Foreign key |
| `status` | Single select | Running, Success, Failed | ✅ | Default: Running |
| `trigger_type` | Single select | Scheduled, Manual | ✅ | How it was triggered |
| `started_at` | Date | Include time | ✅ | Run start time |
| `completed_at` | Date | Include time | ❌ | Run end time |
| `duration_seconds` | Number | Integer | ❌ | Execution duration |
| `records_found` | Number | Integer | ✅ | Listings found |
| `records_sent` | Number | Integer | ✅ | Records sent to destination |
| `records_failed` | Number | Integer | ✅ | Records that failed |
| `error_message` | Long text | | ❌ | Error details if failed |
| `error_code` | Single line text | | ❌ | Error code |
| `execution_log` | Long text | JSON | ❌ | Detailed execution log |
| `created_at` | Date | Include time | ✅ | Auto on creation |

**Record Count Estimate:** 10,000-100,000 runs (Year 1)

**Sample Record:**
```
run_id: run_s8t9u0v1w2x3
automation: auto_m3n4o5p6q7r8 (Daily LA Listings to Google Sheets)
user: usr_a1b2c3d4e5f6 (John Doe)
status: Success
trigger_type: Scheduled
started_at: 2024-12-19 08:00:00 AM
completed_at: 2024-12-19 08:02:15 AM
duration_seconds: 135
records_found: 247
records_sent: 247
records_failed: 0
error_message: null
created_at: 2024-12-19 08:00:00 AM
```

---

### Table 5: **Listings Cache**

**Purpose:** Cache RentCast API results to reduce API calls and improve performance

| Field Name | Field Type | Options | Required | Notes |
|------------|-----------|---------|----------|-------|
| `listing_id` | Single line text | Primary field | ✅ | RentCast property ID |
| **Location Data (RentCast)** | | | | |
| `formatted_address` | Single line text | | ✅ | Full address |
| `address_line1` | Single line text | | ✅ | Street address |
| `city` | Single line text | | ✅ | City |
| `state` | Single line text | | ✅ | State (2-letter) |
| `zip_code` | Single line text | | ✅ | ZIP code |
| `county` | Single line text | | ❌ | County |
| `latitude` | Number | Decimal (6 places) | ✅ | Latitude |
| `longitude` | Number | Decimal (6 places) | ✅ | Longitude |
| **Property Details (RentCast)** | | | | |
| `property_type` | Single line text | | ✅ | Property type |
| `bedrooms` | Number | Integer | ✅ | Bedroom count |
| `bathrooms` | Number | Decimal (0.5 precision) | ✅ | Bathroom count |
| `square_feet` | Number | Integer | ✅ | Interior sqft |
| `lot_size` | Number | Integer | ❌ | Lot size (sqft) |
| `year_built` | Number | Integer | ❌ | Year built |
| `stories` | Number | Integer | ❌ | Number of stories |
| `garage_spaces` | Number | Integer | ❌ | Garage count |
| `pool` | Checkbox | | ❌ | Has pool |
| `waterfront` | Checkbox | | ❌ | Waterfront property |
| **Listing Info (RentCast)** | | | | |
| `price` | Currency | USD | ✅ | List price |
| `status` | Single select | Active, Pending, Sold, Off Market | ✅ | Listing status |
| `listing_date` | Date | | ✅ | Original list date |
| `last_seen_date` | Date | | ✅ | Last seen active |
| `removed_date` | Date | | ❌ | Removed from market |
| `days_on_market` | Number | Integer | ✅ | Current DOM |
| `price_per_sqft` | Number | Decimal | ❌ | Calculated price/sqft |
| **Agent Info (RentCast)** | | | | |
| `agent_name` | Single line text | | ❌ | Listing agent name |
| `agent_email` | Email | | ❌ | Agent email |
| `agent_phone` | Phone number | | ❌ | Agent phone |
| `agent_website` | URL | | ❌ | Agent website |
| **Office Info (RentCast)** | | | | |
| `office_name` | Single line text | | ❌ | Brokerage name |
| `office_email` | Email | | ❌ | Office email |
| `office_phone` | Phone number | | ❌ | Office phone |
| `office_website` | URL | | ❌ | Office website |
| `broker_name` | Single line text | | ❌ | Broker name |
| **MLS Info (RentCast)** | | | | |
| `mls_number` | Single line text | | ❌ | MLS# |
| `mls_name` | Single line text | | ❌ | MLS name |
| **Builder Info (RentCast)** | | | | |
| `builder_name` | Single line text | | ❌ | Builder name |
| `builder_phone` | Phone number | | ❌ | Builder phone |
| `builder_email` | Email | | ❌ | Builder email |
| **Enriched Data (ListingBug)** | | | | |
| `hoa_fees` | Currency | USD | ❌ | Monthly HOA |
| `tax_amount` | Currency | USD | ❌ | Annual property tax |
| `foreclosure_status` | Single select | None, Pre-Foreclosure, Foreclosure, REO | ❌ | Foreclosure status |
| `distressed` | Checkbox | | ❌ | Distressed property |
| `vacancy_status` | Single select | Unknown, Vacant, Occupied | ❌ | Vacancy status |
| `open_house_date` | Date | | ❌ | Next open house |
| `virtual_tour_url` | URL | | ❌ | Virtual tour link |
| `school_rating` | Number | Integer (1-10) | ❌ | School district rating |
| `walk_score` | Number | Integer (0-100) | ❌ | Walk score |
| `price_history` | Long text | JSON | ❌ | Price change history |
| `new_construction` | Checkbox | | ❌ | New construction |
| `price_reduced` | Checkbox | | ❌ | Price recently reduced |
| `relisted` | Checkbox | | ❌ | Relisted property |
| **Cache Metadata** | | | | |
| `cached_at` | Date | Include time | ✅ | When cached |
| `cache_expires_at` | Date | Include time | ✅ | Cache expiration |
| `search_results` | Link to another record | Links to Search Results | ❌ | Which searches matched |

**Record Count Estimate:** 50,000-500,000 listings (Year 1)

**Cache Strategy:**
- Cache listings for 24 hours
- Refresh on next search if expired
- Store in Airtable for quick retrieval

---

### Table 6: **Search Results**

**Purpose:** Junction table linking searches to listings

| Field Name | Field Type | Options | Required | Notes |
|------------|-----------|---------|----------|-------|
| `result_id` | Single line text | Primary field | ✅ | Auto-generated UUID |
| `saved_search` | Link to another record | Links to Saved Searches | ✅ | Foreign key |
| `listing` | Link to another record | Links to Listings Cache | ✅ | Foreign key |
| `matched_at` | Date | Include time | ✅ | When listing matched search |
| `relevance_score` | Number | Decimal (0-1) | ❌ | Match quality score |
| `created_at` | Date | Include time | ✅ | Auto on creation |

**Record Count Estimate:** 100,000-1,000,000 results (Year 1)

---

### Table 7: **User Integrations**

**Purpose:** Store OAuth tokens and integration configs

| Field Name | Field Type | Options | Required | Notes |
|------------|-----------|---------|----------|-------|
| `integration_id` | Single line text | Primary field | ✅ | Auto-generated UUID |
| `user` | Link to another record | Links to Users | ✅ | Foreign key |
| `integration_type` | Single select | See 17 Integrations List | ✅ | Integration name |
| `status` | Single select | Connected, Disconnected, Error | ✅ | Default: Connected |
| `oauth_access_token` | Long text | Encrypted | ❌ | OAuth access token |
| `oauth_refresh_token` | Long text | Encrypted | ❌ | OAuth refresh token |
| `oauth_expires_at` | Date | Include time | ❌ | Token expiration |
| `api_key` | Long text | Encrypted | ❌ | For API key integrations |
| `config` | Long text | JSON | ❌ | Integration-specific config |
| `last_sync_at` | Date | Include time | ❌ | Last successful sync |
| `last_error` | Long text | | ❌ | Last error message |
| `created_at` | Date | Include time | ✅ | Auto on creation |
| `updated_at` | Date | Include time | ✅ | Auto on update |

**17 Integration Types:**
1. `Salesforce`
2. `HubSpot`
3. `Pipedrive`
4. `Zoho CRM`
5. `Mailchimp`
6. `Constant Contact`
7. `ActiveCampaign`
8. `SendGrid`
9. `Google Sheets`
10. `Airtable`
11. `Dropbox`
12. `Google Drive`
13. `Slack`
14. `Microsoft Teams`
15. `Asana`
16. `Trello`
17. `Monday.com`

**Record Count Estimate:** 200-2,000 integrations (Year 1)

---

### Table 8: **Activity Log**

**Purpose:** Track all user actions for dashboard Recent Activity

| Field Name | Field Type | Options | Required | Notes |
|------------|-----------|---------|----------|-------|
| `activity_id` | Single line text | Primary field | ✅ | Auto-generated UUID |
| `user` | Link to another record | Links to Users | ✅ | Foreign key |
| `action_type` | Single select | Search Created, Search Run, Automation Created, Automation Run, Integration Connected, Export Downloaded, etc. | ✅ | Action type |
| `description` | Long text | | ✅ | Human-readable description |
| `related_entity_type` | Single select | Search, Automation, Integration, Listing | ❌ | Related entity |
| `related_entity_id` | Single line text | | ❌ | Entity ID |
| `metadata` | Long text | JSON | ❌ | Additional context |
| `timestamp` | Date | Include time | ✅ | Auto on creation |

**Record Count Estimate:** 50,000-500,000 activities (Year 1)

**Sample Record:**
```
activity_id: act_y4z5a6b7c8d9
user: usr_a1b2c3d4e5f6 (John Doe)
action_type: Automation Run
description: Automation "Daily LA Listings to Google Sheets" completed successfully
related_entity_type: Automation
related_entity_id: auto_m3n4o5p6q7r8
metadata: {"records_sent":247,"duration":135}
timestamp: 2024-12-19 08:02:15 AM
```

---

### Table 9: **Billing Events**

**Purpose:** Track Stripe subscription events

| Field Name | Field Type | Options | Required | Notes |
|------------|-----------|---------|----------|-------|
| `event_id` | Single line text | Primary field | ✅ | Stripe event ID |
| `user` | Link to another record | Links to Users | ✅ | Foreign key |
| `event_type` | Single select | subscription.created, subscription.updated, subscription.deleted, payment.succeeded, payment.failed, etc. | ✅ | Stripe event type |
| `plan` | Single select | Starter, Professional, Enterprise | ❌ | Plan (if applicable) |
| `amount` | Currency | USD | ❌ | Transaction amount |
| `status` | Single select | Pending, Succeeded, Failed | ✅ | Event status |
| `stripe_event_data` | Long text | JSON | ✅ | Full Stripe event |
| `created_at` | Date | Include time | ✅ | Auto on creation |

**Record Count Estimate:** 5,000-50,000 events (Year 1)

---

## 🔌 Complete Xano API Endpoints

### Xano Project Structure

**Project Name:** ListingBug API

**Create the following Function Stacks in Xano:**

---

### 1️⃣ **Authentication Endpoints**

#### **POST /api/auth/signup**

**Purpose:** Create new user account

**Input (Request Body):**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "company": "Real Estate Pros",
  "role": "Agent"
}
```

**Xano Logic (Visual Blocks):**
1. **Validate Input**
   - Check email format
   - Check password strength (min 8 chars)
   - Check if email already exists in Airtable Users table

2. **Hash Password**
   - Use Xano's built-in `bcrypt_hash` function
   - Store hash, not plain password

3. **Create User in Airtable**
   - Insert new record in Users table
   - Set default values:
     - `user_id`: Generate UUID
     - `plan`: "Starter"
     - `status`: "Trial"
     - `trial_ends_at`: 14 days from now
     - `onboarding_completed`: false
     - `onboarding_step`: 0
     - `email_notifications`: true
     - `sms_notifications`: false

4. **Create Auth Token**
   - Use Xano's built-in authentication
   - Return JWT token

5. **Return Response**

**Output (Response):**
```json
{
  "success": true,
  "user": {
    "user_id": "usr_a1b2c3d4e5f6",
    "email": "john@example.com",
    "name": "John Doe",
    "plan": "Starter",
    "status": "Trial",
    "trial_ends_at": "2025-01-02T10:30:00Z"
  },
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400`: Email already exists
- `400`: Invalid email format
- `400`: Password too weak

---

#### **POST /api/auth/login**

**Purpose:** User login

**Input:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Xano Logic:**
1. Query Airtable Users table by email
2. Compare password hash using `bcrypt_compare`
3. If match, create auth token
4. Update `last_login_at` in Airtable
5. Return user data + token

**Output:**
```json
{
  "success": true,
  "user": {
    "user_id": "usr_a1b2c3d4e5f6",
    "email": "john@example.com",
    "name": "John Doe",
    "plan": "Professional",
    "status": "Active",
    "onboarding_completed": true
  },
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401`: Invalid email or password
- `403`: Account suspended

---

#### **POST /api/auth/forgot-password**

**Purpose:** Request password reset

**Input:**
```json
{
  "email": "john@example.com"
}
```

**Xano Logic:**
1. Query Airtable Users table
2. Generate password reset token (UUID)
3. Store token with expiration (1 hour)
4. Send email via SendGrid integration
5. Return success

**Output:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

#### **POST /api/auth/reset-password**

**Purpose:** Reset password with token

**Input:**
```json
{
  "token": "reset_abc123def456",
  "new_password": "NewSecurePassword123!"
}
```

**Xano Logic:**
1. Validate token and expiration
2. Hash new password
3. Update password_hash in Airtable
4. Invalidate reset token
5. Return success

**Output:**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

### 2️⃣ **User Profile Endpoints**

#### **GET /api/user/profile**

**Purpose:** Get current user profile

**Headers:**
```
Authorization: Bearer {authToken}
```

**Xano Logic:**
1. Validate auth token
2. Get user_id from token
3. Query Airtable Users table
4. Return user data

**Output:**
```json
{
  "user_id": "usr_a1b2c3d4e5f6",
  "email": "john@example.com",
  "name": "John Doe",
  "company": "Real Estate Pros",
  "role": "Agent",
  "phone": "+1 (555) 123-4567",
  "phone_verified": true,
  "avatar_url": "https://...",
  "plan": "Professional",
  "status": "Active",
  "trial_ends_at": null,
  "email_notifications": true,
  "sms_notifications": false,
  "onboarding_completed": true,
  "onboarding_step": 9,
  "created_at": "2024-12-01T10:30:00Z",
  "last_login_at": "2024-12-19T09:15:00Z"
}
```

---

#### **PATCH /api/user/profile**

**Purpose:** Update user profile

**Input:**
```json
{
  "name": "John A. Doe",
  "company": "New Company Inc",
  "role": "Senior Agent",
  "phone": "+1 (555) 987-6543",
  "email_notifications": false
}
```

**Xano Logic:**
1. Validate auth token
2. Update Airtable Users record
3. Return updated profile

**Output:**
```json
{
  "success": true,
  "user": { ...updated user object }
}
```

---

#### **POST /api/user/onboarding/complete-step**

**Purpose:** Mark onboarding step as complete

**Input:**
```json
{
  "step": 5
}
```

**Xano Logic:**
1. Validate auth token
2. Update `onboarding_step` in Airtable
3. If step 9, set `onboarding_completed` = true
4. Return success

**Output:**
```json
{
  "success": true,
  "current_step": 6,
  "total_steps": 9,
  "completed": false
}
```

---

### 3️⃣ **Search Endpoints**

#### **POST /api/searches**

**Purpose:** Create and execute search

**Input:**
```json
{
  "name": "LA Single Family Homes - Under $1M",
  "location_city": "Los Angeles",
  "location_state": "CA",
  "location_radius": 10,
  "property_type": ["Single Family"],
  "bedrooms_min": 3,
  "bathrooms_min": 2,
  "price_min": 500000,
  "price_max": 1000000,
  "pool_type": "Any",
  "save_search": true
}
```

**Xano Logic:**
1. Validate auth token
2. If `save_search` = true, create record in Airtable Saved Searches table
3. Call RentCast API with search criteria
4. Cache results in Listings Cache table
5. Create Search Results junction records
6. Log activity in Activity Log
7. Return results

**Output:**
```json
{
  "success": true,
  "search_id": "srch_x7y8z9a0b1c2",
  "name": "LA Single Family Homes - Under $1M",
  "results_count": 247,
  "listings": [
    {
      "listing_id": "prop_123abc",
      "formatted_address": "1234 Main St, Los Angeles, CA 90001",
      "price": 875000,
      "bedrooms": 3,
      "bathrooms": 2,
      "square_feet": 1800,
      "property_type": "Single Family",
      "status": "Active",
      "days_on_market": 12,
      "agent_name": "Jane Smith",
      "agent_email": "jane@realestate.com",
      "agent_phone": "+1 (555) 123-4567"
    },
    // ... more listings
  ]
}
```

---

#### **GET /api/searches**

**Purpose:** Get user's saved searches

**Headers:**
```
Authorization: Bearer {authToken}
```

**Xano Logic:**
1. Validate auth token
2. Query Airtable Saved Searches where user = current user
3. Sort by created_at DESC
4. Return searches

**Output:**
```json
{
  "success": true,
  "searches": [
    {
      "search_id": "srch_x7y8z9a0b1c2",
      "name": "LA Single Family Homes - Under $1M",
      "description": "Los Angeles, CA · Single Family · $500K-$1M · 3+ bed · 2+ bath",
      "status": "Active",
      "last_run_at": "2024-12-19T08:00:00Z",
      "last_result_count": 247,
      "created_at": "2024-12-01T11:00:00Z"
    },
    // ... more searches
  ]
}
```

---

#### **GET /api/searches/{search_id}**

**Purpose:** Get search details and results

**Xano Logic:**
1. Validate auth token
2. Query Airtable Saved Searches by ID
3. Verify user owns search
4. Get cached results from Search Results + Listings Cache
5. Return search + listings

**Output:**
```json
{
  "success": true,
  "search": {
    "search_id": "srch_x7y8z9a0b1c2",
    "name": "LA Single Family Homes - Under $1M",
    // ... all search criteria
  },
  "results": [
    // ... listings array
  ],
  "results_count": 247
}
```

---

#### **POST /api/searches/{search_id}/run**

**Purpose:** Re-run a saved search

**Xano Logic:**
1. Validate auth token
2. Get search criteria from Airtable
3. Call RentCast API
4. Update cache
5. Update `last_run_at` and `last_result_count` in Airtable
6. Log activity
7. Return new results

---

#### **PATCH /api/searches/{search_id}**

**Purpose:** Update search criteria

**Input:**
```json
{
  "name": "LA SFH - Updated",
  "price_max": 950000,
  "status": "Active"
}
```

**Xano Logic:**
1. Validate auth token + ownership
2. Update Airtable Saved Searches record
3. Return updated search

---

#### **DELETE /api/searches/{search_id}**

**Purpose:** Delete (soft delete) search

**Xano Logic:**
1. Validate auth token + ownership
2. Set status = "Deleted" in Airtable
3. Return success

---

### 4️⃣ **Automation Endpoints**

#### **POST /api/automations**

**Purpose:** Create automation

**Input:**
```json
{
  "name": "Daily LA Listings to Google Sheets",
  "saved_search_id": "srch_x7y8z9a0b1c2",
  "destination_type": "Google Sheets",
  "destination_config": {
    "spreadsheet_id": "1A2B3C4D...",
    "sheet_name": "Listings"
  },
  "schedule_frequency": "Daily",
  "schedule_time": "08:00",
  "field_mappings": [
    {"source": "formattedAddress", "destination": "Address", "label": "Suggested", "required": true},
    {"source": "price", "destination": "Price", "label": "Suggested", "required": true},
    // ... more mappings
  ]
}
```

**Xano Logic:**
1. Validate auth token
2. Validate saved_search_id exists and user owns it
3. Validate destination_type is valid
4. Create Airtable Automations record
5. Calculate `next_run_at` based on schedule
6. Log activity
7. Return automation

**Output:**
```json
{
  "success": true,
  "automation": {
    "automation_id": "auto_m3n4o5p6q7r8",
    "name": "Daily LA Listings to Google Sheets",
    "status": "Active",
    "destination_type": "Google Sheets",
    "schedule_frequency": "Daily",
    "schedule_time": "08:00",
    "next_run_at": "2024-12-20T08:00:00Z",
    "created_at": "2024-12-19T10:00:00Z"
  }
}
```

---

#### **GET /api/automations**

**Purpose:** Get user's automations

**Xano Logic:**
1. Validate auth token
2. Query Airtable Automations where user = current user
3. Join with Saved Searches for search names
4. Sort by created_at DESC
5. Return automations

**Output:**
```json
{
  "success": true,
  "automations": [
    {
      "automation_id": "auto_m3n4o5p6q7r8",
      "name": "Daily LA Listings to Google Sheets",
      "saved_search_name": "LA Single Family Homes",
      "destination_type": "Google Sheets",
      "status": "Active",
      "schedule_frequency": "Daily",
      "total_runs": 45,
      "successful_runs": 43,
      "failed_runs": 2,
      "last_run_at": "2024-12-19T08:00:00Z",
      "last_run_status": "Success",
      "next_run_at": "2024-12-20T08:00:00Z"
    },
    // ... more automations
  ]
}
```

---

#### **GET /api/automations/{automation_id}**

**Purpose:** Get automation details + run history

**Xano Logic:**
1. Validate auth token + ownership
2. Get automation from Airtable
3. Get linked Saved Search
4. Get recent runs from Automation Runs table (limit 50)
5. Return full details

**Output:**
```json
{
  "success": true,
  "automation": {
    "automation_id": "auto_m3n4o5p6q7r8",
    // ... all automation fields
    "saved_search": {
      // ... search details
    },
    "field_mappings": [
      // ... field mappings array
    ]
  },
  "runs": [
    {
      "run_id": "run_s8t9u0v1w2x3",
      "status": "Success",
      "started_at": "2024-12-19T08:00:00Z",
      "completed_at": "2024-12-19T08:02:15Z",
      "duration_seconds": 135,
      "records_sent": 247
    },
    // ... more runs
  ]
}
```

---

#### **POST /api/automations/{automation_id}/run**

**Purpose:** Manually trigger automation

**Xano Logic:**
1. Validate auth token + ownership
2. Check plan limits (Starter: 5 automations, Professional: 25, Enterprise: Unlimited)
3. Create Automation Run record with status "Running"
4. Execute automation:
   a. Run saved search
   b. Get results
   c. Format data according to field mappings
   d. Send to destination (Google Sheets, Mailchimp, etc.)
   e. Track sent/failed records
5. Update Automation Run record with results
6. Update Automation stats (total_runs, last_run_at, etc.)
7. Log activity
8. Return run details

**Output:**
```json
{
  "success": true,
  "run": {
    "run_id": "run_s8t9u0v1w2x3",
    "status": "Success",
    "records_sent": 247,
    "duration_seconds": 135
  }
}
```

---

#### **PATCH /api/automations/{automation_id}**

**Purpose:** Update automation

**Input:**
```json
{
  "status": "Paused",
  "schedule_frequency": "Weekly",
  "schedule_days": ["Mon", "Wed", "Fri"]
}
```

**Xano Logic:**
1. Validate auth token + ownership
2. Update Airtable Automations record
3. Recalculate `next_run_at` if schedule changed
4. Return updated automation

---

#### **DELETE /api/automations/{automation_id}**

**Purpose:** Delete automation

**Xano Logic:**
1. Validate auth token + ownership
2. Set status = "Deleted" in Airtable
3. Return success

---

### 5️⃣ **Integration Endpoints**

#### **GET /api/integrations**

**Purpose:** Get available integrations

**Xano Logic:**
1. Return hardcoded list of 17 integrations with metadata
2. Query User Integrations table to mark which are connected
3. Return combined list

**Output:**
```json
{
  "success": true,
  "integrations": [
    {
      "integration_type": "Salesforce",
      "name": "Salesforce",
      "category": "CRM",
      "auth_type": "OAuth",
      "connected": true,
      "description": "Sync leads and opportunities",
      "logo_url": "https://..."
    },
    {
      "integration_type": "Google Sheets",
      "name": "Google Sheets",
      "category": "Spreadsheets",
      "auth_type": "OAuth",
      "connected": false,
      "description": "Export to spreadsheets",
      "logo_url": "https://..."
    },
    // ... 15 more
  ]
}
```

---

#### **POST /api/integrations/connect**

**Purpose:** Initiate OAuth connection

**Input:**
```json
{
  "integration_type": "Google Sheets"
}
```

**Xano Logic:**
1. Validate auth token
2. Generate OAuth authorization URL for integration
3. Store state parameter in session
4. Return OAuth URL

**Output:**
```json
{
  "success": true,
  "oauth_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&scope=..."
}
```

---

#### **GET /api/integrations/callback**

**Purpose:** OAuth callback handler

**Query Params:**
```
?code=abc123&state=xyz789
```

**Xano Logic:**
1. Validate state parameter
2. Exchange code for access_token via integration's OAuth API
3. Create/update User Integrations record in Airtable
4. Encrypt and store tokens
5. Redirect to frontend success page

---

#### **GET /api/integrations/connected**

**Purpose:** Get user's connected integrations

**Xano Logic:**
1. Validate auth token
2. Query Airtable User Integrations where user = current user
3. Return list

**Output:**
```json
{
  "success": true,
  "integrations": [
    {
      "integration_id": "int_abc123",
      "integration_type": "Google Sheets",
      "status": "Connected",
      "last_sync_at": "2024-12-19T08:02:15Z",
      "created_at": "2024-12-05T10:00:00Z"
    },
    // ... more
  ]
}
```

---

#### **DELETE /api/integrations/{integration_id}**

**Purpose:** Disconnect integration

**Xano Logic:**
1. Validate auth token + ownership
2. Set status = "Disconnected" in Airtable
3. Delete stored tokens
4. Return success

---

### 6️⃣ **Billing Endpoints**

#### **GET /api/billing/subscription**

**Purpose:** Get current subscription details

**Xano Logic:**
1. Validate auth token
2. Get user's plan and status from Airtable Users
3. Calculate usage stats
4. Return subscription info

**Output:**
```json
{
  "success": true,
  "subscription": {
    "plan": "Professional",
    "status": "Active",
    "billing_cycle": "monthly",
    "current_period_start": "2024-12-01T00:00:00Z",
    "current_period_end": "2025-01-01T00:00:00Z",
    "cancel_at_period_end": false,
    "usage": {
      "searches_this_month": 157,
      "searches_limit": "Unlimited",
      "automations_active": 12,
      "automations_limit": 25,
      "integrations_connected": 5,
      "integrations_limit": 10
    },
    "next_invoice_date": "2025-01-01T00:00:00Z",
    "next_invoice_amount": 199.00
  }
}
```

---

#### **POST /api/billing/create-checkout-session**

**Purpose:** Create Stripe checkout session

**Input:**
```json
{
  "plan": "Professional",
  "billing_cycle": "monthly"
}
```

**Xano Logic:**
1. Validate auth token
2. Create Stripe Checkout Session via Stripe API
3. Return session URL

**Output:**
```json
{
  "success": true,
  "checkout_url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

---

#### **POST /api/billing/change-plan**

**Purpose:** Change subscription plan

**Input:**
```json
{
  "new_plan": "Enterprise"
}
```

**Xano Logic:**
1. Validate auth token
2. Update Stripe subscription via API
3. Update plan in Airtable Users
4. Log billing event
5. Return success

---

#### **POST /api/billing/cancel-subscription**

**Purpose:** Cancel subscription

**Xano Logic:**
1. Validate auth token
2. Cancel Stripe subscription (at period end)
3. Update status in Airtable
4. Log billing event
5. Return success

---

#### **POST /api/webhooks/stripe**

**Purpose:** Handle Stripe webhooks

**Input:** Stripe webhook event

**Xano Logic:**
1. Verify webhook signature
2. Handle event types:
   - `checkout.session.completed`: Activate subscription
   - `invoice.payment_succeeded`: Log payment
   - `invoice.payment_failed`: Handle failed payment
   - `customer.subscription.updated`: Update plan
   - `customer.subscription.deleted`: Deactivate account
3. Update Airtable Users table
4. Create Billing Events record
5. Return 200 OK

---

### 7️⃣ **Activity Endpoints**

#### **GET /api/activity**

**Purpose:** Get user's recent activity

**Query Params:**
```
?limit=50&offset=0
```

**Xano Logic:**
1. Validate auth token
2. Query Airtable Activity Log where user = current user
3. Sort by timestamp DESC
4. Paginate (limit + offset)
5. Return activities

**Output:**
```json
{
  "success": true,
  "activities": [
    {
      "activity_id": "act_y4z5a6b7c8d9",
      "action_type": "Automation Run",
      "description": "Automation \"Daily LA Listings to Google Sheets\" completed successfully",
      "timestamp": "2024-12-19T08:02:15Z",
      "metadata": {
        "records_sent": 247,
        "duration": 135
      }
    },
    // ... more activities
  ],
  "pagination": {
    "total": 523,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

---

### 8️⃣ **Dashboard Endpoints**

#### **GET /api/dashboard/metrics**

**Purpose:** Get dashboard metrics

**Xano Logic:**
1. Validate auth token
2. Calculate metrics from Airtable:
   - Total saved searches
   - Total automation runs this month
   - Total listings viewed
   - Active automations count
3. Get recent activity (5 items)
4. Get recent searches (3 items)
5. Return metrics

**Output:**
```json
{
  "success": true,
  "metrics": {
    "total_searches": 12,
    "searches_this_month": 8,
    "total_automations": 5,
    "automation_runs_this_month": 45,
    "listings_viewed": 2847,
    "active_automations": 5
  },
  "recent_activity": [
    // ... 5 recent activities
  ],
  "recent_searches": [
    // ... 3 recent searches
  ]
}
```

---

### 9️⃣ **RentCast Integration Endpoints**

#### **POST /api/rentcast/search**

**Purpose:** Search RentCast API and cache results

**Input:**
```json
{
  "latitude": 34.0522,
  "longitude": -118.2437,
  "radius": 10,
  "propertyType": "Single Family",
  "bedrooms": 3,
  "bathrooms": 2,
  "priceMin": 500000,
  "priceMax": 1000000
  // ... all 25+ search parameters
}
```

**Xano Logic:**
1. Validate auth token
2. Build RentCast API request from criteria
3. Call RentCast API:
   ```
   GET https://api.rentcast.io/v1/listings/sale
   Headers: X-API-Key: {YOUR_RENTCAST_API_KEY}
   Query Params: lat, long, radius, propertyType, beds, baths, ...
   ```
4. Parse RentCast response (array of listings)
5. For each listing:
   a. Check if exists in Listings Cache
   b. If exists and not expired, use cached version
   c. If new or expired, insert/update in Listings Cache
   d. Add enriched data (calculate price_per_sqft, etc.)
6. Return listings array

**Output:**
```json
{
  "success": true,
  "results_count": 247,
  "listings": [
    {
      "listing_id": "prop_123abc",
      "formatted_address": "1234 Main St, Los Angeles, CA 90001",
      "city": "Los Angeles",
      "state": "CA",
      "zip_code": "90001",
      "price": 875000,
      "bedrooms": 3,
      "bathrooms": 2,
      "square_feet": 1800,
      "lot_size": 5500,
      "year_built": 2015,
      "property_type": "Single Family",
      "status": "Active",
      "days_on_market": 12,
      "price_per_sqft": 486.11,
      "agent_name": "Jane Smith",
      "agent_email": "jane@realestate.com",
      "agent_phone": "+1 (555) 123-4567",
      "mls_number": "LA12345678"
    },
    // ... 246 more listings
  ],
  "cached": 152,
  "new": 95
}
```

---

## 📅 Week-by-Week Implementation Checklist

---

## **WEEK 1: Foundation & Database Setup**

### **Day 1: Airtable Setup** ✅

- [ ] **Task 1.1:** Create Airtable account (free tier)
- [ ] **Task 1.2:** Create new base: "ListingBug Production"
- [ ] **Task 1.3:** Create **Users** table with all 20 fields
  - [ ] Set field types correctly (single line text, email, date, checkbox, etc.)
  - [ ] Set `user_id` as primary field
  - [ ] Configure default values (plan: Starter, status: Trial, etc.)
- [ ] **Task 1.4:** Create **Saved Searches** table with all 60+ fields
  - [ ] Group fields into sections (Location, Property, Price, Market, Advanced)
  - [ ] Set proper field types (number, currency, checkbox, multiple select)
  - [ ] Create link to Users table
- [ ] **Task 1.5:** Create **Automations** table with all 20+ fields
  - [ ] Create links to Users and Saved Searches
  - [ ] Add destination_type single select with 17 options
  - [ ] Set default values (status: Active, total_runs: 0)
- [ ] **Task 1.6:** Create **Automation Runs** table with all 15 fields
  - [ ] Link to Automations and Users
  - [ ] Set status single select options
- [ ] **Task 1.7:** Create **Listings Cache** table with all 50+ fields
  - [ ] Match RentCast API field names exactly
  - [ ] Add enriched fields (hoa_fees, tax_amount, etc.)
  - [ ] Set proper data types
- [ ] **Task 1.8:** Create **Search Results** junction table
  - [ ] Link to Saved Searches and Listings Cache
- [ ] **Task 1.9:** Create **User Integrations** table
  - [ ] Add integration_type with 17 options
  - [ ] Set encrypted fields for tokens
- [ ] **Task 1.10:** Create **Activity Log** table
  - [ ] Add action_type with all action options
  - [ ] Link to Users
- [ ] **Task 1.11:** Create **Billing Events** table
  - [ ] Add Stripe event types
  - [ ] Link to Users
- [ ] **Task 1.12:** Test all tables with sample data
  - [ ] Create 1-2 sample records in each table
  - [ ] Verify links work correctly
  - [ ] Test filters and views

**AI Assistance Prompt:**
```
"I'm setting up Airtable for ListingBug. Create a checklist for each table with:
1. All field names
2. Correct field types
3. Required vs optional
4. Default values
5. Links between tables"
```

**Deliverable:** Fully structured Airtable base with 9 tables and sample data

**Time Estimate:** 6-8 hours

---

### **Day 2-3: Xano Setup & Authentication** ✅

- [ ] **Task 2.1:** Create Xano account (Launch plan: $25/mo trial)
- [ ] **Task 2.2:** Create new API group: "ListingBug API"
- [ ] **Task 2.3:** Connect Airtable to Xano
  - [ ] Get Airtable API key from Airtable account settings
  - [ ] Get Airtable base ID from URL
  - [ ] Add Airtable external data source in Xano
  - [ ] Test connection by querying Users table
- [ ] **Task 2.4:** Build **POST /api/auth/signup** endpoint
  - [ ] Add input validation (email format, password strength)
  - [ ] Add "Check if email exists" query to Airtable
  - [ ] Add bcrypt_hash function for password
  - [ ] Add "Create User" query to insert into Airtable Users
  - [ ] Generate UUID for user_id
  - [ ] Set default values (plan, status, trial_ends_at)
  - [ ] Generate auth token
  - [ ] Return user + token
  - [ ] Test with Postman/curl
- [ ] **Task 2.5:** Build **POST /api/auth/login** endpoint
  - [ ] Query Airtable Users by email
  - [ ] Compare password with bcrypt_compare
  - [ ] Generate auth token if match
  - [ ] Update last_login_at in Airtable
  - [ ] Return user + token
  - [ ] Test login flow
- [ ] **Task 2.6:** Build **POST /api/auth/forgot-password** endpoint
  - [ ] Query user by email
  - [ ] Generate reset token (UUID)
  - [ ] Store token with expiration (add temp table or use metadata)
  - [ ] Send email via SendGrid (configure later, mock for now)
  - [ ] Test token generation
- [ ] **Task 2.7:** Build **POST /api/auth/reset-password** endpoint
  - [ ] Validate token and expiration
  - [ ] Hash new password
  - [ ] Update password_hash in Airtable
  - [ ] Invalidate token
  - [ ] Test password reset flow
- [ ] **Task 2.8:** Build **GET /api/user/profile** endpoint
  - [ ] Validate auth token
  - [ ] Get user_id from token
  - [ ] Query Airtable Users by user_id
  - [ ] Return user data
  - [ ] Test with valid/invalid tokens
- [ ] **Task 2.9:** Build **PATCH /api/user/profile** endpoint
  - [ ] Validate auth token
  - [ ] Parse request body
  - [ ] Update Airtable Users record
  - [ ] Return updated user
  - [ ] Test profile update
- [ ] **Task 2.10:** Build **POST /api/user/onboarding/complete-step** endpoint
  - [ ] Update onboarding_step in Airtable
  - [ ] If step 9, set onboarding_completed = true
  - [ ] Return current progress
  - [ ] Test step completion

**AI Assistance Prompt:**
```
"Generate Xano visual flow for POST /api/auth/signup that:
1. Validates email format
2. Checks if email exists in Airtable
3. Hashes password with bcrypt
4. Creates user in Airtable with defaults
5. Generates auth token
6. Returns user + token"
```

**Deliverable:** Working authentication system with login/signup/password reset

**Time Estimate:** 12-16 hours

---

### **Day 4-5: Connect Frontend to Xano Auth** ✅

- [ ] **Task 3.1:** Update `/components/LoginPage.tsx`
  - [ ] Replace localStorage mock with Xano API call
  - [ ] Add fetch to `POST /api/auth/login`
  - [ ] Store authToken in localStorage
  - [ ] Handle errors (invalid credentials, network errors)
  - [ ] Test login flow end-to-end
- [ ] **Task 3.2:** Update `/components/SignUpPage.tsx`
  - [ ] Replace localStorage mock with `POST /api/auth/signup`
  - [ ] Add email validation
  - [ ] Add password strength indicator
  - [ ] Store authToken on success
  - [ ] Test signup flow
- [ ] **Task 3.3:** Update `/components/ForgotPasswordPage.tsx`
  - [ ] Connect to `POST /api/auth/forgot-password`
  - [ ] Show success message
  - [ ] Test forgot password
- [ ] **Task 3.4:** Update `/components/ResetPasswordPage.tsx`
  - [ ] Connect to `POST /api/auth/reset-password`
  - [ ] Extract token from URL query params
  - [ ] Test password reset
- [ ] **Task 3.5:** Update `/components/AccountPage.tsx`
  - [ ] Connect to `GET /api/user/profile`
  - [ ] Load user data on mount
  - [ ] Connect to `PATCH /api/user/profile`
  - [ ] Update profile form submission
  - [ ] Test profile update
- [ ] **Task 3.6:** Update `/App.tsx` authentication state
  - [ ] Check for authToken in localStorage on load
  - [ ] If token exists, call `GET /api/user/profile`
  - [ ] If valid, set isLoggedIn = true
  - [ ] If invalid, clear token and show login
  - [ ] Test persistent login
- [ ] **Task 3.7:** Update `/components/WelcomePage.tsx` onboarding
  - [ ] Connect to `POST /api/user/onboarding/complete-step`
  - [ ] Call API when step completed
  - [ ] Test onboarding progress tracking
- [ ] **Task 3.8:** Add loading states to all auth pages
  - [ ] Show spinner during API calls
  - [ ] Disable buttons while loading
  - [ ] Test UX flow
- [ ] **Task 3.9:** Add error handling
  - [ ] Display API error messages to user
  - [ ] Handle network errors gracefully
  - [ ] Test with network offline
- [ ] **Task 3.10:** End-to-end authentication testing
  - [ ] Signup → Login → Profile update → Logout → Login
  - [ ] Test on desktop and mobile
  - [ ] Test on iPad 6th Gen (iOS 16.3.1) for compatibility

**AI Assistance Prompt:**
```
"Convert my LoginPage component from localStorage to Xano API:

Current code:
[paste LoginPage.tsx handleLogin function]

Xano endpoint: POST https://my-xano-instance.xano.io/api:abc123/auth/login
Input: {email, password}
Output: {success, user, authToken}"
```

**Deliverable:** Frontend fully connected to Xano authentication

**Time Estimate:** 10-12 hours

---

### **Day 6-7: RentCast API Integration** ✅

- [ ] **Task 4.1:** Get RentCast API key
  - [ ] Sign up for RentCast account
  - [ ] Get API key from dashboard
  - [ ] Note rate limits and pricing
- [ ] **Task 4.2:** Build **POST /api/rentcast/search** in Xano
  - [ ] Parse search criteria from request
  - [ ] Build RentCast API request URL
  - [ ] Add HTTP request external API call
  - [ ] Set headers: `X-API-Key: {rentcast_key}`
  - [ ] Map search criteria to RentCast params
  - [ ] Call RentCast `/v1/listings/sale` endpoint
  - [ ] Parse response (array of listings)
  - [ ] Test with sample search
- [ ] **Task 4.3:** Implement listing caching logic
  - [ ] For each RentCast listing:
    - [ ] Check if listing_id exists in Airtable Listings Cache
    - [ ] If exists, check if cache_expires_at > now
    - [ ] If expired or new, insert/update record
    - [ ] Set cache_expires_at = now + 24 hours
  - [ ] Return combined results (cached + new)
  - [ ] Test cache hit/miss logic
- [ ] **Task 4.4:** Add data enrichment
  - [ ] Calculate `price_per_sqft` = price / square_feet
  - [ ] Add any additional calculated fields
  - [ ] Test enrichment logic
- [ ] **Task 4.5:** Map RentCast fields to ListingBug schema
  - [ ] Ensure all 40+ fields from RentCast map to Airtable
  - [ ] Handle missing/null fields gracefully
  - [ ] Test with various listing types
- [ ] **Task 4.6:** Implement search result saving
  - [ ] If user is authenticated, create Saved Search record
  - [ ] Create Search Results junction records linking search to listings
  - [ ] Update last_run_at and last_result_count
  - [ ] Test search save
- [ ] **Task 4.7:** Build **POST /api/searches** endpoint
  - [ ] Validate auth token
  - [ ] Create Airtable Saved Searches record
  - [ ] Call RentCast search
  - [ ] Cache results
  - [ ] Create Search Results junctions
  - [ ] Log activity
  - [ ] Return search + results
  - [ ] Test end-to-end
- [ ] **Task 4.8:** Build **GET /api/searches** endpoint
  - [ ] Query user's saved searches from Airtable
  - [ ] Sort by created_at DESC
  - [ ] Return searches array
  - [ ] Test retrieval
- [ ] **Task 4.9:** Build **GET /api/searches/{search_id}** endpoint
  - [ ] Query Saved Search by ID
  - [ ] Verify user ownership
  - [ ] Join with Search Results and Listings Cache
  - [ ] Return search + listings
  - [ ] Test with various searches
- [ ] **Task 4.10:** Build **POST /api/searches/{search_id}/run** endpoint
  - [ ] Get search criteria
  - [ ] Call RentCast API
  - [ ] Update cache
  - [ ] Update last_run_at in Airtable
  - [ ] Log activity
  - [ ] Return new results
  - [ ] Test re-run functionality

**AI Assistance Prompt:**
```
"Generate Xano HTTP request configuration for RentCast API:

Endpoint: GET https://api.rentcast.io/v1/listings/sale
Headers: X-API-Key: {my_key}
Query params from search criteria:
- latitude, longitude, radius
- propertyType, bedrooms, bathrooms
- priceMin, priceMax
- status
... (all 25+ params)

Map response to Airtable Listings Cache schema."
```

**Deliverable:** RentCast integration with caching

**Time Estimate:** 12-14 hours

---

## **WEEK 2: Search & Automations**

### **Day 8-9: Connect Frontend Search** ✅

- [ ] **Task 5.1:** Update `/components/SearchListings.tsx`
  - [ ] Replace mock data with Xano API calls
  - [ ] Update `handleSearch` function to call `POST /api/searches`
  - [ ] Parse API response and update state
  - [ ] Display results in table
  - [ ] Test search with various criteria
- [ ] **Task 5.2:** Implement "Save Search" functionality
  - [ ] Add save_search: true to API call when user clicks save
  - [ ] Show success toast when search saved
  - [ ] Test save flow
- [ ] **Task 5.3:** Update "Saved" tab
  - [ ] Call `GET /api/searches` when tab opens
  - [ ] Display saved searches in list
  - [ ] Test saved searches display
- [ ] **Task 5.4:** Implement "View Saved Search"
  - [ ] Call `GET /api/searches/{search_id}` when user clicks search
  - [ ] Load cached results
  - [ ] Display results
  - [ ] Test view saved search
- [ ] **Task 5.5:** Implement "Re-run Search"
  - [ ] Call `POST /api/searches/{search_id}/run`
  - [ ] Show loading indicator
  - [ ] Update results when complete
  - [ ] Test re-run
- [ ] **Task 5.6:** Add loading states
  - [ ] Show skeleton loaders during search
  - [ ] Disable search button while loading
  - [ ] Test UX
- [ ] **Task 5.7:** Add error handling
  - [ ] Display API errors to user
  - [ ] Handle RentCast API errors (rate limits, etc.)
  - [ ] Test error scenarios
- [ ] **Task 5.8:** Implement pagination (if needed)
  - [ ] Add pagination to results table
  - [ ] Test with large result sets (>100 listings)
- [ ] **Task 5.9:** Add search history
  - [ ] Display recent searches from Activity Log
  - [ ] Test history display
- [ ] **Task 5.10:** End-to-end search testing
  - [ ] Test all 25+ filter parameters
  - [ ] Test save/load/re-run flows
  - [ ] Test on mobile

**Deliverable:** Fully functional search with real data

**Time Estimate:** 12-14 hours

---

### **Day 10-11: Build Automation Backend** ✅

- [ ] **Task 6.1:** Build **POST /api/automations** endpoint
  - [ ] Validate auth token
  - [ ] Validate saved_search_id exists
  - [ ] Validate destination_type is valid
  - [ ] Create Airtable Automations record
  - [ ] Calculate next_run_at based on schedule
  - [ ] Return automation
  - [ ] Test automation creation
- [ ] **Task 6.2:** Build **GET /api/automations** endpoint
  - [ ] Query user's automations from Airtable
  - [ ] Join with Saved Searches for names
  - [ ] Return automations array
  - [ ] Test retrieval
- [ ] **Task 6.3:** Build **GET /api/automations/{automation_id}** endpoint
  - [ ] Get automation + linked search
  - [ ] Get run history from Automation Runs
  - [ ] Return full details
  - [ ] Test detail view
- [ ] **Task 6.4:** Build automation execution logic
  - [ ] Create `executeAutomation()` function:
    1. Get saved search criteria
    2. Run search via RentCast
    3. Get results
    4. Format data according to field_mappings
    5. Send to destination (start with Google Sheets)
    6. Track sent/failed records
    7. Update Automation Run record
    8. Update Automation stats
    9. Log activity
  - [ ] Test with Google Sheets destination
- [ ] **Task 6.5:** Build **POST /api/automations/{automation_id}/run** endpoint
  - [ ] Validate auth token + ownership
  - [ ] Create Automation Run record (status: Running)
  - [ ] Call executeAutomation()
  - [ ] Return run details
  - [ ] Test manual trigger
- [ ] **Task 6.6:** Implement Google Sheets integration
  - [ ] Add Google Sheets API external data source in Xano
  - [ ] Get OAuth credentials from Google Cloud Console
  - [ ] Build "Append to Sheet" function
  - [ ] Map listing fields to sheet columns
  - [ ] Test appending data to sheet
- [ ] **Task 6.7:** Implement Mailchimp integration (if time)
  - [ ] Add Mailchimp API external data source
  - [ ] Build "Add contacts to audience" function
  - [ ] Map agent fields to Mailchimp
  - [ ] Test adding contacts
- [ ] **Task 6.8:** Build **PATCH /api/automations/{automation_id}** endpoint
  - [ ] Validate auth token + ownership
  - [ ] Update Airtable record
  - [ ] Recalculate next_run_at if schedule changed
  - [ ] Return updated automation
  - [ ] Test update
- [ ] **Task 6.9:** Build **DELETE /api/automations/{automation_id}** endpoint
  - [ ] Soft delete (set status = Deleted)
  - [ ] Return success
  - [ ] Test deletion
- [ ] **Task 6.10:** Build scheduled automation trigger
  - [ ] Create Xano cron job function
  - [ ] Query Automations where next_run_at <= now AND status = Active
  - [ ] Execute each automation
  - [ ] Update next_run_at
  - [ ] Test cron execution

**AI Assistance Prompt:**
```
"Generate Xano function to:
1. Get listings from saved search
2. Map fields according to field_mappings JSON
3. Send to Google Sheets via API
4. Track success/failure for each record
5. Return summary stats"
```

**Deliverable:** Working automation system with Google Sheets

**Time Estimate:** 14-16 hours

---

### **Day 12-13: Connect Frontend Automations** ✅

- [ ] **Task 7.1:** Update `/components/CreateAutomationModal.tsx`
  - [ ] Replace localStorage with `POST /api/automations` call
  - [ ] Send automation config to API
  - [ ] Show success message
  - [ ] Close modal on success
  - [ ] Test automation creation flow
- [ ] **Task 7.2:** Update `/components/AutomationsManagementPage.tsx`
  - [ ] Call `GET /api/automations` on mount
  - [ ] Display automations in table
  - [ ] Show stats (total_runs, success rate, etc.)
  - [ ] Test automations list
- [ ] **Task 7.3:** Update `/components/AutomationDetailPage.tsx`
  - [ ] Call `GET /api/automations/{automation_id}`
  - [ ] Display automation details
  - [ ] Display run history table
  - [ ] Test detail view
- [ ] **Task 7.4:** Implement "Run Now" button
  - [ ] Call `POST /api/automations/{automation_id}/run`
  - [ ] Show loading spinner
  - [ ] Display results when complete
  - [ ] Refresh run history
  - [ ] Test manual run
- [ ] **Task 7.5:** Implement "Edit Automation"
  - [ ] Call `PATCH /api/automations/{automation_id}`
  - [ ] Update schedule, status, etc.
  - [ ] Test edit flow
- [ ] **Task 7.6:** Implement "Delete Automation"
  - [ ] Call `DELETE /api/automations/{automation_id}`
  - [ ] Remove from UI
  - [ ] Test deletion
- [ ] **Task 7.7:** Add loading states
  - [ ] Show skeletons while loading
  - [ ] Disable buttons during operations
  - [ ] Test UX
- [ ] **Task 7.8:** Add error handling
  - [ ] Display API errors
  - [ ] Handle automation failures gracefully
  - [ ] Test error scenarios
- [ ] **Task 7.9:** Update Dashboard with automation stats
  - [ ] Call `GET /api/dashboard/metrics`
  - [ ] Display automation run stats
  - [ ] Test dashboard display
- [ ] **Task 7.10:** End-to-end automation testing
  - [ ] Create automation → Run manually → View history
  - [ ] Test scheduled run (wait for cron)
  - [ ] Test on mobile

**Deliverable:** Fully functional automation system

**Time Estimate:** 10-12 hours

---

### **Day 14: Integration OAuth Flows** ✅

- [ ] **Task 8.1:** Set up Google OAuth
  - [ ] Create Google Cloud project
  - [ ] Enable Google Sheets API
  - [ ] Create OAuth credentials
  - [ ] Set redirect URI to Xano callback
  - [ ] Test OAuth flow
- [ ] **Task 8.2:** Build **POST /api/integrations/connect** endpoint
  - [ ] Generate OAuth URL for requested integration
  - [ ] Store state parameter
  - [ ] Return OAuth URL to frontend
  - [ ] Test URL generation
- [ ] **Task 8.3:** Build **GET /api/integrations/callback** endpoint
  - [ ] Validate state parameter
  - [ ] Exchange code for access_token
  - [ ] Store tokens in Airtable User Integrations (encrypted)
  - [ ] Redirect to frontend success page
  - [ ] Test OAuth callback
- [ ] **Task 8.4:** Build **GET /api/integrations** endpoint
  - [ ] Return list of available integrations
  - [ ] Mark which are connected for current user
  - [ ] Test integration list
- [ ] **Task 8.5:** Build **GET /api/integrations/connected** endpoint
  - [ ] Query user's connected integrations
  - [ ] Return list with status
  - [ ] Test connected integrations
- [ ] **Task 8.6:** Build **DELETE /api/integrations/{integration_id}** endpoint
  - [ ] Disconnect integration
  - [ ] Delete tokens from Airtable
  - [ ] Test disconnect
- [ ] **Task 8.7:** Update frontend integration pages
  - [ ] `/components/IntegrationsPage.tsx` - show available integrations
  - [ ] `/components/IntegrationConnectionModal.tsx` - handle OAuth flow
  - [ ] `/components/AccountIntegrationsTab.tsx` - show connected integrations
  - [ ] Test OAuth flow end-to-end
- [ ] **Task 8.8:** Add 2-3 more OAuth integrations
  - [ ] Mailchimp OAuth
  - [ ] Salesforce OAuth (or API key)
  - [ ] Test multiple integrations
- [ ] **Task 8.9:** Handle token refresh
  - [ ] Build token refresh logic for expired tokens
  - [ ] Test token refresh
- [ ] **Task 8.10:** Integration testing
  - [ ] Connect → Use in automation → Disconnect
  - [ ] Test all OAuth integrations

**Deliverable:** Working OAuth for 3-5 integrations

**Time Estimate:** 8-10 hours

---

## **WEEK 3: Billing, Polish & Launch**

### **Day 15-16: Stripe Integration** ✅

- [ ] **Task 9.1:** Set up Stripe account
  - [ ] Create Stripe account
  - [ ] Get API keys (test mode first)
  - [ ] Create products and prices:
    - [ ] Starter: $49/mo
    - [ ] Professional: $199/mo
    - [ ] Enterprise: $499/mo
  - [ ] Note price IDs
- [ ] **Task 9.2:** Build **POST /api/billing/create-checkout-session** endpoint
  - [ ] Validate auth token
  - [ ] Get Stripe price ID for selected plan
  - [ ] Create Stripe Checkout Session via API
  - [ ] Set success_url and cancel_url
  - [ ] Return checkout URL
  - [ ] Test checkout session creation
- [ ] **Task 9.3:** Build **POST /api/webhooks/stripe** endpoint
  - [ ] Verify webhook signature
  - [ ] Handle event types:
    - [ ] `checkout.session.completed`: Update user plan in Airtable
    - [ ] `invoice.payment_succeeded`: Log in Billing Events
    - [ ] `invoice.payment_failed`: Mark user as inactive
    - [ ] `customer.subscription.updated`: Update plan
    - [ ] `customer.subscription.deleted`: Cancel subscription
  - [ ] Return 200 OK
  - [ ] Test with Stripe CLI webhook forwarding
- [ ] **Task 9.4:** Build **GET /api/billing/subscription** endpoint
  - [ ] Get user's current plan from Airtable
  - [ ] Calculate usage stats (searches, automations, etc.)
  - [ ] Get Stripe subscription details via API
  - [ ] Return subscription info
  - [ ] Test subscription retrieval
- [ ] **Task 9.5:** Build **POST /api/billing/change-plan** endpoint
  - [ ] Validate auth token
  - [ ] Update Stripe subscription via API
  - [ ] Update plan in Airtable
  - [ ] Log billing event
  - [ ] Return success
  - [ ] Test plan change
- [ ] **Task 9.6:** Build **POST /api/billing/cancel-subscription** endpoint
  - [ ] Cancel Stripe subscription (at period end)
  - [ ] Update status in Airtable
  - [ ] Log event
  - [ ] Test cancellation
- [ ] **Task 9.7:** Update `/components/BillingPage.tsx`
  - [ ] Call `GET /api/billing/subscription` on mount
  - [ ] Display plan, usage, and billing info
  - [ ] Test billing page
- [ ] **Task 9.8:** Update `/components/ChangePlanModal.tsx`
  - [ ] Call `POST /api/billing/create-checkout-session`
  - [ ] Redirect to Stripe Checkout
  - [ ] Handle success/cancel redirects
  - [ ] Test plan upgrade
- [ ] **Task 9.9:** Update `/components/CancelSubscriptionModal.tsx`
  - [ ] Call `POST /api/billing/cancel-subscription`
  - [ ] Show confirmation
  - [ ] Test cancellation flow
- [ ] **Task 9.10:** Implement plan limits enforcement
  - [ ] Check plan limits before creating automations
  - [ ] Show upgrade prompt if limit reached
  - [ ] Test limits (Starter: 5 automations, Professional: 25)
- [ ] **Task 9.11:** Add Stripe Customer Portal
  - [ ] Build endpoint to create Customer Portal session
  - [ ] Link from billing page
  - [ ] Test portal access
- [ ] **Task 9.12:** End-to-end billing testing
  - [ ] Sign up → Subscribe → Use features → Cancel
  - [ ] Test all 3 plans
  - [ ] Test with Stripe test cards

**Deliverable:** Working Stripe billing system

**Time Estimate:** 12-14 hours

---

### **Day 17-18: Dashboard & Activity** ✅

- [ ] **Task 10.1:** Build **GET /api/dashboard/metrics** endpoint
  - [ ] Calculate metrics from Airtable:
    - [ ] Total saved searches
    - [ ] Searches this month
    - [ ] Total automations
    - [ ] Automation runs this month
    - [ ] Listings viewed (sum of all search results)
    - [ ] Active automations count
  - [ ] Get recent activity (5 items from Activity Log)
  - [ ] Get recent searches (3 items)
  - [ ] Return metrics
  - [ ] Test metrics calculation
- [ ] **Task 10.2:** Build **GET /api/activity** endpoint
  - [ ] Query Activity Log for current user
  - [ ] Sort by timestamp DESC
  - [ ] Paginate (limit + offset)
  - [ ] Return activities
  - [ ] Test pagination
- [ ] **Task 10.3:** Implement activity logging
  - [ ] Create helper function: `logActivity(user_id, action_type, description, metadata)`
  - [ ] Call from all relevant endpoints:
    - [ ] Search created/run
    - [ ] Automation created/run
    - [ ] Integration connected/disconnected
    - [ ] Profile updated
    - [ ] etc.
  - [ ] Test activity logging
- [ ] **Task 10.4:** Update `/components/Dashboard.tsx`
  - [ ] Call `GET /api/dashboard/metrics` on mount
  - [ ] Display metrics in cards
  - [ ] Show recent activity timeline
  - [ ] Show recent searches
  - [ ] Test dashboard display
- [ ] **Task 10.5:** Update activity components
  - [ ] `/components/dashboard/RecentActivitySection.tsx`
  - [ ] Display activity with icons and timestamps
  - [ ] Test activity display
- [ ] **Task 10.6:** Add real-time updates (optional)
  - [ ] Poll `/api/activity` every 30 seconds
  - [ ] Update activity feed
  - [ ] Test live updates
- [ ] **Task 10.7:** Add charts (optional)
  - [ ] Use Recharts library
  - [ ] Add automation runs chart
  - [ ] Add searches over time chart
  - [ ] Test charts
- [ ] **Task 10.8:** Dashboard testing
  - [ ] Test with new account (no data)
  - [ ] Test with active account (lots of data)
  - [ ] Test on mobile

**Deliverable:** Real-time dashboard with metrics

**Time Estimate:** 8-10 hours

---

### **Day 19: Testing & Bug Fixes** ✅

- [ ] **Task 11.1:** Comprehensive user flow testing
  - [ ] New user signup flow
    1. Sign up
    2. Complete onboarding (9 steps)
    3. Create first search
    4. Save search
    5. Create automation
    6. Subscribe to plan
  - [ ] Test on desktop
  - [ ] Test on mobile (iOS + Android)
  - [ ] Test on iPad 6th Gen (iOS 16.3.1)
- [ ] **Task 11.2:** Authentication testing
  - [ ] Test login/logout
  - [ ] Test remember me
  - [ ] Test forgot password email
  - [ ] Test password reset
  - [ ] Test session expiration
- [ ] **Task 11.3:** Search testing
  - [ ] Test all 25+ filter parameters
  - [ ] Test with 0 results
  - [ ] Test with 1000+ results
  - [ ] Test save/load/re-run
  - [ ] Test on slow network
- [ ] **Task 11.4:** Automation testing
  - [ ] Test create automation for each destination type
  - [ ] Test manual run
  - [ ] Test scheduled run (wait for cron)
  - [ ] Test edit automation
  - [ ] Test delete automation
  - [ ] Test with failed API (destination down)
- [ ] **Task 11.5:** Billing testing
  - [ ] Test subscribe to Starter
  - [ ] Test upgrade to Professional
  - [ ] Test downgrade to Starter
  - [ ] Test cancel subscription
  - [ ] Test plan limits enforcement
  - [ ] Test payment failure handling
- [ ] **Task 11.6:** Integration testing
  - [ ] Test connect Google Sheets
  - [ ] Test connect Mailchimp
  - [ ] Test connect Salesforce
  - [ ] Test disconnect integration
  - [ ] Test using integration in automation
- [ ] **Task 11.7:** Performance testing
  - [ ] Test with slow RentCast API
  - [ ] Test with large result sets (1000+ listings)
  - [ ] Test concurrent users (simulate 10 users)
  - [ ] Check Airtable API rate limits
  - [ ] Check Xano API response times
- [ ] **Task 11.8:** Security testing
  - [ ] Test authentication bypass attempts
  - [ ] Test CSRF protection
  - [ ] Test SQL injection (Airtable escaping)
  - [ ] Test XSS in user inputs
  - [ ] Verify tokens are encrypted
  - [ ] Verify passwords are hashed
- [ ] **Task 11.9:** Bug fixes
  - [ ] Document all bugs found
  - [ ] Prioritize (critical, high, medium, low)
  - [ ] Fix critical and high bugs
  - [ ] Test fixes
- [ ] **Task 11.10:** Create bug tracking sheet
  - [ ] List all known bugs
  - [ ] Track status (open, fixed, verified)
  - [ ] Note workarounds

**Deliverable:** Tested, stable application

**Time Estimate:** 10-12 hours

---

### **Day 20-21: Polish & Production Deployment** ✅

- [ ] **Task 12.1:** UI/UX polish
  - [ ] Fix any layout issues found in testing
  - [ ] Ensure all loading states work
  - [ ] Ensure all error states work
  - [ ] Verify mobile responsiveness
  - [ ] Test on multiple browsers (Chrome, Safari, Firefox)
- [ ] **Task 12.2:** Add missing features
  - [ ] Search history in SearchListings
  - [ ] Export to CSV functionality
  - [ ] User avatar upload
  - [ ] Email notifications for automation runs
  - [ ] Any other nice-to-haves
- [ ] **Task 12.3:** Performance optimization
  - [ ] Optimize images (compress, lazy load)
  - [ ] Minimize API calls (caching)
  - [ ] Add pagination where needed
  - [ ] Test load times
- [ ] **Task 12.4:** SEO setup
  - [ ] Add meta tags to all pages
  - [ ] Create sitemap.xml
  - [ ] Add robots.txt
  - [ ] Test with Google Search Console
- [ ] **Task 12.5:** Analytics setup
  - [ ] Add Google Analytics 4
  - [ ] Track key events (signup, search, automation created, subscription)
  - [ ] Set up conversion goals
  - [ ] Test tracking
- [ ] **Task 12.6:** Error monitoring setup
  - [ ] Add Sentry or similar error tracking
  - [ ] Test error reporting
- [ ] **Task 12.7:** Deploy frontend to Vercel
  - [ ] Export Figma Make code
  - [ ] Create Vercel account
  - [ ] Connect GitHub repo
  - [ ] Configure environment variables (Xano API URL)
  - [ ] Deploy to production
  - [ ] Test production URL
- [ ] **Task 12.8:** Configure Xano for production
  - [ ] Upgrade to Xano Launch plan ($85/mo)
  - [ ] Move from dev to production instance
  - [ ] Update API URLs in frontend
  - [ ] Test production API
- [ ] **Task 12.9:** Configure Airtable for production
  - [ ] Upgrade to Airtable Pro ($20/user/mo) if needed
  - [ ] Increase record limits if needed
  - [ ] Set up automated backups
- [ ] **Task 12.10:** Configure Stripe for production
  - [ ] Switch from test mode to live mode
  - [ ] Update API keys in Xano
  - [ ] Test live payment with real card
  - [ ] Set up webhook endpoint in Stripe dashboard
  - [ ] Test webhook delivery
- [ ] **Task 12.11:** Configure RentCast for production
  - [ ] Switch to production API key
  - [ ] Verify rate limits
  - [ ] Set up monitoring for API usage
- [ ] **Task 12.12:** Final production testing
  - [ ] Test complete signup → subscribe → use flow
  - [ ] Verify all integrations work
  - [ ] Test on all devices
  - [ ] Get 2-3 beta users to test
  - [ ] Fix any final issues
- [ ] **Task 12.13:** Launch checklist
  - [ ] All tests passing ✅
  - [ ] No critical bugs ✅
  - [ ] Production deployment successful ✅
  - [ ] Monitoring set up ✅
  - [ ] Beta users tested ✅
  - [ ] **GO LIVE** 🚀

**Deliverable:** ListingBug live in production

**Time Estimate:** 12-16 hours

---

## 📊 Integration Details (17 Destinations)

### **Category 1: Native Export**

#### 1. **ListingBug CSV Download**
- **Type:** File export
- **Setup:** None required
- **Data Sent:** Full listing data + agent contacts
- **Implementation:**
  - Generate CSV file in Xano
  - Return download URL
  - Store in temporary storage (24 hour expiration)

---

### **Category 2: CRM Platforms**

#### 2. **Salesforce**
- **Type:** OAuth 2.0
- **Fields Sent:**
  - Lead: Agent name, email, phone
  - Opportunity: Property address, price, MLS#
  - Custom fields: Property type, beds, baths, sqft
- **Implementation:**
  - OAuth flow to get access token
  - Create Lead via Salesforce REST API
  - Create Opportunity linked to Lead
  - Map custom fields

**Xano HTTP Request:**
```
POST https://yourinstance.salesforce.com/services/data/v58.0/sobjects/Lead
Headers: 
  Authorization: Bearer {access_token}
  Content-Type: application/json
Body:
{
  "FirstName": "Jane",
  "LastName": "Smith",
  "Email": "jane@realestate.com",
  "Phone": "+1 (555) 123-4567",
  "Company": "ABC Realty",
  "MLS_Number__c": "LA12345678",
  "Property_Type__c": "Single Family",
  "Property_Value__c": 875000
}
```

---

#### 3. **HubSpot**
- **Type:** OAuth 2.0
- **Fields Sent:**
  - Contact: Agent name, email, phone
  - Deal: Property details
  - Company: Brokerage info
- **Implementation:**
  - OAuth flow
  - Create Contact via HubSpot API
  - Create Company (if not exists)
  - Create Deal linked to Contact + Company

**Xano HTTP Request:**
```
POST https://api.hubapi.com/crm/v3/objects/contacts
Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json
Body:
{
  "properties": {
    "email": "jane@realestate.com",
    "firstname": "Jane",
    "lastname": "Smith",
    "phone": "+1 (555) 123-4567",
    "company": "ABC Realty",
    "mls_number": "LA12345678",
    "property_address": "1234 Main St, Los Angeles, CA"
  }
}
```

---

#### 4. **Pipedrive**
- **Type:** API Key
- **Fields Sent:**
  - Person: Agent info
  - Deal: Property info
  - Organization: Brokerage
- **Implementation:**
  - Create Person via Pipedrive API
  - Create Organization
  - Create Deal linked to Person + Organization

---

#### 5. **Zoho CRM**
- **Type:** OAuth 2.0
- **Fields Sent:**
  - Lead: Agent + property info
  - Contact: Agent info
  - Deal: Property details
- **Implementation:**
  - OAuth flow
  - Create Lead via Zoho API

---

### **Category 3: Email Marketing**

#### 6. **Mailchimp**
- **Type:** OAuth 2.0
- **Fields Sent:**
  - Contact: Agent email, name
  - Tags: Property type, location, price range
  - Merge fields: Custom data
- **Implementation:**
  - OAuth flow
  - Add subscriber to audience
  - Apply tags based on search criteria

**Xano HTTP Request:**
```
POST https://usX.api.mailchimp.com/3.0/lists/{audience_id}/members
Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json
Body:
{
  "email_address": "jane@realestate.com",
  "status": "subscribed",
  "merge_fields": {
    "FNAME": "Jane",
    "LNAME": "Smith",
    "PHONE": "+1 (555) 123-4567"
  },
  "tags": ["Single Family", "Los Angeles", "500k-1M"]
}
```

---

#### 7. **Constant Contact**
- **Type:** OAuth 2.0
- **Fields Sent:**
  - Contact: Agent email, name
  - Lists: Add to specific list
  - Custom fields: Property data
- **Implementation:**
  - OAuth flow
  - Create contact via API
  - Add to list

---

#### 8. **ActiveCampaign**
- **Type:** API Key
- **Fields Sent:**
  - Contact: Agent info
  - Tags: Search criteria
  - Custom fields: Property details
- **Implementation:**
  - Create contact
  - Apply tags
  - Add to automation

---

#### 9. **SendGrid**
- **Type:** API Key
- **Fields Sent:**
  - Contact: Agent email
  - Custom fields: Property data
  - Lists: Add to marketing list
- **Implementation:**
  - Add contact to list
  - Apply custom fields

---

### **Category 4: Spreadsheets & Databases**

#### 10. **Google Sheets**
- **Type:** OAuth 2.0
- **Fields Sent:**
  - All listing fields
  - One row per listing
- **Implementation:**
  - OAuth flow
  - Append row to specified sheet
  - Map fields to columns

**Xano HTTP Request:**
```
POST https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{sheet_name}:append?valueInputOption=USER_ENTERED
Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json
Body:
{
  "values": [
    [
      "1234 Main St, Los Angeles, CA",
      "$875,000",
      "3",
      "2",
      "1800",
      "Jane Smith",
      "jane@realestate.com",
      "+1 (555) 123-4567"
    ]
  ]
}
```

---

#### 11. **Airtable**
- **Type:** API Key
- **Fields Sent:**
  - All listing fields
  - One record per listing
- **Implementation:**
  - Create record via Airtable API
  - Map fields to Airtable columns

**Xano HTTP Request:**
```
POST https://api.airtable.com/v0/{base_id}/{table_id}
Headers:
  Authorization: Bearer {api_key}
  Content-Type: application/json
Body:
{
  "fields": {
    "Address": "1234 Main St, Los Angeles, CA",
    "Price": 875000,
    "Bedrooms": 3,
    "Bathrooms": 2,
    "Agent Name": "Jane Smith",
    "Agent Email": "jane@realestate.com"
  }
}
```

---

### **Category 5: Cloud Storage**

#### 12. **Dropbox**
- **Type:** OAuth 2.0
- **Fields Sent:**
  - CSV file upload
- **Implementation:**
  - Generate CSV in Xano
  - Upload to Dropbox folder via API

---

#### 13. **Google Drive**
- **Type:** OAuth 2.0
- **Fields Sent:**
  - CSV/Excel file upload
- **Implementation:**
  - Generate file in Xano
  - Upload to Drive folder via API

---

### **Category 6: Communication**

#### 14. **Slack**
- **Type:** OAuth 2.0
- **Fields Sent:**
  - Message with listing summary
  - Link to full listing details
- **Implementation:**
  - OAuth flow
  - Post message to channel via Slack API

**Xano HTTP Request:**
```
POST https://slack.com/api/chat.postMessage
Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json
Body:
{
  "channel": "#listings",
  "text": "New listing found!",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*1234 Main St, Los Angeles, CA* - $875,000\n3 bed · 2 bath · 1,800 sqft\nAgent: Jane Smith - jane@realestate.com"
      }
    }
  ]
}
```

---

#### 15. **Microsoft Teams**
- **Type:** OAuth 2.0
- **Fields Sent:**
  - Message with listing summary
  - Adaptive card
- **Implementation:**
  - OAuth flow
  - Post message to channel via Teams API

---

### **Category 7: Project Management**

#### 16. **Asana**
- **Type:** OAuth 2.0
- **Fields Sent:**
  - Task per listing
  - Custom fields: Property details
- **Implementation:**
  - OAuth flow
  - Create task via Asana API

---

#### 17. **Trello**
- **Type:** OAuth 2.0
- **Fields Sent:**
  - Card per listing
  - Labels: Property type, price range
  - Description: Full property details
- **Implementation:**
  - OAuth flow
  - Create card via Trello API

---

#### 18. **Monday.com**
- **Type:** OAuth 2.0
- **Fields Sent:**
  - Item per listing
  - Column values: Property details
- **Implementation:**
  - OAuth flow
  - Create item via Monday API

---

#### 19. **Custom Webhook**
- **Type:** URL configuration
- **Fields Sent:**
  - Full JSON payload with all listing data
- **Implementation:**
  - User provides webhook URL
  - POST JSON to URL

**Xano HTTP Request:**
```
POST {user_webhook_url}
Headers:
  Content-Type: application/json
Body:
{
  "event": "new_listing",
  "timestamp": "2024-12-19T08:00:00Z",
  "listing": {
    "id": "prop_123abc",
    "address": "1234 Main St, Los Angeles, CA",
    "price": 875000,
    "bedrooms": 3,
    "bathrooms": 2,
    "agent": {
      "name": "Jane Smith",
      "email": "jane@realestate.com",
      "phone": "+1 (555) 123-4567"
    }
    // ... all fields
  }
}
```

---

## 🔍 RentCast API Integration

### **API Documentation**

**Base URL:** `https://api.rentcast.io/v1`  
**Authentication:** API Key in header: `X-API-Key: {your_key}`  
**Rate Limits:** 
- Free tier: 100 requests/month
- Starter: 500 requests/month ($19.99/mo)
- Pro: 2,000 requests/month ($49.99/mo)

### **Endpoint: GET /listings/sale**

**Purpose:** Search for sale listings

**Query Parameters (25+ supported):**

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `latitude` | number | `34.0522` | Latitude coordinate |
| `longitude` | number | `-118.2437` | Longitude coordinate |
| `radius` | number | `10` | Search radius in miles |
| `propertyType` | string | `Single Family` | Property type |
| `bedrooms` | number | `3` | Bedroom count |
| `bathrooms` | number | `2` | Bathroom count |
| `squareFeet` | string | `1500-2500` | Square footage range |
| `lotSize` | string | `5000-10000` | Lot size range (sqft) |
| `yearBuilt` | string | `2000-2025` | Year built range |
| `price` | string | `500000-1000000` | Price range |
| `daysOnMarket` | string | `0-30` | Days on market range |
| `status` | string | `Active` | Listing status |
| `hasPool` | boolean | `true` | Has pool |
| `hasGarage` | boolean | `true` | Has garage |
| `waterfront` | boolean | `true` | Waterfront property |
| `newConstruction` | boolean | `true` | New construction |
| `foreclosure` | boolean | `true` | Foreclosure status |
| `limit` | number | `100` | Results limit (max 500) |
| `offset` | number | `0` | Pagination offset |

### **Response Format**

```json
{
  "listings": [
    {
      "id": "prop_123abc",
      "formattedAddress": "1234 Main St, Los Angeles, CA 90001",
      "addressLine1": "1234 Main St",
      "city": "Los Angeles",
      "state": "CA",
      "zipCode": "90001",
      "county": "Los Angeles County",
      "latitude": 34.0522,
      "longitude": -118.2437,
      "propertyType": "Single Family",
      "bedrooms": 3,
      "bathrooms": 2.0,
      "squareFeet": 1800,
      "lotSize": 5500,
      "yearBuilt": 2015,
      "price": 875000,
      "status": "Active",
      "daysOnMarket": 12,
      "listingDate": "2024-12-07",
      "lastSeenDate": "2024-12-19",
      "removedDate": null,
      "createdDate": "2024-12-07",
      "agent": {
        "name": "Jane Smith",
        "email": "jane@realestate.com",
        "phone": "+1 (555) 123-4567",
        "website": "https://janesmith.com"
      },
      "office": {
        "name": "ABC Realty",
        "email": "info@abcrealty.com",
        "phone": "+1 (555) 987-6543",
        "website": "https://abcrealty.com",
        "broker": "John Broker"
      },
      "mls": {
        "number": "LA12345678",
        "name": "CRMLS"
      },
      "builder": {
        "name": "XYZ Builders",
        "phone": "+1 (555) 111-2222",
        "email": "contact@xyzbuilders.com"
      }
    }
    // ... more listings
  ],
  "total": 247,
  "limit": 100,
  "offset": 0
}
```

---

## 💎 Data Enrichment Fields

**Fields ListingBug adds on top of RentCast data:**

### **Financial Enrichment**

| Field | Source | Calculation |
|-------|--------|-------------|
| `price_per_sqft` | Calculated | `price / squareFeet` |
| `hoa_fees` | Third-party API | Monthly HOA fees |
| `tax_amount` | Public records | Annual property tax |
| `price_history` | Historical tracking | Array of price changes |
| `price_reduced` | Calculated | True if price dropped in last 30 days |

### **Market Intelligence**

| Field | Source | Description |
|-------|--------|-------------|
| `foreclosure_status` | Third-party API | Pre-Foreclosure, Foreclosure, REO, None |
| `distressed` | Calculated | True if foreclosure or short sale |
| `vacancy_status` | Third-party API | Vacant, Occupied, Unknown |
| `relisted` | Calculated | True if removed and relisted |

### **Property Features**

| Field | Source | Description |
|-------|--------|-------------|
| `open_house_date` | MLS scraping | Next scheduled open house |
| `virtual_tour_url` | MLS scraping | Link to virtual tour |
| `new_construction` | Calculated | True if year_built >= current_year - 1 |

### **Location Quality**

| Field | Source | Description |
|-------|--------|-------------|
| `school_rating` | GreatSchools API | District rating (1-10) |
| `walk_score` | Walk Score API | Walkability score (0-100) |

---

## 🔗 Component-to-API Mapping

### **Authentication Components**

| Component | Xano Endpoints Used |
|-----------|---------------------|
| `LoginPage.tsx` | `POST /api/auth/login` |
| `SignUpPage.tsx` | `POST /api/auth/signup` |
| `ForgotPasswordPage.tsx` | `POST /api/auth/forgot-password` |
| `ResetPasswordPage.tsx` | `POST /api/auth/reset-password` |
| `AccountPage.tsx` | `GET /api/user/profile`, `PATCH /api/user/profile` |
| `WelcomePage.tsx` | `POST /api/user/onboarding/complete-step` |

### **Search Components**

| Component | Xano Endpoints Used |
|-----------|---------------------|
| `SearchListings.tsx` | `POST /api/searches`, `POST /api/rentcast/search` |
| `SavedListingsPage.tsx` | `GET /api/searches`, `GET /api/searches/{id}`, `POST /api/searches/{id}/run` |
| `ListingDetailModal.tsx` | No API (uses cached data from search results) |

### **Automation Components**

| Component | Xano Endpoints Used |
|-----------|---------------------|
| `CreateAutomationModal.tsx` | `POST /api/automations` |
| `AutomationsManagementPage.tsx` | `GET /api/automations`, `PATCH /api/automations/{id}`, `DELETE /api/automations/{id}` |
| `AutomationDetailPage.tsx` | `GET /api/automations/{id}`, `POST /api/automations/{id}/run` |

### **Integration Components**

| Component | Xano Endpoints Used |
|-----------|---------------------|
| `IntegrationsPage.tsx` | `GET /api/integrations` |
| `IntegrationConnectionModal.tsx` | `POST /api/integrations/connect`, `GET /api/integrations/callback` |
| `AccountIntegrationsTab.tsx` | `GET /api/integrations/connected`, `DELETE /api/integrations/{id}` |

### **Billing Components**

| Component | Xano Endpoints Used |
|-----------|---------------------|
| `BillingPage.tsx` | `GET /api/billing/subscription` |
| `ChangePlanModal.tsx` | `POST /api/billing/create-checkout-session` |
| `CancelSubscriptionModal.tsx` | `POST /api/billing/cancel-subscription` |
| `PlanComparisonModal.tsx` | No API (static data) |

### **Dashboard Components**

| Component | Xano Endpoints Used |
|-----------|---------------------|
| `Dashboard.tsx` | `GET /api/dashboard/metrics` |
| `RecentActivitySection.tsx` | `GET /api/activity` |
| `IntelligentMetricsSection.tsx` | `GET /api/dashboard/metrics` |

---

## ✅ Testing Checklist

### **User Authentication Testing**

- [ ] Sign up with valid email/password
- [ ] Sign up with invalid email (should fail)
- [ ] Sign up with weak password (should fail)
- [ ] Sign up with existing email (should fail)
- [ ] Log in with correct credentials
- [ ] Log in with wrong password (should fail)
- [ ] Log in with non-existent email (should fail)
- [ ] Test "Remember me" checkbox
- [ ] Test session persistence (close/reopen browser)
- [ ] Test logout
- [ ] Test forgot password flow
- [ ] Test password reset with valid token
- [ ] Test password reset with expired token (should fail)
- [ ] Update profile (name, company, role)
- [ ] Update email notification settings
- [ ] Test phone verification (if implemented)
- [ ] Test 2FA flow (if implemented)

### **Onboarding Testing**

- [ ] Complete all 9 onboarding steps
- [ ] Skip onboarding (should still work)
- [ ] Test each step's interaction
- [ ] Verify onboarding_completed flag set in Airtable
- [ ] Test returning user (should skip onboarding)

### **Search Testing**

- [ ] Search with only location (city, state)
- [ ] Search with lat/long coordinates
- [ ] Search with all 25+ filters
- [ ] Search with 0 results
- [ ] Search with 1 result
- [ ] Search with 1000+ results
- [ ] Test pagination (if implemented)
- [ ] Save search
- [ ] Load saved search
- [ ] Re-run saved search
- [ ] Update saved search
- [ ] Delete saved search
- [ ] Test search with slow RentCast API (loading states)
- [ ] Test search with RentCast API error
- [ ] Test cache hit (should be fast)
- [ ] Test cache miss (should call RentCast)
- [ ] Verify listing data matches RentCast response
- [ ] Verify enriched fields are calculated correctly

### **Automation Testing**

- [ ] Create automation for each destination type (17 total)
- [ ] Test with valid saved search
- [ ] Test with invalid saved search (should fail)
- [ ] Test with all schedule frequencies (realtime, hourly, daily, weekly, manual)
- [ ] Test field mapping customization
- [ ] View automation list
- [ ] View automation details
- [ ] View automation run history
- [ ] Run automation manually
- [ ] Wait for scheduled automation run (test cron)
- [ ] Edit automation (change schedule)
- [ ] Pause automation
- [ ] Resume automation
- [ ] Delete automation
- [ ] Test automation with 0 results
- [ ] Test automation with 1000+ results
- [ ] Test automation with destination API error
- [ ] Test automation with network timeout
- [ ] Verify data sent to destination matches field mapping
- [ ] Test plan limits (Starter: 5 automations, Pro: 25)
- [ ] Test automation limit modal when limit reached

### **Integration Testing**

- [ ] View available integrations
- [ ] Connect Google Sheets (OAuth)
- [ ] Connect Mailchimp (OAuth)
- [ ] Connect Salesforce (OAuth)
- [ ] Test OAuth callback redirect
- [ ] Test OAuth with user denial (should fail gracefully)
- [ ] Test API key integration (Airtable, SendGrid)
- [ ] View connected integrations
- [ ] Test using integration in automation
- [ ] Disconnect integration
- [ ] Test token refresh (wait for expiration)
- [ ] Request new integration

### **Billing Testing**

- [ ] View subscription page
- [ ] See current plan details
- [ ] See usage stats (searches, automations, integrations)
- [ ] Subscribe to Starter plan
- [ ] Subscribe to Professional plan
- [ ] Subscribe to Enterprise plan
- [ ] Test with Stripe test cards (success)
- [ ] Test with Stripe test card (failure)
- [ ] Upgrade from Starter to Professional
- [ ] Downgrade from Professional to Starter
- [ ] Cancel subscription
- [ ] Test subscription at end of billing period
- [ ] Test plan limits enforcement
- [ ] Test upgrade prompt when limit reached
- [ ] Access Stripe Customer Portal
- [ ] Update payment method
- [ ] View billing history
- [ ] Download invoice

### **Dashboard Testing**

- [ ] View dashboard metrics
- [ ] Verify search count
- [ ] Verify automation run count
- [ ] Verify listings viewed count
- [ ] View recent activity feed
- [ ] Click on activity item (should navigate)
- [ ] View recent searches
- [ ] Test with new account (0 data)
- [ ] Test with active account (lots of data)
- [ ] Test real-time updates (if implemented)

### **Mobile Testing**

- [ ] Test on iPhone (iOS Safari)
- [ ] Test on Android (Chrome)
- [ ] Test on iPad 6th Gen (iOS 16.3.1 - CRITICAL)
- [ ] Test responsive layouts
- [ ] Test touch interactions
- [ ] Test mobile navigation
- [ ] Test forms on mobile
- [ ] Test modals on mobile

### **Performance Testing**

- [ ] Measure page load times
- [ ] Measure API response times
- [ ] Test with slow network (3G)
- [ ] Test with offline network (should show error)
- [ ] Test with 1000+ listing results
- [ ] Test with 100+ saved searches
- [ ] Test concurrent users (simulate 10-20)
- [ ] Monitor Airtable API usage
- [ ] Monitor Xano API usage
- [ ] Monitor RentCast API usage

### **Security Testing**

- [ ] Test unauthenticated access to protected endpoints (should fail)
- [ ] Test accessing other user's data (should fail)
- [ ] Test SQL injection in search inputs
- [ ] Test XSS in user inputs
- [ ] Verify passwords are hashed in Airtable
- [ ] Verify OAuth tokens are encrypted
- [ ] Verify API keys are encrypted
- [ ] Test CSRF protection
- [ ] Test rate limiting
- [ ] Test Stripe webhook signature verification

---

## 🎉 Launch Criteria

### **Must Have (Critical)**

✅ **Authentication**
- [ ] Signup/login works
- [ ] Password reset works
- [ ] Session persistence works

✅ **Search**
- [ ] RentCast API integration works
- [ ] All 25+ filters work
- [ ] Save/load searches works
- [ ] Results display correctly

✅ **Automations**
- [ ] Create automation works
- [ ] Manual run works
- [ ] Scheduled runs work (cron)
- [ ] At least 3 destinations work (Google Sheets, Mailchimp, Salesforce)

✅ **Billing**
- [ ] Stripe checkout works
- [ ] Webhooks work
- [ ] Plan limits enforced
- [ ] Subscription management works

✅ **Integrations**
- [ ] OAuth flow works for 3+ integrations
- [ ] Tokens stored securely
- [ ] Disconnect works

✅ **Dashboard**
- [ ] Metrics display correctly
- [ ] Activity feed works

✅ **Mobile**
- [ ] Works on iOS Safari
- [ ] Works on Android Chrome
- [ ] Works on iPad 6th Gen iOS 16.3.1

✅ **Performance**
- [ ] Page load < 3 seconds
- [ ] API response < 2 seconds
- [ ] No critical errors in Sentry

✅ **Security**
- [ ] All passwords hashed
- [ ] All tokens encrypted
- [ ] Authentication enforced
- [ ] No security vulnerabilities

### **Should Have (High Priority)**

- [ ] All 17 destinations work
- [ ] Email notifications work
- [ ] Export to CSV works
- [ ] User avatar upload works
- [ ] SEO meta tags set
- [ ] Analytics tracking works
- [ ] Error monitoring works

### **Nice to Have (Medium Priority)**

- [ ] Real-time dashboard updates
- [ ] Charts and visualizations
- [ ] Advanced search filters
- [ ] Bulk operations
- [ ] Team features
- [ ] API access for users

---

## 🆘 Getting Help

### **AI Assistance Prompts**

When stuck, use these prompts with AI assistants:

**For Airtable:**
```
"I'm building ListingBug in Airtable. I need to create a table called [TABLE_NAME] with these fields:
[List fields with types]

What's the best way to structure this? Should I use linked records or JSON fields for [SPECIFIC_FIELD]?"
```

**For Xano:**
```
"I need to build a Xano API endpoint:
POST /api/[ENDPOINT_NAME]

It should:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Generate the Xano visual flow blocks for this."
```

**For Frontend:**
```
"Update my React component [COMPONENT_NAME] to call Xano API:

Current code:
[Paste component code]

Xano endpoint: POST /api/[ENDPOINT]
Input: {field1, field2}
Output: {response}

How should I modify the code?"
```

**For Integration:**
```
"I need to integrate [INTEGRATION_NAME] with Xano.

The integration requires:
- Auth type: [OAuth/API Key]
- Endpoint: [URL]
- Fields to send: [List]

Generate the HTTP request configuration for Xano."
```

---

## 📚 Documentation Links

**Airtable:**
- API Docs: https://airtable.com/developers/web/api/introduction
- Field types: https://airtable.com/developers/web/api/field-model

**Xano:**
- Docs: https://docs.xano.com/
- API Reference: https://docs.xano.com/api-reference/introduction
- Video tutorials: https://www.youtube.com/@xano/videos

**RentCast:**
- API Docs: https://developers.rentcast.io/reference/overview
- Listings endpoint: https://developers.rentcast.io/reference/listings-sale

**Stripe:**
- Docs: https://stripe.com/docs
- Checkout: https://stripe.com/docs/payments/checkout
- Webhooks: https://stripe.com/docs/webhooks

**Vercel:**
- Docs: https://vercel.com/docs
- Deployment: https://vercel.com/docs/deployments/overview

---

## 🏁 Final Notes

**This guide is designed to be:**
- ✅ Comprehensive (every detail included)
- ✅ Actionable (step-by-step checklists)
- ✅ Beginner-friendly (assumes AI-assisted development)
- ✅ Production-ready (covers deployment and monitoring)

**Estimated Total Time: 2-3 weeks**
- Week 1: 40-50 hours (Foundation, Auth, Search, RentCast)
- Week 2: 35-45 hours (Automations, Integrations, Dashboard)
- Week 3: 30-40 hours (Billing, Testing, Deployment)

**Total: 105-135 hours of focused work**

**For a full-time developer (8 hours/day):** 13-17 days = **2-3 weeks**  
**For a part-time developer (4 hours/day):** 26-34 days = **4-5 weeks**

---

**Last Updated:** December 19, 2024  
**Report Version:** 1.0  
**Next Update:** After Week 1 completion

---

**Questions? Use this prompt with any AI:**
```
"I'm building ListingBug using Airtable + Xano. I'm on Week [X], Day [Y], Task [Z].

[Describe your issue or question]

Refer to /AI_HANDOFF_AIRTABLE_XANO.md for full context."
```

**Good luck! You've got this! 🚀**
