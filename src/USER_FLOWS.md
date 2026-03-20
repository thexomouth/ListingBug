# ListingBug User Flows & Navigation

## Site Navigation Map

### Public (Signed-Out) Pages
```
Homepage
├── How It Works
├── Data Sets
├── Use Cases
├── Pricing (homepage variant)
├── Login
└── Sign Up

Footer Links (Signed-Out)
├── Product
│   ├── How It Works
│   ├── Data Sets
│   └── Use Cases
├── Company
│   ├── About
│   ├── Careers
│   └── Contact
├── Resources
│   ├── Help Center
│   ├── API Documentation
│   ├── Blog
│   └── Changelog
└── Legal
    ├── Privacy Policy
    └── Terms of Service
```

### Member (Signed-In) Pages
```
Dashboard (default landing after login)
├── New Report
├── My Reports
├── Account Settings
└── Billing

Footer Links (Signed-In)
├── Product
│   ├── Dashboard
│   ├── New Report
│   └── My Reports
├── Company
│   ├── About
│   ├── Careers
│   └── Contact
├── Resources
│   ├── Help Center
│   ├── API Documentation
│   ├── Blog
│   └── Changelog
└── Legal
    ├── Privacy Policy
    └── Terms of Service
```

---

## User Flow 1: New User Sign-Up

### Flow Diagram
```
Homepage
  ↓ Click "Get Started" CTA
Sign Up Page
  ↓ Choose sign-up method
  ├─→ Social Sign-In (Google/Apple/Facebook)
  │     ↓ OAuth redirect
  │     ↓ Account created
  │     ↓
  └─→ Email Sign-Up
        ↓ Fill form (name, email, password)
        ↓ Submit
        ↓ Account created
        ↓
Dashboard (Welcome screen)
```

### Steps
1. **Landing**: User arrives at homepage
2. **CTA Click**: User clicks "Get Started" or "Sign Up" button
3. **Sign Up Page**: User sees two options:
   - Social sign-in buttons (Google, Apple, Facebook)
   - Email registration form
4. **Social Path** (if chosen):
   - Click social provider button
   - Redirect to OAuth provider
   - Authorize application
   - Return to ListingBug
   - Account created automatically
5. **Email Path** (if chosen):
   - Enter full name
   - Enter email address
   - Create password
   - Confirm password
   - Click "Create Account"
   - Validation checks:
     - All fields filled
     - Valid email format
     - Passwords match
6. **Success**: User redirected to Dashboard
7. **Welcome**: User sees dashboard with demo/empty state

### Page States
- **Sign Up Form**: Empty fields
- **Validation Errors**: Red borders, error messages
- **Processing**: Loading state on button
- **Success**: Redirect to Dashboard

### Conditional Logic
- If passwords don't match → Show error alert
- If email already exists → Show "Account exists" message
- If social auth fails → Show error, allow retry

---

## User Flow 2: Existing User Login

### Flow Diagram
```
Any Public Page
  ↓ Click "Sign In" or "Login"
Login Page
  ↓ Enter credentials
  ├─→ Social Sign-In (Google/Apple/Facebook)
  │     ↓ OAuth redirect
  │     ↓ Authenticated
  │     ↓
  └─→ Email Login
        ↓ Enter email & password
        ↓ Submit
        ↓ Authenticated
        ↓
Dashboard
```

### Steps
1. **Entry Point**: User clicks "Sign In" from any page
2. **Login Page**: User sees:
   - "Welcome Back" heading (large, bold)
   - Social sign-in options
   - Email/password form
   - Link to sign-up page
3. **Authentication**:
   - Enter email
   - Enter password
   - Click "Sign In"
4. **Validation**:
   - Check credentials (mock validation in demo)
   - Show loading state
5. **Success**: Redirect to Dashboard
6. **Failure**: Show error message

### Alternative Paths
- **Forgot Password**: (Future feature - show placeholder link)
- **New User**: Click "Sign up" link → Navigate to Sign Up page
- **Social Login**: Click provider button → OAuth flow

