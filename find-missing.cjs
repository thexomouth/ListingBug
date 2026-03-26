const fs = require('fs');
// Check update-password edge function
const ef = fs.readFileSync('C:/Users/User/Downloads/ListingBug FIGMA MVP/supabase/functions/update-password/index.ts', 'utf8');
console.log('=== update-password edge fn ===');
console.log(ef);
// Check how listings tab switching works
const sl = fs.readFileSync('C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/SearchListings.tsx', 'utf8');
const lines = sl.split('\n');
lines.forEach((l, i) => {
  if (l.includes('open_saved') || l.includes('open_tab') || l.includes('savedlistings') || l.includes('savedListings') && l.includes('sessionStorage')) {
    console.log('SearchListings', i+1, l.trim());
  }
});
