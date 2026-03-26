const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx';
let c = fs.readFileSync(path, 'utf8');

// Find where new function ends (after completeStep(3)) and orphan begins
const completeStepIdx = c.indexOf('completeStep(3);\n    }\n  };');
if (completeStepIdx < 0) { console.log('marker not found'); process.exit(1); }

const newFnEnd = completeStepIdx + 'completeStep(3);\n    }\n  };'.length;
console.log('new fn ends at:', newFnEnd);
console.log('next 200 chars:', JSON.stringify(c.slice(newFnEnd, newFnEnd + 200)));

// Find handleAutomationUpdated
const nextFn = c.indexOf('  const handleAutomationUpdated');
console.log('next fn at:', nextFn);

// Remove orphan between newFnEnd and nextFn
c = c.slice(0, newFnEnd) + '\n\n' + c.slice(nextFn);
fs.writeFileSync(path, c);

// Verify build-readiness
const v = fs.readFileSync(path, 'utf8');
console.log('orphan gone:', !v.includes('setAutomations(prev => [newAutomation'));
console.log('loadAutomations:', v.includes('const loadAutomations'));
console.log('supabase insert:', v.includes('.insert({'));
console.log('supabase delete:', v.includes("from('automations').delete()"));
