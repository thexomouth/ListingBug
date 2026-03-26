const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/CreateAutomationModal.tsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Add supabase import if not already there
if (!c.includes("import { supabase }")) {
  c = c.replace(
    "import { useWalkthrough } from '../lib/walkthrough';",
    "import { useWalkthrough } from '../lib/walkthrough';\nimport { supabase } from '../lib/supabase';"
  );
}

// 2. Add connectedIds state and effect to load from DB — insert after destinationConfig state
const stateMarker = "const [destinationConfig, setDestinationConfig] = useState<Record<string, string>>({});";
const stateIdx = c.indexOf(stateMarker);
if (stateIdx < 0) { console.log('STATE MARKER NOT FOUND'); process.exit(1); }
const afterState = stateIdx + stateMarker.length;

const newState = `
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadConnections = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      const { data } = await supabase
        .from('integration_connections')
        .select('integration_id')
        .eq('user_id', session.user.id);
      if (data) setConnectedIds(new Set(data.map((r: any) => r.integration_id)));
    };
    loadConnections();
  }, []);`;

c = c.slice(0, afterState) + newState + c.slice(afterState);

// 3. Update the destinations list — replace all 'connected: true' with dynamic check
// and update setupFields to match actual destination_config shapes

const oldDestStart = c.indexOf("// Spreadsheets & Databases\n    { \n      id: 'sheets'");
const oldSheets = `    { 
      id: 'sheets', 
      name: 'Google Sheets', 
      icon: FileSpreadsheet, 
      connected: true, 
      requiresSetup: true,
      setupFields: [
        { key: 'spreadsheet_id', label: 'Spreadsheet ID', placeholder: '1A2B3C4D...' }
      ]
    },`;

const newSheets = `    { 
      id: 'google', 
      name: 'Google Sheets', 
      icon: FileSpreadsheet, 
      connected: connectedIds.has('google'), 
      requiresSetup: true,
      setupFields: [
        { key: 'spreadsheet_id', label: 'Spreadsheet ID', placeholder: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms', hint: 'In your Google Sheets URL between /d/ and /edit' },
        { key: 'sheet_name', label: 'Sheet Tab Name', placeholder: 'Sheet1', hint: 'The tab name at the bottom of your spreadsheet' },
        { key: 'write_mode', label: 'Write Mode', type: 'select', options: [{value:'append',label:'Append rows each run'},{value:'overwrite',label:'Overwrite each run'}] }
      ]
    },`;

if (c.includes(oldSheets)) {
  c = c.replace(oldSheets, newSheets);
  console.log('sheets: patched');
} else {
  console.log('sheets: NOT FOUND, trying indexOf');
}

// Fix mailchimp setupFields
const oldMailchimp = `      setupFields: [
        { key: 'api_key', label: 'API Key', placeholder: 'Enter API key', type: 'password' },
        { key: 'list_id', label: 'Contact List ID', placeholder: 'Enter list ID' }
      ]`;
const newMailchimp = `      setupFields: [
        { key: 'list_id', label: 'Audience / List ID', placeholder: 'abc123def', hint: 'Found in Mailchimp → Audience → Settings → Audience ID' },
        { key: 'tags', label: 'Tags (optional)', placeholder: 'ListingBug, Denver Agents', hint: 'Comma-separated tags applied to each contact' },
        { key: 'double_opt_in', label: 'Double opt-in', type: 'select', options: [{value:'false',label:'No (subscribe immediately)'},{value:'true',label:'Yes (send confirmation email)'}] }
      ]`;
if (c.includes(oldMailchimp)) { c = c.replace(oldMailchimp, newMailchimp); console.log('mailchimp fields: patched'); }

// Fix twilio setupFields
const oldTwilio = `      setupFields: [
        { key: 'account_sid', label: 'Account SID', placeholder: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' },
        { key: 'auth_token', label: 'Auth Token', placeholder: 'Enter auth token', type: 'password' },
        { key: 'from_number', label: 'From Number', placeholder: '+1234567890' }
      ]`;
