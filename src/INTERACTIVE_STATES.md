# ListingBug Interactive States Documentation

## Overview

This document provides a comprehensive reference for all interactive states across the ListingBug application, including hover, focus, active, and disabled states for every interactive element.

---

## Buttons

### Primary Button (Yellow)

**Default State**:
- Background: #FFD447
- Text: #342E37
- Border: None
- Shadow: None
- Cursor: pointer

**Hover State**:
- Background: #FFC520 (darker yellow)
- Transform: scale(1.02)
- Transition: all 200ms ease-in-out
- Cursor: pointer

**Active/Pressed State**:
- Background: #FFB300 (even darker yellow)
- Transform: scale(0.98)
- Transition: all 100ms ease-in-out

**Focus State**:
- Background: #FFD447 (same as default)
- Ring: 2px solid #0E79B2
- Ring Offset: 2px
- Outline: none (browser default removed)

**Disabled State**:
- Background: #F3F4F6 (gray-100)
- Text: #9CA3AF (gray-400)
- Opacity: 0.5
- Cursor: not-allowed
- No hover/active effects

**Loading State**:
- Background: #FFD447
- Text: #342E37
- Spinner icon rotating
- Cursor: not-allowed
- Pointer events: none

---

### Secondary Button (Outline)

**Default State**:
- Background: Transparent
- Text: #342E37
- Border: 1px solid #E5E7EB (gray-200)
- Cursor: pointer

**Hover State**:
- Background: #F9FAFB (gray-50)
- Border: 1px solid #D1D5DB (gray-300)
- Transform: scale(1.02)
- Transition: all 200ms ease-in-out

**Active/Pressed State**:
- Background: #F3F4F6 (gray-100)
- Border: 1px solid #D1D5DB (gray-300)
- Transform: scale(0.98)

**Focus State**:
- Background: Transparent
- Border: 1px solid #E5E7EB
- Ring: 2px solid #0E79B2
- Ring Offset: 2px
- Outline: none

**Disabled State**:
- Background: Transparent
- Text: #9CA3AF (gray-400)
- Border: 1px solid #E5E7EB (gray-200)
- Opacity: 0.5
- Cursor: not-allowed

---

### Destructive Button (Red)

**Default State**:
- Background: #EF4444 (red-600)
- Text: White
- Border: None
- Cursor: pointer

**Hover State**:
- Background: #DC2626 (red-700)
- Transform: scale(1.02)
- Transition: all 200ms ease-in-out

**Active/Pressed State**:
- Background: #B91C1C (red-800)
- Transform: scale(0.98)

**Focus State**:
- Background: #EF4444
- Ring: 2px solid #EF4444
- Ring Offset: 2px
- Outline: none

**Disabled State**:
- Background: #FCA5A5 (red-300)
- Text: White
- Opacity: 0.5
- Cursor: not-allowed

---

### Ghost Button

**Default State**:
- Background: Transparent
- Text: #342E37
- Border: None
- Cursor: pointer

**Hover State**:
- Background: #F9FAFB (gray-50)
- Text: #342E37
- Transition: background-color 200ms ease-in-out

**Active/Pressed State**:
- Background: #F3F4F6 (gray-100)
- Transform: scale(0.98)

**Focus State**:
- Background: Transparent
- Ring: 2px solid #0E79B2
- Ring Offset: 2px
- Outline: none

**Disabled State**:
- Background: Transparent
- Text: #9CA3AF (gray-400)
- Opacity: 0.5
- Cursor: not-allowed

---

### Icon Button

**Default State**:
- Background: Transparent
- Icon Color: #6B7280 (gray-500)
- Size: 40px × 40px (or size-specific)
- Cursor: pointer

**Hover State**:
- Background: #F9FAFB (gray-50)
- Icon Color: #342E37 (darker)
- Border Radius: 6px (rounded-md)
- Transition: all 200ms ease-in-out

**Active/Pressed State**:
- Background: #F3F4F6 (gray-100)
- Icon Color: #342E37
- Transform: scale(0.95)

**Focus State**:
- Ring: 2px solid #0E79B2
- Ring Offset: 2px
- Outline: none

**Disabled State**:
- Icon Color: #D1D5DB (gray-300)
- Cursor: not-allowed
- No hover effects

---

## Form Inputs

### Text Input

