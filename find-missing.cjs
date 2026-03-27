const fs = require('fs');
const c = fs.readFileSync('C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/SearchListings.tsx', 'utf8');
// Find the React import line
const lines = c.split('\n');
lines.forEach((l, i) => {
  if (i < 5) console.log(i+1, l.trim().substring(0, 100));
});
