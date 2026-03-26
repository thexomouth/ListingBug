const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx';
const raw = fs.readFileSync(path, 'utf8');
const lines = raw.split('\n');

console.log('Total lines:', lines.length);

// Find the corruption line
const corruptLineIdx = lines.findIndex(l => l.includes(".eq('user_id', userId)") && l.includes("useCallback } from 'react'"));
console.log('Corrupt line index (0-based):', corruptLineIdx, '| line number:', corruptLineIdx + 1);

// Find all export function declarations
const exportMatches = [];
lines.forEach((l, i) => {
  if (l.includes('export function AutomationsManagementPage')) exportMatches.push(i);
});
console.log('export function at lines (0-based):', exportMatches);

// Find first return ( after line 200 and before corrupt line
const firstReturnIdx = lines.findIndex((l, i) => i > 200 && i < corruptLineIdx && l.trim() === 'return (');
console.log('First return( index:', firstReturnIdx, '| line:', firstReturnIdx + 1);

// Part A: everything before corrupted line
const partA = lines.slice(0, corruptLineIdx);

// Part B: clean continuation of loadAutomations
const partB = [
  "      .eq('user_id', userId)",
  "      .order('created_at', { ascending: false });",
  "    if (error) {",
  "      console.error('[Automations] load error:', error.message);",
  "      setAutomationsLoading(false);",
  "      return;",
  "    }",
  "    const mapped = (data || []).map((row: any) => ({",
  "      id: row.id,",
  "      name: row.name,",
  "      searchName: row.search_name ?? '',",
  "      schedule: [row.schedule, row.schedule_time ? `at ${row.schedule_time}` : ''].filter(Boolean).join(' '),",
  "      destination: { type: row.destination_type, label: row.destination_label ?? row.destination_type, config: row.destination_config ?? {} },",
  "      searchCriteria: row.search_criteria ?? {},",
  "      active: row.active ?? true,",
  "      status: 'idle',",
  "      lastRun: row.last_run_at ? { date: row.last_run_at, status: 'success', listingsSent: 0 } : undefined,",
  "      nextRun: row.next_run_at ? new Date(row.next_run_at).toLocaleString() : 'Pending first run',",
  "    }));",
  "    if (data !== null) {",
  "      console.log('[loadAutomations] setting', mapped.length, 'automations');",
  "      setAutomations(mapped);",
  "    } else {",
  "      console.warn('[loadAutomations] data was null, keeping existing state');",
  "    }",
  "    setAutomationsLoading(false);",
  "  };",
  "",
  "  useEffect(() => {",
  "    loadAutomations();",
  "    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {",
  "      if (event === 'SIGNED_IN') {",
  "        loadAutomations();",
  "      }",
  "      if (event === 'SIGNED_OUT') {",
  "        setAutomations([]);",
  "      }",
  "    });",
  "    return () => subscription.unsubscribe();",
  "  }, []);",
].join('\n');

// Part C: JSX return to end of file
const partC = lines.slice(firstReturnIdx);

const fixed = [...partA, partB, '', ...partC].join('\n');
fs.writeFileSync(path, fixed);

// Verify
const v = fs.readFileSync(path, 'utf8');
const vLines = v.split('\n');
console.log('\n=== VERIFICATION ===');
console.log('Total lines after fix:', vLines.length);
console.log('export fn count:', (v.match(/export function AutomationsManagementPage/g)||[]).length, '(should be 1)');
console.log('interface Automation { count:', (v.match(/interface Automation \{/g)||[]).length, '(should be 1)');
console.log('loadAutomations count:', (v.match(/const loadAutomations/g)||[]).length, '(should be 1)');
console.log('corruption gone:', !v.includes("userId) useCallback } from 'react'"));
console.log('duplicate imports gone:', (v.match(/import \{ useState/g)||[]).length, '(should be 1)');
console.log('sonner import count:', (v.match(/from 'sonner/g)||[]).length, '(should be 1)');
