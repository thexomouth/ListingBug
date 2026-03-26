const fs = require('fs');
const v = fs.readFileSync('C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx', 'utf8');
const lines = v.split('\n');
// Show lucide import block
lines.forEach((l,i) => {
  if (i >= 13 && i <= 35) console.log(i+1, l);
});
// Show AlertTriangle usage
lines.forEach((l,i) => {
  if (l.includes('AlertTriangle')) console.log('AlertTriangle at', i+1, l.trim());
});
