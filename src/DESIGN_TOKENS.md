# ListingBug Design System

A comprehensive design system with reusable components and consistent design tokens.

## Design Tokens

### Colors

#### Primary Colors
- **Primary**: `#2563eb` (Blue 600)
  - Used for primary actions, links, and brand elements
  - CSS Variable: `--primary`
- **Primary Foreground**: `#ffffff` (White)
  - Text color on primary backgrounds
  - CSS Variable: `--primary-foreground`

#### Secondary Colors
- **Secondary**: `#f1f5f9` (Slate 100)
  - Used for secondary actions and backgrounds
  - CSS Variable: `--secondary`
- **Secondary Foreground**: `#0f172a` (Slate 900)
  - Text color on secondary backgrounds
  - CSS Variable: `--secondary-foreground`

#### Semantic Colors
- **Destructive**: `#d4183d` (Red)
  - Used for destructive actions and error states
  - CSS Variable: `--destructive`
- **Muted**: `#ececf0`
  - Used for muted text and backgrounds
  - CSS Variable: `--muted`
- **Accent**: `#e9ebef`
  - Used for hover states and highlights
  - CSS Variable: `--accent`

#### Neutral Colors
- **Background**: `#ffffff`
  - Page background color
  - CSS Variable: `--background`
- **Foreground**: `oklch(0.145 0 0)` (Near black)
  - Default text color
  - CSS Variable: `--foreground`
- **Border**: `rgba(0, 0, 0, 0.1)`
  - Default border color
  - CSS Variable: `--border`

### Typography

#### Font Weights
- **Normal**: `400` - `var(--font-weight-normal)`
- **Medium**: `500` - `var(--font-weight-medium)`
- **Semibold**: `600` - `var(--font-weight-semibold)`
- **Bold**: `700` - `var(--font-weight-bold)`

#### Font Sizes
Default typography is defined in `/styles/globals.css`:
- **H1**: `var(--text-2xl)` - Medium weight
- **H2**: `var(--text-xl)` - Medium weight
- **H3**: `var(--text-lg)` - Medium weight
- **H4**: `var(--text-base)` - Medium weight
- **Paragraph**: `var(--text-base)` - Normal weight
- **Label**: `var(--text-base)` - Medium weight
- **Button**: `var(--text-base)` - Medium weight
- **Input**: `var(--text-base)` - Normal weight

### Spacing

Consistent spacing scale for margins, padding, and gaps:

- **XS**: `0.25rem` (4px) - `var(--spacing-xs)`
- **SM**: `0.5rem` (8px) - `var(--spacing-sm)`
- **MD**: `1rem` (16px) - `var(--spacing-md)`
- **LG**: `1.5rem` (24px) - `var(--spacing-lg)`
- **XL**: `2rem` (32px) - `var(--spacing-xl)`
- **2XL**: `3rem` (48px) - `var(--spacing-2xl)`
- **3XL**: `4rem` (64px) - `var(--spacing-3xl)`

### Elevation (Shadows)

Four levels of elevation for depth and hierarchy:

- **Small**: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
  - CSS Variable: `var(--elevation-sm)`
  - Use: Subtle lift, cards, buttons
  
- **Medium**: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`
  - CSS Variable: `var(--elevation-md)`
  - Use: Standard cards, dropdowns
  
- **Large**: `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`
  - CSS Variable: `var(--elevation-lg)`
  - Use: Modals, popovers
  
- **XLarge**: `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`
  - CSS Variable: `var(--elevation-xl)`
  - Use: High-priority overlays

Usage:
```css
.element {
  box-shadow: var(--elevation-md);
}
```

Or with Tailwind:
```jsx
<div className="shadow-[var(--elevation-md)]">
```

### Border Radius

- **SM**: `calc(var(--radius) - 4px)` - `var(--radius-sm)`
- **MD**: `calc(var(--radius) - 2px)` - `var(--radius-md)`
- **LG**: `var(--radius)` (0.625rem / 10px) - `var(--radius-lg)`
- **XL**: `calc(var(--radius) + 4px)` - `var(--radius-xl)`

## Component Library

### LBButton

Primary, secondary, ghost, destructive, and outline button variants with three sizes.

**Import:**
```tsx
import { LBButton } from './components/design-system';
```

**Usage:**
```tsx
<LBButton variant="primary" size="md">
  Click Me
</LBButton>
```

**Props:**
- `variant`: "primary" | "secondary" | "ghost" | "destructive" | "outline"
- `size`: "sm" | "md" | "lg"
- `asChild`: boolean
- All standard button HTML attributes

### LBInput

Input field with validation states, icons, labels, and helper text.

**Import:**
```tsx
import { LBInput } from './components/design-system';
```

**Usage:**
```tsx
<LBInput
  label="Email"
  type="email"
  placeholder="you@example.com"
  error="Invalid email"
  helperText="We'll never share your email"
  icon={<Mail />}
  required
