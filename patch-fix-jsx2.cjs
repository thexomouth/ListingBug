const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/IntegrationsPage.tsx';
let c = fs.readFileSync(path, 'utf8');

// Find the broken block using a unique anchor
const anchor = c.indexOf('Connected\r\n            </span>\r\n          {connectedInfo');
console.log('anchor at:', anchor);

if (anchor < 0) {
  console.log('trying LF version');
  const anchor2 = c.indexOf('Connected\n            </span>\n          {connectedInfo');
  console.log('anchor2 at:', anchor2);
}

// Find start of the whole broken section: "{isConnected && ("
// We know it's around line 411, let's find it precisely
const isConnStart = c.lastIndexOf('{isConnected && (', anchor > 0 ? anchor : 50000);
console.log('isConnStart:', isConnStart);

// Find end: the extra )} that should have closed isConnected
// The broken structure is:
//   {isConnected && (
//     <span>...Connected</span>
//     {connectedInfo...}
//   )}
// We need:
//   {isConnected && (<span>...Connected</span>)}
//   {isConnected && connectedInfo[...] && (<p>Since...</p>)}

// Let's find and replace the entire broken block
const blockStart = isConnStart;
// Find the )} that ends the whole thing (after the connectedInfo block)
// Look for the pattern: )}  (after the connectedInfo closing })
const connInfoEnd = c.indexOf('          )}\r\n          {isFuture', isConnStart);
const connInfoEndLF = c.indexOf('          )}\n          {isFuture', isConnStart);
const blockEnd = (connInfoEnd >= 0 ? connInfoEnd : connInfoEndLF) + '          )}'.length;
console.log('blockEnd:', blockEnd);
console.log('full broken block:', JSON.stringify(c.slice(blockStart, blockEnd)));

const fixedBlock = `{isConnected && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 dark:text-green-500">
              <CheckCircle className="w-3 h-3" />
              Connected
            </span>
          )}
          {isConnected && connectedInfo[integration.id]?.connectedAt && (
            <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">
              Since {new Date(connectedInfo[integration.id].connectedAt).toLocaleDateString()}
            </p>
          )}`;

c = c.slice(0, blockStart) + fixedBlock + c.slice(blockEnd);
fs.writeFileSync(path, c);
console.log('done, checking syntax...');
const v = fs.readFileSync(path, 'utf8');
console.log('connectedInfo outside isConnected:', v.includes('isConnected && connectedInfo'));
console.log('no broken nesting:', !v.includes('</span>\r\n          {connectedInfo') && !v.includes('</span>\n          {connectedInfo'));