**Default State**:
- Background: White
- Border: 1px solid #E5E7EB (gray-200)
- Text: #342E37
- Placeholder: #9CA3AF (gray-400)
- Border Radius: 6px
- Padding: 10px 12px
- Cursor: text

**Hover State**:
- Border: 1px solid #D1D5DB (gray-300)
- Transition: border-color 150ms ease-in-out

**Focus State**:
- Border: 1px solid #0E79B2 (blue)
- Ring: 2px solid #0E79B2 with 20% opacity
- Ring Offset: 0
- Outline: none
- Placeholder: Fades to lighter gray

**Active/Typing State**:
- Same as focus state
- Cursor: text with blinking caret

**Error State**:
- Border: 1px solid #EF4444 (red-600)
- Ring: 2px solid #EF4444 with 20% opacity (on focus)
- Background: #FEF2F2 (red-50) - optional
- Error message shown below in red text

**Disabled State**:
- Background: #F9FAFB (gray-50)
- Border: 1px solid #E5E7EB (gray-200)
- Text: #9CA3AF (gray-400)
- Cursor: not-allowed
- No hover/focus effects

**Read-Only State**:
- Background: #F9FAFB (gray-50)
- Border: 1px solid #E5E7EB (gray-200)
- Text: #4B5563 (gray-600)
- Cursor: default
- No focus ring

---

### Select Dropdown

**Default State**:
- Background: White
- Border: 1px solid #E5E7EB (gray-200)
- Text: #342E37 or placeholder color #9CA3AF
- Chevron icon: #6B7280 (gray-500)
- Cursor: pointer

**Hover State**:
- Border: 1px solid #D1D5DB (gray-300)
- Chevron icon: #342E37
- Transition: border-color 150ms ease-in-out

**Focus State**:
- Border: 1px solid #0E79B2 (blue)
- Ring: 2px solid #0E79B2 with 20% opacity
- Outline: none

**Open/Active State**:
- Border: 1px solid #0E79B2 (blue)
- Ring: 2px solid #0E79B2 with 20% opacity
- Dropdown menu visible below
- Chevron icon rotates 180° (points up)

**Disabled State**:
- Background: #F9FAFB (gray-50)
- Border: 1px solid #E5E7EB (gray-200)
- Text: #9CA3AF (gray-400)
- Chevron icon: #D1D5DB (gray-300)
- Cursor: not-allowed

---

### Select Dropdown Menu

**Default State** (when open):
- Background: White
- Border: 1px solid #E5E7EB (gray-200)
- Border Radius: 6px
- Shadow: 0 10px 15px rgba(0,0,0,0.1)
- Max height: 300px (scrollable if more)

**Option Default**:
- Background: White
- Text: #342E37
- Padding: 8px 12px
- Cursor: pointer

**Option Hover**:
- Background: #F9FAFB (gray-50)
- Text: #342E37

**Option Selected**:
- Background: #FFD447 20% opacity
- Text: #342E37
- Checkmark icon: #0E79B2 (on right side)

**Option Disabled**:
- Text: #9CA3AF (gray-400)
- Background: White
- Cursor: not-allowed
- No hover effect

---

### Checkbox

**Unchecked Default State**:
- Background: White
- Border: 1px solid #D1D5DB (gray-300)
- Size: 16px × 16px
- Border Radius: 4px
- Cursor: pointer

**Unchecked Hover State**:
- Border: 1px solid #0E79B2 (blue)
- Transition: border-color 150ms ease-in-out

**Unchecked Focus State**:
- Border: 1px solid #0E79B2 (blue)
- Ring: 2px solid #0E79B2 with 20% opacity
- Outline: none

**Checked Default State**:
- Background: #FFD447 (yellow)
- Border: 1px solid #FFD447
- Checkmark: #342E37 (dark)
- Cursor: pointer

**Checked Hover State**:
- Background: #FFC520 (darker yellow)
- Border: 1px solid #FFC520

**Checked Focus State**:
- Background: #FFD447
- Ring: 2px solid #0E79B2 with 20% opacity
- Outline: none

**Disabled Unchecked**:
- Background: #F3F4F6 (gray-100)
- Border: 1px solid #E5E7EB (gray-200)
- Cursor: not-allowed

**Disabled Checked**:
- Background: #FDE68A (yellow-200)
- Border: 1px solid #FDE68A
- Checkmark: #9CA3AF (gray-400)
- Cursor: not-allowed

