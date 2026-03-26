const fs = require('fs');
const amp = fs.readFileSync('C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx', 'utf8');
const lines = amp.split('\n');
// Find the state declarations around the automations/automationUsage area
lines.forEach((l, i) => {
  if (i >= 110 && i <= 140) console.log(i+1, l);
});
