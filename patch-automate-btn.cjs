const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/SearchListings.tsx';
let c = fs.readFileSync(path, 'utf8');

// Replace the Automate button onClick in saved searches to navigate instead of opening modal
c = c.replace(
  'onClick={() => handleCreateAutomation(search)}',
  'onClick={() => onNavigate ? onNavigate(\'automations\') : undefined}'
);

fs.writeFileSync(path, c);
console.log('done');