/>
```

**Props:**
- `label`: string
- `error`: string
- `success`: string
- `helperText`: string
- `icon`: ReactNode
- All standard input HTML attributes

### LBSelect

Styled select dropdown with validation and options.

**Import:**
```tsx
import { LBSelect } from './components/design-system';
```

**Usage:**
```tsx
<LBSelect
  label="Property Type"
  options={[
    { value: "house", label: "House" },
    { value: "condo", label: "Condo" }
  ]}
  placeholder="Select type"
  error="Please select an option"
  onChange={(value) => console.log(value)}
/>
```

**Props:**
- `label`: string
- `options`: Array<{ value: string; label: string; disabled?: boolean }>
- `placeholder`: string
- `error`: string
- `helperText`: string
- `onChange`: (value: string) => void

### LBToggle

Toggle switch with labels and multiple sizes.

**Import:**
```tsx
import { LBToggle } from './components/design-system';
```

**Usage:**
```tsx
<LBToggle
  checked={enabled}
  onCheckedChange={setEnabled}
  label="Enable Notifications"
  description="Receive email updates"
  size="md"
/>
```

**Props:**
- `checked`: boolean
- `onCheckedChange`: (checked: boolean) => void
- `label`: string
- `description`: string
- `size`: "sm" | "md" | "lg"
- `disabled`: boolean

### LBCard

Container component with elevation and padding variants.

**Import:**
```tsx
import {
  LBCard,
  LBCardHeader,
  LBCardTitle,
  LBCardDescription,
  LBCardContent,
  LBCardFooter
} from './components/design-system';
```

**Usage:**
```tsx
<LBCard elevation="md" padding="lg" hover>
  <LBCardHeader>
    <LBCardTitle>Title</LBCardTitle>
    <LBCardDescription>Description</LBCardDescription>
  </LBCardHeader>
  <LBCardContent>
    Content goes here
  </LBCardContent>
  <LBCardFooter>
    <LBButton>Action</LBButton>
  </LBCardFooter>
</LBCard>
```

**Props (LBCard):**
- `elevation`: "none" | "sm" | "md" | "lg" | "xl"
- `padding`: "none" | "sm" | "md" | "lg"
- `hover`: boolean

### LBTable

Data table component with header, body, and row components.

**Import:**
```tsx
import {
  LBTable,
  LBTableHeader,
  LBTableBody,
  LBTableHead,
  LBTableRow,
  LBTableCell
} from './components/design-system';
```

**Usage:**
```tsx
<LBTable>
  <LBTableHeader>
    <LBTableRow>
      <LBTableHead>Name</LBTableHead>
      <LBTableHead>Status</LBTableHead>
    </LBTableRow>
  </LBTableHeader>
  <LBTableBody>
    <LBTableRow>
      <LBTableCell>John Doe</LBTableCell>
      <LBTableCell>Active</LBTableCell>
    </LBTableRow>
  </LBTableBody>
</LBTable>
```

**Props (LBTableRow):**
- `hover`: boolean (default: true)

## Best Practices

### 1. Use Design Tokens
Always use CSS variables for colors, spacing, and elevation:
```css
/* Good */
.element {
  background: var(--primary);
  padding: var(--spacing-md);
  box-shadow: var(--elevation-sm);
}

/* Avoid */
.element {
  background: #2563eb;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
```

### 2. Consistent Spacing
Use the spacing scale for margins, padding, and gaps:
- XS (4px): Tight spacing within components
- SM (8px): Component internal spacing
- MD (16px): Standard component spacing
- LG (24px): Section spacing
- XL (32px): Large section spacing
- 2XL (48px): Page section spacing
- 3XL (64px): Hero section spacing

### 3. Elevation Hierarchy
- SM: Buttons, small cards
- MD: Standard cards, dropdowns
- LG: Modals, popovers, dialogs
- XL: High-priority overlays, tooltips

### 4. Component Composition
Build complex UIs by composing simple components:
```tsx
<LBCard elevation="md">
  <LBCardHeader>
    <LBCardTitle>Create Report</LBCardTitle>
  </LBCardHeader>
  <LBCardContent>
    <div className="space-y-4">
      <LBInput label="Report Name" />
      <LBSelect label="Type" options={options} />
      <LBToggle label="Automated" />
    </div>
  </LBCardContent>
  <LBCardFooter>
    <LBButton variant="primary">Create</LBButton>
    <LBButton variant="ghost">Cancel</LBButton>
  </LBCardFooter>
</LBCard>
```

### 5. Accessibility
All components are built with accessibility in mind:
- Proper ARIA attributes
- Keyboard navigation support
- Focus states
- Screen reader support
- Semantic HTML

## Dark Mode Support

All design tokens include dark mode variants. The system automatically switches based on the `.dark` class on a parent element.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
