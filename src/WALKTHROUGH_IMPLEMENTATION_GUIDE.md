# First-Time User Walkthrough Implementation Guide

**Status:** In Progress  
**Date:** December 6, 2025  
**Feature:** Interactive onboarding flow for new users

---

## 🎯 Overview

A 3-step guided walkthrough that helps new users complete their first search, automation setup, and integration connection. Triggered only after signup (not on login).

---

## 📋 Flow Steps

### Step 1: Search Experience
**Page:** `/components/SearchListings.tsx`  
**Trigger:** Automatically after Quick Start Guide completes  
**Goal:** Help user find and save their first search

**Actions:**
1. Overlay appears: "Let's start by finding properties"
2. Highlights search filters section
3. Shows tooltip: "Use filters to narrow down properties. You can save this search for automation."
4. When user clicks "Save Search" → Complete Step 1
5. Navigate to Automations page with Step 2 active

**Implementation Status:** 🟡 IN PROGRESS

```typescript
// Added to SearchListings.tsx
const { isStepActive, completeStep, skipWalkthrough, totalSteps } = useWalkthrough();
const walkthroughStep1Active = isStepActive(1);

// In handleConfirmSaveSearch function:
if (walkthroughStep1Active) {
  completeStep(1); // Triggers Step 2 and navigates to automations
}
```

**Toast Confirmation:** "Search saved! Moving to automations..."

---

### Step 2: Automation Setup
**Page:** `/components/AutomationsManagementPage.tsx`  
**Trigger:** After Step 1 completes  
**Goal:** Guide user to create their first automation

**Actions:**
1. Overlay appears: "Now let's automate your search"
2. Highlights "Create Automation" button
3. Shows slot tracker: "You have 1 automation slot (Starter plan)"
4. Tooltip: "Automations run your saved searches on a schedule"
5. When user completes automation wizard → Complete Step 2
6. Open Integration Connection Modal

**Implementation Status:** ⏳ TODO

```typescript
// To add to AutomationsManagementPage.tsx
const { isStepActive, completeStep } = useWalkthrough();
const walkthroughStep2Active = isStepActive(2);

// After automation is created:
if (walkthroughStep2Active) {
  completeStep(2); // Triggers Step 3
}
```

**Toast Confirmation:** "Automation created! Now connect an integration..."

---

### Step 3: Integration Selection
**Page:** `/components/IntegrationConnectionModal.tsx` or inline  
**Trigger:** After Step 2 completes  
**Goal:** Help user connect their first integration

**Actions:**
1. Overlay appears: "Choose where your listings should go"
2. Highlights available integrations based on plan:
   - **Starter:** Mailchimp, Google Sheets, Airtable, Twilio
   - **Pro:** Salesforce, HubSpot, Zapier, Make
   - **Enterprise:** Custom API, White-label
3. Tooltip: "Your plan includes X integrations. Upgrade for more."
4. When user connects integration → Complete Step 3
5. Show completion modal

**Implementation Status:** ⏳ TODO

```typescript
// To add to integration connection flow
const { isStepActive, completeStep } = useWalkthrough();
const walkthroughStep3Active = isStepActive(3);

// After integration is connected:
if (walkthroughStep3Active) {
  completeStep(3); // Shows completion modal
}
```

**Toast Confirmation:** "Integration connected! 🎉"

---

## 🎨 Design & Styling

### WalkthroughOverlay Component
**Location:** `/components/WalkthroughOverlay.tsx`  
**Status:** ✅ COMPLETE

