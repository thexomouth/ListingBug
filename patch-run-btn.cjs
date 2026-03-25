const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/AutomationsManagementPage.tsx';
let c = fs.readFileSync(path, 'utf8');

const old = `                          <div class="inline-flex items-center justify-end gap-3">
                            <div onClick={(e) => { e.stopPropagation(); handleToggleAutomation(automation.id); }}`;

// Use regex to handle CRLF
c = c.replace(
  /<div className="inline-flex items-center justify-end gap-3">\r?\n\s+<div onClick=\{\(e\) => \{ e\.stopPropagation\(\); handleToggleAutomation\(automation\.id\); \}\}/,
  `<div className="inline-flex items-center justify-end gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRunNow(automation); }}
                              disabled={runNowLoading && runningAutomation?.id === automation.id}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#FFCE0A] hover:bg-[#FFCE0A]/10 dark:hover:bg-[#FFCE0A]/10 transition-colors disabled:opacity-50"
                              title="Run now"
                            >
                              {runNowLoading && runningAutomation?.id === automation.id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Play className="w-4 h-4" />}
                            </button>
                            <div onClick={(e) => { e.stopPropagation(); handleToggleAutomation(automation.id); }}`
);

// Make sure Play and Loader2 are imported
if (!c.includes('Loader2')) {
  c = c.replace(', Trash2 }', ', Trash2, Loader2 }');
}
if (!c.includes("'Play'") && !c.includes(', Play,') && !c.includes(', Play }')) {
  c = c.replace(', Loader2 }', ', Loader2, Play }');
}

fs.writeFileSync(path, c);
console.log('done');
