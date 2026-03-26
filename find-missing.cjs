const fs = require('fs');
const v = fs.readFileSync('C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/ViewEditAutomationDrawer.tsx', 'utf8');
const lines = v.split('\n');
// Find the prop definition and any calls to onAutomationUpdated
lines.forEach((l, i) => {
  if (l.includes('onAutomationUpdated') || l.includes('AutomationUpdated')) console.log(i+1, l.trim());
});
