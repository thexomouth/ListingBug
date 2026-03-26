const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx';
let c = fs.readFileSync(path, 'utf8');

// Replace getSession with getUser in loadAutomations
// getSession reads from localStorage (can be stale/expired)
// getUser validates against Supabase auth server (always fresh)
const oldAuth = `    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.warn('[loadAutomations] no session, skipping');
      setAutomationsLoading(false);
      return;
    }
    console.log('[loadAutomations] fetching for user', session.user.id);`;

const newAuth = `    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser?.id) {
      console.warn('[loadAutomations] no authenticated user, skipping');
      setAutomationsLoading(false);
      return;
    }
    console.log('[loadAutomations] fetching for user', currentUser.id);`;

// Also need to replace session.user.id with currentUser.id in the query
const oldQuery = `.eq('user_id', session.user.id)`;
const newQuery = `.eq('user_id', currentUser.id)`;

if (c.includes(oldAuth)) {
  c = c.replace(oldAuth, newAuth);
  console.log('auth: replaced getSession with getUser');
} else {
  console.log('auth marker not found, trying partial...');
  // Try just replacing the session reference
  c = c.replace(
    "const { data: { session } } = await supabase.auth.getSession();\n    if (!currentUser?.id)",
    "const { data: { user: currentUser } } = await supabase.auth.getUser();\n    if (!currentUser?.id)"
  );
}

c = c.replace(oldQuery, newQuery);

fs.writeFileSync(path, c);
const v = fs.readFileSync(path, 'utf8');
console.log('getUser used:', v.includes('supabase.auth.getUser()'));
console.log('getSession removed from loadAutomations:', !v.slice(v.indexOf('const loadAutomations'), v.indexOf('const loadAutomations') + 500).includes('getSession'));
console.log('currentUser.id in query:', v.includes('.eq(\'user_id\', currentUser.id)'));