---

### Radio Button

**Unselected Default State**:
- Background: White
- Border: 1px solid #D1D5DB (gray-300)
- Size: 16px × 16px
- Border Radius: 50% (full circle)
- Cursor: pointer

**Unselected Hover State**:
- Border: 1px solid #0E79B2 (blue)
- Transition: border-color 150ms ease-in-out

**Unselected Focus State**:
- Border: 1px solid #0E79B2 (blue)
- Ring: 2px solid #0E79B2 with 20% opacity
- Outline: none

**Selected Default State**:
- Background: #FFD447 (yellow)
- Border: 1px solid #FFD447
- Inner dot: #342E37 (dark), 8px diameter
- Cursor: pointer

**Selected Hover State**:
- Background: #FFC520 (darker yellow)
- Border: 1px solid #FFC520

**Selected Focus State**:
- Background: #FFD447
- Ring: 2px solid #0E79B2 with 20% opacity
- Outline: none

**Disabled States**:
- Similar to checkbox disabled states
- Cursor: not-allowed

---

### Toggle Switch

**Off Default State**:
- Background: #E5E7EB (gray-200)
- Toggle dot: White
- Toggle position: Left
- Cursor: pointer

**Off Hover State**:
- Background: #D1D5DB (gray-300)
- Transition: background-color 150ms ease-in-out

**Off Focus State**:
- Background: #E5E7EB
- Ring: 2px solid #0E79B2 with 20% opacity
- Outline: none

**On Default State**:
- Background: #FFD447 (yellow)
- Toggle dot: White
- Toggle position: Right
- Cursor: pointer

**On Hover State**:
- Background: #FFC520 (darker yellow)
- Transition: background-color 150ms ease-in-out

**On Focus State**:
- Background: #FFD447
- Ring: 2px solid #0E79B2 with 20% opacity
- Outline: none

**Disabled Off**:
- Background: #F3F4F6 (gray-100)
- Toggle dot: #E5E7EB (gray-200)
- Cursor: not-allowed

**Disabled On**:
- Background: #FDE68A (yellow-200)
- Toggle dot: White with reduced opacity
- Cursor: not-allowed

**Transition**:
- Toggle dot slides left/right: 200ms ease-in-out
- Background color changes: 200ms ease-in-out

---

## Cards

### Standard Card

**Default State**:
- Background: White
- Border: 1px solid #E5E7EB (gray-200)
- Border Radius: 8px
- Shadow: 0 1px 2px rgba(0,0,0,0.05)
- Cursor: default (or pointer if clickable)

**Hover State** (if clickable):
- Shadow: 0 4px 6px rgba(0,0,0,0.1)
- Transform: translateY(-2px)
- Transition: all 200ms ease-in-out

**Focus State** (if clickable):
- Ring: 2px solid #0E79B2
- Ring Offset: 2px
- Outline: none

**Active/Pressed State** (if clickable):
- Shadow: 0 1px 2px rgba(0,0,0,0.05)
- Transform: translateY(0)

**Selected State** (if selectable):
- Border: 2px solid #FFD447 (yellow)
- Shadow: 0 4px 6px rgba(255, 212, 71, 0.2)

---

### Report Card

**Default State**:
- Background: White
- Border: 1px solid #E5E7EB (gray-200)
- Border Radius: 8px
- Padding: 16px
- Cursor: default

**Hover State**:
- Background: #F9FAFB (gray-50)
- Transition: background-color 200ms ease-in-out

**Action Button States**:
- Edit/History buttons use Secondary Button states (see above)

---

## Navigation Links

### Header Nav Link

**Default State**:
- Text: #4B5563 (gray-600)
- Font Weight: 500
- Background: Transparent
- Cursor: pointer

**Hover State**:
- Text: #342E37 (darker)
- Background: Transparent
- Transition: color 150ms ease-in-out

**Active/Current Page State**:
- Text: #342E37 (darker)
- Border Bottom: 3px solid #FFD447 (yellow)
- Font Weight: 600

**Focus State**:
- Text: #342E37
- Outline: 2px solid #0E79B2
- Outline Offset: 4px

**Pressed State**:
- Text: #1F2937 (even darker)

---

### Footer Link

**Default State**:
- Text: #6B7280 (gray-500)
- Font Weight: 400
- Text Decoration: None
- Cursor: pointer

