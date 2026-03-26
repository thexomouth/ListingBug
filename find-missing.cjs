const fs = require('fs');
const v = fs.readFileSync('C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/SearchListings.tsx', 'utf8');
const lines = v.split('\n');
lines.forEach((l,i) => {
  if (l.includes('Saved Listings') || l.includes('Saved Searches') || l.includes('tab="saved"') || l.includes("tab='saved'") || (l.includes('saved') && l.includes('Tab'))) {
    console.log(i+1, l.trim().substring(0,120));
  }
});
