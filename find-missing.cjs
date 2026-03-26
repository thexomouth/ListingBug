const fs = require('fs');
const c = fs.readFileSync('C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/APIKeysSection.tsx', 'utf8');
c.split('\n').forEach((l,i) => {
  if (l.includes('showKeyModal') || l.includes('KeyModal') || l.includes('setShowKey')) {
    console.log(i+1, l.trim());
  }
});
