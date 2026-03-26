const fs = require('fs');
const v = fs.readFileSync('C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx', 'utf8');
console.log('AlertTriangle count:', (v.match(/AlertTriangle/g)||[]).length);
// Also check planLimits imports still needed
console.log('canCreateAutomation uses:', (v.match(/canCreateAutomation/g)||[]).length);
console.log('getNextPlan uses:', (v.match(/getNextPlan/g)||[]).length);
