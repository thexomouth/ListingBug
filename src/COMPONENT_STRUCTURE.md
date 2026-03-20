# ListingBug Component Structure

## Component Hierarchy

### Layout Components

---

#### Header
**File**: `/components/Header.tsx`

**Purpose**: Global navigation header with logo, nav links, and account menu

**Props**:
```typescript
{
  currentPage: Page;           // Current active page
  isLoggedIn: boolean;         // User authentication status
  onNavigate: (page: Page) => void;  // Navigation handler
}
```

**Key Features**:
- Responsive navigation (hamburger menu on mobile)
- Different nav items for logged-in vs logged-out users
- Logo with click navigation to home
- Account dropdown menu (logged-in users)
- Primary CTA button

**States**:
- Hover: Nav links change color to #342E37
- Active: Current page highlighted with bottom border (#FFD447)
- Mobile: Menu toggles open/closed

**Naming Convention**: `Header/MainNav`, `Header/Logo`, `Header/AccountMenu`

---

#### Footer
**File**: `/components/Footer.tsx`

**Purpose**: Site-wide footer with links and company information

**Props**:
```typescript
{
  isLoggedIn: boolean;         // User authentication status
  onNavigate: (page: Page) => void;  // Navigation handler
}
```

**Key Features**:
- Four-column layout (Product, Company, Resources, Legal)
- Copyright notice
- Responsive (stacks on mobile)
- Different links based on auth status

**Sections**:
1. Product: Features, Data Sets, Use Cases
2. Company: About, Careers, Contact
3. Resources: Help Center, API Docs, Blog
4. Legal: Privacy, Terms

**Naming Convention**: `Footer/Column`, `Footer/LinkGroup`, `Footer/Copyright`

---

### Page Components

---

#### HomePage
**File**: `/components/HomePage.tsx`

**Purpose**: Landing page with hero section and feature highlights

**Props**:
```typescript
{
  page: 'home' | 'pricing';    // Which variant to show
}
```

**Sections**:
1. **Hero**: Large headline, description, CTA button
2. **Features**: 3-column grid of feature cards
3. **Stats**: Metrics display
4. **Pricing** (when page='pricing'): Pricing tiers

**Auto Layout**: 
- Hero: Centered flex column
- Features: Grid 1-col mobile, 3-col desktop
- Stats: Grid 1-col mobile, 3-col desktop

**Naming Convention**: `HomePage/Hero`, `HomePage/Features`, `HomePage/FeatureCard`

---

#### LoginPage
**File**: `/components/LoginPage.tsx`

**Purpose**: User authentication page

**Props**:
```typescript
{
  onLogin: () => void;         // Success callback
  onNavigateToSignUp?: () => void;  // Navigation to sign up
}
```

**Features**:
- Email/password form
- "Welcome Back" heading (large and bold)
- Link to sign up page
- Centered card layout

**Form Fields**:
- Email (type: email, required)
- Password (type: password, required)

**Naming Convention**: `LoginPage/Card`, `LoginPage/Form`, `LoginPage/SubmitButton`

---

#### SignUpPage
**File**: `/components/SignUpPage.tsx`

**Purpose**: New user registration page

**Props**:
```typescript
{
  onSignUp: () => void;        // Success callback
  onNavigateToLogin?: () => void;  // Navigation to login
}
```

**Features**:
- Social sign-in buttons (Google, Apple, Facebook)
- Email registration form
- Password confirmation
- Link to login page
- Divider between social and email options

**Social Providers**:
- Google: Chrome icon, outline style
- Apple: Apple icon, black background
- Facebook: Facebook logo, blue background (#1877F2)

**Form Fields**:
- Full Name
- Email
- Password
- Confirm Password

**Naming Convention**: `SignUpPage/SocialButtons`, `SignUpPage/Form`, `SignUpPage/Divider`

---

#### Dashboard
**File**: `/components/Dashboard.tsx`

**Purpose**: Member dashboard with metrics and reports overview

**Props**:
```typescript
{
  onOpenReport: (report: Report, tab: 'preferences' | 'history') => void;
}
```

**Sections**:
1. **Header**: Page title with icon
2. **Metrics Grid**: 4 metric cards (2x2 on tablet, 1-col mobile)
3. **Recent Reports**: Section with report list
4. **Activity & Locations**: 2-column grid (stacks on mobile)

**Metric Cards**:
- Total Listings Tracked
- Active Reports
- Data Points Collected
- Last Updated

**Responsive**:
- Metrics: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- Bottom section: `lg:grid-cols-2`
- Text sizes scale: `text-xs sm:text-sm`, `text-xl sm:text-2xl`

**Naming Convention**: `Dashboard/Header`, `Dashboard/MetricCard`, `Dashboard/RecentReports`

---

#### MyReports
**File**: `/components/MyReports.tsx`

**Purpose**: List view of all user reports

**Props**:
```typescript
{
  newReportData?: any;         // New report to add to list
  onOpenReport: (report: Report, tab: 'preferences' | 'history') => void;
}
```

**Features**:
- Tabbed interface (All Reports, Automated, Manual)
- Report cards with metadata
- Edit and History action buttons
- Empty state handling

**Report Card Elements**:
- Report name
- Location
- Criteria
- Results count
- Last run timestamp
- Automated badge (if applicable)
- Download badge (if ready)

**Tabs**:
- All Reports (default)
- Automated Reports
- Manual Reports

**Naming Convention**: `MyReports/Tabs`, `MyReports/ReportCard`, `MyReports/ActionButtons`

---

#### NewReport
**File**: `/components/NewReport.tsx`

**Purpose**: Multi-step form to create new listing reports

**Props**:
```typescript
{
  onAddToMyReports: (reportData: any) => void;
}
```

**Steps**:
1. Location & Property Type
2. Criteria & Filters
3. Schedule & Automation
4. Review & Create

**Form Sections**:
- Location selection (city, state, radius)
- Property type (checkboxes)
- Bedrooms, bathrooms (select)
- Price range (min/max inputs)
- Square footage
- Year built
- Automation schedule

**Naming Convention**: `NewReport/StepIndicator`, `NewReport/Form`, `NewReport/Section`

---

#### AccountPage
**File**: `/components/AccountPage.tsx`

**Purpose**: User account settings and preferences

**Props**:
```typescript
{
  onLogout: () => void;        // Logout handler
}
```

**Sections**:
1. **Profile Information**: Name, email, role
2. **Account Settings**: Password change, email preferences
3. **Subscription Info**: Plan details, billing

**Features**:
- Editable profile fields
- Password change form
- Email notification toggles
- Logout button

**Naming Convention**: `AccountPage/Section`, `AccountPage/ProfileCard`, `AccountPage/SettingsForm`

---

### Utility Pages

---

#### HowItWorksPage
**File**: `/components/HowItWorksPage.tsx`

**Purpose**: Educational content about platform features

**Structure**:
- Page header with icon
- Step-by-step process
- Feature explanations
- Visual examples (placeholder for future images)

**Naming Convention**: `HowItWorks/Step`, `HowItWorks/FeatureBlock`

---

#### DataSetsPage
**File**: `/components/DataSetsPage.tsx`

**Purpose**: Information about available data sources

**Features**:
- Data source cards
- Coverage information
- Update frequency
- Sample data examples

**Naming Convention**: `DataSets/SourceCard`, `DataSets/CoverageMap`

---

#### UseCasesPage
**File**: `/components/UseCasesPage.tsx`

**Purpose**: Real-world use case examples

**Structure**:
- Use case cards
- Industry examples
- Success metrics
- Customer testimonials (placeholder)

**Naming Convention**: `UseCases/Card`, `UseCases/Testimonial`

---

### Specialized Components

---

#### RecentReportsSection
**File**: `/components/dashboard/RecentReportsSection.tsx`

**Purpose**: Dashboard widget showing recent reports

**Props**:
```typescript
{
  onReportClick: (reportId: number, action: 'edit' | 'history') => void;
}
```

**Features**:
- Report cards with full details
- Edit and History buttons
- Automated badge
- Download ready badge
- Last run timestamp

**Report Display**:
- Name (truncated if long)
- Location
- Criteria
- Results count
- Badges (Automated, Ready)
- Action buttons

**Responsive**:
- Actions stack on mobile: `flex-col sm:flex-row`
- Text sizes: `text-xs sm:text-sm`, `text-sm sm:text-base`
- Gaps: `gap-1 sm:gap-4`

**Naming Convention**: `RecentReports/Card`, `RecentReports/Badge`, `RecentReports/Actions`

---

#### ReportDetailsModal
**File**: `/components/ReportDetailsModal.tsx`

**Purpose**: Side panel modal for viewing/editing report details

**Props**:
```typescript
{
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (report: Report) => void;
  showFromNewReport?: boolean;
  defaultTab?: 'preferences' | 'history';
}
```

**Features**:
- Large side panel (1200px wide, 90vh height)
- Tabbed interface (Preferences, History)
- Editable report settings
- Historical run data
- Close button

**Tabs**:
1. **Preferences**: Report settings, filters, automation
2. **History**: Past runs, results, downloads

**Animation**: Slides in from right when opening

**Naming Convention**: `Modal/Panel`, `Modal/Tabs`, `Modal/Content`

---

### UI Components (ShadCN)

All located in `/components/ui/`

---

#### Button
**File**: `/components/ui/button.tsx`

**Variants**:
- `default`: Yellow background (#FFD447), dark text
- `outline`: Transparent with border
- `destructive`: Red background
- `ghost`: No background, hover effect only
- `link`: Styled as link

**Sizes**:
- `default`: py-2 px-4
- `sm`: py-1.5 px-3
- `lg`: py-3 px-6
- `icon`: Square icon button

**Usage**:
```tsx
<Button variant="default" size="lg">Click me</Button>
<Button variant="outline" size="sm">Cancel</Button>
```

**States**: Hover, active, disabled, focus

**Naming Convention**: `Button/Primary`, `Button/Secondary`, `Button/Icon`

---

#### Card
**File**: `/components/ui/card.tsx`

**Components**:
- `Card`: Wrapper container
- `CardHeader`: Top section with title
- `CardTitle`: Heading text
- `CardDescription`: Subtitle text
- `CardContent`: Main content area
- `CardFooter`: Bottom actions

**Usage**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content here</CardContent>
  <CardFooter>Footer actions</CardFooter>
</Card>
```

**Styling**: White background, border, rounded corners, subtle shadow

**Naming Convention**: `Card/Container`, `Card/Header`, `Card/Content`

---

#### Input
**File**: `/components/ui/input.tsx`

**Types**:
- text
- email
- password
- number
- date

**States**:
- Default: Border #E5E7EB
- Focus: Border #0E79B2, ring effect
- Disabled: Gray background, cursor not-allowed
- Error: Red border (custom class)

**Usage**:
```tsx
<Input type="email" placeholder="Enter email" />
<Input type="password" value={password} onChange={handleChange} />
```

**Naming Convention**: `Input/Field`, `Input/Error`

---

#### Label
**File**: `/components/ui/label.tsx`

**Purpose**: Form field labels

**Styling**:
- Font size: 14px (text-sm)
- Weight: 500 (medium)
- Color: #374151 (gray-700)
- Margin bottom: 8px

**Usage**:
```tsx
<Label htmlFor="email">Email Address</Label>
<Input id="email" type="email" />
```

**Naming Convention**: `Label/Field`

---

#### Select
**File**: `/components/ui/select.tsx`

**Components**:
- `Select`: Wrapper
- `SelectTrigger`: Button to open dropdown
- `SelectValue`: Displays selected value
- `SelectContent`: Dropdown menu
- `SelectItem`: Individual option

**Usage**:
```tsx
<Select onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

**Naming Convention**: `Select/Trigger`, `Select/Menu`, `Select/Item`

---

#### Tabs
**File**: `/components/ui/tabs.tsx`

**Components**:
- `Tabs`: Wrapper with state management
- `TabsList`: Container for tab buttons
- `TabsTrigger`: Individual tab button
- `TabsContent`: Content panel for each tab

**Usage**:
```tsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

**Active State**: Bottom border in yellow (#FFD447)

**Naming Convention**: `Tabs/List`, `Tabs/Trigger`, `Tabs/Panel`

---

#### Dialog/Modal
**File**: `/components/ui/dialog.tsx`

**Components**:
- `Dialog`: Wrapper with state
- `DialogTrigger`: Element that opens dialog
- `DialogContent`: Modal content container
- `DialogHeader`: Top section
- `DialogTitle`: Modal title
- `DialogDescription`: Subtitle
- `DialogFooter`: Bottom actions

**Features**:
- Backdrop overlay (50% black)
- Focus trap
- ESC key to close
- Click outside to close

**Usage**:
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <div>Content</div>
    <DialogFooter>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Naming Convention**: `Dialog/Overlay`, `Dialog/Content`, `Dialog/Header`

---

#### Badge
**File**: `/components/ui/badge.tsx`

**Variants**:
- `default`: Gray background
- `secondary`: Secondary color
- `destructive`: Red background
- `outline`: Border only

**Usage**:
```tsx
<Badge variant="default">New</Badge>
<Badge variant="destructive">Error</Badge>
```

**Custom Badges**:
- Automated: Yellow background 20% opacity
- Success: Green-100 background, green-700 text

**Naming Convention**: `Badge/Status`, `Badge/Count`

---

#### Checkbox
**File**: `/components/ui/checkbox.tsx`

**States**:
- Unchecked: Border only
- Checked: Yellow background (#FFD447), checkmark icon
- Disabled: Gray, cursor not-allowed

**Usage**:
```tsx
<Checkbox id="terms" checked={accepted} onCheckedChange={setAccepted} />
<Label htmlFor="terms">Accept terms</Label>
```

**Naming Convention**: `Checkbox/Input`, `Checkbox/Label`

---

#### Switch
**File**: `/components/ui/switch.tsx`

**Purpose**: Toggle switch for on/off states

**States**:
- Off: Gray background
- On: Yellow background (#FFD447)
- Disabled: Gray, cursor not-allowed

**Usage**:
```tsx
<Switch checked={enabled} onCheckedChange={setEnabled} />
```

**Naming Convention**: `Switch/Toggle`

---

## Reusable Patterns

### Page Header Pattern
Used across all content pages:
```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-3">
      <Icon className="w-7 h-7 text-[#0e79b2]" />
      <h1 className="mb-0 text-4xl font-bold">Page Title</h1>
    </div>
    <p className="text-lg text-gray-600 leading-relaxed">Description</p>
  </div>
</div>
```

**Elements**:
- Icon (7x7, blue color)
- Title (text-4xl, bold, no margin bottom)
- Description (text-lg, gray-600)

**Naming Convention**: `PageHeader/Container`, `PageHeader/Title`, `PageHeader/Icon`

---

### Report Card Pattern
Used in dashboard and my reports:
```tsx
<div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
  <div className="flex items-start justify-between gap-4">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-3 mb-2">
        <h3 className="text-base font-medium truncate">{name}</h3>
        {automated && <Badge>Automated</Badge>}
        {hasDownload && <Badge variant="success">Ready</Badge>}
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
        <div><span className="text-gray-500">Location: </span>{location}</div>
        <div><span className="text-gray-500">Criteria: </span>{criteria}</div>
        <div><span className="text-gray-500">Results: </span>{results}</div>
      </div>
      <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
        <Clock className="w-3 h-3" />
        Last run {timestamp}
      </div>
    </div>
    <div className="flex gap-2 flex-shrink-0">
      <Button variant="outline" size="sm">Edit</Button>
      <Button variant="outline" size="sm">History</Button>
    </div>
  </div>
</div>
```

**Responsive**: Actions stack on mobile with `flex-col sm:flex-row`

**Naming Convention**: `ReportCard/Container`, `ReportCard/Header`, `ReportCard/Actions`

---

### Form Section Pattern
Used in account, new report, etc.:
```tsx
<div className="space-y-4">
  <h3 className="text-xl font-bold">Section Title</h3>
  <div className="space-y-2">
    <Label htmlFor="field">Field Label</Label>
    <Input id="field" type="text" />
  </div>
</div>
```

**Spacing**: Consistent vertical spacing with `space-y-*`

**Naming Convention**: `FormSection/Title`, `FormSection/Field`

---

## Component Data Flow

### Authentication Flow
```
App.tsx (manages isLoggedIn state)
  ↓
Header (shows different nav based on auth)
  ↓
LoginPage/SignUpPage (triggers onLogin/onSignUp)
  ↓
Dashboard (protected, requires auth)
```

### Report Management Flow
```
NewReport (create report)
  ↓ onAddToMyReports
MyReports (view all reports)
  ↓ onOpenReport
ReportDetailsModal (view/edit specific report)
  ↓ onSave
App.tsx (updates global state)
```

### Navigation Flow
```
User clicks nav link
  ↓
Header onNavigate callback
  ↓
App.tsx setCurrentPage
  ↓
renderPage() shows new component
```

---

## Naming Conventions for Design Handoff

### Layer Naming
- **Container**: `[Component]/Container`
- **Header**: `[Component]/Header`
- **Content**: `[Component]/Content`
- **Footer**: `[Component]/Footer`
- **Icon**: `[Component]/Icon`
- **Title**: `[Component]/Title`
- **Action**: `[Component]/Action`

### Component Naming Examples
- `Dashboard/MetricCard/Container`
- `Dashboard/MetricCard/Icon`
- `Dashboard/MetricCard/Value`
- `Dashboard/MetricCard/Label`
- `Header/MainNav/Link`
- `Header/Logo/Image`
- `ReportCard/Badge/Automated`
- `Modal/Tabs/Trigger`

### State Naming
- `[Component]/[State]` - e.g., `Button/Hover`, `Input/Focus`
- `[Component]/[Variant]/[State]` - e.g., `Button/Primary/Hover`

---

## Dynamic Data Expectations

### Report Cards
```javascript
{
  id: number,
  name: string,              // Report name
  location: string,          // City, State
  criteria: string,          // Filtering criteria summary
  results: number,           // Number of listings found
  createdAt: string,         // ISO date string
  automated: boolean,        // Is this an automated report?
  lastRun: string,          // Relative time (e.g., "2 hours ago")
  hasDownload: boolean      // Is download ready?
}
```

### User Profile
```javascript
{
  name: string,
  email: string,
  role: string,
  company: string,
  plan: 'Professional' | 'Enterprise',
  status: 'Active' | 'Trial'
}
```

### Metrics
```javascript
{
  title: string,
  value: string | number,
  change: string,           // e.g., "+12.5%"
  icon: LucideIcon
}
```

---

## Notes for Bubble Implementation

### Components to Build as Reusables
1. **Button** - Multiple variants (primary, outline, destructive)
2. **Card** - Header, content, footer sections
3. **Report Card** - Complex card with badges and actions
4. **Page Header** - Icon + title + description
5. **Form Field** - Label + input wrapper
6. **Badge** - Status indicators
7. **Metric Card** - Dashboard stat display

### Conditional Visibility Rules
- Nav items based on `isLoggedIn`
- Report badges based on `automated` and `hasDownload`
- Page access based on authentication
- Form sections based on step number
- Tab content based on active tab

### Data Sources
- User profile: Current User
- Reports: Database query filtered by Current User
- Metrics: API call or database aggregation
- Activity feed: Database query ordered by date
