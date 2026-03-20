# Walkthrough System - Quick Start Guide

## For Developers

### Using the Walkthrough Hook

```tsx
import { useWalkthrough } from './WalkthroughContext';

function MyComponent() {
  const { 
    walkthroughActive,      // Is walkthrough currently running?
    currentStep,            // What step are we on? (1-4)
    totalSteps,             // Total steps (4)
    startWalkthrough,       // Start from step 1
    completeStep,           // Advance to next step
    skipWalkthrough,        // Skip entire walkthrough
    resetWalkthrough,       // Reset and allow restart
    isStepActive            // Check if specific step is active
  } = useWalkthrough();

  const isStep2Active = isStepActive(2);
  
  const handleAction = () => {
    // Do something
    if (isStep2Active) {
      completeStep(2); // Advance to step 3
    }
  };
}
```

### Adding Walkthrough to a New Page

1. **Add data attribute** to the element you want to highlight:
```tsx
<button data-walkthrough="my-button-id">
  Click Me
</button>
```

2. **Import the hook and overlay**:
```tsx
import { useWalkthrough } from './WalkthroughContext';
import { WalkthroughOverlay } from './WalkthroughOverlay';
```

3. **Check if step is active**:
```tsx
const { isStepActive, completeStep, skipWalkthrough, totalSteps } = useWalkthrough();
const isMyStepActive = isStepActive(X); // Replace X with step number
```

4. **Add the overlay**:
```tsx
<WalkthroughOverlay
  isActive={isMyStepActive}
  step={X}
  totalSteps={totalSteps}
  title="Step Title"
  description="What the user should do"
  highlightSelector="[data-walkthrough='my-button-id']"
  position="center"
  ctaText="Next"
  onNext={() => completeStep(X)}
  onSkip={skipWalkthrough}
/>
```

### Interactive Overlay (for complex interactions)

```tsx
import { InteractiveWalkthroughOverlay } from './InteractiveWalkthroughOverlay';

<InteractiveWalkthroughOverlay
  isActive={isStep1Active}
  highlightSelector="[data-walkthrough='search-listings-button']"
  tooltipPosition="bottom-left"
  mode="wait-for-click"
  title="Welcome to ListingBug!"
  description="Click the Search Listings button to get started."
/>
```

## For Product/Design

### Current Walkthrough Steps

| Step | Page | Action | User Sees |
|------|------|--------|-----------|
| 1 | Dashboard | Click "Search Listings" | Welcome overlay with button highlight |
| 2 | SearchListings | Click "Save Search" | Guidance to save first search |
| 3 | Automations | Fill form & create | Instructions for first automation |
| 4 | Integrations Tab | Click "Finish" | Completion message + compliance reminder |

### Editing Walkthrough Messaging

**Step 1 - Dashboard** (`/components/Dashboard.tsx`):
```tsx
<InteractiveWalkthroughOverlay
  title="Welcome to ListingBug! 👋"  // Edit this
  description="Start by searching..."  // Edit this
/>
```

**Step 2 - SearchListings** (`/components/SearchListings.tsx`):
```tsx
<WalkthroughOverlay
  title="Save your search"  // Edit this
  description="Click the Save Search button..."  // Edit this
/>
```

**Step 3 - Automations** (`/components/AutomationsManagementPage.tsx`):
```tsx
<WalkthroughOverlay
  title="Create your first automation"  // Edit this
  description="Fill out the form above..."  // Edit this
/>
```

**Step 4 - Completion** (`/components/AutomationsManagementPage.tsx`):
```tsx
<WalkthroughOverlay
  title="All set! You're ready to go"  // Edit this
  description="Your automation is active..."  // Edit this
/>
```

## For QA Testing

### Test Scenarios

#### **1. First-Time User (Happy Path)**
1. Clear browser localStorage
2. Navigate to Dashboard
3. Verify Step 1 overlay appears
4. Click "Search Listings" button
5. Verify navigation to SearchListings page
6. Perform a search
7. Click "Save Search" button
8. Verify navigation to Automations page
9. Fill out automation form
10. Click "Create Automation"
11. Verify navigation to Integrations tab
12. Click "Finish walkthrough"
13. Verify completion toast appears

**Expected Result**: `localStorage.getItem('listingbug_walkthrough_completed') === 'true'`

#### **2. Skip Walkthrough**
1. Clear browser localStorage
2. Navigate to Dashboard
3. Click "Skip" on Step 1 overlay
4. Verify walkthrough dismissed
5. Verify completion stored in localStorage

**Expected Result**: Walkthrough doesn't appear on subsequent pages

#### **3. Resume After Refresh**
1. Clear browser localStorage
2. Navigate to Dashboard
3. Start walkthrough (Step 1)
4. Click "Search Listings"
5. On SearchListings page, refresh browser
6. Verify Step 2 resumes automatically
7. Verify resume toast appears

**Expected Result**: Walkthrough continues from current step

