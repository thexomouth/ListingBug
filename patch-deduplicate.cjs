const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx';
const c = fs.readFileSync(path, 'utf8');
const lines = c.split('\n');

console.log('Total lines before:', lines.length);

// Keep lines 1-673 (0-indexed: 0-672) and lines 1237+ (0-indexed: 1236+)
// Line 674 (index 673) starts the duplicate
// Line 1237 (index 1236) starts the real return()
const keep1 = lines.slice(0, 673);   // lines 1-673
const keep2 = lines.slice(1236);     // lines 1237 to end

const result = [...keep1, ...keep2].join('\n');
fs.writeFileSync(path, result);

// Verify
const v = fs.readFileSync(path, 'utf8');
const vLines = v.split('\n');
console.log('Total lines after:', vLines.length);
const loadCount = (v.match(/const loadAutomations/g)||[]).length;
const setAutoCount = (v.match(/useState<Automation\[\]>/g)||[]).length;
const returnCount = (v.match(/^  return \(/gm)||[]).length;
console.log('loadAutomations declarations:', loadCount, '(should be 1)');
console.log('useState<Automation[]>:', setAutoCount, '(should be 1)');
console.log('return( count:', returnCount, '(should be 1)');
