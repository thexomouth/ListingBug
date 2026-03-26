const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/IntegrationsPage.tsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Move Twilio from future → available
c = c.replace(
  "id: 'twilio', \n      name: 'Twilio', \n      icon: MessageSquare, \n      connected: false, \n      description: 'SMS notifications',\n      category: 'future'",
  "id: 'twilio', \n      name: 'Twilio', \n      icon: MessageSquare, \n      connected: false, \n      description: 'Push agent contacts to Twilio Sync List',\n      category: 'available'"
);

// 2. Fix sheets id → google (so it matches integration_connections.integration_id)
c = c.replace(
  "id: 'sheets', \n      name: 'Google Sheets', \n      icon: FileSpreadsheet, \n      connected: false, \n      description: 'Spreadsheet automation',\n      category: 'available'",
  "id: 'google', \n      name: 'Google Sheets', \n      icon: FileSpreadsheet, \n      connected: false, \n      description: 'Append listing data as rows in a spreadsheet',\n      category: 'available'"
);

// 3. Add connectedAccounts state to track account info per integration
// Insert after the loadConnectedIntegrations function body
const loadFnMarker = 'const loadConnectedIntegrations = async () => {';
const loadFnIdx = c.indexOf(loadFnMarker);
if (loadFnIdx > 0) {
  // Find the closing }; of this function
  const loadFnEnd = c.indexOf('\n  };', loadFnIdx) + 5;

  // Replace the function body to also store connected_at
  const oldFn = c.slice(loadFnIdx, loadFnEnd);
  const newFn = `const loadConnectedIntegrations = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;
    const { data, error } = await supabase
      .from('integration_connections')
      .select('integration_id, connected_at, config')
      .eq('user_id', session.user.id);
    if (error || !data) return;
    const connectedIds = new Set(data.map((r: any) => r.integration_id));
    const infoMap: Record<string, { connectedAt: string; config: any }> = {};
    data.forEach((r: any) => {
      infoMap[r.integration_id] = { connectedAt: r.connected_at, config: r.config };
    });
    setConnectedInfo(infoMap);
    setIntegrations(prev => prev.map(i => ({
      ...i,
      connected: connectedIds.has(i.id),
      category: connectedIds.has(i.id) ? 'connected' : (i.category === 'connected' ? 'available' : i.category),
    })));
  };`;
  c = c.slice(0, loadFnIdx) + newFn + c.slice(loadFnEnd);
  console.log('loadConnectedIntegrations: updated');
}

// 4. Add connectedInfo state declaration near the top of the component
const stateMarker = 'const [connectionModalOpen, setConnectionModalOpen] = useState(false);';
const stateIdx = c.indexOf(stateMarker);
if (stateIdx > 0) {
  c = c.slice(0, stateIdx) + 
    'const [connectedInfo, setConnectedInfo] = useState<Record<string, {connectedAt: string; config: any}>>({});\n  ' +
    c.slice(stateIdx);
  console.log('connectedInfo state: added');
}

fs.writeFileSync(path, c);
const v = fs.readFileSync(path, 'utf8');
console.log('twilio available:', v.includes("id: 'twilio'") && v.includes("category: 'available'"));
console.log('sheets id=google:', v.includes("id: 'google'"));
console.log('connectedInfo state:', v.includes('connectedInfo'));
