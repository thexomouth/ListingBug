const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Fix: only setAutomations if data is non-null (don't wipe state on empty DB response)
c = c.replace(
  '    setAutomations(mapped);\n    setAutomationsLoading(false);',
  '    // Only update if we got real data back — never wipe existing state with empty array\n    if (data !== null) {\n      setAutomations(mapped);\n    }\n    setAutomationsLoading(false);'
);

// 2. Fix: don't re-run loadAutomations on TOKEN_REFRESHED — that fires constantly
// Only load on SIGNED_IN (initial login) and initial mount
c = c.replace(
  "      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {\n        loadAutomations();\n      }",
  "      if (event === 'SIGNED_IN') {\n        loadAutomations();\n      }"
);

fs.writeFileSync(path, c);
const v = fs.readFileSync(path, 'utf8');
console.log('null guard:', v.includes('if (data !== null)'));
console.log('TOKEN_REFRESHED removed:', !v.includes("'TOKEN_REFRESHED'"));
