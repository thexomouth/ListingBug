const fs = require('fs');

const replacement = `
            {/* Field Mapping */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500">
                Field mappings will be configured per integration at implementation time.
              </p>
            </div>`;

function fixFile(path, endMarker) {
  let c = fs.readFileSync(path, 'utf8');
  const lines = c.split('\n');
  
  let startLine = -1, endLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('{/* Field Mapping */}') && startLine === -1) startLine = i;
    if (startLine !== -1 && lines[i].includes(endMarker) && endLine === -1) { endLine = i; break; }
  }
  
  if (startLine === -1 || endLine === -1) {
    console.log(path + ': not found', startLine, endLine);
    return;
  }
  
  const out = [...lines.slice(0, startLine), ...replacement.split('\n'), '', ...lines.slice(endLine)];
  fs.writeFileSync(path, out.join('\n'));
  console.log(path + ': replaced lines', startLine, 'to', endLine);
}

fixFile('src/components/AccountIntegrationsTab.tsx', '{/* Integration-Specific Settings */}');
fixFile('src/components/IntegrationsPage.tsx', '{/* Integration-Specific Settings */}');
