# ListingBug Data Schema & Field Mapping

## Overview

This document provides detailed data schemas for all entities in the ListingBug application, including field types, validation rules, and naming conventions for frontend-backend integration.

---

## Table of Contents

1. [User Schema](#user-schema)
2. [Report Schema](#report-schema)
3. [Report Run Schema](#report-run-schema)
4. [Activity Schema](#activity-schema)
5. [Field Naming Conventions](#field-naming-conventions)
6. [Data Transformation](#data-transformation)
7. [Validation Rules](#validation-rules)

---

## User Schema

### Database Table: `users`

| Field Name | Data Type | Required | Unique | Default | Component Mapping |
|------------|-----------|----------|--------|---------|-------------------|
| `id` | string (UUID) | Yes | Yes | Auto-generated | User_ID |
| `name` | string | Yes | No | - | Header_Avatar_Name, AccountPage_Input_Name |
| `email` | string | Yes | Yes | - | AccountPage_Display_Email, LoginPage_Input_Email |
| `password` | string (hashed) | Yes | No | - | (Not displayed, password inputs only) |
| `company` | string | No | No | null | AccountPage_Input_Company |
| `role` | string | No | No | null | AccountPage_Input_Role |
| `plan` | enum | Yes | No | "Professional" | AccountPage_Display_Plan |
| `status` | enum | Yes | No | "Trial" | AccountPage_Display_Status |
| `avatar` | string (URL) | No | No | null | Header_Avatar_Image |
| `emailNotifications` | boolean | Yes | No | true | AccountPage_Toggle_EmailNotifications |
| `smsNotifications` | boolean | Yes | No | false | AccountPage_Toggle_SMSNotifications |
| `createdAt` | timestamp | Yes | No | CURRENT_TIMESTAMP | - |
| `updatedAt` | timestamp | Yes | No | CURRENT_TIMESTAMP | - |
| `lastLoginAt` | timestamp | No | No | null | - |

### Enums

**Plan**:
- `"Professional"`
- `"Enterprise"`

**Status**:
- `"Active"` - Paying customer
- `"Trial"` - Trial period
- `"Inactive"` - Cancelled/suspended

### JSON Example

```json
{
  "id": "user_123abc",
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Real Estate Inc",
  "role": "Agent",
  "plan": "Professional",
  "status": "Active",
  "avatar": "https://cdn.listingbug.com/avatars/user_123abc.jpg",
  "emailNotifications": true,
  "smsNotifications": false,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-11-23T14:22:00Z",
  "lastLoginAt": "2024-11-23T09:15:00Z"
}
```

---

## Report Schema

### Database Table: `reports`

| Field Name | Data Type | Required | Unique | Default | Component Mapping |
|------------|-----------|----------|--------|---------|-------------------|
| `id` | string (UUID) | Yes | Yes | Auto-generated | Report_ID |
| `userId` | string (UUID) | Yes | No | - | Foreign key to users |
| `name` | string (255) | Yes | No | - | ReportCard_Name, NewReport_Step1_Input_Name |
| `location` | string (255) | Yes | No | - | ReportCard_Location, NewReport_Step1_Input_Location |
| `searchRadius` | integer | Yes | No | 10 | NewReport_Step1_Select_Radius |
| `propertyTypes` | JSON array | Yes | No | [] | NewReport_Step1_Checkboxes_PropertyTypes |
| `bedrooms` | string (10) | Yes | No | "Any" | NewReport_Step2_Select_Bedrooms |
| `bathrooms` | string (10) | Yes | No | "Any" | NewReport_Step2_Select_Bathrooms |
| `priceMin` | integer | No | No | null | NewReport_Step2_Input_PriceMin |
| `priceMax` | integer | No | No | null | NewReport_Step2_Input_PriceMax |
| `sqftMin` | integer | No | No | null | NewReport_Step2_Input_SqftMin |
| `sqftMax` | integer | No | No | null | NewReport_Step2_Input_SqftMax |
| `yearBuiltMin` | integer | No | No | null | NewReport_Step2_Input_YearMin |
| `yearBuiltMax` | integer | No | No | null | NewReport_Step2_Input_YearMax |
| `features` | JSON array | No | No | [] | NewReport_Step2_Checkboxes_Features |
| `automated` | boolean | Yes | No | false | NewReport_Step3_Toggle_Automation, ReportCard_Badge_Automated |
| `frequency` | enum | No | No | null | NewReport_Step3_Select_Frequency |
| `emailNotifications` | boolean | Yes | No | true | NewReport_Step3_Checkbox_Email |
| `exportFormat` | enum | Yes | No | "CSV" | NewReport_Step3_Select_Format |
| `status` | enum | Yes | No | "Active" | ReportModal_Toggle_Status |
| `results` | integer | Yes | No | 0 | ReportCard_Results |
| `criteria` | string (500) | Yes | No | Auto-generated | ReportCard_Criteria |
| `hasDownload` | boolean | Yes | No | false | ReportCard_Badge_Ready |
| `lastRun` | timestamp | No | No | null | ReportCard_LastRun |
| `createdAt` | timestamp | Yes | No | CURRENT_TIMESTAMP | - |
| `updatedAt` | timestamp | Yes | No | CURRENT_TIMESTAMP | - |

### Enums

**Frequency**:
- `"Daily"`
- `"Weekly"`
- `"Monthly"`

**Export Format**:
- `"CSV"`
- `"Excel"`
- `"PDF"`

**Status**:
- `"Active"` - Running/scheduled
- `"Paused"` - Temporarily stopped
- `"Deleted"` - Soft deleted

### Property Types (JSON Array)

```json
[
  "Single Family",
  "Condo",
  "Townhouse",
  "Multi-family"
]
```

### Features (JSON Array)

```json
[
  "Pool",
  "Garage",
  "Waterfront",
  "New Construction"
]
```

### JSON Example

```json
{
  "id": "report_456def",
  "userId": "user_123abc",
  "name": "Los Angeles Single Family Homes",
  "location": "Los Angeles, CA",
  "searchRadius": 10,
  "propertyTypes": ["Single Family"],
  "bedrooms": "3+",
  "bathrooms": "2+",
  "priceMin": 500000,
  "priceMax": 1000000,
  "sqftMin": 1500,
  "sqftMax": null,
  "yearBuiltMin": 2000,
  "yearBuiltMax": null,
  "features": ["Pool", "Garage"],
  "automated": true,
  "frequency": "Weekly",
  "emailNotifications": true,
  "exportFormat": "CSV",
  "status": "Active",
  "results": 247,
  "criteria": "3+ bed, 2+ bath, $500k-$1M",
  "hasDownload": true,
  "lastRun": "2024-11-23T12:00:00Z",
  "createdAt": "2024-11-15T09:30:00Z",
  "updatedAt": "2024-11-23T12:00:00Z"
}
```

---

## Report Run Schema

### Database Table: `report_runs`

| Field Name | Data Type | Required | Unique | Default | Component Mapping |
|------------|-----------|----------|--------|---------|-------------------|
| `id` | string (UUID) | Yes | Yes | Auto-generated | ReportRun_ID |
| `reportId` | string (UUID) | Yes | No | - | Foreign key to reports |
| `runDate` | timestamp | Yes | No | CURRENT_TIMESTAMP | ReportHistory_Row_Date |
| `resultsCount` | integer | Yes | No | 0 | ReportHistory_Row_Results |
| `status` | enum | Yes | No | "InProgress" | ReportHistory_Row_Status |
| `downloadUrl` | string (URL) | No | No | null | ReportHistory_Button_Download |
| `errorMessage` | text | No | No | null | ReportHistory_Row_Error |
| `duration` | integer | No | No | null | Seconds taken to complete |
| `createdAt` | timestamp | Yes | No | CURRENT_TIMESTAMP | - |

### Enums

**Status**:
- `"InProgress"` - Currently running
- `"Success"` - Completed successfully
- `"Failed"` - Error occurred

### JSON Example

```json
{
  "id": "run_789ghi",
  "reportId": "report_456def",
  "runDate": "2024-11-23T12:00:00Z",
  "resultsCount": 247,
  "status": "Success",
  "downloadUrl": "https://cdn.listingbug.com/exports/run_789ghi.csv",
  "errorMessage": null,
  "duration": 45,
  "createdAt": "2024-11-23T12:00:00Z"
}
```

---

## Activity Schema

### Database Table: `activities`

| Field Name | Data Type | Required | Unique | Default | Component Mapping |
|------------|-----------|----------|--------|---------|-------------------|
| `id` | string (UUID) | Yes | Yes | Auto-generated | Activity_ID |
| `userId` | string (UUID) | Yes | No | - | Foreign key to users |
| `action` | string (255) | Yes | No | - | Dashboard_Activity_Action |
| `location` | string (255) | No | No | null | Dashboard_Activity_Location |
| `reportId` | string (UUID) | No | No | null | Foreign key to reports (optional) |
| `timestamp` | timestamp | Yes | No | CURRENT_TIMESTAMP | Dashboard_Activity_Time |
| `metadata` | JSON | No | No | {} | Additional context data |
| `createdAt` | timestamp | Yes | No | CURRENT_TIMESTAMP | - |

### Action Examples

- `"New report created"`
- `"Report updated"`
- `"Report deleted"`
- `"Data export completed"`
- `"Report run scheduled"`
- `"Report run completed"`

### JSON Example

```json
{
  "id": "activity_101jkl",
  "userId": "user_123abc",
  "action": "New report created",
  "location": "Los Angeles, CA",
  "reportId": "report_456def",
  "timestamp": "2024-11-23T12:00:00Z",
  "metadata": {
    "reportName": "Los Angeles Single Family Homes",
    "automated": true
  },
  "createdAt": "2024-11-23T12:00:00Z"
}
```

---

## Field Naming Conventions

### Frontend Component Naming

**Pattern**: `[Component]_[ElementType]_[FieldName]`

**Examples**:
- `ReportCard_Title` - Report name in card
- `ReportCard_Location` - Location text
- `Dashboard_Metric_Value` - Metric numeric value
- `NewReport_Step1_Input_Name` - Name input in step 1
- `AccountPage_Toggle_EmailNotifications` - Email toggle switch

### API Response Field Naming

**Pattern**: `camelCase`

**Examples**:
- `userId` not `user_id` or `UserId`
- `emailNotifications` not `email_notifications`
- `lastRun` not `last_run`

### Database Field Naming

**Pattern**: `camelCase` (if using NoSQL) or `snake_case` (if using SQL)

**SQL Example**:
- `user_id`
- `created_at`
- `email_notifications`

**NoSQL Example** (MongoDB, etc.):
- `userId`
- `createdAt`
- `emailNotifications`

**Note**: API should transform between database naming and JSON response naming

---

## Data Transformation

### Database → API Response

Transform database fields to API-friendly format before sending to frontend.

**Example**:
```javascript
// Database record (SQL)
{
  user_id: "123",
  email_notifications: true,
  created_at: "2024-11-23T12:00:00Z"
}

// Transform to API response
{
  userId: "123",
  emailNotifications: true,
  createdAt: "2024-11-23T12:00:00Z"
}
```

### API Response → Frontend Display

Transform API data to user-friendly display format.

**Timestamp Transformations**:
```javascript
// API: "2024-11-23T12:00:00Z"
// Display: "2 hours ago" or "Nov 23, 2024"

function formatRelativeTime(timestamp) {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return past.toLocaleDateString();
}
```

**Number Formatting**:
```javascript
// API: 12458
// Display: "12,458"

function formatNumber(num) {
  return num.toLocaleString();
}

// API: 1200000
// Display: "1.2M"

function formatLargeNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
```

**Currency Formatting**:
```javascript
// API: 500000
// Display: "$500,000"

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(amount);
}
```

### Frontend Input → API Request

Transform user input to API-expected format.

**Example**:
```javascript
// User input
{
  priceMin: "$500,000",  // String with formatting
  priceMax: "$1,000,000"
}

// Transform to API request
{
  priceMin: 500000,  // Number without formatting
  priceMax: 1000000
}

function parseCurrency(currencyString) {
  return parseInt(currencyString.replace(/[$,]/g, ''));
}
```

---

## Validation Rules

### User Fields

| Field | Rule | Error Message |
|-------|------|---------------|
| `name` | Required, 2-100 chars | "Name must be between 2 and 100 characters" |
| `email` | Required, valid email format | "Please enter a valid email address" |
| `password` | Required, min 8 chars, 1 uppercase, 1 number | "Password must be at least 8 characters with 1 uppercase and 1 number" |
| `company` | Optional, max 255 chars | "Company name too long" |
| `role` | Optional, max 100 chars | "Role name too long" |

### Report Fields

| Field | Rule | Error Message |
|-------|------|---------------|
| `name` | Required, 3-255 chars | "Report name must be between 3 and 255 characters" |
| `location` | Required, valid format "City, State" | "Please enter location as 'City, State'" |
| `searchRadius` | Required, 1-100 miles | "Search radius must be between 1 and 100 miles" |
| `propertyTypes` | Required, at least 1 selected | "Please select at least one property type" |
| `priceMin` | Optional, > 0, < priceMax | "Minimum price must be less than maximum price" |
| `priceMax` | Optional, > 0, > priceMin | "Maximum price must be greater than minimum price" |
| `sqftMin` | Optional, > 0, < sqftMax | "Minimum sqft must be less than maximum sqft" |
| `sqftMax` | Optional, > 0, > sqftMin | "Maximum sqft must be greater than minimum sqft" |
| `yearBuiltMin` | Optional, 1800-current year, < yearBuiltMax | "Invalid year range" |
| `yearBuiltMax` | Optional, 1800-current year, > yearBuiltMin | "Invalid year range" |
| `frequency` | Required if automated=true | "Please select a frequency for automated reports" |

### Frontend Validation Example

```javascript
function validateNewReport(formData) {
  const errors = {};
  
  // Name
  if (!formData.name || formData.name.trim().length < 3) {
    errors.name = "Report name must be at least 3 characters";
  }
  
  // Location
  if (!formData.location || !formData.location.includes(',')) {
    errors.location = "Please enter location as 'City, State'";
  }
  
  // Property types
  if (!formData.propertyTypes || formData.propertyTypes.length === 0) {
    errors.propertyTypes = "Please select at least one property type";
  }
  
  // Price range
  if (formData.priceMin && formData.priceMax && formData.priceMin >= formData.priceMax) {
    errors.priceMin = "Minimum price must be less than maximum price";
  }
  
  // Automation frequency
  if (formData.automated && !formData.frequency) {
    errors.frequency = "Please select a frequency for automated reports";
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
```

### Backend Validation

Always validate on backend even if frontend validates. Frontend validation is for UX only.

```javascript
// Backend validation (Node.js example)
function validateReport(data) {
  const errors = [];
  
  if (!data.name || data.name.length < 3 || data.name.length > 255) {
    errors.push({ field: 'name', message: 'Invalid report name' });
  }
  
  if (!data.userId) {
    errors.push({ field: 'userId', message: 'User ID required' });
  }
  
  if (data.propertyTypes && !Array.isArray(data.propertyTypes)) {
    errors.push({ field: 'propertyTypes', message: 'Property types must be an array' });
  }
  
  // Price range validation
  if (data.priceMin !== null && data.priceMax !== null) {
    if (data.priceMin >= data.priceMax) {
      errors.push({ field: 'priceMin', message: 'Min price must be less than max price' });
    }
  }
  
  return errors;
}
```

---

## Field Constraints Summary

### String Length Limits

| Field | Min | Max | Frontend Component |
|-------|-----|-----|-------------------|
| User name | 2 | 100 | AccountPage_Input_Name |
| User email | 5 | 255 | AccountPage_Display_Email |
| User company | 0 | 255 | AccountPage_Input_Company |
| User role | 0 | 100 | AccountPage_Input_Role |
| Report name | 3 | 255 | NewReport_Step1_Input_Name |
| Report location | 3 | 255 | NewReport_Step1_Input_Location |
| Report criteria | 0 | 500 | ReportCard_Criteria (auto-generated) |
| Activity action | 3 | 255 | Dashboard_Activity_Action |

### Numeric Ranges

| Field | Min | Max | Frontend Component |
|-------|-----|-----|-------------------|
| Search radius | 1 | 100 | NewReport_Step1_Select_Radius |
| Price | 0 | 100,000,000 | NewReport_Step2_Input_PriceMin/Max |
| Square feet | 0 | 50,000 | NewReport_Step2_Input_SqftMin/Max |
| Year built | 1800 | Current year | NewReport_Step2_Input_YearMin/Max |

---

## Data Type Reference

### UUID/ID Format

- **Pattern**: `[entity]_[random]`
- **Examples**: `user_123abc`, `report_456def`, `run_789ghi`
- **Length**: ~15-20 characters
- **Frontend**: Treat as opaque string, never parse

### Timestamp Format

- **API Format**: ISO 8601 - `"2024-11-23T12:00:00Z"`
- **Database**: TIMESTAMP or DATETIME
- **Frontend Display**: Relative time or formatted date
- **Timezone**: Always UTC in API/database, convert to local for display

### Boolean Fields

- **API Format**: `true` or `false` (JSON boolean)
- **Database**: BOOLEAN or TINYINT(1)
- **Frontend**: Checkboxes, toggles, switches

### JSON Arrays

- **API Format**: `["item1", "item2"]`
- **Database**: JSON or TEXT column
- **Frontend**: Checkbox groups, multi-select

### Enums

- **API Format**: String - `"Daily"`, `"Weekly"`, `"Monthly"`
- **Database**: ENUM or VARCHAR with constraint
- **Frontend**: Select dropdowns, radio buttons

---

## Integration Checklist

### When Adding New Fields

- [ ] Add to database table
- [ ] Add to TypeScript interface
- [ ] Add to API response transformation
- [ ] Add to frontend component
- [ ] Add validation rules (frontend and backend)
- [ ] Add to this documentation
- [ ] Update BACKEND_INTEGRATION.md if endpoint affected
- [ ] Update COMPONENT_STRUCTURE.md with component mapping
- [ ] Add naming convention entry
- [ ] Test with real data

### When Modifying Existing Fields

- [ ] Update database schema
- [ ] Update TypeScript interface
- [ ] Update API response transformation
- [ ] Update frontend component
- [ ] Update validation rules
- [ ] Update this documentation
- [ ] Test backward compatibility
- [ ] Consider migration script if needed

---

This completes the Data Schema documentation for ListingBug.
