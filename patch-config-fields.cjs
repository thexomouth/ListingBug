const fs = require('fs');
const path = 'C:/Users/User/Downloads/ListingBug FIGMA MVP/src/components/CreateAutomationModal.tsx';
let c = fs.readFileSync(path, 'utf8');

const oldBlock = `                {/* Configuration Fields */}
                {selectedIntegration?.requiresSetup && selectedIntegration.setupFields && (
                  <div className="space-y-3 pt-4 border-t border-gray-300">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      Configure {selectedIntegration.name}
                      <span className="text-xs font-normal text-gray-600">
                        (API Endpoint: POST /api/integrations/{selectedIntegration.id}/configure)
                      </span>
                    </h4>
                    {selectedIntegration.setupFields.map((field) => (
                      <LBInput
                        key={field.key}
                        label={\`\${field.label} (Field: destination_config.\${field.key})\`}
                        type={field.type || 'text'}
                        value={destinationConfig[field.key] || ''}
                        onChange={(e) => setDestinationConfig({
                          ...destinationConfig,
                          [field.key]: e.target.value
                        })}
                        placeholder={field.placeholder}
                        required
                      />
                    ))}
                  </div>
                )}`;

const newBlock = `                {/* Configuration Fields */}
                {selectedIntegration?.requiresSetup && selectedIntegration.setupFields && (
                  <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-white/10">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                      Configure {selectedIntegration.name}
                    </h4>
                    {selectedIntegration.setupFields.map((field: any) => (
                      <div key={field.key} className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {field.label}
                          {field.required !== false && <span className="text-red-500 ml-0.5">*</span>}
                        </label>
                        {field.type === 'select' ? (
                          <select
                            className="w-full border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#2F2F2F] text-gray-900 dark:text-white"
                            value={destinationConfig[field.key] || (field.options?.[0]?.value ?? '')}
                            onChange={(e) => setDestinationConfig({ ...destinationConfig, [field.key]: e.target.value })}
                          >
                            {(field.options ?? []).map((opt: any) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type === 'password' ? 'password' : field.type === 'url' ? 'url' : 'text'}
                            className="w-full border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#2F2F2F] text-gray-900 dark:text-white placeholder-gray-400"
                            placeholder={field.placeholder}
                            value={destinationConfig[field.key] || ''}
                            onChange={(e) => setDestinationConfig({ ...destinationConfig, [field.key]: e.target.value })}
                          />
                        )}
                        {field.hint && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{field.hint}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}`;

const idx = c.indexOf('                {/* Configuration Fields */}');
if (idx < 0) { console.log('NOT FOUND'); process.exit(1); }

// Find the end of this block
const endMarker = '                )}';
const endIdx = c.indexOf(endMarker, idx + 200) + endMarker.length;

console.log('found at', idx, 'to', endIdx);
c = c.slice(0, idx) + newBlock + c.slice(endIdx);

fs.writeFileSync(path, c);
const v = fs.readFileSync(path, 'utf8');
console.log('select renderer:', v.includes("field.type === 'select'"));
console.log('hint renderer:', v.includes('field.hint'));
console.log('debug label gone:', !v.includes('API Endpoint: POST /api/integrations'));
