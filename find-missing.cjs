const fs = require('fs');
const v = fs.readFileSync('C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx', 'utf8');
const lines = v.split('\n');
lines.forEach((l, i) => {
  if (l.includes('automationUsage') || l.includes('Automation Limit') || l.includes('automation slots')) console.log(i+1, l.trim());
});