const newTwilio = `      setupFields: [
        { key: 'list_unique_name', label: 'Sync List Name', placeholder: 'listingbug_contacts', hint: 'Name of the Twilio Sync List to push contacts to' }
      ]`;
if (c.includes(oldTwilio)) { c = c.replace(oldTwilio, newTwilio); console.log('twilio fields: patched'); }

// Fix zapier to include send_mode
const oldZapier = `      setupFields: [
        { key: 'webhook_url', label: 'Zapier Webhook URL', placeholder: 'https://hooks.zapier.com/hooks/catch/...', type: 'url' }
      ]`;
const newZapier = `      setupFields: [
        { key: 'webhook_url', label: 'Zapier Webhook URL', placeholder: 'https://hooks.zapier.com/hooks/catch/...', type: 'url', hint: 'From Webhooks by Zapier → Catch Hook trigger' },
        { key: 'send_mode', label: 'Delivery Mode', type: 'select', options: [{value:'batch',label:'Batch (one request with all listings)'},{value:'individual',label:'Individual (one request per listing)'}] }
      ]`;
if (c.includes(oldZapier)) { c = c.replace(oldZapier, newZapier); console.log('zapier fields: patched'); }

// Fix make to include send_mode
const oldMake = `      setupFields: [
        { key: 'webhook_url', label: 'Make Webhook URL', placeholder: 'https://hook.integromat.com/...', type: 'url' }
      ]`;
const newMake = `      setupFields: [
        { key: 'webhook_url', label: 'Make Webhook URL', placeholder: 'https://hook.make.com/...', type: 'url', hint: 'From Webhooks module → Custom Webhook trigger' },
        { key: 'send_mode', label: 'Delivery Mode', type: 'select', options: [{value:'batch',label:'Batch (one request with all listings)'},{value:'individual',label:'Individual (one request per listing)'}] }
      ]`;
if (c.includes(oldMake)) { c = c.replace(oldMake, newMake); console.log('make fields: patched'); }

// Make all destinations use connectedIds for their connected state
// Replace connected: true for hubspot, sendgrid, twilio, zapier, make, webhook, n8n, mailchimp
const connectReplacements = [
  ["id: 'hubspot', \n      name: 'HubSpot'", "connected: true,", "connected: connectedIds.has('hubspot'),"],
  ["id: 'sendgrid', \n      name: 'SendGrid'", "connected: true,", "connected: connectedIds.has('sendgrid'),"],
  ["id: 'twilio', \n      name: 'Twilio'", "connected: true,", "connected: connectedIds.has('twilio'),"],
  ["id: 'zapier', \n      name: 'Zapier'", "connected: true,", "connected: connectedIds.has('zapier'),"],
  ["id: 'make', \n      name: 'Make'", "connected: true,", "connected: connectedIds.has('make'),"],
  ["id: 'webhook', \n      name: 'Custom Webhook'", "connected: true,", "connected: true,"], // webhook has no integration connection
  ["id: 'mailchimp', \n      name: 'Mailchimp'", "connected: true,", "connected: connectedIds.has('mailchimp'),"],
];

// Use a targeted approach — find each block and replace its connected line
for (const [idBlock, oldConn, newConn] of connectReplacements) {
  const blockIdx = c.indexOf(idBlock);
  if (blockIdx > 0) {
    const connIdx = c.indexOf(oldConn, blockIdx);
    if (connIdx > 0 && connIdx < blockIdx + 200) {
      c = c.slice(0, connIdx) + newConn + c.slice(connIdx + oldConn.length);
    }
  }
}
console.log('connected states patched');

fs.writeFileSync(path, c);
const v = fs.readFileSync(path, 'utf8');
console.log('connectedIds state:', v.includes('connectedIds'));
console.log('sheets id=google:', v.includes("id: 'google'"));
console.log('supabase import:', v.includes("import { supabase }"));
