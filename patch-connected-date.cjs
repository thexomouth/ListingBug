const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/IntegrationsPage.tsx';
let c = fs.readFileSync(path, 'utf8');

// Find the Connected badge span and add connected date below it
const marker = c.indexOf('              Connected\n            </span>');
if (marker < 0) {
  // Try CRLF
  const markerCrlf = c.indexOf('              Connected\r\n            </span>');
  if (markerCrlf < 0) { console.log('MARKER NOT FOUND'); process.exit(1); }
}

// Use a different approach — find the exact span end
const spanEnd = c.indexOf('Connected\n            </span>');
const spanEndCrlf = c.indexOf('Connected\r\n            </span>');
const idx = spanEnd >= 0 ? spanEnd : spanEndCrlf;
const closer = '</span>';
const closerEnd = c.indexOf(closer, idx) + closer.length;

console.log('found at:', idx, closerEnd);

const addition = `\n          {connectedInfo[integration.id]?.connectedAt && (
            <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">
              Since {new Date(connectedInfo[integration.id].connectedAt).toLocaleDateString()}
            </p>
          )}`;

c = c.slice(0, closerEnd) + addition + c.slice(closerEnd);
fs.writeFileSync(path, c);
console.log('connected date added:', fs.readFileSync(path,'utf8').includes('connectedInfo[integration.id]?.connectedAt'));
