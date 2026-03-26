const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/CreateAutomationModal.tsx';
let c = fs.readFileSync(path, 'utf8');

const idx = c.indexOf('canProceedToStep2 = selectedDestination');
const end = c.indexOf(';', idx) + 1;
console.log('found at', idx, JSON.stringify(c.slice(idx, end)));

const newVal = `canProceedToStep2 = selectedDestination &&
    (!selectedIntegration?.requiresSetup ||
      (selectedIntegration.setupFields?.every((f: any) =>
        f.type === 'select' || destinationConfig[f.key]?.trim()
      )));`;

c = c.slice(0, idx) + newVal + c.slice(end);
fs.writeFileSync(path, c);
console.log('fixed:', fs.readFileSync(path, 'utf8').includes("f.type === 'select'"));
