const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/SearchResultsPage.tsx';
let c = fs.readFileSync(path, 'utf8');

const start = c.indexOf("supabase.from('saved_listings').upsert(");
const end = c.indexOf(');', start) + 2;
console.log('found at', start, '-', end);
console.log('snippet:', JSON.stringify(c.slice(start, end)));

const fixed = `supabase.from('saved_listings').upsert(
        { user_id: user.id, listing_id: listing.id, listing_data_json: listing, saved_at: new Date().toISOString() },
        { onConflict: 'user_id,listing_id' }
      )`;

fs.writeFileSync(path, c.slice(0, start) + fixed + c.slice(end));
const v = fs.readFileSync(path, 'utf8');
console.log('listing_data_json:', v.includes('listing_data_json'));
console.log('saved_at:', v.includes('saved_at'));
console.log('onConflict:', v.includes('onConflict'));