### Page States
- **Default**: Empty form, ready for input
- **Loading**: Button shows loading spinner
- **Error**: Alert/message showing invalid credentials
- **Success**: Immediate redirect

---

## User Flow 3: Create New Report

### Flow Diagram
```
Dashboard or Header Nav
  ↓ Click "New Report"
New Report Page - Step 1: Location & Property Type
  ↓ Enter location, select property types
  ↓ Click "Next"
Step 2: Criteria & Filters
  ↓ Set bedrooms, bathrooms, price range, etc.
  ↓ Click "Next"
Step 3: Schedule & Automation
  ↓ Enable automation (optional)
  ↓ Set schedule (if automated)
  ↓ Click "Next"
Step 4: Review & Create
  ↓ Review all settings
  ↓ Click "Create Report"
  ↓ Report created
My Reports Page
  ↓ Report appears in list
```

### Detailed Steps

#### Step 1: Location & Property Type
**Fields**:
- Report Name (text input, required)
- Location (City, State - text input, required)
- Search Radius (select: 5, 10, 25, 50 miles)
- Property Types (checkboxes: Single Family, Condo, Townhouse, Multi-family)

**Validation**:
- Report name not empty
- Location filled
- At least one property type selected

**UI Elements**:
- Step indicator (1 of 4)
- Form fields with labels
- "Next" button (primary yellow)
- Progress bar or step dots

---

#### Step 2: Criteria & Filters
**Fields**:
- Bedrooms (select: Any, 1+, 2+, 3+, 4+, 5+)
- Bathrooms (select: Any, 1+, 2+, 3+, 4+)
- Price Range:
  - Min Price (number input)
  - Max Price (number input)
- Square Footage:
  - Min Sqft (number input)
  - Max Sqft (number input)
- Year Built:
  - Min Year (number input)
  - Max Year (number input)
- Additional Features (checkboxes):
  - Pool
  - Garage
  - Waterfront
  - New Construction

**Validation**:
- Min values < Max values
- Reasonable ranges

**UI Elements**:
- Step indicator (2 of 4)
- Form sections grouped logically
- "Back" button (outline)
- "Next" button (primary)

---

#### Step 3: Schedule & Automation
**Fields**:
- Enable Automation (toggle switch)
- Schedule Frequency (if automated):
  - Select: Daily, Weekly, Monthly
- Email Notifications (checkbox)
- Export Format (select: CSV, Excel, PDF)

**Conditional Display**:
- Frequency selector only visible if automation enabled
- Email notification options if automation enabled

**UI Elements**:
- Step indicator (3 of 4)
- Toggle switch for automation
- Conditional fields with smooth transition
- "Back" and "Next" buttons

---

#### Step 4: Review & Create
**Display**:
- Summary card showing all selections:
  - Report Name
  - Location & Radius
  - Property Types
  - Criteria filters
  - Automation settings
- Edit buttons for each section (navigates back to that step)

**Actions**:
- "Back" to modify
- "Create Report" (primary button)

**On Submit**:
1. Show loading state
2. Create report (add to state)
3. Navigate to My Reports
4. Show success message
5. Report appears at top of list

---

### Step Navigation
- **Linear Flow**: Must complete steps in order
- **Back Navigation**: Can go back to previous steps
- **Edit from Review**: Can jump to specific step to edit

### Form Persistence
- Data persists if user goes back
- Data cleared on final submit
- Data cleared if user navigates away

---

## User Flow 4: View & Manage Reports

### Flow Diagram
```
Dashboard or My Reports
  ↓ Click "Edit" or "History" on a report
Report Details Modal (Side Panel)
  ├─→ Preferences Tab
  │     ↓ View/edit report settings
  │     ↓ Modify filters
  │     ↓ Change automation
  │     ↓ Click "Save"
  │     ↓ Changes saved
  │     ↓ Modal stays open or closes
  │
  └─→ History Tab
        ↓ View past runs
        ↓ See results over time
        ↓ Download past exports
        ↓ View charts/trends
```

