const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/components/AutomationsManagementPage.tsx');
let c = fs.readFileSync(filePath, 'utf8');

// Check if useCallback is imported
const hasUseCallback = c.includes('useCallback');
if (!hasUseCallback) {
  c = c.replace("import { useState, useEffect", "import { useState, useEffect, useCallback");
  console.log('Added useCallback import');
}

// Fix handleAutomationCreated - make async and add Supabase persist
c = c.replace(
  "  const handleAutomationCreated = (automation: any) => {\n    const newAutomation: any = {",
  `  const handleAutomationCreated = async (automation: any) => {
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
      console.error('Failed to persist automation to Supabase:', err);
    }
    const newAutomation: any = {`
);
console.log('handleAutomationCreated: patched');

// Add standalone loadRunHistory as useCallback above the useEffect that defines it
// First check if it already exists as standalone
if (!c.includes('const loadRunHistory = useCallback')) {
  const hookLine = "  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>([]);";
  const replacement = `  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>([]);

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
    setRunHistory(data.map((run) => ({
      id: run.id,
      automationName: run.automation_name || 'Unknown',
      runDate: run.run_date || new Date().toISOString(),
      status: run.status || 'failed',
      listingsFound: run.listings_found || 0,
      listingsSent: run.listings_sent || 0,
      destination: run.destination || '',
      details: run.details || '',
    })));
  }, []);`;
  c = c.replace(hookLine, replacement);
  console.log('loadRunHistory useCallback: added');
}

fs.writeFileSync(filePath, c);
console.log('Done.');
