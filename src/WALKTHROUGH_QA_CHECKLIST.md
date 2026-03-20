# ListingBug Walkthrough - QA Validation Checklist

## Test Environment Setup

### Required Test Devices
- [ ] Desktop: 1920×1080 resolution (Chrome, Firefox, Safari)
- [ ] Desktop: 1366×768 resolution (Chrome, Firefox)
- [ ] iPhone 14/16 (390×844) or iOS Simulator
- [ ] Android device (360×800 or 412×915)
- [ ] iPad/Tablet (768×1024)

### Pre-Test Setup
- [ ] Clear localStorage: `localStorage.clear()`
- [ ] Verify `WALKTHROUGH_ENABLED = true` in WalkthroughContext.tsx
- [ ] Test as first-time user (no `listingbug_returning_user` flag)
- [ ] Ensure no authentication pages are active

---

## 1. FUNCTIONAL TESTING - Step-by-Step Flow

### Step 1: Welcome (Dashboard)
- [ ] Walkthrough starts automatically on first login
- [ ] Highlight appears around `[data-walkthrough='search-listings-button']`
- [ ] Tooltip shows: "Welcome to ListingBug!"
- [ ] Progress indicator shows: Step 1 of 9
- [ ] Yellow highlight border (3px desktop, 4px mobile) is visible
- [ ] Dark overlay (70% opacity) covers rest of screen
- [ ] "Continue" button is clickable
- [ ] "Skip tour" button is present and clickable
- [ ] Clicking "Continue" advances to Step 2
- [ ] Clicking highlighted Search Listings button also advances to Step 2

**Expected Element:** Search Listings button on Dashboard  
**Trigger:** Auto-starts on mount for new users  
**Advance:** Click "Continue" OR click highlighted button

---

### Step 2: Add a Location (Search Page)
- [ ] Step 2 activates after navigating to Search page
- [ ] Highlight appears around `[data-walkthrough='location-section']`
- [ ] Entire location section (label + input) is highlighted as one group
- [ ] Location input auto-focuses
- [ ] Tooltip shows: "Add a location"
- [ ] Progress indicator shows: Step 2 of 9
- [ ] User can type in location input
- [ ] Blurring input (clicking outside or pressing Tab) advances to Step 3
- [ ] Pressing Enter key in input advances to Step 3
- [ ] Tooltip does NOT overlap input field

**Expected Element:** Location section container  
**Trigger:** Search page loads  
**Advance:** Blur location input OR press Enter  
**Mode:** `wait-for-blur`

---

### Step 3: Add Search Parameters (Search Criteria)
- [ ] Step 3 activates after Step 2 completion
- [ ] Highlight appears around `[data-walkthrough='search-criteria']`
- [ ] Search criteria section (filters + Add Filter button) is highlighted
- [ ] Tooltip shows: "Add search parameters"
- [ ] Progress indicator shows: Step 3 of 9
- [ ] "Continue" button is present
- [ ] User can interact with filter dropdowns
- [ ] Clicking "Continue" advances to Step 4
- [ ] Filters remain functional during walkthrough

**Expected Element:** Search criteria section  
**Trigger:** Step 2 completion  
**Advance:** Click "Continue"  
**Mode:** `click-to-continue`

---

### Step 4: View Search Results
- [ ] Step 4 activates after Step 3 completion
- [ ] Highlight appears around `[data-walkthrough='results-section']`
- [ ] Results section is highlighted
- [ ] Tooltip shows: "Search results will appear here"
- [ ] Progress indicator shows: Step 4 of 9
- [ ] Tooltip explains the four action buttons individually:
  - [ ] Save button explained
  - [ ] Automate button explained
  - [ ] Export button explained
  - [ ] Share button explained
- [ ] "Continue" button advances to Step 5

**Expected Element:** Results section  
**Trigger:** Step 3 completion  
**Advance:** Click "Continue"  
**Mode:** `click-to-continue`

---

