const fs = require('fs');
const v = fs.readFileSync('C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/Dashboard.tsx', 'utf8');
const lines = v.split('\n');
lines.forEach((l, i) => {
  if (l.includes('automation') || l.includes('Automation')) console.log(i+1, l.trim());
});