#### **4. Reset Walkthrough**
1. Complete walkthrough (all 4 steps)
2. Navigate to Account Settings → Profile tab
3. Scroll to "Preferences" card
4. Click "Reset Walkthrough" button
5. Verify toast: "Walkthrough reset! Reload..."
6. Reload page
7. Verify walkthrough starts from Step 1

**Expected Result**: Walkthrough replays from beginning

#### **5. Returning User (No Walkthrough)**
1. Set `localStorage.setItem('listingbug_walkthrough_completed', 'true')`
2. Navigate to Dashboard
3. Verify NO walkthrough overlay appears
4. Navigate to other pages
5. Verify walkthrough never triggers

**Expected Result**: Completed users don't see walkthrough

#### **6. Mobile Responsive**
1. Open in mobile viewport (375x667)
2. Start walkthrough
3. Verify tooltip stays within viewport
4. Verify buttons are touch-friendly
5. Verify highlighted elements scroll into view

**Expected Result**: Full mobile compatibility

#### **7. Automation Limit Bypass**
1. Set plan to Pro: `localStorage.setItem('listingbug_user_plan', 'pro')`
2. Create 3 automations (Pro plan limit)
3. Clear walkthrough: `localStorage.removeItem('listingbug_walkthrough_completed')`
4. Reload and start walkthrough
5. Complete Steps 1-2
6. On Step 3, create automation
7. Verify automation created successfully

**Expected Result**: Walkthrough bypasses 3-automation limit

### Test Checklist

- [ ] Step 1 displays on first visit
- [ ] Click "Search Listings" advances to Step 2
- [ ] Save Search advances to Step 3
- [ ] Create Automation advances to Step 4
- [ ] Finish button completes walkthrough
- [ ] Skip button works at any step
- [ ] Reset button in Settings works
- [ ] Page refresh resumes walkthrough
- [ ] Returning users don't see walkthrough
- [ ] Mobile tooltips stay in viewport
- [ ] All toast notifications appear correctly
- [ ] localStorage keys set properly
- [ ] No console errors
- [ ] Automation limit bypass works

## For Support Team

### User Reports: "I want to see the walkthrough again"

**Solution**:
1. Go to Account Settings (click profile icon in header)
2. Click "Profile" tab
3. Scroll to "Preferences" section
4. Click "Reset Walkthrough" button
5. Reload the page
6. Walkthrough will start from Step 1

### User Reports: "Walkthrough is stuck / won't advance"

**Troubleshooting**:
1. Check browser console for errors (F12 → Console tab)
2. Verify localStorage: `localStorage.getItem('listingbug_walkthrough_step')`
3. Try clicking "Skip" to dismiss, then reset via Settings
4. Clear browser cache and localStorage
5. Try in incognito mode

**Escalate if**: Error persists across browsers/devices

### User Reports: "I accidentally skipped the walkthrough"

**Solution**:
Same as "I want to see the walkthrough again" - use Reset Walkthrough feature in Settings.

## localStorage Management

### Check Walkthrough State (Browser Console)
```javascript
// Is walkthrough completed?
localStorage.getItem('listingbug_walkthrough_completed')
// Returns: 'true' or null

// What step is active?
localStorage.getItem('listingbug_walkthrough_step')
// Returns: '1', '2', '3', '4', or null
```

### Manually Reset Walkthrough (Browser Console)
```javascript
localStorage.removeItem('listingbug_walkthrough_completed');
localStorage.removeItem('listingbug_walkthrough_step');
location.reload();
```

### Simulate First-Time User (Browser Console)
```javascript
localStorage.clear();
location.reload();
```

## Common Issues & Solutions

### Issue: Walkthrough doesn't appear on first visit
**Cause**: `listingbug_walkthrough_completed` is already set  
**Solution**: Clear localStorage or use Reset Walkthrough

### Issue: Overlay appears but button isn't highlighted
**Cause**: `data-walkthrough` attribute missing or incorrect  
**Solution**: Check element has correct attribute, verify selector matches

### Issue: Step doesn't advance after completing action
**Cause**: `completeStep()` not called in handler function  
**Solution**: Verify `completeStep(X)` is called in appropriate event handler

### Issue: Tooltip appears off-screen on mobile
**Cause**: Position calculation error  
**Solution**: Tooltip should auto-adjust, report as bug if persists

### Issue: Walkthrough conflicts with automation limit modal
**Cause**: Both modals trying to display simultaneously  
**Solution**: Walkthrough includes bypass logic, should not conflict

---

## Quick Links

- **Full Documentation**: `/WALKTHROUGH_SYSTEM.md`
- **Completion Summary**: `/WALKTHROUGH_COMPLETION_SUMMARY.md`
- **Context Component**: `/components/WalkthroughContext.tsx`
- **Overlay Components**: 
  - `/components/WalkthroughOverlay.tsx`
  - `/components/InteractiveWalkthroughOverlay.tsx`

---

**Questions?** Contact the development team or refer to the full documentation files.
