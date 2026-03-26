const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx';
let c = fs.readFileSync(path, 'utf8');

// Remove useCallback wrapping - replace with plain async function
c = c.replace(
  'loadAutomations = useCallback(async () => {',
  'loadAutomations = async () => {'
);

// Remove the closing , []) that useCallback added
// Find the end of the function body
const fnStart = c.indexOf('loadAutomations = async () => {');
let braceCount = 0;
let i = fnStart;
while (i < c.length) {
  if (c[i] === '{') braceCount++;
  if (c[i] === '}') {
    braceCount--;
    if (braceCount === 0) {
      // Check what follows: should be  }, [])  or  };
      const after = c.slice(i + 1, i + 10);
      console.log('fn ends at', i, 'next chars:', JSON.stringify(after));
      // If followed by , []) remove that
      if (after.includes(', [])')) {
        c = c.slice(0, i + 1) + c.slice(i + 1).replace(/^(\s*,\s*\[\s*\]\s*\))/, '');
      }
      break;
    }
  }
  i++;
}

fs.writeFileSync(path, c);
const v = fs.readFileSync(path, 'utf8');
console.log('useCallback removed:', !v.includes('loadAutomations = useCallback'));
console.log('plain async fn:', v.includes('loadAutomations = async () => {'));
console.log('no stale , []):', !v.includes(', [])'));
