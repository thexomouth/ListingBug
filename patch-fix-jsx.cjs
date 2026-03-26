const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/IntegrationsPage.tsx';
let c = fs.readFileSync(path, 'utf8');

// Find and fix the broken block
const broken = c.indexOf('              Connected\r\n            </span>\r\n          {connectedInfo');
const brokenLF = c.indexOf('              Connected\n            </span>\n          {connectedInfo');
const idx = broken >= 0 ? broken : brokenLF;
if (idx < 0) { console.log('NOT FOUND'); process.exit(1); }

// Read 200 chars to see what we have
console.log(JSON.stringify(c.slice(idx, idx + 250)));

// Find end of broken block: the extra )} that closes isConnected
// The structure is: Connected</span> {connectedInfo...} )} {isFuture
// We need: Connected</span> )} {connectedInfo...} {isFuture

// Simpler: just replace the whole broken section
const brokenSection = c.slice(idx, idx + 250);
const fixedSection = brokenSection
  .replace(/Connected\r?\n            <\/span>\r?\n          \{connectedInfo[\s\S]*?\}\r?\n          \}\)/,
    (match) => {
      // extract the connectedInfo block
      const connStart = match.indexOf('{connectedInfo');
      const connEnd = match.lastIndexOf(')}') ;
      const connBlock = match.slice(connStart, connEnd).trim();
      return `Connected\n            </span>\n          )}\n          ${connBlock}`;
    }
  );

console.log('fixed section:', JSON.stringify(fixedSection.slice(0, 200)));
c = c.slice(0, idx) + fixedSection + c.slice(idx + 250);
fs.writeFileSync(path, c);