### Entry Points
1. **Dashboard**: "Recent Reports" section
   - Click "Edit" → Opens modal to Preferences tab
   - Click "History" → Opens modal to History tab
2. **My Reports**: Report cards
   - Click "Edit" → Opens modal to Preferences tab
   - Click "History" → Opens modal to History tab

### Modal Features

#### Preferences Tab
**Sections**:
1. **Basic Info**:
   - Report name (editable)
   - Location (editable)
   - Status (toggle: Active/Paused)

2. **Search Criteria**:
   - All filters from creation
   - Editable inline
   - Real-time validation

3. **Automation**:
   - Enable/disable toggle
   - Frequency selector
   - Email preferences

**Actions**:
- "Save Changes" (primary button)
- "Cancel" (outline button)
- "Delete Report" (destructive, bottom of modal)

---

#### History Tab
**Display**:
1. **Summary Stats**:
   - Total runs
   - Average results
   - Last successful run
   - Trend chart

2. **Run History Table**:
   - Date/Time
   - Results count
   - Status (Success/Failed)
   - Download link (if available)

3. **Trend Chart**:
   - Results over time
   - Visual representation using recharts

**Actions**:
- Download CSV for specific run
- View detailed results (future feature)
- Re-run report manually

---

### Edit Flow
```
User clicks "Edit"
  ↓
Modal opens to Preferences tab
  ↓
User modifies settings
  ↓
User clicks "Save Changes"
  ↓
Validation check
  ├─→ Valid: Save changes, show success message
  └─→ Invalid: Show errors, keep modal open
```

### Delete Flow
```
User clicks "Delete Report"
  ↓
Confirmation dialog appears
  ↓ User confirms
Report deleted
  ↓
Modal closes
  ↓
Report removed from list
  ↓
Success message shown
```

---

## User Flow 5: Account Management

### Flow Diagram
```
Dashboard or Header
  ↓ Click Account/Settings
Account Page
  ├─→ Profile Section
  │     ↓ Edit name, email
  │     ↓ Click "Save"
  │     ↓ Updates saved
  │
  ├─→ Password Section
  │     ↓ Enter current password
  │     ↓ Enter new password
  │     ↓ Confirm new password
  │     ↓ Click "Update Password"
  │     ↓ Password changed
  │
  ├─→ Notifications Section
  │     ↓ Toggle email preferences
  │     ↓ Auto-saves
  │
  └─→ Subscription Section
        ↓ View current plan
        ↓ Click "Manage Billing"
        ↓ Navigate to Billing Page
```

### Profile Updates
**Fields**:
- Full Name (text input)
- Email (text input)
- Company (text input)
- Role (text input)

**Process**:
1. User edits fields
2. Clicks "Save Changes"
3. Validation:
   - Email format valid
   - Required fields filled
4. Success message
5. UI updates

### Password Change
**Fields**:
- Current Password (password input)
- New Password (password input)
- Confirm New Password (password input)

**Validation**:
- Current password correct
- New password meets requirements (8+ chars)
- Passwords match

**Process**:
1. User fills all three fields
2. Clicks "Update Password"
3. Validation checks
4. Success/error message
5. Form clears on success

### Billing Management
```
Account Page
  ↓ Click "Manage Billing" or "Billing" tab
Billing Page
  ├─→ View current subscription
  ├─→ View billing history
  ├─→ Update payment method
  └─→ Change plan
```

---

## User Flow 6: Browse Information Pages

### Public Information Flow
```
Homepage
  ↓ Click "How It Works" or nav link
How It Works Page
  ↓ Read about process
  ↓ Click "Get Started"
  ↓ Navigate to Sign Up
```

### Resource Browsing
```
Any Page (Footer)
  ↓ Click "Blog" or "Help Center"
Resource Page
  ↓ Browse articles/posts
  ↓ (Future: Click article to read)
```

