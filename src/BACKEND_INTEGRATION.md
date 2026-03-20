# ListingBug Backend Integration Guide

## Overview

This document provides comprehensive guidance for integrating backend services with the ListingBug frontend application. It includes API endpoint specifications, data schemas, authentication flows, and integration points throughout the application.

---

## Table of Contents

1. [Authentication & User Management](#authentication--user-management)
2. [Report Management](#report-management)
3. [Data Endpoints](#data-endpoints)
4. [API Integration Points](#api-integration-points)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [Error Handling](#error-handling)
7. [State Management](#state-management)
8. [Third-Party Integrations](#third-party-integrations)

---

## Authentication & User Management

### Sign Up Endpoint

**Endpoint**: `POST /api/auth/signup`

**Request Body**:
```json
{
  "name": "string",           // DYNAMIC: SignUpPage_Input_Name
  "email": "string",          // DYNAMIC: SignUpPage_Input_Email
  "password": "string",       // DYNAMIC: SignUpPage_Input_Password
  "confirmPassword": "string" // DYNAMIC: SignUpPage_Input_ConfirmPassword
}
```

**Response** (Success):
```json
{
  "success": true,
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "plan": "Professional",
    "status": "Trial",
    "createdAt": "ISO 8601 date"
  },
  "token": "JWT token string"
}
```

**Response** (Error):
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS | WEAK_PASSWORD | VALIDATION_ERROR",
    "message": "string"
  }
}
```

**Frontend Integration**:
- File: `/components/SignUpPage.tsx`
- Button: `SignUpPage_Button_CreateAccount`
- Workflow: On click → Validate inputs → Call API → Store token → Navigate to Dashboard
- Error Display: `SignUpPage_Alert_Error`

---

### Social Sign-In Endpoints

**Google OAuth**:
- Endpoint: `POST /api/auth/google`
- Button: `SignUpPage_Button_Google`
- Workflow: Redirect to Google OAuth → Receive token → Create/login user

**Apple Sign-In**:
- Endpoint: `POST /api/auth/apple`
- Button: `SignUpPage_Button_Apple`
- Workflow: Similar to Google OAuth

**Facebook Login**:
- Endpoint: `POST /api/auth/facebook`
- Button: `SignUpPage_Button_Facebook`
- Workflow: Similar to Google OAuth

**Response Format** (All):
```json
{
  "success": true,
  "user": { /* User object */ },
  "token": "JWT token",
  "isNewUser": boolean
}
```

---

### Login Endpoint

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "string",    // DYNAMIC: LoginPage_Input_Email
  "password": "string"  // DYNAMIC: LoginPage_Input_Password
}
```

**Response** (Success):
```json
{
  "success": true,
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "plan": "Professional | Enterprise",
    "status": "Active | Trial",
    "company": "string",
    "role": "string"
  },
  "token": "JWT token string"
}
```

**Frontend Integration**:
- File: `/components/LoginPage.tsx`
- Button: `LoginPage_Button_SignIn`
- Workflow: Validate → API call → Store token → Navigate to Dashboard
- Error Display: `LoginPage_Alert_Error`

---

### Get Current User

**Endpoint**: `GET /api/auth/me`

**Headers**:
```
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "string",
    "name": "string",           // DYNAMIC: Header_Avatar_Name
    "email": "string",          // DYNAMIC: AccountPage_Display_Email
    "plan": "string",           // DYNAMIC: AccountPage_Display_Plan
    "status": "string",         // DYNAMIC: AccountPage_Display_Status
    "company": "string",        // DYNAMIC: AccountPage_Input_Company
    "role": "string",           // DYNAMIC: AccountPage_Input_Role
    "avatar": "url | null",     // DYNAMIC: Header_Avatar_Image
    "createdAt": "ISO 8601",
    "preferences": {
      "emailNotifications": boolean,
      "smsNotifications": boolean
    }
  }
}
```

**Frontend Integration**:
- Called on: App load, page refresh
- Updates: User state, Header avatar, Account page

---

### Update User Profile

**Endpoint**: `PATCH /api/users/profile`

**Request Body**:
```json
{
  "name": "string",      // DYNAMIC: AccountPage_Input_Name
  "company": "string",   // DYNAMIC: AccountPage_Input_Company
  "role": "string"       // DYNAMIC: AccountPage_Input_Role
}
```

**Frontend Integration**:
- File: `/components/AccountPage.tsx`
- Button: `AccountPage_Button_SaveChanges`
- Workflow: Collect form data → API call → Update local state → Show success message

---

### Change Password

**Endpoint**: `POST /api/users/change-password`

**Request Body**:
```json
{
  "currentPassword": "string",  // DYNAMIC: AccountPage_Input_CurrentPassword
  "newPassword": "string",      // DYNAMIC: AccountPage_Input_NewPassword
  "confirmPassword": "string"   // DYNAMIC: AccountPage_Input_ConfirmPassword
}
```

**Frontend Integration**:
- File: `/components/AccountPage.tsx`
- Button: `AccountPage_Button_UpdatePassword`
- Workflow: Validate → API call → Clear form → Show success message

---

## Report Management

### Create Report Endpoint

**Endpoint**: `POST /api/reports`

**Request Body**:
```json
{
  // STEP 1: Location & Property Type
  "name": "string",                    // DYNAMIC: NewReport_Step1_Input_Name
  "location": "string",                // DYNAMIC: NewReport_Step1_Input_Location
  "searchRadius": number,              // DYNAMIC: NewReport_Step1_Select_Radius
  "propertyTypes": ["string"],         // DYNAMIC: NewReport_Step1_Checkboxes_PropertyTypes
  
  // STEP 2: Criteria & Filters
  "bedrooms": "string",                // DYNAMIC: NewReport_Step2_Select_Bedrooms
  "bathrooms": "string",               // DYNAMIC: NewReport_Step2_Select_Bathrooms
  "priceMin": number | null,           // DYNAMIC: NewReport_Step2_Input_PriceMin
  "priceMax": number | null,           // DYNAMIC: NewReport_Step2_Input_PriceMax
  "sqftMin": number | null,            // DYNAMIC: NewReport_Step2_Input_SqftMin
  "sqftMax": number | null,            // DYNAMIC: NewReport_Step2_Input_SqftMax
  "yearBuiltMin": number | null,       // DYNAMIC: NewReport_Step2_Input_YearMin
  "yearBuiltMax": number | null,       // DYNAMIC: NewReport_Step2_Input_YearMax
  "features": ["string"],              // DYNAMIC: NewReport_Step2_Checkboxes_Features
  
  // STEP 3: Schedule & Automation
  "automated": boolean,                // DYNAMIC: NewReport_Step3_Toggle_Automation
  "frequency": "Daily | Weekly | Monthly" | null,  // DYNAMIC: NewReport_Step3_Select_Frequency
  "emailNotifications": boolean,       // DYNAMIC: NewReport_Step3_Checkbox_Email
  "exportFormat": "CSV | Excel | PDF", // DYNAMIC: NewReport_Step3_Select_Format
  
  "status": "Active"
}
```

**Response**:
```json
{
  "success": true,
  "report": {
    "id": "string",
    "name": "string",
    "location": "string",
    "criteria": "string",        // Auto-generated summary
    "results": 0,
    "automated": boolean,
    "lastRun": null,
    "createdAt": "ISO 8601",
    "status": "Active"
  }
}
```

**Frontend Integration**:
- File: `/components/NewReport.tsx`
- Button: `NewReport_Step4_Button_CreateReport`
- Workflow: Multi-step form → Collect all data → API call → Navigate to My Reports
- Success Message: `MyReports_Alert_Success`

---

### Get All Reports

**Endpoint**: `GET /api/reports`

**Query Parameters**:
```
?status=Active|Paused|All
&automated=true|false
&page=1
&limit=50
&sort=lastRun|createdAt|name
&order=desc|asc
```

**Response**:
```json
{
  "success": true,
  "reports": [
    {
      "id": "string",
      "name": "string",              // DYNAMIC: ReportCard_Title
      "location": "string",          // DYNAMIC: ReportCard_Location
      "criteria": "string",          // DYNAMIC: ReportCard_Criteria
      "results": number,             // DYNAMIC: ReportCard_ResultsCount
      "automated": boolean,          // DYNAMIC: ReportCard_Badge_Automated (conditional)
      "hasDownload": boolean,        // DYNAMIC: ReportCard_Badge_Ready (conditional)
      "lastRun": "string",           // DYNAMIC: ReportCard_LastRun (relative time)
      "createdAt": "ISO 8601",
      "status": "Active | Paused"
    }
  ],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

**Frontend Integration**:
- File: `/components/MyReports.tsx`
- Component: `ReportCard` (repeatable)
- Data Binding: Map each report to ReportCard component
- Loading State: `MyReports_LoadingState`
- Empty State: `MyReports_EmptyState`

---

### Get Single Report

**Endpoint**: `GET /api/reports/:id`

**Response**:
```json
{
  "success": true,
  "report": {
    "id": "string",
    "name": "string",
    "location": "string",
    "searchRadius": number,
    "propertyTypes": ["string"],
    "bedrooms": "string",
    "bathrooms": "string",
    "priceMin": number | null,
    "priceMax": number | null,
    "sqftMin": number | null,
    "sqftMax": number | null,
    "yearBuiltMin": number | null,
    "yearBuiltMax": number | null,
    "features": ["string"],
    "automated": boolean,
    "frequency": "string" | null,
    "emailNotifications": boolean,
    "exportFormat": "string",
    "status": "Active | Paused",
    "results": number,
    "lastRun": "ISO 8601" | null,
    "createdAt": "ISO 8601",
    "updatedAt": "ISO 8601"
  }
}
```

**Frontend Integration**:
- File: `/components/ReportDetailsModal.tsx`
- Tab: `ReportModal_Tab_Preferences`
- Data Binding: Populate all form fields with report data
- Editable: All fields except ID, createdAt

---

### Update Report

**Endpoint**: `PATCH /api/reports/:id`

**Request Body**: (Same structure as Create, only include changed fields)

**Frontend Integration**:
- File: `/components/ReportDetailsModal.tsx`
- Button: `ReportModal_Button_SaveChanges`
- Workflow: Collect changed fields → API call → Update local state → Close modal

---

### Delete Report

**Endpoint**: `DELETE /api/reports/:id`

**Response**:
```json
{
  "success": true,
  "message": "Report deleted successfully"
}
```

**Frontend Integration**:
- File: `/components/ReportDetailsModal.tsx`
- Button: `ReportModal_Button_Delete`
- Workflow: Show confirmation → API call → Remove from list → Close modal → Navigate if needed

---

### Run Report Manually

**Endpoint**: `POST /api/reports/:id/run`

**Response**:
```json
{
  "success": true,
  "run": {
    "id": "string",
    "reportId": "string",
    "status": "InProgress",
    "startedAt": "ISO 8601"
  }
}
```

**Frontend Integration**:
- File: `/components/ReportDetailsModal.tsx`
- Button: `ReportModal_Button_RunNow`
- Workflow: API call → Show loading → Poll for completion → Update UI

---

### Get Report History

**Endpoint**: `GET /api/reports/:id/runs`

**Query Parameters**:
```
?page=1
&limit=20
&sort=runDate
&order=desc
```

**Response**:
```json
{
  "success": true,
  "runs": [
    {
      "id": "string",
      "reportId": "string",
      "runDate": "ISO 8601",           // DYNAMIC: ReportHistory_Row_Date
      "resultsCount": number,          // DYNAMIC: ReportHistory_Row_Results
      "status": "Success | Failed",    // DYNAMIC: ReportHistory_Row_Status
      "downloadUrl": "string" | null,  // DYNAMIC: ReportHistory_Button_Download (conditional)
      "errorMessage": "string" | null
    }
  ],
  "pagination": { /* Same as above */ }
}
```

**Frontend Integration**:
- File: `/components/ReportDetailsModal.tsx`
- Tab: `ReportModal_Tab_History`
- Component: Table with repeatable rows
- Loading State: `ReportHistory_LoadingState`
- Empty State: `ReportHistory_EmptyState`

---

## Data Endpoints

### Get Dashboard Metrics

**Endpoint**: `GET /api/dashboard/metrics`

**Response**:
```json
{
  "success": true,
  "metrics": {
    "marketTemperature": {
      "value": "Hot",                    // DYNAMIC: Dashboard_Metric_MarketTemp_Value ("Cold", "Cool", "Warm", "Hot", "Very Hot")
      "score": 8.5,                      // DYNAMIC: Numeric score 0-10
      "change": 12,                      // DYNAMIC: Percent change from last period
      "trend": "up",                     // DYNAMIC: "up" | "down" | "neutral"
      "insight": "High demand, low inventory"  // DYNAMIC: AI-generated insight
    },
    "freshListings": {
      "count": 127,                      // DYNAMIC: Dashboard_Metric_FreshListings_Count
      "change": 18,                      // DYNAMIC: Percent change from last period
      "trend": "up",                     // DYNAMIC: "up" | "down" | "neutral"
      "timeframe": "48h"                 // DYNAMIC: Time window
    },
    "priceMovement": {
      "percent": 3.2,                    // DYNAMIC: Dashboard_Metric_PriceMovement_Percent
      "average": 524000,                 // DYNAMIC: Average list price
      "change": 16200,                   // DYNAMIC: Dollar change
      "trend": "up",                     // DYNAMIC: "up" | "down" | "neutral"
      "period": "30d"                    // DYNAMIC: Calculation period
    },
    "marketVelocity": {
      "days": 22,                        // DYNAMIC: Dashboard_Metric_MarketVelocity_Days
      "change": -18,                     // DYNAMIC: Percent change (negative = faster)
      "trend": "down",                   // DYNAMIC: "up" | "down" | "neutral" (down = faster = good)
      "previousDays": 27                 // DYNAMIC: Previous period comparison
    },
    "hotOpportunities": {
      "count": 43,                       // DYNAMIC: Dashboard_Metric_HotOpportunities_Count
      "change": 35,                      // DYNAMIC: Percent change from last period
      "trend": "up",                     // DYNAMIC: "up" | "down" | "neutral"
      "averageReduction": 18500,         // DYNAMIC: Average price reduction amount
      "period": "7d"                     // DYNAMIC: Time window
    },
    "reportAlerts": {
      "count": 18,                       // DYNAMIC: Dashboard_Metric_ReportAlerts_Count
      "change": 20,                      // DYNAMIC: Percent change from last period
      "trend": "up",                     // DYNAMIC: "up" | "down" | "neutral"
      "byReport": {                      // DYNAMIC: Breakdown by report
        "report_123": 7,
        "report_456": 6,
        "report_789": 5
      }
    }
  },
  "lastUpdated": "2024-11-23T14:22:00Z"  // DYNAMIC: ISO timestamp
}
```

**Metric Calculations**:

1. **Market Temperature**:
   - Algorithm: Weighted score (0-10) based on:
     - Days on market (lower = hotter) - 30% weight
     - New listings vs inventory ratio - 25% weight
     - Price trends - 25% weight
     - Sale velocity - 20% weight
   - Scale: 0-3 = "Cold", 3-5 = "Cool", 5-7 = "Warm", 7-9 = "Hot", 9-10 = "Very Hot"
   - Updates: Every 15 minutes

2. **Fresh Listings**:
   - Count: Properties with listingDate within last 48 hours
   - Change: Compare to same 48h period one week ago
   - Breakdown: By property type (Single Family, Condo, Townhouse, etc.)

3. **Price Movement**:
   - Average: Mean of all active listing prices in last 30 days
   - Change: Percentage difference from previous 30 days
   - Also track: Median price, price per sqft trends

4. **Market Velocity**:
   - Days: Average daysOnMarket for properties sold/pending in last 30 days
   - Change: Percentage faster/slower than previous 30 days
   - Note: Lower is better (indicates faster market)

5. **Hot Opportunities**:
   - Count: Properties with price reductions in last 7 days
   - Include: Properties with price/sqft >10% below market average
   - Flag: Properties with >20 days on market + recent price drop

6. **Report Alerts**:
   - Count: New properties matching user's saved report criteria
   - Period: Since last check (usually 24 hours)
   - Breakdown: Group by report ID with match counts

**Frontend Integration**:
- File: `/components/dashboard/IntelligentMetricsSection.tsx`
- Component: Metric cards with click-to-expand
- Loading State: `Dashboard_Metrics_LoadingState`
- Refresh: Every 15 minutes (optional auto-refresh)

---

### Get Metric Details

**Endpoint**: `GET /api/metrics/{metricType}/details`

**Metric Types**:
- `market-temperature`
- `fresh-listings`
- `price-movement`
- `market-velocity`
- `hot-opportunities`
- `report-alerts`

**Response Example** (Fresh Listings):
```json
{
  "success": true,
  "metric": {
    "type": "fresh-listings",
    "title": "Fresh Listings",
    "summary": "Properties listed in the last 48 hours",
    "primaryValue": "127 New",
    "trend": "up",
    "trendPercent": 18,
    "breakdown": [
      {
        "label": "Single Family",
        "value": 78,
        "trend": "up",
        "trendPercent": 15
      },
      {
        "label": "Condo",
        "value": 32,
        "trend": "up",
        "trendPercent": 25
      },
      {
        "label": "Townhouse",
        "value": 17,
        "trend": "neutral"
      }
    ],
    "properties": [
      {
        "id": "prop_123",
        "address": "2847 Riverside Drive",
        "city": "Austin",
        "state": "TX",
        "price": 675000,
        "beds": 4,
        "baths": 3,
        "sqft": 2850,
        "pricePerSqft": 237,
        "daysOnMarket": 0,
        "listingDate": "2024-11-23T08:00:00Z",
        "propertyType": "Single Family"
      }
      // ... more properties
    ],
    "chart": {
      "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      "values": [45, 52, 48, 61, 55, 67, 58]
    },
    "insights": [
      "18% more new listings compared to the same period last week.",
      "Average price of new listings is $498K, 5% below market average.",
      "Single family homes dominate new inventory at 61% of listings."
    ]
  }
}
```

**Frontend Integration**:
- File: `/components/MetricDetailsPanel.tsx`
- Trigger: Click on metric card in dashboard
- Display: Side panel with detailed breakdown
- Features: Property list, charts, insights, export options

---

### Get Recent Activity

**Endpoint**: `GET /api/activity/recent`

**Query Parameters**:
```
?limit=5
```

**Response**:
```json
{
  "success": true,
  "activities": [
    {
      "id": "string",
      "action": "string",      // DYNAMIC: Dashboard_Activity_Action
      "location": "string",    // DYNAMIC: Dashboard_Activity_Location
      "timestamp": "ISO 8601", // DYNAMIC: Dashboard_Activity_Time (relative)
      "reportId": "string" | null
    }
  ]
}
```

**Frontend Integration**:
- File: `/components/Dashboard.tsx`
- Section: Recent Activity card
- Component: List with repeatable items
- Empty State: `Dashboard_Activity_EmptyState`

---

### Get Top Locations

**Endpoint**: `GET /api/reports/top-locations`

**Query Parameters**:
```
?limit=5
```

**Response**:
```json
{
  "success": true,
  "locations": [
    {
      "location": "string",    // DYNAMIC: Dashboard_Location_Name
      "listingsCount": number, // DYNAMIC: Dashboard_Location_Count
      "change": "string"       // DYNAMIC: Dashboard_Location_Change
    }
  ]
}
```

**Frontend Integration**:
- File: `/components/Dashboard.tsx`
- Section: Top Locations card
- Component: List with repeatable items
- Empty State: `Dashboard_Locations_EmptyState`

---

## API Integration Points

### Component-Level Integration Map

#### Header Component
**File**: `/components/Header.tsx`

**Dynamic Elements**:
- `Header_Avatar_Image`: User avatar (if available)
- `Header_Avatar_Fallback`: User initials from name

**API Calls**:
- None (uses global user state)

**Workflows**:
- Logout button → `POST /api/auth/logout` → Clear token → Navigate to home

---

#### Dashboard Component
**File**: `/components/Dashboard.tsx`

**Dynamic Elements**:
- `Dashboard_Metrics_*`: 4 metric cards (see above)
- `Dashboard_RecentReports_List`: Recent 3 reports
- `Dashboard_Activity_List`: Recent 5 activities
- `Dashboard_Locations_List`: Top 5 locations

**API Calls on Load**:
1. `GET /api/dashboard/metrics`
2. `GET /api/reports?limit=3&sort=lastRun&order=desc`
3. `GET /api/activity/recent?limit=5`
4. `GET /api/reports/top-locations?limit=5`

**Loading State**: Show skeleton loaders for each section
**Error State**: Show error message with retry button
**Refresh**: Optional auto-refresh every 5 minutes

---

#### MyReports Component
**File**: `/components/MyReports.tsx`

**Dynamic Elements**:
- `MyReports_Tabs`: All/Automated/Manual filters
- `MyReports_ReportList`: Repeatable ReportCard components
- `MyReports_EmptyState`: When no reports exist

**API Calls**:
- On Load: `GET /api/reports`
- On Tab Switch: `GET /api/reports?automated=true|false`

**Search/Filter** (Future):
- `MyReports_Search_Input` → `GET /api/reports?search={query}`

**Pagination** (Future):
- `MyReports_Pagination_*` → `GET /api/reports?page={page}`

---

#### NewReport Component
**File**: `/components/NewReport.tsx`

**Dynamic Elements**: (See Create Report endpoint above)

**API Calls**:
- On Submit (Step 4): `POST /api/reports`

**Workflows**:
1. User fills Step 1 → Click Next → Validate → Show Step 2
2. User fills Step 2 → Click Next → Validate → Show Step 3
3. User fills Step 3 → Click Next → Show Step 4 (Review)
4. User clicks Create Report → Validate all → API call → Navigate to My Reports

**Validation**:
- Step 1: Name, Location, at least 1 property type
- Step 2: Min < Max for all ranges
- Step 3: Frequency required if automated = true
- Step 4: No additional validation

---

#### ReportDetailsModal Component
**File**: `/components/ReportDetailsModal.tsx`

**Dynamic Elements**:
- `ReportModal_Tab_Preferences`: All report settings (editable)
- `ReportModal_Tab_History`: Report run history (read-only)

**API Calls**:
- On Open: `GET /api/reports/:id` (if not already loaded)
- On Open (History tab): `GET /api/reports/:id/runs`
- On Save: `PATCH /api/reports/:id`
- On Delete: `DELETE /api/reports/:id`
- On Run Now: `POST /api/reports/:id/run`

---

#### AccountPage Component
**File**: `/components/AccountPage.tsx`

**Dynamic Elements**:
- `AccountPage_Input_Name`: User name
- `AccountPage_Input_Email`: User email (read-only or requires verification)
- `AccountPage_Input_Company`: Company name
- `AccountPage_Input_Role`: User role
- `AccountPage_Display_Plan`: Current plan (read-only)
- `AccountPage_Display_Status`: Account status (read-only)

**API Calls**:
- On Load: Uses global user state
- On Save Profile: `PATCH /api/users/profile`
- On Change Password: `POST /api/users/change-password`
- On Update Preferences: `PATCH /api/users/preferences`

**Workflows**:
- Profile Update: Change fields → Click Save → API call → Update state → Show success
- Password Change: Fill form → Validate → API call → Clear form → Show success
- Logout: Click Logout → `POST /api/auth/logout` → Clear token → Navigate to home

---

## Data Flow Diagrams

### Authentication Flow

```
1. User Signup
   SignUpPage
   ↓ Submit form
   POST /api/auth/signup
   ↓ Success
   Store token in localStorage/cookie
   ↓
   Update global user state
   ↓
   Navigate to Dashboard

2. User Login
   LoginPage
   ↓ Submit form
   POST /api/auth/login
   ↓ Success
   Store token in localStorage/cookie
   ↓
   Update global user state
   ↓
   Navigate to Dashboard

3. Session Restore
   App loads
   ↓ Check for token
   If token exists:
   ↓
   GET /api/auth/me
   ↓ Success
   Update global user state
   ↓
   User sees authenticated UI
```

---

### Report Creation Flow

```
NewReport Page (Step 1)
↓ User fills location & property types
↓ Click Next
Validate inputs
↓ Valid
Show Step 2
↓ User fills criteria
↓ Click Next
Validate inputs
↓ Valid
Show Step 3
↓ User configures automation
↓ Click Next
Show Step 4 (Review)
↓ User reviews all settings
↓ Click Create Report
POST /api/reports
↓ Success
Navigate to My Reports
↓
Show new report in list
```

---

### Report Management Flow

```
My Reports Page
↓ Load on mount
GET /api/reports
↓ Success
Render ReportCard for each report
↓
User clicks "Edit" or "History"
↓
Open ReportDetailsModal
├─→ Preferences Tab
│   ↓ User edits fields
│   ↓ Click Save
│   PATCH /api/reports/:id
│   ↓ Success
│   Update local report data
│   Close modal
│
└─→ History Tab
    ↓ Load history
    GET /api/reports/:id/runs
    ↓ Success
    Render history table
    ↓
    User clicks Download
    ↓
    Download file from downloadUrl
```

---

## Error Handling

### Error Response Format

All API endpoints should return errors in this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "field": "fieldName" // Optional, for validation errors
  }
}
```

### Common Error Codes

| Code | Meaning | HTTP Status |
|------|---------|-------------|
| `UNAUTHORIZED` | Invalid or missing token | 401 |
| `FORBIDDEN` | User lacks permission | 403 |
| `NOT_FOUND` | Resource doesn't exist | 404 |
| `VALIDATION_ERROR` | Invalid input data | 400 |
| `EMAIL_EXISTS` | Email already registered | 400 |
| `WEAK_PASSWORD` | Password too weak | 400 |
| `INVALID_CREDENTIALS` | Wrong email/password | 401 |
| `RATE_LIMIT` | Too many requests | 429 |
| `SERVER_ERROR` | Internal server error | 500 |

### Frontend Error Handling

**Pattern**:
```typescript
try {
  const response = await fetch('/api/endpoint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  
  const result = await response.json();
  
  if (!result.success) {
    // Show error to user
    showErrorAlert(result.error.message);
    return;
  }
  
  // Handle success
  handleSuccess(result);
  
} catch (error) {
  // Network error or JSON parse error
  showErrorAlert('Unable to connect. Please try again.');
}
```

**Error Display Locations**:
- **Form-level errors**: Alert at top of form
- **Field-level errors**: Red text below specific field
- **Page-level errors**: Error state component
- **Global errors**: Toast notification

---

## State Management

### Global State (App.tsx)

**User State**:
```typescript
{
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  company: string;
  role: string;
  avatar: string | null;
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
}
```

**Auth State**:
```typescript
{
  isLoggedIn: boolean;
  token: string | null;
}
```

**Reports State** (Optional local cache):
```typescript
{
  reports: Report[];
  lastFetched: Date;
}
```

### Local Storage

**Keys**:
- `listingbug_auth_token`: JWT token
- `listingbug_user`: User object (optional, for quick load)

**Clear on**:
- Logout
- Token expiration
- Auth error (401)

---

## Third-Party Integrations

### CRM & Email Marketing Integrations

ListingBug supports connecting to popular CRM and email marketing platforms to automatically sync leads, contacts, and send updates. All integrations are managed through the Account Settings > Integrations tab.

**Frontend Components**:
- `/components/IntegrationsPage.tsx` - Main integrations dashboard
- `/components/IntegrationConnectionModal.tsx` - OAuth and API key authentication
- `/components/IntegrationDetailsPanel.tsx` - Manage connected integrations

---

#### List All Integrations

**Endpoint**: `GET /api/integrations`

**Purpose**: Get all available integrations with user's connection status

**Response**:
```json
{
  "success": true,
  "integrations": [
    {
      "id": "salesforce",
      "name": "Salesforce",
      "category": "crm",
      "description": "Sync leads and contacts automatically to your Salesforce CRM",
      "authType": "oauth",
      "status": "connected",                          // DYNAMIC: Integration_Status
      "connectedAt": "2024-11-15T10:30:00Z",         // DYNAMIC: Integration_ConnectedAt
      "lastSync": "2024-11-23T08:15:00Z",            // DYNAMIC: Integration_LastSync
      "features": [
        "Auto-sync new leads from reports",
        "Update contact information",
        "Create opportunities from listings",
        "Bi-directional sync"
      ]
    },
    {
      "id": "hubspot",
      "name": "HubSpot",
      "category": "crm",
      "status": "available",                          // DYNAMIC: Not connected
      "authType": "oauth"
    },
    {
      "id": "mailchimp",
      "name": "Mailchimp",
      "category": "email",
      "status": "connected",
      "authType": "oauth"
    }
    // ... more integrations
  ]
}
```

**Categories**:
- `crm`: Salesforce, HubSpot, Zoho CRM
- `email`: Mailchimp, SendGrid, Constant Contact
- `automation`: Zapier, Make.com, n8n

---

#### Connect Integration (OAuth)

**Endpoint**: `POST /api/integrations/{service}/oauth/authorize`

**Purpose**: Initiate OAuth flow for integration

**Path Parameters**:
- `service`: Integration ID (e.g., "salesforce", "hubspot", "mailchimp")

**Response**:
```json
{
  "success": true,
  "authorizationUrl": "https://login.salesforce.com/services/oauth2/authorize?client_id=...",
  "state": "random_state_token"
}
```

**Frontend Workflow**:
1. User clicks "Connect" on integration card
2. Modal opens with integration details
3. User clicks "Connect to {Service}"
4. Frontend calls `/oauth/authorize`
5. Frontend redirects to `authorizationUrl`
6. User authorizes on provider's site
7. Provider redirects to: `https://listingbug.com/integrations/callback/{service}?code=xxx&state=xxx`
8. Frontend calls `/oauth/callback` with code

---

#### OAuth Callback

**Endpoint**: `POST /api/integrations/{service}/oauth/callback`

**Purpose**: Complete OAuth flow and save tokens

**Request Body**:
```json
{
  "code": "authorization_code_from_provider",
  "state": "random_state_token"
}
```

**Response**:
```json
{
  "success": true,
  "integration": {
    "id": "salesforce",
    "status": "connected",
    "connectedAt": "2024-11-23T10:30:00Z"
  }
}
```

---

#### Connect Integration (API Key)

**Endpoint**: `POST /api/integrations/{service}/api-key`

**Purpose**: Connect integration using API key

**Request Body**:
```json
{
  "apiKey": "sk_xxxxxxxxxxxxxxxxxxxx"
}
```

**Response**:
```json
{
  "success": true,
  "integration": {
    "id": "sendgrid",
    "status": "connected",
    "connectedAt": "2024-11-23T10:30:00Z"
  }
}
```

**API Key Validation**:
- Backend should test the API key before saving
- Make a test API call to the provider
- Return error if key is invalid

---

#### Get Integration Details

**Endpoint**: `GET /api/integrations/{service}/details`

**Purpose**: Get detailed information about a connected integration

**Response**:
```json
{
  "success": true,
  "integration": {
    "id": "salesforce",
    "name": "Salesforce",
    "category": "crm",
    "status": "connected",
    "connectedAt": "2024-11-15T10:30:00Z",
    "lastSync": "2024-11-23T08:15:00Z",
    "nextSync": "2024-11-23T09:15:00Z",
    "autoSync": true,
    "syncFrequency": "hourly",                      // "realtime" | "hourly" | "daily" | "manual"
    "syncedItems": [
      { "label": "Leads", "count": 1247 },
      { "label": "Contacts", "count": 3891 },
      { "label": "Opportunities", "count": 156 },
      { "label": "Accounts", "count": 892 }
    ],
    "recentActivity": [
      {
        "timestamp": "2024-11-23T08:15:00Z",
        "action": "Synced 47 new leads from report 'Austin Single Family'",
        "status": "success"
      },
      {
        "timestamp": "2024-11-23T07:15:00Z",
        "action": "Synced 23 contacts",
        "status": "success"
      }
    ]
  }
}
```

---

#### Update Integration Settings

**Endpoint**: `PATCH /api/integrations/{service}/settings`

**Purpose**: Update integration configuration

**Request Body**:
```json
{
  "autoSync": true,
  "syncFrequency": "hourly",
  "emailNotifications": true,
  "customSettings": {
    "defaultOwner": "user_id",
    "leadSource": "ListingBug"
  }
}
```

**Response**:
```json
{
  "success": true,
  "integration": {
    "id": "salesforce",
    "autoSync": true,
    "syncFrequency": "hourly",
    "nextSync": "2024-11-23T09:15:00Z"
  }
}
```

---

#### Manual Sync

**Endpoint**: `POST /api/integrations/{service}/sync`

**Purpose**: Trigger immediate data sync

**Response**:
```json
{
  "success": true,
  "syncStarted": true,
  "estimatedDuration": 120,                       // seconds
  "message": "Sync initiated successfully"
}
```

**Backend Process**:
1. Validate integration is connected
2. Start async sync job
3. Return immediately (don't wait for completion)
4. Update `lastSync` timestamp when complete
5. Create activity log entry

---

#### Disconnect Integration

**Endpoint**: `DELETE /api/integrations/{service}`

**Purpose**: Remove integration connection

**Response**:
```json
{
  "success": true,
  "message": "Integration disconnected successfully"
}
```

**Backend Process**:
1. Revoke OAuth tokens with provider (if OAuth)
2. Delete stored credentials
3. Optionally: Keep historical sync data
4. Stop any scheduled sync jobs
5. Send confirmation email

---

### Integration-Specific Implementations

#### Salesforce Integration

**OAuth Configuration**:
```
Authorization URL: https://login.salesforce.com/services/oauth2/authorize
Token URL: https://login.salesforce.com/services/oauth2/token
Scopes: api, refresh_token, offline_access
```

**Data Mapping**:
```javascript
ListingBug Property → Salesforce Lead
- address → Street
- city → City
- state → State
- zipCode → PostalCode
- price → AnnualRevenue
- agentEmail → Email
- agentPhone → Phone
- propertyType → LeadSource (custom)
- mlsNumber → MLS_Number__c (custom field)
```

**Sync Logic**:
- Create new Lead for each property in report
- Update existing Lead if `MLS_Number__c` matches
- Create Task for agent follow-up
- Assign to user specified in settings

---

#### HubSpot Integration

**OAuth Configuration**:
```
Authorization URL: https://app.hubspot.com/oauth/authorize
Token URL: https://api.hubapi.com/oauth/v1/token
Scopes: contacts, crm.objects.contacts.write, crm.objects.deals.write
```

**Data Mapping**:
```javascript
ListingBug Property → HubSpot Contact
- agentName → firstname + lastname
- agentEmail → email
- agentPhone → phone
- brokerName → company
- address → address (custom property)
- price → property_value (custom)
```

---

#### Mailchimp Integration

**OAuth Configuration**:
```
Authorization URL: https://login.mailchimp.com/oauth2/authorize
Token URL: https://login.mailchimp.com/oauth2/token
Scopes: read, write
```

**Sync Logic**:
- Add agent contacts to specified audience
- Create segments based on report criteria
- Tag contacts with property preferences
- Trigger campaigns on new listings

---

#### SendGrid Integration (API Key)

**API Key Format**: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Usage**:
- Send transactional emails (report ready, alerts)
- Template-based emails
- Track opens and clicks
- No audience management (use Mailchimp for that)

---

#### Zapier/Make/n8n Integration (API Key)

**ListingBug API Key**: Generated in Account Settings

**Webhook URL**: `https://listingbug.com/integrations/callback/{service}`

**Available Triggers**:
1. **New Report Created**
   - Fires when user creates a report
   - Payload: Report details
   
2. **Report Run Complete**
   - Fires when automated report finishes
   - Payload: Report results, property count
   
3. **New Property Match**
   - Fires when new properties match report criteria
   - Payload: Property details array

**Available Actions**:
1. **Create Report**
   - Programmatically create a report
   
2. **Run Report**
   - Trigger manual report execution
   
3. **Export Report**
   - Get report data in JSON/CSV format

---

### Integration Security

**OAuth Token Storage**:
- Encrypt access tokens and refresh tokens
- Store in secure database with user association
- Rotate refresh tokens periodically
- Revoke tokens on disconnect

**API Key Storage**:
- Encrypt API keys before storing
- Never return full key in API responses
- Show only last 4 characters: `sk_...xxxx`
- Allow regeneration if compromised

**Webhook Security**:
- Verify webhook signatures
- Use HTTPS only
- Rate limit requests
- Log all webhook events

---

### OAuth Providers

#### Google OAuth
**Provider**: Google Identity Platform
**Button**: `SignUpPage_Button_Google`
**Redirect URL**: Configure in Google Console
**Scopes**: `openid`, `email`, `profile`

#### Apple Sign-In
**Provider**: Apple ID
**Button**: `SignUpPage_Button_Apple`
**Redirect URL**: Configure in Apple Developer
**Scopes**: `name`, `email`

#### Facebook Login
**Provider**: Facebook Login
**Button**: `SignUpPage_Button_Facebook`
**Redirect URL**: Configure in Facebook Developers
**Scopes**: `email`, `public_profile`

---

## API Request Headers

### Standard Headers

**All Requests**:
```
Content-Type: application/json
Accept: application/json
```

**Authenticated Requests**:
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token}
```

### CORS Configuration

**Allowed Origins**:
- Development: `http://localhost:*`
- Production: `https://listingbug.com`

**Allowed Methods**:
- `GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS`

**Allowed Headers**:
- `Content-Type`, `Authorization`, `Accept`

---

## Rate Limiting

### Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| Report Creation | 10 reports | 1 hour |
| Report Updates | 30 requests | 1 hour |
| Dashboard/Data | 60 requests | 1 minute |
| Downloads | 20 requests | 1 hour |

### Frontend Handling

**When rate limited (429)**:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT",
    "message": "Too many requests. Please try again in 5 minutes.",
    "retryAfter": 300
  }
}
```

**Display**: Show error message with retry time

---

## Webhook Endpoints (Incoming)

### Stripe Webhooks

**Endpoint**: `POST /api/webhooks/stripe`

**Events Handled**:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

**Frontend Impact**:
- Update user plan/status
- Show upgrade/downgrade messages
- Block access if payment failed

---

### OAuth Callbacks

**Google**: `/api/auth/google/callback`
**Apple**: `/api/auth/apple/callback`
**Facebook**: `/api/auth/facebook/callback`

**Process**:
1. Receive authorization code
2. Exchange for tokens
3. Fetch user profile
4. Create or update user
5. Issue JWT token
6. Redirect to frontend with token

---

## Data Synchronization

### Real-Time Updates (Optional)

**Technology**: WebSockets / Server-Sent Events

**Use Cases**:
1. **Report Status**: Update when automated report starts/completes
2. **Live Metrics**: Dashboard metrics update in real-time
3. **Notifications**: In-app notifications for events

**Frontend Integration**:
```typescript
// Connect to WebSocket
const ws = new WebSocket('wss://api.listingbug.com/ws');

// Authenticate
ws.send(JSON.stringify({
  type: 'auth',
  token: userToken
}));

// Listen for updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'report_complete':
      updateReportInList(data.reportId, data.results);
      showNotification('Report completed!');
      break;
    case 'metrics_update':
      updateDashboardMetrics(data.metrics);
      break;
  }
};
```

---

## Testing Endpoints

### Health Check

**Endpoint**: `GET /api/health`

**Response**:
```json
{
  "status": "ok",
  "timestamp": "ISO 8601",
  "version": "1.0.0"
}
```

---

### Mock Data Endpoints (Development)

During development, use mock endpoints:

**Base URL**: `/api/mock/*`

**Examples**:
- `GET /api/mock/reports` → Returns sample reports
- `POST /api/mock/reports` → Returns success with fake ID
- All endpoints return success with sample data

---

## Security Considerations

### JWT Token

**Storage**: localStorage or httpOnly cookie
**Expiration**: 7 days (configurable)
**Refresh**: Optional refresh token mechanism
**Payload**: Minimal (user ID, email, role)

### API Key (For external APIs)

**Storage**: Backend environment variables ONLY
**Never**: Send to frontend or expose in responses

### Input Validation

**Frontend**: Basic validation for UX
**Backend**: Complete validation (don't trust frontend)

**Rules**:
- Sanitize all user inputs
- Validate data types and ranges
- Check for SQL injection attempts
- Limit string lengths
- Validate email formats
- Check password strength

### HTTPS

**All production traffic**: HTTPS only
**Development**: HTTP acceptable

---

## Integration Checklist

### Initial Setup
- [ ] Set up authentication endpoints
- [ ] Configure OAuth providers
- [ ] Set up database tables
- [ ] Configure CORS
- [ ] Set up rate limiting
- [ ] Configure error logging

### User Management
- [ ] Signup endpoint working
- [ ] Login endpoint working
- [ ] Profile update working
- [ ] Password change working
- [ ] JWT token generation/validation
- [ ] Session management

### Report Management
- [ ] Create report endpoint
- [ ] List reports endpoint
- [ ] Update report endpoint
- [ ] Delete report endpoint
- [ ] Report history endpoint
- [ ] Manual run endpoint

### Dashboard Data
- [ ] Metrics endpoint
- [ ] Recent activity endpoint
- [ ] Top locations endpoint
- [ ] Recent reports endpoint

### Third-Party Services
- [ ] Email service configured
- [ ] OAuth providers configured
- [ ] Payment provider integrated (Stripe)
- [ ] Real estate data API integrated

### Frontend Integration
- [ ] Token storage working
- [ ] API error handling
- [ ] Loading states implemented
- [ ] Empty states implemented
- [ ] Error states implemented
- [ ] Form validation working
- [ ] Success messages showing

### Testing
- [ ] All endpoints tested
- [ ] Error scenarios tested
- [ ] Rate limiting tested
- [ ] Authentication tested
- [ ] CRUD operations tested
- [ ] Frontend integration tested

---

## Support & Documentation

### API Documentation

Generate API docs using:
- **Swagger/OpenAPI**: Interactive API explorer
- **Postman Collection**: Import and test endpoints
- **README**: Quick start guide

### Frontend Developer Guide

Reference files:
- `BACKEND_INTEGRATION.md` (this file)
- `DATA_SCHEMA.md` (detailed schemas)
- `COMPONENT_STRUCTURE.md` (component data bindings)
- `USER_FLOWS.md` (user journey impacts)

### Contact

For backend integration questions:
- Review documentation first
- Check API responses with dev tools
- Test with mock endpoints
- Reach out to backend team with specific questions

---

## Version History

**v1.0** - Initial integration guide
- Authentication & user management
- Report CRUD operations
- Dashboard data endpoints
- Third-party integrations

**Future Versions**:
- Real-time updates
- Advanced search & filtering
- Bulk operations
- Team collaboration features
- Analytics & reporting