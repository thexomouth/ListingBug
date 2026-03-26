const fs = require('fs');
const projectPath = 'C:/Users/User/Downloads/ListingBug FIGMA MVP';

// Read current fixed file (has clean imports + loadAutomations but missing JSX)
const currentFixed = fs.readFileSync(`${projectPath}/src/components/AutomationsManagementPage.tsx`, 'utf8');
const currentLines = currentFixed.split('\n');
console.log('Current fixed file lines:', currentLines.length);

// Read the JSX-only portion extracted from HEAD
const jsxOnly = fs.readFileSync(`${projectPath}/automations-jsx-only.txt`, 'utf8');
const jsxLines = jsxOnly.split('\n');
console.log('JSX portion lines:', jsxLines.length);
console.log('JSX starts with:', jsxLines[0]);
console.log('JSX ends with:', jsxLines[jsxLines.length - 2], jsxLines[jsxLines.length - 1]);

// Verify current file ends cleanly after useEffect
const lastFewLines = currentLines.slice(-8);
console.log('\nLast 8 lines of current file:');
lastFewLines.forEach((l, i) => console.log(currentLines.length - 8 + i, ':', JSON.stringify(l)));

// Check if it already ends with closing brace
const lastMeaningfulLine = currentLines.filter(l => l.trim()).slice(-1)[0];
console.log('\nLast meaningful line:', JSON.stringify(lastMeaningfulLine));

// Merge: current file + blank line + JSX
// Remove any trailing blank lines from current, then append JSX
const trimmedCurrent = currentFixed.trimEnd();
const merged = trimmedCurrent + '\n\n' + jsxOnly;

fs.writeFileSync(`${projectPath}/src/components/AutomationsManagementPage.tsx`, merged);

// Verify merged
const v = fs.readFileSync(`${projectPath}/src/components/AutomationsManagementPage.tsx`, 'utf8');
const vLines = v.split('\n');
console.log('\n=== MERGED VERIFICATION ===');
console.log('Total lines:', vLines.length);
console.log('export fn count:', (v.match(/export function AutomationsManagementPage/g)||[]).length, '(should be 1)');
console.log('return ( count:', (v.match(/^  return \(/gm)||[]).length, '(should be 1)');
console.log('loadAutomations count:', (v.match(/const loadAutomations/g)||[]).length, '(should be 1)');
console.log('interface Automation { count:', (v.match(/interface Automation \{/g)||[]).length, '(should be 1)');
console.log('corruption gone:', !v.includes("userId) useCallback } from 'react'"));
console.log('duplicate imports gone:', (v.match(/import \{ useState/g)||[]).length, '(should be 1)');
console.log('sonner import count:', (v.match(/from 'sonner/g)||[]).length, '(should be 1)');
console.log('Play import count:', (v.match(/^  Play,$/gm)||[]).length, '(should be 1)');
console.log('Last 3 lines:', JSON.stringify(vLines.slice(-3)));
