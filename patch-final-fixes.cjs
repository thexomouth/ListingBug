const fs = require('fs');

// Fix 1: CreateAutomationModal — add supabase import
const camPath = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/CreateAutomationModal.tsx';
let cam = fs.readFileSync(camPath, 'utf8');
if (!cam.includes("import { supabase }")) {
  cam = cam.replace(
    "import { useWalkthrough } from './WalkthroughContext';",
    "import { useWalkthrough } from './WalkthroughContext';\nimport { supabase } from '../lib/supabase';"
  );
  fs.writeFileSync(camPath, cam);
  console.log('CAM supabase import: added');
} else {
  console.log('CAM supabase import: already present');
}

// Fix 2: IntegrationsPage — fix Twilio category using indexOf (CRLF-safe)
const ipPath = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/IntegrationsPage.tsx';
let ip = fs.readFileSync(ipPath, 'utf8');

const twilioIdx = ip.indexOf("id: 'twilio'");
const twilioBlock = ip.slice(twilioIdx, twilioIdx + 200);
console.log('twilio block:', JSON.stringify(twilioBlock));

// Find category line within the block
const catIdx = ip.indexOf("category: 'future'", twilioIdx);
const catEnd = catIdx + "category: 'future'".length;
// Make sure this is within the twilio block (not some other future integration)
if (catIdx > twilioIdx && catIdx < twilioIdx + 200) {
  ip = ip.slice(0, catIdx) + "category: 'available'" + ip.slice(catEnd);
  // Also fix description
  const descIdx = ip.indexOf("description: 'SMS notifications'", twilioIdx);
  if (descIdx > 0 && descIdx < twilioIdx + 200) {
    const descEnd = descIdx + "description: 'SMS notifications'".length;
    ip = ip.slice(0, descIdx) + "description: 'Push agent contacts to your Twilio Sync List'" + ip.slice(descEnd);
  }
  fs.writeFileSync(ipPath, ip);
  console.log('Twilio: moved to available');
} else {
  console.log('Twilio category not found in expected range, catIdx:', catIdx, 'twilioIdx:', twilioIdx);
}

// Verify
const ipv = fs.readFileSync(ipPath, 'utf8');
const ti = ipv.indexOf("id: 'twilio'");
console.log('twilio category:', JSON.stringify(ipv.slice(ti, ti+160)));