### Step 5: Save a Listing
- [ ] Step 5 activates after Step 4 completion
- [ ] Highlight appears around `[data-walkthrough='save-search-button']`
- [ ] Save button is highlighted
- [ ] Tooltip shows: "Save this search"
- [ ] Progress indicator shows: Step 5 of 9
- [ ] Tooltip uses `wait-for-click` mode
- [ ] Animated pointer icon appears on highlighted element
- [ ] Waiting indicator shows: "Click the highlighted area to continue"
- [ ] Clicking Save button opens Save Search modal
- [ ] User can name the saved search
- [ ] Confirming save advances to Step 6
- [ ] Walkthrough does NOT break when modal opens

**Expected Element:** Save Search button  
**Trigger:** Step 4 completion  
**Advance:** Click Save button → complete save flow  
**Mode:** `wait-for-click`

---

### Step 6: Create Your First Automation
- [ ] Step 6 activates after Step 5 completion
- [ ] Highlight appears around `[data-walkthrough='create-automation-button']`
- [ ] Create Automation button is highlighted
- [ ] Tooltip shows: "Create your first automation"
- [ ] Progress indicator shows: Step 6 of 9
- [ ] Animated pointer icon appears
- [ ] Clicking Create Automation button opens CreateAutomationModal
- [ ] Walkthrough continues inside modal (does NOT disappear)
- [ ] Modal overlay does NOT conflict with walkthrough overlay

**Expected Element:** Create Automation button  
**Trigger:** Step 5 completion  
**Advance:** Click Create Automation button  
**Mode:** `wait-for-click`

---

### Step 7: Choose Destination (Automation Wizard)
- [ ] Step 7 activates when CreateAutomationModal opens
- [ ] Highlight appears around `[data-walkthrough='destination-selector']`
- [ ] Destination dropdown/selector is highlighted
- [ ] Tooltip shows: "Choose where to send listings"
- [ ] Progress indicator shows: Step 7 of 9
- [ ] User can select destination (e.g., "ListingBug CSV")
- [ ] After selecting destination, step auto-advances after 800ms delay
- [ ] Tooltip shows "Complete the action to continue" indicator

**Expected Element:** Destination selector in wizard  
**Trigger:** CreateAutomationModal opens  
**Advance:** Select destination → 800ms auto-advance  
**Mode:** `wait-for-action`

---

### Step 8: Name and Activate Automation
- [ ] Step 8 activates after Step 7 completion
- [ ] Highlight appears around `[data-walkthrough='wizard-content']`
- [ ] Automation name input and settings are highlighted
- [ ] Tooltip shows: "Name your automation and activate it"
- [ ] Progress indicator shows: Step 8 of 9
- [ ] User can type automation name
- [ ] User can toggle automation active/inactive
- [ ] Clicking "Create Automation" button completes the automation
- [ ] After creation, page navigates to Integrations page
- [ ] Walkthrough persists during navigation

**Expected Element:** Wizard content area  
**Trigger:** Step 7 completion  
**Advance:** Create automation → navigate to Integrations  
**Mode:** `wait-for-action`

---

### Step 9: You're All Set! (Integrations Page)
- [ ] Step 9 activates when IntegrationsPage loads
- [ ] Highlight appears around `[data-walkthrough='integrations-page']`
- [ ] For users without integrations, ListingBug CSV is highlighted
- [ ] ListingBug CSV is selected by default for new users
- [ ] Tooltip shows: "You're all set!"
- [ ] Progress indicator shows: Step 9 of 9
- [ ] All 9 progress dots are filled with yellow
- [ ] "Finish" or "Complete" button is present
- [ ] Clicking "Finish" completes walkthrough
- [ ] Walkthrough state saved to localStorage
- [ ] `listingbug_walkthrough_completed = true` is set
- [ ] Walkthrough does NOT reappear on page refresh

**Expected Element:** Integrations page content  
**Trigger:** IntegrationsPage loads after automation creation  
**Advance:** Click "Finish"  
**Mode:** `click-to-continue`

---

