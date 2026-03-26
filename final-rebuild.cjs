const fs = require('fs');
const projectPath = 'C:/Users/User/Downloads/ListingBug FIGMA MVP';
const headLines = fs.readFileSync(`${projectPath}/automations-head.tsx`, 'utf8').split('\n');

// Part A: lines 1-537 (idx 0-536) — clean up to end of handleDuplicateAutomation
const partA = headLines.slice(0, 537); // idx 0-536 = lines 1-537

// Part B: clean handleAutomationCreated — just reload from DB
const partB = [
  '',
  '  const handleAutomationCreated = async () => {',
  '    await loadAutomations();',
  '    setActiveTab(\'automations\');',
  '  };',
  '',
];

// Part C: JSX return to end of file (idx 673-1141 = lines 674-1142)
const partC = headLines.slice(673);

const rebuilt = [...partA, ...partB, ...partC].join('\n');
fs.writeFileSync(`${projectPath}/src/components/AutomationsManagementPage.tsx`, rebuilt);

// Verify
const v = fs.readFileSync(`${projectPath}/src/components/AutomationsManagementPage.tsx`, 'utf8');
const vLines = v.split('\n');
console.log('=== VERIFICATION ===');
console.log('Total lines:', vLines.length);
console.log('export fn count:', (v.match(/export function AutomationsManagementPage/g)||[]).length, '(should be 1)');
console.log('return ( count:', (v.match(/^  return \(/gm)||[]).length, '(should be 1)');
console.log('loadAutomations count:', (v.match(/const loadAutomations/g)||[]).length, '(should be 1)');
console.log('handleAutomationCreated count:', (v.match(/const handleAutomationCreated/g)||[]).length, '(should be 1)');
console.log('interface Automation { count:', (v.match(/interface Automation \{/g)||[]).length, '(should be 1)');
console.log('corruption gone:', !v.includes("userId) useCallback } from 'react'"));
console.log('duplicate imports gone:', (v.match(/import \{ useState/g)||[]).length, '(should be 1)');
console.log('sonner count:', (v.match(/from 'sonner/g)||[]).length, '(should be 1)');
console.log('Play import count:', (v.match(/^  Play,\r?$/gm)||[]).length, '(should be 1)');
console.log('Last 3 lines:', JSON.stringify(vLines.slice(-3)));

// Show the handleAutomationCreated area
const hacIdx = vLines.findIndex(l => l.includes('handleAutomationCreated'));
console.log('\nhandleAutomationCreated area:');
for (let i = hacIdx - 1; i <= hacIdx + 5; i++) {
  console.log(`  ${i+1}: ${vLines[i]}`);
}