**Hover State**:
- Text: #342E37 (darker)
- Text Decoration: Underline
- Transition: color 150ms ease-in-out

**Focus State**:
- Text: #342E37
- Outline: 2px solid #0E79B2
- Outline Offset: 2px

**Active/Visited State**:
- Same as default (no color change)

---

### Text Link (Inline)

**Default State**:
- Text: #0E79B2 (blue)
- Font Weight: 400
- Text Decoration: None
- Cursor: pointer

**Hover State**:
- Text: #0E79B2
- Text Decoration: Underline
- Transition: text-decoration 100ms ease-in-out

**Focus State**:
- Text: #0E79B2
- Outline: 2px solid #0E79B2
- Outline Offset: 2px

**Active/Pressed State**:
- Text: #075985 (darker blue)

**Visited State**:
- Text: #7C3AED (purple) - optional
- Or same as default

---

## Tabs

### Tab Button (Inactive)

**Default State**:
- Background: Transparent
- Text: #6B7280 (gray-500)
- Border Bottom: 2px solid transparent
- Padding: 12px 16px
- Cursor: pointer

**Hover State**:
- Background: #F9FAFB (gray-50)
- Text: #4B5563 (darker gray)
- Border Bottom: 2px solid #E5E7EB (gray-200)
- Transition: all 150ms ease-in-out

**Focus State**:
- Ring: 2px solid #0E79B2
- Ring Offset: 2px
- Outline: none

---

### Tab Button (Active)

**Default State**:
- Background: Transparent
- Text: #342E37 (dark)
- Font Weight: 600
- Border Bottom: 3px solid #FFD447 (yellow)
- Padding: 12px 16px
- Cursor: default

**No Hover State**:
- Same as default (already active)

**Focus State**:
- Ring: 2px solid #0E79B2
- Ring Offset: 2px
- Outline: none

---

## Badges

### Standard Badge

**Default State**:
- Background: Varies by variant (see below)
- Text: Varies by variant
- Padding: 4px 8px
- Border Radius: 6px
- Font Size: 12px
- Cursor: default (not clickable)

**Automated Badge**:
- Background: #FFD447 with 20% opacity
- Text: #342E37

**Success Badge**:
- Background: #D1FAE5 (green-100)
- Text: #059669 (green-700)

**Warning Badge**:
- Background: #FEF3C7 (amber-100)
- Text: #D97706 (amber-700)

**Error Badge**:
- Background: #FEE2E2 (red-100)
- Text: #DC2626 (red-700)

**No Interactive States**:
- Badges are typically static (no hover, focus, etc.)

---

## Modals & Dialogs

### Modal Overlay

**Default State**:
- Background: rgba(0, 0, 0, 0.5) - 50% black
- Backdrop Filter: Optional blur (if supported)
- Cursor: default

**Clickable State**:
- Cursor: pointer (to close modal)

**Animation**:
- Fade in: opacity 0 → 0.5 (300ms ease-in-out)
- Fade out: opacity 0.5 → 0 (300ms ease-in-out)

---

### Modal Container

**Default State**:
- Background: White
- Border Radius: 12px
- Shadow: 0 20px 25px rgba(0,0,0,0.1)
- Padding: 24px
- Cursor: default

**Animation**:
- Slide in from right: translateX(100%) → 0 (300ms ease-out)
- Slide out to right: translateX(0) → 100% (300ms ease-in)

**Focus Trap**:
- Focus should be trapped within modal
- Tab cycles through interactive elements inside modal

---

### Modal Close Button

**Default State**:
- Icon: X (close icon)
- Color: #6B7280 (gray-500)
- Background: Transparent
- Size: 24px × 24px
- Cursor: pointer

**Hover State**:
- Icon Color: #342E37 (darker)
- Background: #F9FAFB (gray-50)
- Border Radius: 4px
- Transition: all 150ms ease-in-out

**Focus State**:
- Ring: 2px solid #0E79B2
- Ring Offset: 2px
- Outline: none

**Active/Pressed State**:
- Icon Color: #1F2937 (even darker)
- Background: #F3F4F6 (gray-100)

---

## Tables

### Table Row

**Default State**:
- Background: White
- Border Bottom: 1px solid #E5E7EB (gray-200)
- Text: #4B5563 (gray-600)
- Cursor: default (or pointer if clickable)

