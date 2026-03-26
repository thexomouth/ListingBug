const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx';
let c = fs.readFileSync(path, 'utf8');

// Fix handleAutomationCreated - replace getSession with getUser
const fnStart = c.indexOf('handleAutomationCreated = async (automation: any) => {');
const snippet = c.slice(fnStart, fnStart + 300);
console.log('snippet:', snippet);

// Replace the getSession call in handleAutomationCreated
c = c.replace(
  `handleAutomationCreated = async (automation: any) => {\n    const { data: { session } } = await supabase.auth.getSession();\n    if (!session?.user?.id) {\n      toast.error('You must be signed in to create automations.');\n      return;\n    }`,
  `handleAutomationCreated = async (automation: any) => {\n    const { data: { user: currentUser } } = await supabase.auth.getUser();\n    if (!currentUser?.id) {\n      toast.error('You must be signed in to create automations.');\n      return;\n    }`
);

// Replace session.user.id with currentUser.id in the insert
c = c.replace(
  `        user_id: session.user.id,\n        name: automation.name,`,
  `        user_id: currentUser.id,\n        name: automation.name,`
);

fs.writeFileSync(path, c);
const v = fs.readFileSync(path, 'utf8');
// Count remaining getSession calls
const remaining = (v.match(/getSession/g) || []).length;
console.log('remaining getSession calls:', remaining);
console.log('handleAutomationCreated uses getUser:', v.slice(v.indexOf('handleAutomationCreated'), v.indexOf('handleAutomationCreated') + 300).includes('getUser'));