### Navigation Patterns
- **Header Navigation**: Primary pages
- **Footer Navigation**: All pages organized by category
- **In-Page CTAs**: Direct to sign-up or specific features
- **Breadcrumbs**: (Future feature for deep pages)

---

## User Flow 7: Logout & Return

### Logout Flow
```
Any Member Page
  ↓ Click Account dropdown
  ↓ Click "Logout"
Logged out
  ↓ Redirect to Homepage
  ↓ Nav updates to signed-out state
```

### Return Flow
```
User returns to site (logged out)
  ↓ Homepage shown
  ↓ Click "Sign In"
Login Page
  ↓ Enter credentials
  ↓ Sign in
Dashboard
  ↓ All reports and data still present
```

---

## Navigation Behaviors

### Header Navigation (Signed-Out)
**Links**:
- Logo → Homepage
- How It Works → How It Works Page
- Data Sets → Data Sets Page
- Use Cases → Use Cases Page
- Pricing → Homepage (pricing section)
- Login → Login Page
- Get Started (CTA) → Sign Up Page

### Header Navigation (Signed-In)
**Links**:
- Logo → Dashboard
- Dashboard → Dashboard
- New Report → New Report Page
- My Reports → My Reports Page
- Account (dropdown):
  - Account Settings → Account Page
  - Billing → Billing Page
  - Logout → Logout action

### Footer Navigation
**Always Visible**: Same structure for signed-in and signed-out
**Link Behavior**: 
- External pages open in same window
- All internal navigation updates app state
- No page refreshes (SPA behavior)

### Mobile Navigation
**Hamburger Menu**:
- Opens slide-out menu
- Shows all nav items vertically
- Closes on selection
- Closes on outside click

---

## Modal & Overlay Behaviors

### Report Details Modal
**Opening**:
- Slides in from right
- 1200px wide, 90vh tall
- Overlay darkens background
- Focus trapped in modal

**Closing**:
- Click X button
- Click outside modal (overlay)
- Press ESC key
- Slides out to right

**Data Handling**:
- Changes saved explicitly with "Save" button
- "Cancel" discards changes
- Closing without saving prompts confirmation (if edited)

### Confirmation Dialogs
**When Triggered**:
- Delete report
- Unsaved changes
- Destructive actions

**Structure**:
- Title
- Description/warning
- Cancel button
- Confirm button (destructive style)

---

## Responsive Navigation

### Desktop (1024px+)
- Full horizontal nav bar
- All items visible
- Dropdown for account menu
- Footer in 4 columns

### Tablet (768px - 1023px)
- Condensed nav bar
- Some items may wrap
- Footer in 2 columns

### Mobile (< 768px)
- Hamburger menu
- Logo and hamburger only in header
- Side drawer for navigation
- Footer stacks vertically (1 column)

---

## Error States & Handling

### Authentication Errors
- **Invalid Credentials**: Alert on login page
- **Account Exists**: Message on sign-up
- **Session Expired**: Redirect to login with message

### Form Errors
- **Validation Errors**: Red borders, error text below field
- **Server Errors**: Alert message at top of form
- **Network Errors**: Retry button, error message

### Empty States
- **No Reports**: 
  - Message: "You haven't created any reports yet"
  - CTA: "Create Your First Report" button
- **No History**: 
  - Message: "This report hasn't been run yet"
  - Info: "Automated reports will appear here after their first run"

### Loading States
- **Page Loading**: Skeleton screens or spinner
- **Button Actions**: Loading spinner in button
- **Data Fetching**: Loading component shown

---

## Annotations for Dynamic Data

### Dashboard
- **Metrics Cards**: Pull from database aggregations
  - "Total Listings Tracked": SUM of all report results
  - "Active Reports": COUNT of reports where status = active
  - "Data Points Collected": Calculated metric
  - "Last Updated": MAX(lastRun) from all reports

- **Recent Reports**: 
  - Query: Reports ordered by lastRun DESC, limit 3
  - Display: Card with name, location, results, badges