**Hover State** (if clickable):
- Background: #F9FAFB (gray-50)
- Transition: background-color 150ms ease-in-out

**Selected/Active State**:
- Background: #FFD447 with 10% opacity
- Border Left: 3px solid #FFD447

**Focus State** (if clickable):
- Ring: 2px solid #0E79B2 (inside row)
- Outline: none

---

### Table Header Cell

**Default State**:
- Background: #F9FAFB (gray-50)
- Text: #374151 (gray-700)
- Font Weight: 600
- Border Bottom: 2px solid #E5E7EB (gray-200)
- Cursor: default

**Sortable Header (Default)**:
- Background: #F9FAFB
- Text: #374151
- Sort icon: #9CA3AF (gray-400)
- Cursor: pointer

**Sortable Header (Hover)**:
- Background: #F3F4F6 (gray-100)
- Text: #342E37
- Sort icon: #6B7280 (gray-500)
- Transition: all 150ms ease-in-out

**Sortable Header (Active/Sorted)**:
- Background: #F9FAFB
- Text: #342E37
- Font Weight: 700
- Sort icon: #0E79B2 (blue)

---

## Icons

### Icon Button (Standalone)

**Default State**:
- Color: #6B7280 (gray-500) or #0E79B2 (blue) based on context
- Background: Transparent
- Size: Varies (16px, 20px, 24px)
- Cursor: pointer

**Hover State**:
- Color: #342E37 (darker) or darker blue
- Background: #F9FAFB (gray-50) - optional circle
- Transform: scale(1.1)
- Transition: all 150ms ease-in-out

**Focus State**:
- Ring: 2px solid #0E79B2
- Ring Offset: 2px
- Border Radius: 4px

**Active/Pressed State**:
- Color: #1F2937 (even darker)
- Transform: scale(0.95)

**Disabled State**:
- Color: #D1D5DB (gray-300)
- Cursor: not-allowed
- No hover effects

---

### Icon Within Button

**States**:
- Icon inherits color from button text
- Icon transforms with button (scale, etc.)
- No separate interactive states

---

## Dropdowns & Menus

### Dropdown Menu Container

**Default State** (when open):
- Background: White
- Border: 1px solid #E5E7EB (gray-200)
- Border Radius: 8px
- Shadow: 0 10px 15px rgba(0,0,0,0.1)
- Padding: 4px
- Animation: Fade in + scale from 95% to 100% (150ms ease-out)

---

### Dropdown Menu Item

**Default State**:
- Background: White
- Text: #342E37
- Padding: 8px 12px
- Border Radius: 4px
- Cursor: pointer

**Hover State**:
- Background: #F9FAFB (gray-50)
- Text: #342E37
- Transition: background-color 100ms ease-in-out

**Focus State**:
- Background: #F9FAFB (gray-50)
- Ring: 2px solid #0E79B2 (inside item)
- Outline: none

**Active/Pressed State**:
- Background: #F3F4F6 (gray-100)

**Disabled State**:
- Text: #9CA3AF (gray-400)
- Background: White
- Cursor: not-allowed
- No hover effect

**Destructive Item** (e.g., Delete):
- Text: #EF4444 (red-600)
- Hover Background: #FEE2E2 (red-100)

---

## Tooltips

### Tooltip

**Default State** (when visible):
- Background: #1F2937 (gray-800)
- Text: White
- Font Size: 12px
- Padding: 6px 10px
- Border Radius: 6px
- Shadow: 0 4px 6px rgba(0,0,0,0.1)
- Arrow: Pointing to trigger element
- Animation: Fade in (150ms ease-out)
- Delay: 500ms after hover starts

**Position**:
- Adapts based on available space (top, bottom, left, right)

**Animation**:
- Fade in: opacity 0 → 1
- Fade out: opacity 1 → 0
- Transition: 150ms ease-in-out

---

## Loading States

### Button Loading

**State**:
- Background: Same as button default
- Text: Hidden or "Loading..."
- Spinner: Rotating icon in button color
- Cursor: not-allowed
- Pointer events: none

**Spinner Animation**:
- Rotate 360° continuous
- Animation: 1s linear infinite

---

### Page/Content Loading

**Skeleton Loader**:
- Background: #E5E7EB (gray-200)
- Animation: Pulse (opacity 100% → 50% → 100%)
- Animation Duration: 1.5s ease-in-out infinite
- Shape: Matches content being loaded

