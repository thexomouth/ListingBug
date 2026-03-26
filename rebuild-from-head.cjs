const fs = require('fs');
const projectPath = 'C:/Users/User/Downloads/ListingBug FIGMA MVP';

// Use the HEAD version as our source of truth
const headContent = fs.readFileSync(`${projectPath}/automations-head.tsx`, 'utf8');
const headLines = headContent.split('\n');
console.log('HEAD lines:', headLines.length);

// HEAD has two copies of the component. Structure:
//   Lines 1..92   = imports + interfaces (first copy)
//   Line 93       = export function AutomationsManagementPage (first copy - BROKEN loadAutomations)
//   Lines 93..549 = first component body up to corrupt .eq line
//   Lines 550..641 = garbage duplicate imports
//   Lines 642..end = second complete component (with working/clean loadAutomations)
//
// Strategy: take imports+interfaces from lines 1..92 (0-indexed: 0..91)
// Then take EVERYTHING from line 642 onward (0-indexed: 641..end) - this is the clean component

// Find second export function (0-based index)
let secondExportIdx = -1;
headLines.forEach((l, i) => {
  if (l.includes('export function AutomationsManagementPage') && i > 100) {
    secondExportIdx = i;
  }
});
console.log('Second export fn at 0-based index:', secondExportIdx, '| line:', secondExportIdx + 1);

// Find first export function (0-based)
const firstExportIdx = headLines.findIndex(l => l.includes('export function AutomationsManagementPage'));
console.log('First export fn at 0-based index:', firstExportIdx, '| line:', firstExportIdx + 1);

// Lines 0..(firstExportIdx-1) = clean imports and interfaces
const importsAndInterfaces = headLines.slice(0, firstExportIdx);
console.log('Imports/interfaces lines:', importsAndInterfaces.length);
console.log('Last line of imports section:', JSON.stringify(importsAndInterfaces[importsAndInterfaces.length - 1]));

// Lines secondExportIdx..end = clean second component
const cleanComponent = headLines.slice(secondExportIdx);
console.log('Clean component lines:', cleanComponent.length);
console.log('First line:', cleanComponent[0]);

// Check what loadAutomations looks like in clean component
const loadIdx = cleanComponent.findIndex(l => l.includes('const loadAutomations'));
console.log('loadAutomations in clean component at line:', loadIdx);
// Show the .eq line
const eqIdx = cleanComponent.findIndex(l => l.includes(".eq('user_id'"));
console.log('.eq line:', JSON.stringify(cleanComponent[eqIdx]));

// Merge
const rebuilt = [...importsAndInterfaces, ...cleanComponent].join('\n');
fs.writeFileSync(`${projectPath}/src/components/AutomationsManagementPage.tsx`, rebuilt);

// Verify
const v = fs.readFileSync(`${projectPath}/src/components/AutomationsManagementPage.tsx`, 'utf8');
const vLines = v.split('\n');
console.log('\n=== FINAL VERIFICATION ===');
console.log('Total lines:', vLines.length);
console.log('export fn count:', (v.match(/export function AutomationsManagementPage/g)||[]).length, '(should be 1)');
console.log('return ( count:', (v.match(/^  return \(/gm)||[]).length, '(should be 1)');
console.log('loadAutomations count:', (v.match(/const loadAutomations/g)||[]).length, '(should be 1)');
console.log('interface Automation { count:', (v.match(/interface Automation \{/g)||[]).length, '(should be 1)');
console.log('corruption gone:', !v.includes("userId) useCallback } from 'react'"));
console.log('duplicate imports gone:', (v.match(/import \{ useState/g)||[]).length, '(should be 1)');
console.log('sonner import count:', (v.match(/from 'sonner/g)||[]).length, '(should be 1)');
console.log('Play import count:', (v.match(/^  Play,\r?$/gm)||[]).length, '(should be 1)');
console.log('Last 3 lines:', JSON.stringify(vLines.slice(-3)));
