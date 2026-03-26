const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx';
let c = fs.readFileSync(path, 'utf8');

// Add logging before every critical point in loadAutomations
c = c.replace(
  "// Load automations from Supabase — works on any device\n  const loadAutomations = async () => {\n    const { data: { session } } = await supabase.auth.getSession();\n    if (!session?.user?.id) { setAutomationsLoading(false); return; }",
  "// Load automations from Supabase — works on any device\n  const loadAutomations = async () => {\n    const { data: { session } } = await supabase.auth.getSession();\n    if (!session?.user?.id) {\n      console.warn('[loadAutomations] no session, skipping');\n      setAutomationsLoading(false);\n      return;\n    }\n    console.log('[loadAutomations] fetching for user', session.user.id);"
);

c = c.replace(
  "    // Only update if we got real data back — never wipe existing state with empty array\n    if (data !== null) {\n      setAutomations(mapped);\n    }\n    setAutomationsLoading(false);",
  "    // Only update if we got real data back — never wipe existing state with empty array\n    if (data !== null) {\n      console.log('[loadAutomations] setting', mapped.length, 'automations');\n      setAutomations(mapped);\n    } else {\n      console.warn('[loadAutomations] data was null, keeping existing state');\n    }\n    setAutomationsLoading(false);"
);

fs.writeFileSync(path, c);
console.log('logging added');