**Features:**
- Dark overlay with spotlight effect on highlighted element
- Yellow (#FFD447) border pulsing animation
- Progress indicator (Step X of 3)
- Step-specific icons (Search, Zap, Database)
- Skip button (always visible)
- Next button with dynamic text
- Responsive positioning (center, top, bottom, left, right)

**Props:**
```typescript
interface WalkthroughOverlayProps {
  isActive: boolean;
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  highlightSelector?: string; // CSS selector
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: React.ReactNode;
  ctaText?: string;
  onNext: () => void;
  onSkip: () => void;
  showSkip?: boolean;
}
```

**Usage Example:**
```tsx
<WalkthroughOverlay
  isActive={walkthroughStep === 1}
  step={1}
  totalSteps={3}
  title="Let's start by finding properties"
  description="Use filters to narrow down properties. You can save this search for automation."
  highlightSelector=".search-filters"
  position="center"
  ctaText="Got it"
  onNext={() => handleNextStep()}
  onSkip={() => skipWalkthrough()}
/>
```

---

### WalkthroughCompleteModal Component
**Location:** `/components/WalkthroughOverlay.tsx`  
**Status:** ✅ COMPLETE

**Shown when:** All 3 steps are completed

**Content:**
- Green checkmark icon
- "You're all set!" heading
- Success message
- 3-column stats (Search Saved ✓, Automation Created ✓, Integration Connected ✓)
- "Go to Dashboard" button
- Help Center link

---

## 🔄 Walkthrough Context

**Location:** `/components/WalkthroughContext.tsx`  
**Status:** ✅ COMPLETE

**Purpose:** Manages walkthrough state across entire app

**Provider:**
```tsx
<WalkthroughProvider>
  <App />
</WalkthroughProvider>
```

**Hook:**
```typescript
const {
  walkthroughActive,      // boolean
  currentStep,            // 0 | 1 | 2 | 3
  totalSteps,             // 3
  startWalkthrough,       // () => void
  completeStep,           // (stepNumber: number) => void
  skipWalkthrough,        // () => void
  resetWalkthrough,       // () => void
  isStepActive,           // (stepNumber: number) => boolean
} = useWalkthrough();
```

**LocalStorage Keys:**
- `listingbug_walkthrough_completed`: "true" if completed or skipped
- `listingbug_walkthrough_step`: Current step number (1-3)

**Behavior:**
- Persists progress across page refreshes
- Resumes from saved step if interrupted
- Clears on skip or completion

---

## 🚀 Integration Points

### 1. App.tsx
**Status:** ✅ COMPLETE

- Wrapped entire app in `<WalkthroughProvider>`
- Added Sonner Toaster for notifications

```tsx
<WalkthroughProvider>
  <div className="min-h-screen bg-background flex flex-col">
    {/* ... app content ... */}
    <Toaster position="top-right" richColors />
  </div>
</WalkthroughProvider>
```

---

### 2. QuickStartGuidePage.tsx
**Status:** ✅ COMPLETE

- Imports `useWalkthrough` hook
- Calls `startWalkthrough()` when user clicks "Start Walkthrough" on final step
- Modified last button text from "Next" to "Start Walkthrough"

**Flow:**
```
Welcome Page → Quick Start Guide (3 steps) → START WALKTHROUGH → Search (Step 1)
```

---

### 3. SearchListings.tsx
**Status:** 🟡 IN PROGRESS

**TODO:**
1. Add walkthrough overlay when Step 1 is active
2. Highlight "Save Search" button
3. Complete Step 1 when search is saved
4. Navigate to automations page

**Code to Add:**
```tsx
// At component top (DONE)
const { isStepActive, completeStep, skipWalkthrough, totalSteps } = useWalkthrough();
const walkthroughStep1Active = isStepActive(1);

// In handleConfirmSaveSearch function (TODO)
if (walkthroughStep1Active) {
  completeStep(1);
  // Navigation handled by context (shows toast + moves to step 2)
}

// In JSX (TODO - add before closing div)
<WalkthroughOverlay
  isActive={walkthroughStep1Active}
  step={1}
  totalSteps={totalSteps}
  title="Let's start by finding properties"
  description="Use filters to narrow down properties matching your criteria. When you're ready, save this search so we can automate it."
  highlightSelector=".search-filters"
  position="center"
  ctaText="Show me how to save"
  onNext={() => {
    // Scroll to save button
    document.querySelector('[data-walkthrough=\"save-search\"]')?.scrollIntoView({ behavior: 'smooth' });
  }}
  onSkip={skipWalkthrough}
/>
```

**Button to Highlight:**
```tsx
<LBButton 
  onClick={handleSaveSearch} 
  variant="outline" 
  size="sm" 
  className="whitespace-nowrap"
  data-walkthrough="save-search" // ADD THIS
>
  <Save className="w-4 h-4" />
  <span className="hidden sm:inline">Save</span>
</LBButton>
```

---

### 4. AutomationsManagementPage.tsx
**Status:** ⏳ TODO

**Actions Needed:**
1. Import `useWalkthrough` hook
2. Check if Step 2 is active
3. Show overlay highlighting "Create Automation" button
4. Complete Step 2 when automation is created
5. Open integration selection

**Code to Add:**
```tsx
import { useWalkthrough } from './WalkthroughContext';
import { WalkthroughOverlay } from './WalkthroughOverlay';

// In component
const { isStepActive, completeStep, skipWalkthrough, totalSteps } = useWalkthrough();
const walkthroughStep2Active = isStepActive(2);

// After automation is saved in handleCreateAutomation
if (walkthroughStep2Active) {
  completeStep(2);
  // Open integration modal or show Step 3
}

// In JSX (add overlay)
<WalkthroughOverlay
  isActive={walkthroughStep2Active}
  step={2}
  totalSteps={totalSteps}
  title="Now let's automate your search"
  description={`Automations run your saved searches on a schedule. You have ${automationSlots} automation slot${automationSlots === 1 ? '' : 's'} available on your Starter plan.`}
  highlightSelector=".create-automation-button"
  position="bottom"
  ctaText="Create my first automation"
  onNext={() => {
    // Open CreateAutomationModal
    setShowCreateModal(true);
  }}
  onSkip={skipWalkthrough}
/>
```

---

### 5. Integration Connection Flow
**Status:** ⏳ TODO

**Options:**
1. **Option A:** Show overlay on IntegrationsPage
2. **Option B:** Show overlay in CreateAutomationModal (Step 4)
3. **Option C:** Create dedicated IntegrationConnectionModal

**Recommended:** Option B (inline in automation wizard)

**Code to Add:**
```tsx
// After automation wizard Step 4 (Schedule & Activate)
if (walkthroughStep3Active) {
  // Show integration selection step
  setWizardStep(5); // New step for integration
}

// In wizard Step 5
<WalkthroughOverlay
  isActive={walkthroughStep3Active}
  step={3}
  totalSteps={totalSteps}
  title="Choose where your listings should go"
  description="Connect an integration to receive listing updates automatically. Your Starter plan includes Mailchimp, Google Sheets, Airtable, and Twilio."
  highlightSelector=".integration-grid"
  position="center"
  ctaText="Connect an integration"
  onNext={() => {
    // Open integration connection modal
  }}
  onSkip={skipWalkthrough}
/>

// When integration is connected
if (walkthroughStep3Active) {
  completeStep(3); // Shows WalkthroughCompleteModal
}
```

---

## 📱 Responsive Behavior

### Mobile (< 768px)
- Overlay card max-width: 100% - 32px padding
- Highlight border smaller (2px instead of 4px)
- Smaller icons and text
- Stack progress dots

### Tablet (768px - 1023px)
- Overlay card max-width: 500px
- Standard spacing

### Desktop (≥ 1024px)
- Overlay card max-width: 600px
- Larger spacing and icons
- Dynamic positioning (top/bottom/left/right)

---

## ✅ Completion Criteria

### Step 1: Search Experience
- [ ] Overlay displays when Step 1 is active
- [ ] Search filters are highlighted with pulsing yellow border
- [ ] "Save Search" button is data-attribute tagged
- [ ] Completing search save triggers `completeStep(1)`
- [ ] Toast shows: "Search saved! Moving to automations..."
- [ ] Auto-navigates to AutomationsManagementPage with Step 2 active

### Step 2: Automation Setup
- [ ] Overlay displays when Step 2 is active
- [ ] "Create Automation" button is highlighted
- [ ] Slot tracker is visible and shows correct count
- [ ] Completing automation wizard triggers `completeStep(2)`
- [ ] Toast shows: "Automation created! Now connect an integration..."
- [ ] Opens integration selection UI

### Step 3: Integration Selection
- [ ] Overlay displays when Step 3 is active
- [ ] Integration grid is highlighted
- [ ] Shows correct integrations based on plan (Starter/Pro/Enterprise)
- [ ] Completing integration connection triggers `completeStep(3)`
- [ ] Toast shows: "Integration connected! 🎉"
- [ ] WalkthroughCompleteModal displays
- [ ] "Go to Dashboard" button navigates to dashboard
- [ ] Walkthrough marked complete in localStorage

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Reset walkthrough: `localStorage.removeItem('listingbug_walkthrough_completed')`
- [ ] Test full flow: Signup → Welcome → Quick Start → Walkthrough (all 3 steps)
- [ ] Test skip at each step
- [ ] Test page refresh mid-walkthrough (should resume)
- [ ] Test on mobile (320px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1440px width)
- [ ] Test with different plans (Starter, Pro, Enterprise)

### Edge Cases
- [ ] User already has saved searches before walkthrough
- [ ] User already has automations before walkthrough
- [ ] User already has integrations connected
- [ ] User navigates away mid-walkthrough
- [ ] Multiple browser tabs open simultaneously
- [ ] LocalStorage is disabled/blocked

---

## 🐛 Known Issues

### Issue #1: SearchListings handleConfirmSaveSearch
**Status:** 🟡 BLOCKED  
**Problem:** `edit_tool` cannot find exact text due to indentation  
**Solution:** Manually add walkthrough completion code  
**Location:** `/components/SearchListings.tsx` line 463

**Code to Add After Line 463:**
```typescript
// Complete walkthrough step 1 if active
if (walkthroughStep1Active) {
  completeStep(1);
}
```

---

## 📚 File Inventory

### ✅ Created Files
1. `/components/WalkthroughOverlay.tsx` (350 lines)
2. `/components/WalkthroughContext.tsx` (110 lines)
3. `/WALKTHROUGH_IMPLEMENTATION_GUIDE.md` (this file)

### 🔧 Modified Files
1. `/App.tsx` - Added WalkthroughProvider, Toaster
2. `/components/QuickStartGuidePage.tsx` - Added startWalkthrough() call
3. `/components/SearchListings.tsx` - Added useWalkthrough hook (partial)

### ⏳ Files to Modify
1. `/components/SearchListings.tsx` - Complete Step 1 integration
2. `/components/AutomationsManagementPage.tsx` - Add Step 2 integration
3. `/components/CreateAutomationModal.tsx` or new modal - Add Step 3 integration

---

## 🎯 Next Steps (Priority Order)

1. **HIGH:** Complete SearchListings.tsx Step 1 integration
   - Add overlay JSX
   - Add `data-walkthrough` attribute to Save button
   - Add `completeStep(1)` call in handleConfirmSaveSearch
   - Test full Step 1 flow

2. **HIGH:** Add Step 2 integration to AutomationsManagementPage.tsx
   - Import useWalkthrough hook
   - Add overlay JSX
   - Add `data-walkthrough` attribute to Create Automation button
   - Add `completeStep(2)` call after automation is created
   - Test full Step 2 flow

3. **HIGH:** Add Step 3 integration selection
   - Decide on UI location (wizard step vs modal)
   - Add overlay JSX
   - Highlight integration options
   - Add `completeStep(3)` call after connection
   - Show WalkthroughCompleteModal
   - Test full Step 3 flow

4. **MEDIUM:** Add navigation guards
   - Prevent user from navigating away mid-walkthrough
   - Show "Are you sure?" modal if they try to leave

5. **MEDIUM:** Add restart walkthrough option in Settings
   - Account page → Settings tab
   - "Restart Tutorial" button
   - Calls `resetWalkthrough()`

6. **LOW:** Add analytics tracking
   - Track walkthrough start
   - Track step completions
   - Track skip rate
   - Track completion rate

---

## 🚀 Launch Checklist

Before enabling walkthrough for production:

- [ ] All 3 steps fully implemented and tested
- [ ] Mobile responsive verified
- [ ] Toast notifications working
- [ ] LocalStorage persistence working
- [ ] Skip functionality working at all steps
- [ ] Resume functionality working after page refresh
- [ ] Completion modal working
- [ ] Navigation to dashboard working
- [ ] No console errors
- [ ] Accessibility audit passed (keyboard navigation, screen readers)
- [ ] Analytics tracking implemented
- [ ] Help Center article created
- [ ] Feature flag ready (if using staged rollout)

---

**Document Version:** 1.0  
**Last Updated:** December 6, 2025  
**Status:** In Progress - Step 1 partially complete  
**Estimated Completion:** 2-3 hours additional work