## 2. VISUAL/UI TESTING - Desktop (1920×1080)

### Highlight Positioning
- [ ] Highlights anchor precisely to element bounding boxes
- [ ] 16px padding around highlighted elements
- [ ] Yellow border (#FFD447) is 3px thick
- [ ] Box shadow: `0 0 0 4px rgba(255, 212, 71, 0.2), 0 0 24px rgba(255, 212, 71, 0.4)`
- [ ] Highlight follows element when page scrolls
- [ ] Highlight updates position at 60fps (smooth tracking)
- [ ] Highlight does NOT flicker or jump

### Tooltip Positioning
- [ ] Tooltips float 24px away from highlighted element
- [ ] Auto-positioning algorithm works correctly:
  - [ ] Prefers bottom when space available below
  - [ ] Switches to top when insufficient space below
  - [ ] Uses left/right when vertical space limited
  - [ ] Falls back to center when no good position
- [ ] Tooltips have 12px margin from viewport edges
- [ ] Tooltips do NOT overlap highlighted elements
- [ ] Tooltips do NOT extend off-screen
- [ ] Tooltips are max-width 400px
- [ ] Transform-based centering is pixel-perfect

### Dark Overlay
- [ ] Four-part overlay creates spotlight effect
- [ ] Top, bottom, left, right sections align perfectly
- [ ] No gaps between overlay sections
- [ ] Overlay is 70% opacity black
- [ ] Highlighted area is completely clear (no overlay)
- [ ] Clicking overlay triggers "Skip tour" (if enabled)

### Tooltip Card Styling
- [ ] 2px yellow (#FFD447) border
- [ ] White background
- [ ] Drop shadow: `shadow-2xl`
- [ ] Progress indicator dots (9 total)
- [ ] Active dots are yellow, inactive are gray-200
- [ ] "Step X of 9" label is gray-500
- [ ] Title is font-bold, text-lg, #342E37
- [ ] Description is 14px, gray-700
- [ ] Close button (X) in top-right corner

### Buttons on Desktop
- [ ] Buttons arranged horizontally
- [ ] Primary button (Continue) has yellow background
- [ ] Primary button has arrow icon on right
- [ ] Skip/Back buttons are text-only, gray-600
- [ ] Hover states work correctly
- [ ] Button spacing is 12px (gap-3)

---

## 3. VISUAL/UI TESTING - Mobile (390×844 iPhone)

### Highlight Positioning
- [ ] Highlights anchor precisely to element bounding boxes
- [ ] 24px padding around highlighted elements (larger for touch)
- [ ] Yellow border (#FFD447) is 4px thick (thicker than desktop)
- [ ] Box shadow: `0 0 0 6px rgba(255, 212, 71, 0.25), 0 0 32px rgba(255, 212, 71, 0.5)`
- [ ] Highlight follows element when page scrolls
- [ ] Highlight is large enough to prevent accidental taps outside

### Tooltip Positioning
- [ ] Tooltips use full width: `calc(100vw - 32px)`
- [ ] 16px horizontal margin on both sides
- [ ] Tooltips reposition when keyboard opens
- [ ] When keyboard visible, tooltip moves to top of screen
- [ ] Input fields remain visible when tooltip repositions
- [ ] Keyboard safe area (100px) maintained at bottom

### Keyboard Detection
- [ ] Open location input (Step 2) and verify keyboard appears
- [ ] Tooltip automatically moves above keyboard
- [ ] Location input remains visible and usable
- [ ] Viewport height change >150px triggers keyboard detection
- [ ] Closing keyboard restores normal tooltip positioning
- [ ] `window.visualViewport` API is used (not just window.innerHeight)

### Buttons on Mobile
- [ ] Buttons stack vertically (flex-col)
- [ ] Primary button is full width
- [ ] Primary button has min-height: 48px (touch-friendly)
- [ ] Secondary buttons (Skip/Back) are full width
- [ ] Button padding: py-3 px-4 (larger than desktop)
- [ ] Buttons do NOT overflow horizontally
- [ ] Gap between buttons is 12px (gap-3)

### Touch Interactions
- [ ] All buttons have minimum 48px touch target
- [ ] Tapping highlighted element triggers action
- [ ] No accidental clicks on overlay
- [ ] Smooth scrolling when element scrolls into view
- [ ] Pinch-to-zoom does NOT break positioning

### Grouped Highlights
- [ ] Location section highlights label + input together
- [ ] Search criteria highlights filters + button together
- [ ] No multiple small highlights on mobile
- [ ] Grouped highlights have sufficient padding (24px)

---

## 4. DESKTOP-SPECIFIC TESTING (1366×768)

### Floating Tooltips
- [ ] Tooltips float above content (not inline)
- [ ] 24px gap between tooltip and highlight
- [ ] Tooltip has subtle drop shadow
- [ ] Tooltip does NOT feel cramped on smaller desktop

### Real-Time Scroll Anchoring
- [ ] Open walkthrough on Step 2 (Location section)
- [ ] Scroll page up and down while tooltip is visible
- [ ] Highlight follows element position in real-time
- [ ] Tooltip repositions smoothly without jank
- [ ] `requestAnimationFrame` ensures 60fps tracking
- [ ] Position only updates when delta >0.5px (performance)

### Multi-Monitor Testing
- [ ] Test on secondary monitor with different resolution
- [ ] Tooltips position correctly relative to element
- [ ] No offset bugs due to window.screenX/screenY

---

## 5. EDGE CASES & ERROR HANDLING

### Element Not Found (2-Second Timeout)
- [ ] Manually hide target element: `document.querySelector('[data-walkthrough="location-section"]').style.display = 'none'`
- [ ] Wait 2 seconds
- [ ] Fallback tooltip appears at top of screen
- [ ] Fallback has orange border (warning state)
- [ ] Info icon appears in fallback tooltip
- [ ] Message: "The element we're looking for isn't visible yet"
- [ ] "Continue Anyway" button is present
- [ ] Clicking "Continue Anyway" advances to next step
- [ ] "Skip tour" option is available
- [ ] Console shows: "⚠️ Walkthrough: Showing fallback UI - element not found"

### Retry Logic
- [ ] Element appears after 1 second (within retry window)
- [ ] Walkthrough finds element and shows normal tooltip
- [ ] No fallback UI appears
- [ ] Console shows retry attempts: "⏳ Walkthrough: Element not found, retry 1/20"
- [ ] Exponential backoff delays: 100ms, 150ms, 225ms... up to 2000ms

### Navigation Away During Walkthrough
- [ ] Start walkthrough on Step 3
- [ ] Manually navigate to different page: `window.location.href = '/dashboard'`
- [ ] Walkthrough pauses automatically
- [ ] `localStorage.setItem('listingbug_walkthrough_paused', 'true')`
- [ ] On next visit, toast appears: "Walkthrough paused at Step 3"
- [ ] Toast has "Resume Tour" button
- [ ] Clicking "Resume Tour" restores Step 3
- [ ] Walkthrough continues from paused step

### Modal Overlay Conflicts
- [ ] Open CreateAutomationModal during Step 6
- [ ] Verify both modal overlay and walkthrough overlay coexist
- [ ] Walkthrough overlay has higher z-index: 9999
- [ ] Modal overlay is below walkthrough
- [ ] Highlighted elements inside modal are clickable
- [ ] No z-index fighting or flickering

### Dynamic Content
- [ ] Test on page with lazy-loaded content
- [ ] Verify retry logic waits for element to appear
- [ ] Highlight appears once element is in DOM
- [ ] No "element not found" errors for delayed content

### User Logs Out Mid-Walkthrough
- [ ] Start walkthrough on Step 4
- [ ] Log out user
- [ ] Walkthrough state persists in localStorage
- [ ] On next login, walkthrough does NOT resume (blocked for returning users)
- [ ] No orphaned tooltips or highlights

---

## 6. ACCESSIBILITY TESTING

### Focus Trap
- [ ] Open walkthrough tooltip
- [ ] Verify focus moves to first button in tooltip
- [ ] Press Tab to cycle through buttons
- [ ] Focus stays within tooltip (does not escape to page)
- [ ] Shift+Tab cycles backwards through buttons
- [ ] When reaching last button, Tab cycles back to first

### Keyboard Navigation
- [ ] Press **Escape** → Walkthrough skips/closes
- [ ] Press **Enter** → Continues to next step (when Continue button visible)
- [ ] Press **Arrow Right** → Continues to next step
- [ ] Press **Arrow Left** → Goes back (when Back button visible)
- [ ] All keyboard shortcuts work from any focused element

### Screen Reader Support
- [ ] Close button has `aria-label="Skip walkthrough"`
- [ ] Progress indicator is readable: "Step 3 of 9"
- [ ] All buttons have clear labels (not just icons)
- [ ] Tooltip title and description are in correct heading hierarchy

### Focus Restoration
- [ ] Note current focused element before walkthrough starts
- [ ] Complete or skip walkthrough
- [ ] Verify focus returns to previously focused element
- [ ] No focus lost to body or invalid element

### Color Contrast
- [ ] Yellow highlight (#FFD447) is visible on white backgrounds
- [ ] Text in tooltip meets WCAG AA standards (4.5:1 contrast)
- [ ] Gray text (gray-500, gray-600, gray-700) is readable

---

## 7. STATE MANAGEMENT & PERSISTENCE

### LocalStorage Keys
- [ ] `listingbug_walkthrough_completed`: Set to 'true' after Step 9
- [ ] `listingbug_walkthrough_step`: Stores current step (1-9)
- [ ] `listingbug_walkthrough_paused`: Set to 'true' when paused
- [ ] `listingbug_returning_user`: Prevents walkthrough on subsequent visits

### Step Progression
- [ ] Each step increments localStorage step counter
- [ ] Refreshing page mid-walkthrough resumes from correct step
- [ ] No steps are skipped unintentionally
- [ ] Progress indicator matches localStorage step value

### Returning Users
- [ ] Set `localStorage.setItem('listingbug_returning_user', 'true')`
- [ ] Refresh page
- [ ] Walkthrough does NOT start automatically
- [ ] Console log: "🚫 Walkthrough blocked: Returning user detected"

### Reset Walkthrough
- [ ] Open browser console
- [ ] Run: `localStorage.clear()`
- [ ] Refresh page
- [ ] Walkthrough starts from Step 1 as new user

---

## 8. PERFORMANCE TESTING

### Animation Performance
- [ ] Open Chrome DevTools → Performance tab
- [ ] Start recording
- [ ] Navigate through all 9 walkthrough steps
- [ ] Stop recording
- [ ] Verify 60fps (no frame drops below 58fps)
- [ ] `requestAnimationFrame` should show smooth green bars
- [ ] No long tasks (>50ms) during highlight tracking

### Memory Leaks
- [ ] Open walkthrough
- [ ] Skip walkthrough
- [ ] Repeat 10 times
- [ ] Check Chrome Task Manager for memory growth
- [ ] Memory should stabilize (no continuous growth)
- [ ] All event listeners and timers cleaned up

### Render Performance
- [ ] Highlight updates only when position delta >0.5px
- [ ] No unnecessary re-renders when element is static
- [ ] Tooltip does NOT re-render on every frame
- [ ] Console logs show position updates are throttled

---

## 9. CROSS-BROWSER TESTING

### Chrome (Latest)
- [ ] All 9 steps work correctly
- [ ] Highlights position accurately
- [ ] Tooltips render correctly
- [ ] Keyboard navigation works
- [ ] No console errors

### Firefox (Latest)
- [ ] All 9 steps work correctly
- [ ] Highlights position accurately
- [ ] Tooltips render correctly
- [ ] `window.visualViewport` polyfill works (if needed)
- [ ] No console errors

### Safari (Latest)
- [ ] All 9 steps work correctly
- [ ] Highlights position accurately
- [ ] Tooltips render correctly
- [ ] iOS Safari viewport handling is correct
- [ ] No webkit-specific bugs

### Edge (Latest)
- [ ] All 9 steps work correctly
- [ ] Highlights position accurately
- [ ] Tooltips render correctly
- [ ] No console errors

---

## 10. ACCEPTANCE CRITERIA

### End-to-End Flow
- [ ] ✅ Walkthrough completes all 9 steps without errors
- [ ] ✅ No orphaned tooltips or highlights after completion
- [ ] ✅ User can navigate normally after walkthrough ends
- [ ] ✅ Walkthrough does NOT reappear for returning users

### Visual Accuracy
- [ ] ✅ No tooltip appears offset vertically or horizontally
- [ ] ✅ All highlights anchor precisely to element bounding boxes
- [ ] ✅ Tooltips never overlap inputs or get hidden by keyboard
- [ ] ✅ Progress indicator updates correctly at every step

### Usability
- [ ] ✅ All steps are reachable and actionable on desktop and mobile
- [ ] ✅ "Skip Tour" works at every step
- [ ] ✅ User can complete intended actions while walkthrough is active
- [ ] ✅ No blocking bugs or UI breakage

### Mobile Experience
- [ ] ✅ Touch targets are ≥48px on all buttons
- [ ] ✅ Keyboard detection works and tooltip repositions correctly
- [ ] ✅ Buttons stack vertically and fit within viewport
- [ ] ✅ No horizontal scrolling or overflow issues

### Error Handling
- [ ] ✅ Fallback tooltip appears if element not found within 2 seconds
- [ ] ✅ User can continue walkthrough even with missing elements
- [ ] ✅ Pause/resume functionality works across sessions
- [ ] ✅ No JavaScript errors in console

---

## 11. REGRESSION TESTING (After Code Changes)

### Critical Paths
- [ ] Re-test Steps 1-9 end-to-end
- [ ] Verify highlight positioning on all screen sizes
- [ ] Test keyboard detection on mobile devices
- [ ] Validate localStorage persistence
- [ ] Check focus trap and keyboard navigation
- [ ] Confirm no new console errors

### Visual Regression
- [ ] Compare tooltip positioning before/after changes
- [ ] Verify highlight padding is consistent (16px desktop, 24px mobile)
- [ ] Check border thickness (3px desktop, 4px mobile)
- [ ] Validate progress indicator styling

---

## 12. KNOWN ISSUES & LIMITATIONS

Document any known issues discovered during QA:

### Issue Template
**Issue:** [Brief description]  
**Steps to Reproduce:**  
1. [Step 1]  
2. [Step 2]  
**Expected:** [What should happen]  
**Actual:** [What actually happens]  
**Severity:** [Critical / High / Medium / Low]  
**Workaround:** [If available]

---

## QA SIGN-OFF

**Tester Name:** ___________________________  
**Date:** ___________________________  
**Build/Commit:** ___________________________

**Overall Status:** [ ] Pass [ ] Fail [ ] Pass with Known Issues

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## AUTOMATED TEST CHECKLIST (Future Enhancement)

### Unit Tests Needed
- [ ] Test highlight padding calculation (mobile vs desktop)
- [ ] Test keyboard detection logic (viewport height delta)
- [ ] Test auto-positioning algorithm with mock DOMRect
- [ ] Test localStorage state management
- [ ] Test pause/resume functionality

### Integration Tests Needed
- [ ] Test full 9-step flow in headless browser
- [ ] Test cross-page navigation persistence
- [ ] Test modal overlay interactions
- [ ] Test element retry logic with delayed DOM insertion

### Visual Regression Tests
- [ ] Capture screenshots of each step on desktop
- [ ] Capture screenshots of each step on mobile
- [ ] Compare against baseline images
- [ ] Flag positioning or styling differences

---

**End of QA Checklist**  
*Last Updated: December 8, 2025*
