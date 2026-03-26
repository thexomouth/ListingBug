const fs = require('fs');
const v = fs.readFileSync('C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx', 'utf8');
const l = v.split('\n');
console.log('lines:', l.length);
console.log('export fn:', (v.match(/export function AutomationsManagementPage/g)||[]).length);
console.log('loadAutomations:', (v.match(/const loadAutomations/g)||[]).length);
console.log('return( count:', (v.match(/^  return \(/gm)||[]).length);
console.log('corrupt:', v.includes("userId) useCallback } from 'react'"));
console.log('Play dupes:', (v.match(/^  Play,\r?$/gm)||[]).length);
console.log('sonner count:', (v.match(/from 'sonner/g)||[]).length);
console.log('interface Automation:', (v.match(/interface Automation \{/g)||[]).length);

// Find key line numbers
l.forEach((line, i) => {
  if (line.includes('export function AutomationsManagementPage')) console.log('  export fn at line:', i+1);
  if (line.includes('const loadAutomations')) console.log('  loadAutomations at line:', i+1);
  if (line.trim() === 'return (') console.log('  return( at line:', i+1);
  if (line.includes("userId) useCallback")) console.log('  CORRUPT at line:', i+1);
});
