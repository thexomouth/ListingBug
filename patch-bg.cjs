const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/SearchListings.tsx';
let c = fs.readFileSync(path, 'utf8');
c = c.replace(/className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-6 bg-gray-50"/, 'className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-6"');
fs.writeFileSync(path, c);
console.log(c.includes('bg-gray-50') ? 'still present' : 'removed');
