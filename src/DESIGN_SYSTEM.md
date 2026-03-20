# ListingBug Design System

## Brand Colors

### Primary Colors
- **Primary Yellow**: `#FFD447` - Main brand color used for CTAs, highlights, and important UI elements
- **Secondary Dark**: `#342E37` - Main text color and secondary UI elements
- **Icon Blue**: `#0E79B2` - Reserved exclusively for icons throughout the application
- **Background White**: `#FFFFFF` - Main background color for pages and cards

### Usage Guidelines
- **Yellow (#FFD447)**: Use for primary buttons, important badges, selected states, and brand elements
- **Dark (#342E37)**: Use for headings, body text, and dark UI elements
- **Blue (#0E79B2)**: Use ONLY for icons - never for backgrounds or text
- **White**: Use for card backgrounds, main page backgrounds, and light UI elements

### Semantic Colors
- **Success Green**: `#10B981` (green-600) - Success messages, positive indicators
- **Error Red**: `#EF4444` (red-600) - Error messages, delete actions
- **Warning Orange**: `#F59E0B` (amber-600) - Warning messages
- **Info Blue**: `#3B82F6` (blue-600) - Informational messages

### Neutral Grays
- **Gray 50**: `#F9FAFB` - Hover backgrounds
- **Gray 100**: `#F3F4F6` - Subtle backgrounds
- **Gray 200**: `#E5E7EB` - Borders
- **Gray 300**: `#D1D5DB` - Disabled states
- **Gray 400**: `#9CA3AF` - Placeholder text
- **Gray 500**: `#6B7280` - Secondary text
- **Gray 600**: `#4B5563` - Body text
- **Gray 700**: `#374151` - Strong text
- **Gray 800**: `#1F2937` - Headings
- **Gray 900**: `#111827` - Emphasis text

---

## Typography

### Font Family
- **Primary Font**: Work Sans (imported from Google Fonts)
- **Fallback**: system-ui, sans-serif

### Text Styles

#### Headings
- **H1 (Page Title)**: 
  - Size: 36px (text-4xl)
  - Weight: 700 (Bold)
  - Color: #342E37
  - Usage: Main page headings with icon
  
- **H2 (Section Heading)**:
  - Size: 30px (text-3xl)
  - Weight: 700 (Bold)
  - Color: #342E37
  - Usage: Major section dividers
  
- **H3 (Subsection)**:
  - Size: 24px (text-2xl)
  - Weight: 700 (Bold)
  - Color: #342E37
  - Usage: Card titles, subsections

- **H4 (Card Title)**:
  - Size: 20px (text-xl)
  - Weight: 600 (Semi-bold)
  - Color: #342E37
  - Usage: Component titles

#### Body Text
- **Large Body**:
  - Size: 18px (text-lg)
  - Weight: 400 (Regular)
  - Color: #4B5563 (gray-600)
  - Usage: Descriptions, introductions
  
- **Regular Body**:
  - Size: 16px (text-base)
  - Weight: 400 (Regular)
  - Color: #4B5563 (gray-600)
  - Usage: Main content, forms
  
- **Small Body**:
  - Size: 14px (text-sm)
  - Weight: 400 (Regular)
  - Color: #6B7280 (gray-500)
  - Usage: Labels, metadata

- **Extra Small (Caption)**:
  - Size: 12px (text-xs)
  - Weight: 400 (Regular)
  - Color: #6B7280 (gray-500)
  - Usage: Timestamps, helper text

#### Links
- **Primary Link**:
  - Color: #0E79B2
  - Hover: Underline
  - Weight: 400 (Regular)

#### Special States
- **Bold Text**: Weight 700 for emphasis
- **Medium Text**: Weight 500 for semi-emphasis
- **Muted Text**: Color #9CA3AF (gray-400) for disabled/inactive

---

## Spacing System

### Standard Spacing Scale (Tailwind)
- **1**: 4px (0.25rem)
- **2**: 8px (0.5rem)
- **3**: 12px (0.75rem)
- **4**: 16px (1rem)
- **5**: 20px (1.25rem)
- **6**: 24px (1.5rem)
- **8**: 32px (2rem)
- **10**: 40px (2.5rem)
- **12**: 48px (3rem)
- **16**: 64px (4rem)
- **20**: 80px (5rem)

### Layout Spacing
- **Page Padding**: 
  - Desktop: `px-8` (32px horizontal)
  - Mobile: `px-4` (16px horizontal)
  
- **Section Vertical Spacing**: `py-8` (32px vertical)

- **Component Gaps**:
  - Large gap: `gap-6` (24px)
  - Medium gap: `gap-4` (16px)
  - Small gap: `gap-2` (8px)
  - Tight gap: `gap-1` (4px)

### Container Max Width
- **Standard Container**: `max-w-7xl` (1280px) - Used for all content pages
- **Centered**: `mx-auto` - Centers the container

---

## Component Styles

### Buttons

#### Primary Button (Yellow)
- **Background**: #FFD447
- **Text Color**: #342E37
- **Padding**: 12px 24px (py-3 px-6)
- **Border Radius**: 6px (rounded-md)
- **Font Weight**: 500 (Medium)
- **Hover**: Slightly darker yellow (hover:bg-[#ffc520])
- **Active**: Scale 98% (active:scale-98)
- **Transition**: All 200ms

#### Secondary Button (Outline)
- **Background**: Transparent
- **Border**: 1px solid #E5E7EB (gray-200)
- **Text Color**: #342E37
- **Padding**: 12px 24px
- **Border Radius**: 6px
- **Hover**: Background #F9FAFB (gray-50)

#### Destructive Button (Red)
- **Background**: #EF4444 (red-600)
- **Text Color**: White
- **Hover**: #DC2626 (red-700)

#### Button Sizes
- **Large**: py-3 px-6 (12px 24px)
- **Medium**: py-2 px-4 (8px 16px)
- **Small**: py-1.5 px-3 (6px 12px)

### Cards

#### Standard Card
- **Background**: White
- **Border**: 1px solid #E5E7EB (gray-200)
- **Border Radius**: 8px (rounded-lg)
- **Padding**: 24px (p-6)
- **Shadow**: sm (0 1px 2px rgba(0,0,0,0.05))
- **Hover**: Slightly larger shadow (hover:shadow-md)

#### Card Header
- **Padding Bottom**: 16px (pb-4)
- **Border Bottom**: 1px solid #E5E7EB

#### Card Content
- **Padding**: 24px (p-6)

### Forms

#### Input Fields
- **Background**: White
- **Border**: 1px solid #E5E7EB (gray-200)
- **Border Radius**: 6px (rounded-md)
- **Padding**: 10px 12px (py-2.5 px-3)
- **Font Size**: 16px (text-base)
- **Focus Border**: #0E79B2 (blue)
- **Focus Ring**: 2px #0E79B2 with 20% opacity
- **Placeholder**: #9CA3AF (gray-400)

#### Labels
- **Font Size**: 14px (text-sm)
- **Font Weight**: 500 (Medium)
- **Color**: #374151 (gray-700)
- **Margin Bottom**: 8px (mb-2)

#### Select Dropdowns
- Same styling as input fields
- Icon: Chevron down on right side

#### Checkboxes/Radio
- **Size**: 16px (w-4 h-4)
- **Border**: 1px solid #D1D5DB (gray-300)
- **Checked Background**: #FFD447 (primary yellow)
- **Border Radius**: 
  - Checkbox: 4px (rounded)
  - Radio: 50% (rounded-full)

### Badges/Pills

#### Status Badge
- **Padding**: 4px 8px (py-1 px-2)
- **Border Radius**: 6px (rounded-md)
- **Font Size**: 12px (text-xs)
- **Font Weight**: 500 (Medium)

#### Badge Variants
- **Automated**: Background #FFD447 20% opacity, Text #342E37
- **Ready/Success**: Background green-100, Text green-700
- **Warning**: Background amber-100, Text amber-700
- **Error**: Background red-100, Text red-700

### Icons

#### Standard Sizes
- **Extra Small**: 12px (w-3 h-3)
- **Small**: 16px (w-4 h-4)
- **Medium**: 20px (w-5 h-5)
- **Large**: 24px (w-6 h-6)
- **Extra Large**: 28px (w-7 h-7)

#### Icon Colors
- **Primary**: #0E79B2 (icon blue) - Use for all icons
- **Muted**: #6B7280 (gray-500) - Use for secondary/inactive icons
- **Success**: #10B981 (green-600)
- **Error**: #EF4444 (red-600)

### Navigation

#### Header
- **Background**: White
- **Border Bottom**: 1px solid #E5E7EB (gray-200)
- **Height**: 64px
- **Shadow**: sm (0 1px 2px rgba(0,0,0,0.05))

#### Nav Links
- **Color**: #4B5563 (gray-600)
- **Hover**: #342E37 (secondary dark)
- **Active**: #342E37 with bottom border #FFD447
- **Font Weight**: 500 (Medium)

#### Footer
- **Background**: #F9FAFB (gray-50)
- **Border Top**: 1px solid #E5E7EB (gray-200)
- **Padding**: 48px 32px (py-12 px-8)
- **Link Color**: #6B7280 (gray-500)
- **Link Hover**: #342E37

### Modals/Dialogs

#### Modal Overlay
- **Background**: rgba(0, 0, 0, 0.5) - 50% black opacity
- **Backdrop Blur**: Optional light blur

#### Modal Container
- **Background**: White
- **Border Radius**: 12px (rounded-xl)
- **Max Width**: 
  - Small: 400px
  - Medium: 600px
  - Large: 800px
  - Extra Large: 1200px (for side panel)
- **Shadow**: xl (0 20px 25px rgba(0,0,0,0.1))
- **Padding**: 24px (p-6)

#### Side Panel Modal
- **Width**: 1200px
- **Height**: 90vh
- **Position**: Fixed right side
- **Animation**: Slide in from right

### Tables

#### Table Header
- **Background**: #F9FAFB (gray-50)
- **Font Weight**: 600 (Semi-bold)
- **Color**: #374151 (gray-700)
- **Padding**: 12px 16px (py-3 px-4)
- **Border Bottom**: 2px solid #E5E7EB

#### Table Row
- **Padding**: 12px 16px (py-3 px-4)
- **Border Bottom**: 1px solid #E5E7EB
- **Hover**: Background #F9FAFB (gray-50)
- **Transition**: background-color 150ms

#### Table Cell
- **Font Size**: 14px (text-sm)
- **Color**: #4B5563 (gray-600)

---

## Interactive States

### Hover States
- **Buttons**: Slightly darker background, scale 102%
- **Cards**: Elevated shadow (shadow-md)
- **Links**: Underline, darker color
- **Table Rows**: Light gray background (#F9FAFB)
- **Icons**: Color shift to darker shade

### Focus States
- **All Interactive Elements**: 
  - Ring: 2px solid #0E79B2
  - Ring Offset: 2px
  - Outline: None (browser default removed)

### Active/Pressed States
- **Buttons**: Scale 98%, darker background
- **Cards**: Slight shadow reduction

### Disabled States
- **Opacity**: 50%
- **Cursor**: not-allowed
- **Background**: #F3F4F6 (gray-100)
- **Text Color**: #9CA3AF (gray-400)

---

## Responsive Breakpoints

### Tailwind Breakpoints (Mobile-First)
- **sm**: 640px - Small tablets
- **md**: 768px - Tablets
- **lg**: 1024px - Laptops
- **xl**: 1280px - Desktops
- **2xl**: 1536px - Large desktops

### Common Responsive Patterns

#### Grid Layouts
```
grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
```
- Mobile: 1 column
- Small tablets: 2 columns
- Desktop: 4 columns

#### Spacing
```
px-4 sm:px-6 lg:px-8
```
- Mobile: 16px padding
- Tablet: 24px padding
- Desktop: 32px padding

#### Typography
```
text-xs sm:text-sm lg:text-base
```
- Mobile: 12px
- Tablet: 14px
- Desktop: 16px

---

## Animation & Transitions

### Standard Transitions
- **Duration**: 200ms (default), 150ms (fast), 300ms (slow)
- **Easing**: ease-in-out
- **Properties**: 
  - Colors: `transition-colors`
  - All: `transition-all`
  - Transform: `transition-transform`
  - Opacity: `transition-opacity`

### Common Animations
- **Fade In**: opacity 0 → 1 (300ms)
- **Slide In**: translateY(-10px) → 0 (200ms)
- **Scale Up**: scale(0.95) → scale(1) (150ms)
- **Hover Scale**: scale(1) → scale(1.02) (200ms)

---

## Accessibility

### Color Contrast
- All text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- Primary button (#FFD447 background with #342E37 text) passes contrast requirements

### Focus Indicators
- All interactive elements have visible focus rings
- Focus ring color: #0E79B2 (2px solid with 2px offset)

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Logical tab order maintained
- Modal traps focus when open

### Screen Reader Support
- Semantic HTML elements used
- ARIA labels on icon-only buttons
- Alternative text for images
- Status announcements for dynamic content

---

## File Organization

### Component Hierarchy
```
/components
  /ui (ShadCN components)
  /dashboard
  /account
  Header.tsx
  Footer.tsx
  HomePage.tsx
  LoginPage.tsx
  SignUpPage.tsx
  Dashboard.tsx
  MyReports.tsx
  NewReport.tsx
  AccountPage.tsx
  [etc...]
```

### Styling
- **Global Styles**: `/styles/globals.css`
- **Tailwind Config**: Inline in globals.css (v4.0)
- **Component Styles**: Inline Tailwind classes
