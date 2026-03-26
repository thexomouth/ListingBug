const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx';
const c = fs.readFileSync(path, 'utf8');
const lines = c.split('\n');

console.log('Total lines:', lines.length);

// Find the corruption at line 550 (index 549)
// The line is: .eq('user_id', userId) useCallback } from 'react';
// We need to:
// 1. Fix line 549 to just be: .eq('user_id', userId)
// 2. Remove everything from line 550 onwards until we hit the real return (
// Find the return ( that belongs to the JSX
let returnIdx = -1;
for (let i = 549; i < lines.length; i++) {
  if (lines[i].trim() === 'return (' || lines[i].trim() === 'return(') {
    returnIdx = i;
    console.log('Found return ( at line', i+1);
    break;
  }
}

if (returnIdx < 0) {
  console.log('No return ( found after line 550');
  process.exit(1);
}

// Show context around the return
console.log('Lines around return:');
[returnIdx-2, returnIdx-1, returnIdx, returnIdx+1, returnIdx+2].forEach(i => {
  if (lines[i]) console.log(i+1, JSON.stringify(lines[i].slice(0,80)));
});

// Fix: take lines 1-549 (fix line 549), skip 550 to returnIdx-1, keep returnIdx onwards
const fixed549 = "      .eq('user_id', userId)";
const before = [...lines.slice(0, 549), fixed549];
const after = lines.slice(returnIdx - 1); // keep a bit before return for context

// Check what's just before the return
console.log('\nLines just before return:');
[returnIdx-5, returnIdx-4, returnIdx-3, returnIdx-2, returnIdx-1].forEach(i => {
  if (lines[i]) console.log(i+1, JSON.stringify(lines[i].slice(0,80)));
});
