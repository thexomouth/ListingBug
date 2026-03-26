const fs = require('fs');
const projectPath = 'C:/Users/User/Downloads/ListingBug FIGMA MVP';
const headLines = fs.readFileSync(`${projectPath}/automations-head.tsx`, 'utf8').split('\n');

console.log('HEAD lines:', headLines.length);

// Confirmed structure from mapping:
// Lines 1-533 (idx 0-532): clean component — imports, interfaces, state, loadAutomations, hooks
// Lines 534-550 (idx 533-549): second corrupted loadAutomations fragment — DELETE
// Lines 551-641 (idx 550-640): garbage duplicate imports — DELETE  
// Lines 642-673 (idx 641-672): second component declaration + state (no loadAutomations) — DELETE
// Line 674 (idx 673): return ( — start of JSX we want
// Lines 674-1142 (idx 673-1141): JSX return to end of file — KEEP

// Verify the cut points
console.log('Line 533 (idx 532):', JSON.stringify(headLines[532]));
console.log('Line 534 (idx 533):', JSON.stringify(headLines[533]));
console.log('Line 641 (idx 640):', JSON.stringify(headLines[640]));
console.log('Line 642 (idx 641):', JSON.stringify(headLines[641]));
console.log('Line 673 (idx 672):', JSON.stringify(headLines[672]));
console.log('Line 674 (idx 673):', JSON.stringify(headLines[673]));
console.log('Line 675 (idx 674):', JSON.stringify(headLines[674]));

// Find exact cut: last clean line before the second loadAutomations fragment
// Line 533 should be the end of the prefill useEffect or similar clean code
// Let's find where the second loadAutomations fragment starts
let secondLoadStart = -1;
for (let i = 300; i < 560; i++) {
  if (headLines[i].includes('const loadAutomations')) {
    secondLoadStart = i;
    console.log('Second loadAutomations fragment at idx:', i, '| line:', i+1);
    console.log('  content:', JSON.stringify(headLines[i]));
    break;
  }
}

// Find the return ( for the JSX (inside the first component, after all hooks)
// We know it's at line 182 and 674 — line 182 is inside the first component
// The return( at line 182 is for the first component's JSX... wait let me recheck
// markers showed return( at lines [182, 674, 812]
// Line 182 = first component's return()
// But we want to use that one — lines 93-181 are the component open + loadAutomations + useEffect
// Lines 182-533 are additional hooks THEN the return( 
// Wait, 182 is too early for return — it's probably another useEffect?
// Let me check what's actually at line 182

console.log('\nLines 180-185:');
for (let i = 179; i <= 184; i++) {
  console.log(`  Line ${i+1}:`, JSON.stringify(headLines[i]));
}
