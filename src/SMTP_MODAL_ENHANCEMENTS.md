# SMTP Setup Modal Enhancements - Implementation Task

## Current State

**File:** `/Users/jake/ListingBug-main/src/components/SMTPSetupModal.tsx`

The SMTPSetupModal component currently collects basic SMTP configuration:
- Host, Port, Username, Password
- From Email, From Name
- TLS toggle (currently ON by default)

The modal is already integrated into V2Onboarding step 0 and working correctly.

## Requirements

### 1. TLS Toggle Changes
- **Current:** TLS toggle is ON by default (`use_tls: true`)
- **New:** TLS toggle should be OFF by default (`use_tls: false`)
- **Location:** Move from main form to new "Advanced" collapsible section

### 2. Create "Advanced" Collapsible Section
- Add a new collapsible section labeled "Advanced ▾" (or "Advanced ▸" when collapsed)
- Should appear AFTER the "From Name" field and BEFORE the test result messages
- Section should be collapsed by default
- When expanded, contains:
  - TLS/STARTTLS toggle
  - Reply Tracking toggle (new)
  - IMAP settings (conditional, based on Reply Tracking toggle)

### 3. Reply Tracking Feature
- Add a new toggle: "Enable Reply Tracking"
- Default: OFF
- Description text: "Monitor replies via IMAP to track agent responses"
- When enabled, show IMAP configuration fields below

### 4. IMAP Configuration Fields (Conditional)
Show these fields ONLY when "Enable Reply Tracking" is ON:

**IMAP Host**
- Label: "IMAP Host"
- Placeholder: "imap.gmail.com"
- Help text: "Your mail server's IMAP hostname"

**IMAP Port**
- Label: "IMAP Port"
- Type: number
- Default: "993"
- Help text: "Common ports: 993 (SSL), 143 (STARTTLS)"

**IMAP Username** (optional, can default to SMTP username)
- Label: "IMAP Username (optional)"
- Placeholder: "Same as SMTP username"
- Help text: "Leave blank to use SMTP username"

**IMAP Password** (optional, can default to SMTP password)
- Label: "IMAP Password (optional)"
- Type: password with show/hide toggle
- Placeholder: "Same as SMTP password"
- Help text: "Leave blank to use SMTP password"

**IMAP Use SSL**
- Toggle switch
- Label: "Use SSL for IMAP"
- Default: ON

## Implementation Details

### State Management

Add to SMTPSetupModal state:
```typescript
const [showAdvanced, setShowAdvanced] = useState(false);
const [replyTracking, setReplyTracking] = useState(false);
const [imapConfig, setImapConfig] = useState({
  host: '',
  port: '993',
  username: '',
  password: '',
  use_ssl: true,
});
```

### Data Structure

When saving to `integration_connections` table:

```typescript
{
  credentials: {
    username: config.username,
    password: config.password,
    // IMAP credentials only if reply tracking enabled
    ...(replyTracking && {
      imap_username: imapConfig.username || config.username,
      imap_password: imapConfig.password || config.password,
    })
  },
  config: {
    host: config.host,
    port: config.port,
    use_tls: config.use_tls,
    reply_tracking_enabled: replyTracking,
    // IMAP config only if reply tracking enabled
    ...(replyTracking && {
      imap_host: imapConfig.host,
      imap_port: imapConfig.port,
      imap_use_ssl: imapConfig.use_ssl,
    })
  },
  // ... rest of fields
}
```

### UI Layout Structure

```
┌─ SMTP Setup Modal ─────────────────────────────┐
│                                                 │
│ SMTP Host *                                     │
│ [input]                                         │
│                                                 │
│ Port *                                          │
│ [input]                                         │
│                                                 │
│ Username *                                      │
│ [input]                                         │
│                                                 │
│ Password *                                      │
│ [input with show/hide]                          │
│                                                 │
│ From Email *                                    │
│ [input]                                         │
│                                                 │
│ From Name *                                     │
│ [input]                                         │
│                                                 │
│ ┌─ Advanced ▾ ─────────────────────────────┐   │
│ │                                           │   │
│ │ Use TLS/STARTTLS        [toggle - OFF]   │   │
│ │                                           │   │
│ │ Enable Reply Tracking   [toggle - OFF]   │   │
│ │                                           │   │
│ │ [IF reply tracking ON:]                   │   │
│ │                                           │   │
│ │ IMAP Host                                 │   │
│ │ [input]                                   │   │
│ │                                           │   │
│ │ IMAP Port                                 │   │
│ │ [input]                                   │   │
│ │                                           │   │
│ │ IMAP Username (optional)                  │   │
│ │ [input]                                   │   │
│ │                                           │   │
│ │ IMAP Password (optional)                  │   │
│ │ [input with show/hide]                    │   │
│ │                                           │   │
│ │ Use SSL for IMAP        [toggle - ON]    │   │
│ │                                           │   │
│ └───────────────────────────────────────────┘   │
│                                                 │
│ [Test Result Messages]                          │
│                                                 │
│ [Cancel] [Test Connection] [Save & Connect]    │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Collapsible Component

Use the existing Shadcn Collapsible component (already available in the project):

```typescript
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
```

Example usage:
```typescript
<Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
  <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 py-2">
    Advanced {showAdvanced ? '▾' : '▸'}
  </CollapsibleTrigger>
  <CollapsibleContent className="space-y-4 pt-2">
    {/* TLS toggle */}
    {/* Reply tracking toggle */}
    {/* Conditional IMAP fields */}
  </CollapsibleContent>
</Collapsible>
```

## Testing Checklist

After implementation, test:
- [ ] TLS toggle defaults to OFF
- [ ] Advanced section is collapsed by default
- [ ] Clicking "Advanced" toggles the section open/closed
- [ ] Reply Tracking toggle shows/hides IMAP fields
- [ ] IMAP username/password default to SMTP values when left empty
- [ ] Test connection works with TLS OFF
- [ ] Test connection works with TLS ON
- [ ] Save & Connect stores all configuration correctly
- [ ] IMAP credentials are only saved when reply tracking is enabled
- [ ] Modal maintains existing functionality for non-advanced use cases

## Notes

- **Do NOT implement reply tracking functionality yet** - just collect the configuration
- The actual IMAP monitoring will be implemented later as a separate Edge Function
- Focus on UI/UX and proper data storage for now
- Maintain backwards compatibility with existing SMTP connections (no IMAP data)
- Use consistent styling with the rest of the modal
- Toggle switches should use the existing pattern from the current TLS toggle

## Related Files

- **Main file:** `src/components/SMTPSetupModal.tsx`
- **UI components:** `src/components/ui/collapsible.tsx`
- **Database:** Stores in `integration_connections` table with `integration_id: 'smtp'`
- **Used in:** `src/components/v2/V2Onboarding.tsx` (step 0)

## Success Criteria

1. TLS toggle is OFF by default and moved to Advanced section
2. Advanced section collapses/expands smoothly
3. Reply Tracking toggle conditionally shows IMAP fields
4. All IMAP configuration is collected and stored when enabled
5. Existing SMTP functionality remains unchanged
6. UI is clean, intuitive, and matches existing design patterns