**Spinner**:
- Color: #0E79B2 (blue) or #FFD447 (yellow)
- Size: 32px - 48px
- Center of container
- Animation: Rotate 360° continuous

---

## Error States

### Form Field Error

**Input Error State**:
- Border: 1px solid #EF4444 (red-600)
- Ring: 2px solid #EF4444 with 20% opacity (on focus)
- Background: #FEF2F2 (red-50) - optional

**Error Message**:
- Text: #EF4444 (red-600)
- Font Size: 12px (text-xs)
- Icon: Alert circle (optional)
- Margin Top: 4px

---

### Page Error State

**Error Container**:
- Background: #FEF2F2 (red-50)
- Border: 1px solid #FEE2E2 (red-200)
- Border Radius: 8px
- Padding: 16px
- Icon: Alert triangle or X circle (#EF4444)

**Error Text**:
- Heading: #DC2626 (red-700), font weight 600
- Body: #991B1B (red-800)

**Retry Button**:
- Uses Primary or Secondary button states

---

## Empty States

### Empty List/Content

**Container**:
- Background: #F9FAFB (gray-50) - optional
- Border: 2px dashed #E5E7EB (gray-200) - optional
- Border Radius: 8px
- Padding: 48px 24px
- Text Align: Center

**Icon**:
- Color: #9CA3AF (gray-400)
- Size: 48px - 64px

**Text**:
- Heading: #4B5563 (gray-600)
- Body: #6B7280 (gray-500)

**CTA Button**:
- Uses Primary button states

**No Interactive States**:
- Empty state itself is not interactive (except CTA button)

---

## Notifications & Alerts

### Toast Notification

**Default State** (when visible):
- Background: White
- Border: 1px solid #E5E7EB (gray-200)
- Border Radius: 8px
- Shadow: 0 10px 15px rgba(0,0,0,0.1)
- Padding: 16px
- Animation: Slide in from top/right (300ms ease-out)

**Success Toast**:
- Border Left: 4px solid #10B981 (green-600)
- Icon: Checkmark circle (#10B981)

**Error Toast**:
- Border Left: 4px solid #EF4444 (red-600)
- Icon: X circle (#EF4444)

**Warning Toast**:
- Border Left: 4px solid #F59E0B (amber-600)
- Icon: Alert triangle (#F59E0B)

**Info Toast**:
- Border Left: 4px solid #0E79B2 (blue)
- Icon: Info circle (#0E79B2)

**Close Button**:
- Uses Modal Close Button states
- Hover: Background #F9FAFB (gray-50)

**Auto-Dismiss**:
- Fades out after 5 seconds
- Fade out animation: opacity 1 → 0 (300ms ease-in)

---

## Search & Filters

### Search Input

**Default State**:
- Background: White
- Border: 1px solid #E5E7EB (gray-200)
- Padding Left: 36px (space for search icon)
- Search Icon: #9CA3AF (gray-400), positioned left
- Cursor: text

**Hover State**:
- Border: 1px solid #D1D5DB (gray-300)
- Search Icon: #6B7280 (gray-500)

**Focus State**:
- Border: 1px solid #0E79B2 (blue)
- Ring: 2px solid #0E79B2 with 20% opacity
- Search Icon: #0E79B2 (blue)

**Active/Has Content State**:
- Clear button (X) appears on right
- Clear button states:
  - Default: #9CA3AF (gray-400)
  - Hover: #6B7280 (gray-500), background #F9FAFB
  - Active: #4B5563 (gray-600)

---

## Progress Indicators

### Progress Bar

**Container**:
- Background: #E5E7EB (gray-200)
- Height: 8px
- Border Radius: 4px (full)

**Progress Fill**:
- Background: #FFD447 (yellow) or #0E79B2 (blue)
- Height: 8px
- Border Radius: 4px (full)
- Transition: width 300ms ease-in-out

**Indeterminate/Loading**:
- Background: Animated gradient sliding left to right
- Animation: 1.5s linear infinite

---

### Step Indicator (Multi-step Form)

**Step Circle (Completed)**:
- Background: #FFD447 (yellow)
- Border: 2px solid #FFD447
- Checkmark: #342E37
- Text Color: #342E37 (dark)

**Step Circle (Current)**:
- Background: #0E79B2 (blue)
- Border: 2px solid #0E79B2
- Number: White
- Ring: 4px solid #0E79B2 with 20% opacity

**Step Circle (Upcoming)**:
- Background: White
- Border: 2px solid #E5E7EB (gray-200)
- Number: #9CA3AF (gray-400)

**Step Connector Line (Completed)**:
- Background: #FFD447 (yellow)
- Height: 2px

**Step Connector Line (Upcoming)**:
- Background: #E5E7EB (gray-200)
- Height: 2px

---

## Accessibility Annotations

### Keyboard Focus Order
- Tab through interactive elements in logical order
- Skip navigation link available (optional)
- Focus visible on all interactive elements
- Modal traps focus when open

### Screen Reader States
- Buttons: Include aria-label for icon-only buttons
- Form fields: Associate labels with inputs
- Error messages: aria-describedby on inputs
- Loading states: aria-live regions for dynamic content
- Disabled states: aria-disabled="true"
- Active tab: aria-selected="true"

### Color Contrast
- All text meets WCAG AA standards (4.5:1 ratio)
- Interactive elements have 3:1 contrast against background
- Focus indicators have 3:1 contrast

### Motion Preferences
- Respect prefers-reduced-motion
- Disable animations if user prefers reduced motion
- Provide instant transitions instead

---

## Animation Timing Reference

### Standard Durations
- **Fast**: 100ms - Small transforms, color changes
- **Normal**: 150-200ms - Most transitions
- **Slow**: 300ms - Modal open/close, page transitions
- **Loading**: 1-2s - Infinite animations

### Easing Functions
- **ease-in-out**: Most transitions (default)
- **ease-out**: Entrances, opening animations
- **ease-in**: Exits, closing animations
- **linear**: Progress bars, loading spinners

---

## State Combinations

### Button with Icon
- Icon color matches text color
- Icon scales with button transform
- Both icon and text change on state change

### Card with Buttons
- Card has hover state (background change)
- Buttons inside have independent hover states
- Button hover takes precedence over card hover

### Form Field with Error
- Error state overrides default/focus states
- Error ring appears on focus
- Error message always visible when in error state

### Disabled Elements
- No pointer events
- No focus state
- No keyboard interaction
- Cursor: not-allowed

---

## Implementation Notes for Designers

### Figma Setup
1. Create component variants for each state
2. Name variants: "State=Default", "State=Hover", "State=Focus", etc.
3. Use auto-layout for consistent padding
4. Add annotations for animations and transitions
5. Document timing in component descriptions

### Bubble Setup
1. Use conditional formatting for states
2. Create workflows for state changes
3. Use custom states for complex UI states
4. Add CSS for hover effects (custom code if needed)
5. Test all states on different devices

### Testing Checklist
- [ ] All buttons have hover, focus, active, disabled states
- [ ] All form fields have default, hover, focus, error, disabled states
- [ ] All links have hover and focus states
- [ ] Cards have appropriate hover states if clickable
- [ ] Modals have open/close animations
- [ ] Loading states defined for async actions
- [ ] Error states defined for all user inputs
- [ ] Empty states designed for all lists/collections
- [ ] Focus indicators visible and consistent
- [ ] Color contrast meets WCAG AA standards
- [ ] Keyboard navigation works throughout
- [ ] Screen reader support verified

---

## Quick Reference Chart

| Element | Hover | Focus | Active | Disabled |
|---------|-------|-------|--------|----------|
| Primary Button | Darker yellow, scale 1.02 | Blue ring | Scale 0.98 | Gray, 50% opacity |
| Secondary Button | Gray-50 bg | Blue ring | Gray-100 bg | Gray text, 50% opacity |
| Text Input | Gray-300 border | Blue border + ring | N/A | Gray-50 bg |
| Checkbox | Blue border | Blue ring | N/A | Gray bg |
| Card (clickable) | Elevated shadow | Blue ring | Shadow reduced | N/A |
| Nav Link | Darker text | Blue outline | Even darker | N/A |
| Tab (inactive) | Gray-50 bg | Blue ring | N/A | N/A |
| Tab (active) | No change | Blue ring | N/A | N/A |
| Icon Button | Darker, scale 1.1 | Blue ring | Scale 0.95 | Gray-300 color |
| Table Row | Gray-50 bg | Blue ring | N/A | N/A |

---

This completes the interactive states documentation. Use this as a reference when implementing designs in Figma or building in Bubble to ensure consistent user experience across all interactions.
