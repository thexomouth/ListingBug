const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx';
let c = fs.readFileSync(path, 'utf8');

const start = c.indexOf('handleDeleteAutomation = (id: string) => {');
const end = c.indexOf('};', start) + 2;
console.log('found at', start, 'to', end);
console.log('snippet:', JSON.stringify(c.slice(start, start+100)));

const newFn = `handleDeleteAutomation = async (id: string) => {
    await supabase.from('automations').delete().eq('id', id);
    setAutomations(prev => prev.filter(a => a.id !== id));
    toast.success('Automation deleted');
  };`;

fs.writeFileSync(path, c.slice(0, start) + newFn + c.slice(end));
const v = fs.readFileSync(path, 'utf8');
console.log('delete patched:', v.includes("from('automations').delete()"));
