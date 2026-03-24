# ChangePlanModal Dark Mode Redesign

## Overview
The ChangePlanModal component has been redesigned to support both light mode (saved) and dark mode (new). The implementation maintains the original light mode design while introducing a cohesive dark mode that aligns with the brand's design system.

## Design Philosophy

### Light Mode (Saved)
- **Header**: Bright yellow background (#ffd447) with dark text (#342e37)
- **Containers**: White backgrounds (bg-white)
- **Text**: Dark text colors (#342e37) for primary, gray (gray-600) for secondary
- **Accents**: Green for success states, blue for upgrades, amber for downgrades
- **Borders**: Light gray (border-gray-200)

### Dark Mode (Redesigned - NEW)
- **Header**: Brand yellow (#FFCE0A) background with dark text (#0F1115) for high contrast
- **Main Containers**: Dark backgrounds (dark:bg-[#2F2F2F])
- **Secondary Containers**: Darker backgrounds (dark:bg-[#1a1a2e]) for nested content
- **Text**: 
  - Primary: white text (dark:text-white)
  - Secondary: semi-transparent white (dark:text-white/60, dark:text-white/70)
  - Tertiary: more transparent (dark:text-white/80)
- **Accents**: Brand yellow (#FFCE0A) for highlights and selected states
- **Borders**: Semi-transparent white (dark:border-white/10, dark:border-white/20)

## Component Styling Details

### Modal Container
```
LIGHT MODE:  bg-white
DARK MODE:   dark:bg-[#2F2F2F]
```

### Header
```
LIGHT MODE:  bg-[#ffd447] text-[#342e37]
DARK MODE:   dark:bg-[#FFCE0A] dark:text-[#0F1115]
```
High contrast in both modes for optimal readability.

### Plan Cards
```
LIGHT MODE:
- Default:     border-gray-200 bg-white
- Current:     border-green-400 bg-green-50/30
- Selected:    border-[#342e37] bg-white (shadow-lg)

DARK MODE:
- Default:     dark:border-white/10 dark:bg-[#1a1a2e]
- Current:     dark:border-green-500 dark:bg-green-500/10
- Selected:    dark:border-[#FFCE0A] dark:bg-[#1a1a2e] (shadow-xl shadow-[#FFCE0A]/20)
```

### Plan Information
```
LIGHT MODE:  Dark text (#342e37) for plan name/price
DARK MODE:   White text (dark:text-white)
```

### Feature List
```
LIGHT MODE:  Green checkmarks (text-green-600), gray text (text-gray-700)
DARK MODE:   Green checkmarks (dark:text-green-400), light text (dark:text-white/80)
```

### Badges
```
LIGHT MODE:  bg-[#ffd447] text-[#342e37] (yellow)
DARK MODE:   dark:bg-[#FFCE0A] dark:text-[#0F1115] (bright yellow)

CURRENT PLAN BADGE:
- Both modes: Green with white text
```

### Info Box
```
LIGHT MODE:  bg-gray-50
DARK MODE:   dark:bg-white/5 dark:border-white/10 dark:text-white/80
```

### Confirmation Screen Header
```
LIGHT MODE:  bg-white
DARK MODE:   dark:bg-[#2F2F2F] dark:border-white/10 dark:text-white
```

### Change Summary Container
```
LIGHT MODE:  bg-gray-50
DARK MODE:   dark:bg-[#1a1a2e] dark:border-white/10
```

### Alert Boxes
**Upgrade Alert (Blue)**
```
LIGHT MODE:  bg-blue-50 text-blue-900
DARK MODE:   dark:bg-blue-500/10 dark:text-blue-300
```

**Downgrade Alert (Amber)**
```
LIGHT MODE:  bg-amber-50 text-amber-900
DARK MODE:   dark:bg-amber-500/10 dark:text-amber-300
```

## Color Palette Reference

### Dark Mode Colors Used
| Element | Color | Usage |
|---------|-------|-------|
| Main Background | #2F2F2F | Modal container |
| Secondary Background | #1a1a2e | Plan cards, nested content |
| Icon Wrapper | #0F1115 | Icon containers |
| Brand Yellow | #FFCE0A | Header, accent highlights, borders |
| Text Primary | white | Main text in dark mode |
| Text Secondary | white/60, white/70 | Labels, secondary info |
| Text Tertiary | white/80 | Feature descriptions |
| Border | white/10, white/20 | Subtle borders |

## Implementation Notes

### Tailwind Dark Mode
- Uses Tailwind's `dark:` prefix for all dark mode styles
- Requires `dark` class on parent container (typically handled by app-level theme provider)
- Responsive and performant - no JavaScript required beyond existing component logic

### Accessibility
- Maintains WCAG AA contrast ratios in both modes
- Yellow header (#FFCE0A) on dark background provides high contrast
- Semi-transparent text uses sufficient opacity for readability

### Consistency
- Aligns with existing ListingBug design system used across:
  - Dashboard
  - Integrations Page
  - Automations Management
  - Search and Listing Pages
  - Account Settings

## Testing Checklist

- [ ] Light mode displays correctly (all text readable, colors accurate)
- [ ] Dark mode displays correctly (all text readable, colors accurate)
- [ ] Plan selection works in both modes
- [ ] Badge colors correct in both modes
- [ ] Alerts display properly in both modes
- [ ] Icons have proper contrast in both modes
- [ ] Hover states work in both modes
- [ ] Current plan highlighting clear in both modes
- [ ] Selected plan highlighting clear in both modes
- [ ] Responsive design maintained in both modes

## Future Enhancements

1. **Animation Improvements**: Smooth transitions between light/dark modes
2. **Additional Themes**: Support for custom brand color variations
3. **Accessibility Audits**: Regular testing with WCAG compliance tools
4. **User Preference Storage**: Remember user's dark/light mode preference

## Files Modified

- `src/components/ChangePlanModal.tsx` - Main component with dark mode support
- Commit: 0cd2b62 with detailed change documentation

## Build Strategy

**Current Focus**: Dark Mode First
- Dark mode is the primary design focus
- Light mode is preserved as the fallback/alternative design
- This aligns with modern design practices favoring dark mode UX

**Future Work**: Light Mode Polish
- Light mode will be refined in subsequent iterations
- Will maintain visual consistency with dark mode
- Will follow best practices for light mode accessibility
