const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Replace localStorage-based automations state init with empty array
// The old code: useState<Automation[]>(() => { const stored = localStorage... return [...hardcoded default...] })
const oldInit = c.indexOf('// Load automations from localStorage');
const oldInitEnd = c.indexOf('// Save automations to localStorage whenever they change');
if (oldInit < 0 || oldInitEnd < 0) { console.log('MARKERS NOT FOUND'); process.exit(1); }

const oldBlock = c.slice(oldInit, oldInitEnd);
console.log('OLD BLOCK start:', oldBlock.slice(0, 80));

const newInit = `// Automations loaded from Supabase (see loadAutomations below)
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [automationsLoading, setAutomationsLoading] = useState(true);

`;

c = c.slice(0, oldInit) + newInit + c.slice(oldInitEnd);

// 2. Replace "Save automations to localStorage whenever they change" useEffect with loadAutomations function
const oldSave = c.indexOf('// Save automations to localStorage whenever they change');
const oldSaveEnd = c.indexOf('// Check for prefilled automation data from search page');
const oldSaveBlock = c.slice(oldSave, oldSaveEnd);
console.log('OLD SAVE BLOCK:', oldSaveBlock.slice(0, 100));

const newLoadBlock = `// Load automations from Supabase — works on any device
  const loadAutomations = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) { setAutomationsLoading(false); return; }
    const { data, error } = await supabase
      .from('automations')
      .select('id,name,search_name,destination_type,destination_label,destination_config,search_criteria,schedule,schedule_time,sync_frequency,sync_rate,active,last_run_at,next_run_at,created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[Automations] load error:', error.message);
      setAutomationsLoading(false);
      return;
    }
    const mapped = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      searchName: row.search_name ?? '',
      schedule: [row.schedule, row.schedule_time ? \`at \${row.schedule_time}\` : ''].filter(Boolean).join(' '),
      destination: { type: row.destination_type, label: row.destination_label ?? row.destination_type, config: row.destination_config ?? {} },
      searchCriteria: row.search_criteria ?? {},
      active: row.active ?? true,
      status: 'idle',
      lastRun: row.last_run_at ? { date: row.last_run_at, status: 'success', listingsSent: 0 } : undefined,
      nextRun: row.next_run_at ? new Date(row.next_run_at).toLocaleString() : 'Pending first run',
    }));
    setAutomations(mapped);
    setAutomationsLoading(false);
  };

  // Load on mount and whenever auth state changes (handles mobile session restore)
  useEffect(() => {
    loadAutomations();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadAutomations();
      }
      if (event === 'SIGNED_OUT') {
        setAutomations([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

`;

c = c.slice(0, oldSave) + newLoadBlock + c.slice(oldSaveEnd);

// 3. Update handleAutomationCreated to write to Supabase
const oldCreated = c.indexOf('  const handleAutomationCreated = (automation: any) => {');
const oldCreatedEnd = c.indexOf('  };', oldCreated) + 4;
const oldCreatedBlock = c.slice(oldCreated, oldCreatedEnd);
console.log('OLD CREATED BLOCK:', oldCreatedBlock.slice(0, 80));

const newCreated = `  const handleAutomationCreated = async (automation: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      toast.error('You must be signed in to create automations.');
      return;
    }

    // Write to Supabase so it's available on all devices
    const { data: inserted, error } = await supabase
      .from('automations')
      .insert({
        user_id: session.user.id,
        name: automation.name,
        search_name: automation.searchName ?? '',
        search_criteria: automation.searchCriteria ?? {},
        destination_type: automation.destination?.type ?? '',
        destination_label: automation.destination?.label ?? '',
        destination_config: automation.destination?.config ?? {},
        schedule: automation.schedule ?? 'daily',
        schedule_time: automation.scheduleTime ?? '08:00',
        sync_frequency: automation.syncFrequency ?? '1',
        sync_rate: automation.syncRate ?? 'day',
        active: true,
      })
      .select()
      .single();

    if (error || !inserted) {
      console.error('[Automations] insert failed:', error?.message);
      toast.error('Failed to save automation. Please try again.');
      return;
    }

    // Reload from DB so local state matches exactly what's in Supabase
    await loadAutomations();
    setActiveTab('automations');
    toast.success('Automation created successfully!');

    if (walkthroughStep3Active) {
      completeStep(3);
    }
  };`;

c = c.slice(0, oldCreated) + newCreated + c.slice(oldCreatedEnd);

// 4. Fix handleDeleteAutomation to delete from Supabase
const oldDelete = c.indexOf('  const handleDeleteAutomation = (id: string) => {');
if (oldDelete > 0) {
  const oldDeleteEnd = c.indexOf('  };', oldDelete) + 4;
  const newDelete = `  const handleDeleteAutomation = async (id: string) => {
    await supabase.from('automations').delete().eq('id', id);
    setAutomations(prev => prev.filter(a => a.id !== id));
    toast.success('Automation deleted');
  };`;
  c = c.slice(0, oldDelete) + newDelete + c.slice(oldDeleteEnd);
  console.log('handleDeleteAutomation: patched');
}

// 5. Fix handleToggleActive to update Supabase
const oldToggle = c.indexOf('  const handleToggleActive = async (automationId: string) => {');
if (oldToggle > 0) {
  const oldToggleEnd = c.indexOf('  };', oldToggle) + 4;
  const oldToggleBlock = c.slice(oldToggle, oldToggleEnd);
  // Insert supabase update inside the existing toggle
  const newToggle = oldToggleBlock.replace(
    'setAutomations(prev =>',
    `await supabase.from('automations').update({ active: !automations.find(a => a.id === automationId)?.active }).eq('id', automationId);\n    setAutomations(prev =>`
  );
  c = c.slice(0, oldToggle) + newToggle + c.slice(oldToggleEnd);
  console.log('handleToggleActive: patched');
}

fs.writeFileSync(path, c);

// Verify
const verify = fs.readFileSync(path, 'utf8');
console.log('loadAutomations fn:', verify.includes('const loadAutomations = async'));
console.log('onAuthStateChange:', verify.includes('onAuthStateChange'));
console.log('supabase insert:', verify.includes('.insert({'));
console.log('supabase delete:', verify.includes("from('automations').delete()"));
