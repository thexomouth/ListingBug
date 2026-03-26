const fs = require('fs');
const amp = fs.readFileSync('C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx', 'utf8');
// Find where AutomationLimitModal is rendered and what props are passed
amp.split('\n').forEach((l, i) => {
  if (l.includes('AutomationLimitModal') || l.includes('limitModal') || l.includes('LimitModal')) {
    console.log(i+1, l.trim());
  }
});
