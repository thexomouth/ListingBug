const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx';
let c = fs.readFileSync(path, 'utf8');

// Find the exact start and end of loadAutomations function
const fnStart = c.indexOf('  const loadAutomations = async () => {');
if (fnStart < 0) { console.log('NOT FOUND'); process.exit(1); }

// Find its closing }; 
// The function ends at the line with just "  };"
// Count braces to find the end
let braceCount = 0;
let i = fnStart;
let fnEnd = -1;
while (i < c.length) {
  if (c[i] === '{') braceCount++;
  if (c[i] === '}') {
    braceCount--;
    if (braceCount === 0) {
      // Check if followed by ;
      let j = i + 1;
      while (j < c.length && (c[j] === '\r' || c[j] === '\n' || c[j] === ' ')) j++;
      fnEnd = i + 1;
      break;
    }
  }
  i++;
}

console.log('fn start:', fnStart, 'fn end:', fnEnd);
const fnBody = c.slice(fnStart, fnEnd);
console.log('first line:', fnBody.split('\n')[0]);
console.log('last 30 chars:', JSON.stringify(fnBody.slice(-30)));

// Replace:  const loadAutomations = async () => { ... }
// With:     const loadAutomations = useCallback(async () => { ... }, []);
const oldFn = fnBody;
const newFn = fnBody
  .replace('const loadAutomations = async () => {', 'const loadAutomations = useCallback(async () => {')
  + ', [])';

c = c.slice(0, fnStart) + newFn + c.slice(fnEnd);
fs.writeFileSync(path, c);

const v = fs.readFileSync(path, 'utf8');
console.log('useCallback wrapping:', v.includes('loadAutomations = useCallback(async'));
console.log('closes with , []):', v.includes('}, [])'));
