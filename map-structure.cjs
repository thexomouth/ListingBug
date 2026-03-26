const fs = require('fs');
const projectPath = 'C:/Users/User/Downloads/ListingBug FIGMA MVP';
const headLines = fs.readFileSync(`${projectPath}/automations-head.tsx`, 'utf8').split('\n');

// Map out the structure precisely
console.log('=== STRUCTURE MAP ===');
const markers = [
  { pattern: 'export function AutomationsManagementPage', label: 'export fn' },
  { pattern: 'const loadAutomations', label: 'loadAutomations' },
  { pattern: "const { data, error } = await supabase", label: 'supabase query' },
  { pattern: ".eq('user_id'", label: '.eq line' },
  { pattern: '.order(', label: '.order line' },
  { pattern: 'const mapped =', label: 'mapped =' },
  { pattern: 'setAutomations(mapped)', label: 'setAutomations' },
  { pattern: 'setAutomationsLoading(false)', label: 'setAutomationsLoading(false)' },
  { pattern: 'interface RunHistoryItem', label: 'RunHistoryItem interface' },
  { pattern: 'interface AutomationsManagementPageProps', label: 'Props interface' },
  { pattern: '  return (', label: 'return (' },
];

markers.forEach(m => {
  const matches = headLines.map((l, i) => l.includes(m.pattern) ? i + 1 : null).filter(Boolean);
  console.log(`${m.label}: lines ${JSON.stringify(matches)}`);
});
