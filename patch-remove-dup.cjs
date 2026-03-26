const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/IntegrationsPage.tsx';
let c = fs.readFileSync(path, 'utf8');

// Find and remove the OLD handleDisconnect (the fake one at line ~374)
// Our new one is at line 185, the old one starts with "  const handleDisconnect = () => {"
const oldStart = c.indexOf('  const handleDisconnect = () => {');
const oldEnd = c.indexOf('  };', oldStart) + 4;
console.log('removing old handleDisconnect at', oldStart, '-', oldEnd);
console.log('snippet:', JSON.stringify(c.slice(oldStart, oldStart+60)));

c = c.slice(0, oldStart) + c.slice(oldEnd);

// Wire the disconnect button to use selectedIntegration.id
c = c.replace(
  '<Button variant="destructive" onClick={handleDisconnect}>',
  '<Button variant="destructive" onClick={() => selectedIntegration && handleDisconnect(selectedIntegration.id)}>'
);

fs.writeFileSync(path, c);
const v = fs.readFileSync(path, 'utf8');
const matches = (v.match(/const handleDisconnect/g) || []).length;
console.log('handleDisconnect count:', matches, '(should be 1)');
console.log('button wired:', v.includes('handleDisconnect(selectedIntegration.id)'));
