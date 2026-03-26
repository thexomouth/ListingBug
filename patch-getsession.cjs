const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx';
let c = fs.readFileSync(path, 'utf8');

// Find and replace getUser() with getSession() inside loadAutomations
const idx = c.indexOf('const { data: { user: currentUser } } = await supabase.auth.getUser()');
if (idx < 0) { console.log('NOT FOUND - checking alternatives'); console.log('getUser:', c.includes('getUser')); process.exit(1); }

// Find end of the user check block - up to the .eq('user_id', currentUser.id) line
const eqIdx = c.indexOf(".eq('user_id', currentUser.id)", idx);
const eqEnd = eqIdx + ".eq('user_id', currentUser.id)".length;

const oldBlock = c.slice(idx, eqEnd);
console.log('replacing:', oldBlock.slice(0, 80));

const newBlock = `const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.warn('[loadAutomations] no session, skipping');
      setAutomationsLoading(false);
      return;
    }
    const userId = session.user.id;
    console.log('[loadAutomations] fetching for user', userId);
    const { data, error } = await supabase
      .from('automations')
      .select('id,name,search_name,destination_type,destination_label,destination_config,search_criteria,schedule,schedule_time,sync_frequency,sync_rate,active,last_run_at,next_run_at,created_at')
      .eq('user_id', userId)`;

c = c.slice(0, idx) + newBlock + c.slice(eqEnd);
fs.writeFileSync(path, c);

const v = fs.readFileSync(path, 'utf8');
console.log('getSession in loadAutomations:', v.includes("data: { session } } = await supabase.auth.getSession()"));
console.log('getUser removed:', !v.includes('currentUser'));