- **Recent Activity**:
  - Query: Activity log ordered by timestamp DESC, limit 4
  - Display: Action, location, relative time

- **Top Locations**:
  - Query: GROUP BY location, SUM results, ORDER BY results DESC, limit 5
  - Display: Location, listing count, percentage change

### My Reports
- **All Reports Tab**: 
  - Query: All reports for current user, ordered by createdAt DESC
- **Automated Tab**: 
  - Query: WHERE automated = true
- **Manual Tab**: 
  - Query: WHERE automated = false

### Report Details Modal
- **Preferences Tab**: Load report by ID, display all settings
- **History Tab**: 
  - Query: Report runs WHERE reportId = X, ORDER BY timestamp DESC
  - Display: Table with date, results, status, download link

### Account Page
- **Profile Data**: Current user object
- **Subscription Data**: User subscription/plan info
- **Usage Metrics**: Calculated from user's reports

---

## Future Flow Enhancements

### Features to Add
1. **Advanced Filtering**: Multi-criteria search on My Reports
2. **Bulk Actions**: Select multiple reports, delete/export
3. **Report Sharing**: Generate public link or share with team
4. **Notifications Center**: In-app notifications panel
5. **Onboarding Tour**: First-time user walkthrough
6. **Report Templates**: Pre-configured report setups
7. **Data Visualization**: More charts and graphs in dashboard
8. **Export Options**: Bulk export, scheduled exports
9. **Team Management**: Invite users, manage permissions
10. **API Integration**: Developer portal, API key management

---

## Sitemap (Complete)

```
PUBLIC PAGES
│
├── Homepage (/)
│
├── How It Works (/how-it-works)
│
├── Data Sets (/data-sets)
│
├── Use Cases (/use-cases)
│
├── Login (/login)
│
├── Sign Up (/signup)
│
├── About (/about)
│
├── Careers (/careers)
│
├── Contact (/contact)
│
├── Help Center (/help)
│
├── API Documentation (/api-docs)
│
├── Blog (/blog)
│
├── Changelog (/changelog)
│
├── Privacy Policy (/privacy)
│
└── Terms of Service (/terms)

MEMBER PAGES (Protected)
│
├── Dashboard (/dashboard)
│
├── Search Listings (/search-listings)
│   ├── Step 1: Location & Type
│   ├── Step 2: Criteria
│   ├── Step 3: Automation
│   └── Step 4: Review
│
├── My Reports (/my-reports)
│   ├── All Reports (tab)
│   ├── Automated (tab)
│   └── Manual (tab)
│
├── Account (/account)
│   ├── Profile (section)
│   ├── Password (section)
│   ├── Notifications (section)
│   └── Subscription (section)
│
└── Billing (/billing)
    ├── Current Plan (section)
    ├── Payment Method (section)
    └── Billing History (section)

OVERLAYS/MODALS
│
└── Report Details Modal
    ├── Preferences Tab
    └── History Tab
```

---

## Key Interaction Points

### Primary CTAs (Conversion-focused)
1. **Homepage Hero**: "Get Started" → Sign Up
2. **Homepage Features**: "Start Free Trial" → Sign Up
3. **Pricing Section**: "Choose Plan" → Sign Up
4. **Nav Bar**: "Get Started" button → Sign Up

### Secondary Actions
1. **Dashboard**: "Create New Report" → New Report
2. **My Reports**: "Edit" / "History" → Modal
3. **Account**: "Manage Billing" → Billing Page
4. **Report Card**: "Download" → Export file

### Navigation Links
- All header links
- All footer links
- Breadcrumbs (where applicable)
- Back buttons in multi-step flows

---

## Success Metrics to Track

### User Flows
- Sign-up completion rate
- Time to first report created
- Reports created per user
- Automation adoption rate
- Return user rate

### Page Engagement
- Time on Dashboard
- Reports viewed
- Modal interactions
- Settings changes

### Conversions
- Visitor → Sign-up
- Free → Paid upgrade
- Trial → Subscription
- Single report → Multiple reports