# ListingBug — VS Code AI Prompt Queue
**Purpose:** Feed these prompts one at a time to VS Code AI (Copilot/Cursor). Verify each before moving to the next.
**Project path:** C:\Users\User\Downloads\ListingBug FIGMA MVP

---

## PROMPT 1 — Zero out sample API keys and Mailchimp integration for new users

In `src/components/AccountPage.tsx` and any related integration components:

1. The API Keys section currently shows a hardcoded sample Zapier API key (`lb_live_a7f2b4c1...`). Replace this with a real data fetch from Supabase `api_keys` table using the current user's ID. If the table returns no rows, show an empty state: icon + text "No API keys yet" + a "Generate New Key" button.

2. The Connected Integrations section currently shows Mailchimp as "Connected" for all users. Replace this with a real data fetch from Supabase `integration_connections` table filtered by current user ID. If no connections exist, show an empty state: icon + text "No integrations connected yet" + a "Browse Integrations" button.

3. When the user clicks "Disconnect" on an integration card, after the Supabase delete call resolves successfully, immediately remove that card from the local state array so the UI updates without a page reload. Do not leave the card static on screen.

4. When the user clicks "Revoke" on an API key, after the Supabase delete call resolves, immediately remove that key from local state so it disappears and does not reappear on navigation.

---

## PROMPT 2 — Fix "Don't see what you need?" section text color

In `src/components/AccountPage.tsx` or `src/components/IntegrationsPage.tsx` — find the section with heading "Don't see what you need?" and change its text color from white to `text-gray-900 dark:text-white` so it is visible on a white background in light mode.

---

## PROMPT 3 — Fix integration Connect redirect buttons (they currently fake-load)

In `src/components/AccountPage.tsx` or the integration connection modal component:

Each "Connect" button opens a modal with a redirect button (e.g. "Connect to Sheets"). These buttons currently do nothing. Wire them up:

- For OAuth integrations (Google Sheets, HubSpot, Mailchimp, Salesforce, Constant Contact): the button should call `supabase.auth.signInWithOAuth` or open the appropriate OAuth URL in a new tab. For now, if the real OAuth flow isn't built yet, open `window.open(oauthUrl, '_blank')` with a placeholder URL per integration and add a TODO comment.
- For API key integrations (Zapier, Twilio): the button should close the modal and open the API key input flow.
- Remove any fake loading spinner that fires without actually doing anything.

---

## PROMPT 4 — Zero out Usage tab sample stats

In `src/components/AccountPage.tsx` in the Usage tab:

1. Replace the hardcoded `3,542` listings synced this month with a real fetch from Supabase `usage_tracking` table for the current user and current month. If no data exists, show `0`.

2. The "Projected Total" stat is showing a false calculated number AND has white text on white background. Fix the text color to `text-gray-900 dark:text-white`. For the value: if usage is 0, show `0`. Calculate projection only from real data.

3. The "Projected End-of-Month Usage" cards (Projected Total, Projected Overage, Projected Fee) — zero all to `0` / `$0.00` until real data exists.

4. "Daily Average" — calculate from real usage data. If no data, show `0 listings/day`.

---

## PROMPT 5 — Fix billing period display for trial users

In `src/components/AccountPage.tsx` in the Usage tab, the plan banner currently shows:
```
Starter Plan | 4,000 listings per month | Billing Period | Dec 1 - Dec 31, 2024
```

Replace this logic:
- If the user is on a trial (no active Stripe subscription), show: `Trial Period` | `X days remaining` — calculate from `trial_ends_at` field in Supabase `users` table.
- If the user has an active paid subscription, show: `Billing Period` | `[start date] - [end date]` from Stripe subscription data.
- The hardcoded Dec 2024 dates must be removed entirely.

Also apply the same trial-aware logic to the listings usage meter in `src/components/SearchListings.tsx` that currently shows `3,542 / 4,000 listings. Resets 04/27/25` — for trial users show `Trial ends [date]` and for paid users show `Resets [billing reset date]`.

---

## PROMPT 6 — Wire Delete Account button

In `src/components/AccountPage.tsx` in the Profile tab, the "Delete Account" button currently does nothing. Wire it up:

