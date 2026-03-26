const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx';
let c = fs.readFileSync(path, 'utf8');

// Find the exact spot after insert succeeds
const marker = c.indexOf("// Reload from DB so local state matches exactly what's in Supabase\n    await loadAutomations();");
if (marker < 0) { console.log('marker not found'); process.exit(1); }
const end = c.indexOf("toast.success('Automation created successfully!');", marker) + "toast.success('Automation created successfully!');".length;

console.log('found at', marker, '-', end);

const oldBlock = c.slice(marker, end);
console.log('old:', JSON.stringify(oldBlock.slice(0, 100)));

// Replace: immediately add to state from the inserted row, THEN also call loadAutomations in background
const newBlock = `// Immediately add to local state so UI updates without waiting for DB round-trip
    const newAutomation: any = {
      id: inserted.id,
      name: inserted.name,
      searchName: inserted.search_name ?? '',
      schedule: [inserted.schedule, inserted.schedule_time ? \`at \${inserted.schedule_time}\` : ''].filter(Boolean).join(' '),
      destination: {
        type: inserted.destination_type,
        label: inserted.destination_label ?? inserted.destination_type,
        config: inserted.destination_config ?? {}
      },
      searchCriteria: inserted.search_criteria ?? {},
      active: inserted.active ?? true,
      status: 'idle',
      lastRun: undefined,
      nextRun: 'Pending first run',
    };
    setAutomations(prev => [newAutomation, ...prev]);
    setActiveTab('automations');
    // Also sync from DB in background to ensure consistency
    loadAutomations();
    toast.success('Automation created successfully!');`;

c = c.slice(0, marker) + newBlock + c.slice(end);
fs.writeFileSync(path, c);
const v = fs.readFileSync(path, 'utf8');
console.log('setAutomations immediate:', v.includes('setAutomations(prev => [newAutomation'));
console.log('setActiveTab before toast:', v.includes("setActiveTab('automations');\n    // Also sync"));
