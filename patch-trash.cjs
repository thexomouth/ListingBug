const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/components/AutomationsManagementPage.tsx');
let c = fs.readFileSync(filePath, 'utf8');

// 1. Add Trash2 to lucide imports if not present
if (!c.includes('Trash2')) {
  c = c.replace('} from \'lucide-react\';', ', Trash2 } from \'lucide-react\';');
  console.log('Added Trash2 import');
}

// 2. Replace the Active column cell to include trash button
const oldCell = `                        <LBTableCell className="text-right">
                          <div onClick={(e) => { e.stopPropagation(); handleToggleAutomation(automation.id); }}
                            className="inline-flex items-center justify-end gap-2 cursor-pointer select-none">
                            <div className={\`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out \${automation.active ? 'bg-[#FFD447]' : 'bg-gray-200 dark:bg-gray-700'}\`}>
                              <span className={\`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out \${automation.active ? 'translate-x-5' : 'translate-x-0'}\`} />
                            </div>
                          </div>
                        </LBTableCell>`;

const newCell = `                        <LBTableCell className="text-right">
                          <div className="inline-flex items-center justify-end gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteAutomation(automation.id); }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Delete automation"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div onClick={(e) => { e.stopPropagation(); handleToggleAutomation(automation.id); }}
                              className="inline-flex items-center cursor-pointer select-none">
                              <div className={\`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out \${automation.active ? 'bg-[#FFD447]' : 'bg-gray-200 dark:bg-gray-700'}\`}>
                                <span className={\`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out \${automation.active ? 'translate-x-5' : 'translate-x-0'}\`} />
                              </div>
                            </div>
                          </div>
                        </LBTableCell>`;

if (c.includes(oldCell)) {
  c = c.replace(oldCell, newCell);
  console.log('Trash button added to table row');
} else {
  console.log('Pattern not found exactly - check whitespace');
}

fs.writeFileSync(filePath, c);
console.log('Done.');
