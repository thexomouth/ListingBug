const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/SearchListings.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  /await supabase\.from\('saved_listings'\)\.upsert\(\{[\s\S]*?\}, \{ onConflict: 'user_id,listing_id' \}\);/,
  `const { error: saveErr } = await supabase.from('saved_listings').upsert({
          user_id: user.id,
          listing_id: String(listing.id),
          listing_data_json: savedListing,
          saved_at: savedListing.savedAt,
        }, { onConflict: 'user_id,listing_id' });
        if (saveErr) {
          console.error('[SaveListing] upsert error:', saveErr.code, saveErr.message, saveErr.details);
          toast.error('Save failed: ' + saveErr.message);
        }`
);

fs.writeFileSync(path, c);
console.log('done');