1. On click, show a confirmation modal: "Are you sure? This will permanently delete your account and all data. This cannot be undone." with Cancel and "Delete My Account" buttons.
2. On confirm: call `supabase.auth.admin.deleteUser(userId)` via a Supabase Edge Function (since client-side can't call admin API). If the edge function doesn't exist yet, add a TODO comment and show a toast: "Account deletion requested — our team will process this shortly."
3. On success: call `supabase.auth.signOut()` and redirect to homepage.

---

## PROMPT 7 — Zero out automation history sample data

In `src/components/AutomationsManagementPage.tsx` or `src/components/AutomationDetailPage.tsx` in the History tab:

1. Remove all hardcoded sample automation run entries.
2. Replace with a real fetch from Supabase `automation_runs` table filtered by current user ID.
3. If no runs exist, show an empty state: a lightning bolt icon, heading "No automation history yet", subtext "Run your first automation to see results here."

---

## PROMPT 8 — Dashboard "Listings Exported" links to Automations History

In `src/components/Dashboard.tsx`, find the "Listings Exported" snapshot card (the green card). Its `onClick` currently navigates to `automations`. Change it to navigate to `automations` AND set `sessionStorage.setItem('listingbug_automations_tab', 'history')` before navigating, so the Automations page opens directly on the History tab.

In `src/components/AutomationsManagementPage.tsx`, on mount read `sessionStorage.getItem('listingbug_automations_tab')` and if it equals `'history'`, set the active tab to History and clear the sessionStorage key.

---

## PROMPT 9 — Fix top nav Integrations link + add API item to right side nav

**Part A — Top nav:**
In `src/components/Header.tsx`, find the "Integrations" nav item. When the user is logged in, change its navigation target from `account` (or wherever it currently goes) to `integrations` — the dedicated integrations marketing/management page, not the account sub-tab.

**Part B — Right side nav:**
In `src/components/Header.tsx` (or wherever the right side dropdown/nav menu is rendered for logged-in users), add a new menu item called "API" positioned below the existing "Billing" item. It should navigate to the account page with the API & Integrations tab pre-selected (use `onAccountTabChange('integrations')` and `onNavigate('account')`).

---

## PROMPT 10 — Fix nav menu close on outside click

In `src/components/Header.tsx`:

1. For both the left sidebar nav and the right user dropdown nav — add a click-outside handler using `useEffect` with a `mousedown` event listener on `document`. When a click is detected outside the nav element's ref, close the nav.
2. Use `useRef` to reference each nav container and check `!ref.current.contains(event.target)` to determine if the click was outside.
3. Clean up the event listener on component unmount.

---

## PROMPT 11 — Fix left nav menu item colors when signed out

In `src/components/Header.tsx` or the left sidebar nav component — when the user is NOT logged in, the nav menu items are rendering with a purple color. Change all nav item text colors in the signed-out state to `text-white hover:text-white/80`. Remove any purple/violet color classes from these items.

---

## PROMPT 12 — Add email verification waiting step to signup flow

In `src/components/SignUpPage.tsx`:

After a successful `supabase.auth.signUp()` call (email/password path), instead of navigating directly to dashboard, show a new in-page step:

1. Replace the signup form with a "Check your email" screen using the same card design as the signup form. Content:
   - Icon: envelope/mail icon (lucide `Mail`)
   - Heading: "Confirm your email"
   - Body: "We sent a confirmation link to **[user's email]**. Click the link to activate your account."
   - Small text: "Didn't get it? Check your spam folder or" + a "Resend email" button that calls `supabase.auth.resend({ type: 'signup', email })`
   - A "Back to sign in" link

2. In `src/App.tsx`, the `supabase.auth.onAuthStateChange` listener already handles the redirect to dashboard when the session is confirmed — this means once the user clicks the verification link, they'll be auto-routed to dashboard without any extra code needed.

3. Note: This step only shows for email/password signup. Google OAuth bypasses it entirely.

---

## PROMPT 13 — Fix password field placeholder characters

In `src/components/SignUpPage.tsx` and `src/components/LoginPage.tsx`:

The password and confirm password input fields are using non-standard placeholder characters (diamond/strange symbols). Replace all placeholder text for password fields with standard text:
- Password field: `placeholder="Enter your password"`
- Confirm password field: `placeholder="Confirm your password"`

The actual typed characters are already masked by `type="password"` — the placeholder just needs to be clean ASCII text.

---

## PROMPT 14 — Fix input box background color change on autofill/focus

In `src/components/SignUpPage.tsx` and `src/components/LoginPage.tsx`, and in `src/index.css` or the global stylesheet:

When a user types in the email, password, or confirm password fields, the input background changes to white with black text (browser autofill styling). Fix this by adding global CSS overrides:

```css
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px transparent inset !important;
  -webkit-text-fill-color: inherit !important;
  transition: background-color 5000s ease-in-out 0s;
}
```

Also ensure the Input components in those pages have no `focus:bg-white` or similar classes that would override the background on focus.

---

## PROMPT 15 — Add back button to Change Plan modal step 2

In `src/components/ChangePlanModal.tsx` (or `BillingPage.tsx`):

The "Change Plan" modal has two steps. Step 2 currently has no way to go back. Add a back button:
- Position: top-left of the modal header
- Icon: `ChevronLeft` from lucide-react
- Text: "Back"  
- On click: return to step 1 of the modal
- Style: `text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1`

---

## PROMPT 16 — Standardize page padding, margin, and header text size across member pages

Audit the following pages and apply consistent layout standards:
- `src/components/Dashboard.tsx`
- `src/components/SearchListings.tsx`
- `src/components/AutomationsManagementPage.tsx`
- `src/components/AccountPage.tsx`
- `src/components/IntegrationsPage.tsx`

Apply these standards to all:
- Top padding: `pt-6` on the main content container
- Horizontal padding: `px-4 md:px-6 lg:px-8`
- Page title (h1/h2 heading): `text-2xl font-bold text-gray-900 dark:text-white`
- Page subtitle: `text-sm text-gray-500 dark:text-gray-400 mt-1`
- Max width container: `max-w-7xl mx-auto`

---

## PROMPT 17 — Improve search form with state dropdown, validation, and error messaging

In `src/components/SearchListings.tsx`:

1. Replace the free-text state input with a `<select>` dropdown containing all 50 US states (full names as display, 2-letter abbreviations as values). Pre-select blank "Select state".

2. Add client-side validation before submitting to the edge function. Required fields: city OR zip code (at least one), and if city is provided then state is also required. Show inline field-level error messages in red below each field if validation fails. Do not submit to RentCast if validation fails.

3. Replace the generic "Search failed" error with specific user-facing messages:
   - Missing city/zip: "Please enter a city or ZIP code"
   - Missing state when city provided: "Please select a state"
   - RentCast returns 0 results: "No listings found for that location. Try a nearby city or different ZIP code."
   - RentCast API error: "Search unavailable right now. Please try again in a moment."

4. On page load, auto-focus the city input field using `useRef` and `ref.current.focus()` in a `useEffect`.

5. Add RentCast pagination guard: the edge function should only return page 1 (offset 0, limit 500 max per RentCast rules). Cap results at 500 and show a note "Showing up to 500 listings" if the result set is at the limit.

---

## PROMPT 18 — Fix sample report on homepage to use real RentCast data

In `src/components/HomePage.tsx` and `src/components/SampleReportPage.tsx`:

1. The "Free Sample Report" button currently generates results from hardcoded sample/mock data. Wire it to call the real `search-listings` Supabase edge function using the entered ZIP code. The call should be unauthenticated (guest mode) — update the edge function to allow a limited unauthenticated call returning max 10 listings for sample report purposes.

2. In the edge function `supabase/functions/search-listings/index.ts`, add a `?preview=true` query param path that skips auth/plan checks and returns max 10 results, for use by the homepage sample report only.

3. In `SampleReportPage.tsx`, ensure the component renders the returned listings array from the edge function response, not any hardcoded data. If the array is empty or the call fails, show: "No listings found for that ZIP code. Try another." If loading, show a spinner.

---

## PROMPT 19 — Wire notifications to real data + implement notification logic

In `src/components/Header.tsx` (right side nav notifications panel):

1. Replace hardcoded sample notifications with a real fetch from Supabase `notifications` table (or create it if it doesn't exist) filtered by current user ID, ordered by `created_at DESC`, limit 20.

2. If no notifications exist, show empty state: bell icon + "No notifications yet".

3. Create a utility function `createNotification(userId, type, title, message)` in `src/lib/notifications.ts` that inserts a row into the `notifications` table. Call this function from:
   - After a successful automation run (in automations logic)
   - After a successful search that saves listings
   - After integration connect/disconnect events

4. The `notifications` table schema needed (apply via Supabase migration if it doesn't exist):
```sql
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  read boolean default false,
  created_at timestamptz default now()
);
alter table public.notifications enable row level security;
create policy "Users see own notifications" on public.notifications
  for all using (auth.uid() = user_id);
```

---

## AFTER ALL PROMPTS ARE COMPLETE — Deploy command

Run these in cmd from the project folder:

```
cd "C:\Users\User\Downloads\ListingBug FIGMA MVP"
git add -A
git commit -m "fix: zero sample data, real data wiring, UI/UX polish pass"
git push origin main
```

---
