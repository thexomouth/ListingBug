const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/AutomationsManagementPage.tsx');
let c = fs.readFileSync(filePath, 'utf8');

// 1. Replace fake handleRunNow with real edge function call
const oldFn = `  const handleRunNow = async (automation: Automation) => {
    setRunNowLoading(true);
    setRunningAutomation(automation);
    toast.success(\`Running "\${automation.name}"...\`);
    setTimeout(async () => {
      const listingsSent = Math.floor(Math.random() * 15) + 1;
      toast.success(\`Automation completed - \${listingsSent} listings delivered\`);
      setRunNowLoading(false);
      setRunningAutomation(null);

      // Create notification for automation run
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await createNotification({
          userId: user.id,
          type: 'success',
          title: 'Automation Run Complete',
          message: \`"\${automation.name}" completed successfully - \${listingsSent} listings sent to \${automation.destination.label}\`,
        });
      }
    }, 2000);
  };`;

const newFn = `  const handleRunNow = async (automation: Automation) => {
    setRunNowLoading(true);
    setRunningAutomation(automation);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(\`\${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-automation\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${session.access_token}\`
        },
        body: JSON.stringify({ automation })
      });

      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || 'Run failed');

      toast.success(\`"\${automation.name}" complete — \${result.listings_found} listings found\`);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await createNotification({
          userId: user.id,
          type: 'success',
          title: 'Automation Run Complete',
          message: \`"\${automation.name}" found \${result.listings_found} listings for \${automation.destination?.label ?? 'destination'}\`,
        });
      }

      loadRunHistory();

    } catch (err) {
      toast.error(\`Run failed: \${err.message}\`);
    } finally {
      setRunNowLoading(false);
      setRunningAutomation(null);
    }
  };`;

if (c.includes('Math.floor(Math.random() * 15) + 1')) {
  c = c.replace(oldFn, newFn);
  console.log('handleRunNow: replaced with real edge function call');
} else {
  console.log('handleRunNow: pattern not matched exactly, doing targeted replace');
  c = c.replace(
    /const handleRunNow = async \(automation: Automation\) => \{[\s\S]*?setRunNowLoading\(true\);[\s\S]*?setTimeout[\s\S]*?\}, 2000\);\s*\};/,
    newFn.trim()
  );
  console.log('handleRunNow: regex replace done');
}

// 2. Add Supabase persist to handleAutomationCreated
const oldCreate = `  const handleAutomationCreated = (automation: any) => {
    const newAutomation: any = {`;

const newCreate = `  const handleAutomationCreated = async (automation: any) => {
    // Persist to Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('automations').insert({
          id: automation.id,
          user_id: user.id,
          name: automation.name,
          search_name: automation.searchName ?? '',
          search_criteria: automation.searchCriteria ?? {},
          schedule: automation.schedule ?? 'daily',
          schedule_time: automation.scheduleTime ?? '08:00',
          sync_frequency: String(automation.syncFrequency ?? '1'),
          sync_rate: automation.syncRate ?? 'day',
          destination_type: automation.destination?.type ?? '',
          destination_label: automation.destination?.label ?? '',
          destination_config: automation.destination?.config ?? {},
          active: true
        });
      }
    } catch (err) {
      console.error('Failed to persist automation:', err);
    }

    const newAutomation: any = {`;

if (c.includes(oldCreate)) {
  c = c.replace(oldCreate, newCreate);
  console.log('handleAutomationCreated: Supabase persist added');
} else {
  console.log('handleAutomationCreated: pattern not found');
}

// 3. Make loadRunHistory accessible outside useEffect (hoist it)
// It's already defined inside a useEffect - need to extract it
// Check if loadRunHistory is called from handleRunNow scope (it will be after our change)
// We need to hoist it to component level
const oldLoadEffect = `  useEffect(() => {
    const loadRunHistory = async () => {`;

const newLoadEffect = `  const loadRunHistory = useCallback(async () => {`;

if (c.includes(oldLoadEffect)) {
  // More complex refactor - just add a separate callable version
  console.log('loadRunHistory: found in useEffect, adding standalone version');
  
  const hookLine = "  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>([]);";
  const addAfterHook = `  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>([]);

  const loadRunHistory = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) { setRunHistory([]); return; }
    const { data, error } = await supabase
      .from('automation_runs')
      .select('id,automation_name:automation_name,run_date,status,listings_found,listings_sent,destination,details')
      .eq('user_id', userId)
      .order('run_date', { ascending: false })
      .limit(20);
    if (error || !data || data.length === 0) { setRunHistory([]); return; }
    setRunHistory(data.map((run: any) => ({
      id: run.id,
      automationName: run.automation_name || 'Unknown automation',
      runDate: run.run_date || new Date().toISOString(),
      status: run.status || 'failed',
      listingsFound: run.listings_found || 0,
      listingsSent: run.listings_sent || 0,
      destination: run.destination || '',
      details: run.details || '',
    })));
  }, []);`;
  
  c = c.replace(hookLine, addAfterHook);
  console.log('loadRunHistory: standalone useCallback added');
}

fs.writeFileSync(filePath, c);
console.log('Done. File written.');
