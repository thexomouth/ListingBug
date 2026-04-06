import { useRef, useState } from 'react';
import { Upload, AlertCircle, CheckCircle2, Copy, Download, Check } from 'lucide-react';

export interface ParsedContact {
  email: string;
  first_name: string;
  last_name?: string;
  role?: string;
  city?: string;
  phone?: string;
  company?: string;
  tags?: string;
  _error?: string;
}

interface CsvUploadZoneProps {
  onParsed: (contacts: ParsedContact[]) => void;
}

const TEMPLATE_CSV =
  'full_name,email,phone,company,city\n' +
  'Jane Smith,jane@kwrealty.com,512-555-0101,Keller Williams,Austin\n' +
  'John Doe,,214-555-0202,Coldwell Banker,Dallas\n' +
  'Maria Garcia,maria@remax.com,303-555-0303,RE/MAX,Denver\n' +
  'Alex Johnson,alex@compass.com,415-555-0404,Compass,San Francisco';

const COLUMNS: { name: string; badge: 'required' | 'either' | 'optional'; note: string }[] = [
  { name: 'full_name',   badge: 'required', note: 'First and last name combined' },
  { name: 'email',       badge: 'either',   note: 'Email address — required if no phone' },
  { name: 'phone',       badge: 'either',   note: 'Any format — required if no email' },
  { name: 'company',     badge: 'optional', note: 'Brokerage or company name' },
  { name: 'city',        badge: 'optional', note: 'City or market area' },
  { name: 'first_name',  badge: 'optional', note: 'Overrides split from full_name' },
  { name: 'last_name',   badge: 'optional', note: 'Overrides split from full_name' },
];

const BADGE_STYLES: Record<string, string> = {
  required: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
  either:   'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  optional: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
};

function parseCSV(text: string): ParsedContact[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h =>
    h.trim().toLowerCase().replace(/\s+/g, '_').replace(/^"(.*)"$/, '$1')
  );

  return lines.slice(1).map(line => {
    const values: string[] = [];
    let inQuotes = false;
    let current = '';
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (values[i] ?? '').replace(/^"(.*)"$/, '$1').trim(); });

    // Resolve name: explicit first_name wins, otherwise split full_name
    const fullName = row['full_name'] ?? row['name'] ?? '';
    const nameParts = fullName.split(' ');
    const first_name = row['first_name'] || row['firstname'] || nameParts[0] || '';
    const last_name  = row['last_name']  || row['lastname']  || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined);

    const email = (row['email'] ?? '').toLowerCase().trim();
    const phone = row['phone'] ?? row['phone_number'] ?? row['mobile'] ?? undefined;

    const contact: ParsedContact = {
      email,
      first_name,
      last_name: last_name || undefined,
      role:    row['role']    || undefined,
      city:    row['city']    || undefined,
      phone:   phone          || undefined,
      company: row['company'] || row['brokerage'] || undefined,
      tags:    row['tags']    || undefined,
    };

    const errors: string[] = [];
    if (!first_name) errors.push('missing name');
    if (!email && !contact.phone) errors.push('email or phone required');
    if (email && !email.includes('@')) errors.push('invalid email');

    if (errors.length > 0) contact._error = errors.join('; ');
    return contact;
  });
}

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'listingbug_contacts_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function CsvUploadZone({ onParsed }: CsvUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<ParsedContact[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [copied, setCopied] = useState(false);

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target?.result as string);
      setPreview(parsed);
      onParsed(parsed);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) handleFile(file);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(TEMPLATE_CSV).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const validContacts   = preview?.filter(c => !c._error) ?? [];
  const errorContacts   = preview?.filter(c => c._error)  ?? [];

  return (
    <div className="space-y-4">
      {/* Two-column layout: drop zone + format guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[180px] ${
            dragging
              ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10'
              : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={28} className={`mb-3 ${dragging ? 'text-yellow-500' : 'text-zinc-400'}`} />
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {fileName ? fileName : 'Drop a CSV here or click to browse'}
          </p>
          <p className="text-xs text-zinc-400 mt-1.5">
            Requires <span className="font-semibold text-zinc-500 dark:text-zinc-300">full_name</span> + <span className="font-semibold text-zinc-500 dark:text-zinc-300">email</span> or <span className="font-semibold text-zinc-500 dark:text-zinc-300">phone</span>
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        {/* Format guide */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
            <div>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 uppercase tracking-wide">Expected format</p>
              <p className="text-xs text-zinc-400 mt-0.5">Use these column headers exactly</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                title="Copy template as CSV text"
              >
                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                title="Download as .csv file"
              >
                <Download size={12} />
                Template
              </button>
            </div>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {COLUMNS.map(col => (
              <div key={col.name} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-xs text-zinc-800 dark:text-zinc-100 shrink-0">{col.name}</span>
                  <span className="text-xs text-zinc-400 truncate hidden sm:block">{col.note}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ml-2 uppercase tracking-wide ${BADGE_STYLES[col.badge]}`}>
                  {col.badge === 'either' ? 'email or phone' : col.badge}
                </span>
              </div>
            ))}
          </div>

          {/* Mini example */}
          <div className="border-t border-zinc-200 dark:border-zinc-700 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/60">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">Example row</p>
            <p className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed break-all">
              Jane Smith, jane@kw.com, 512-555-0101, Keller Williams, Austin
            </p>
          </div>
        </div>
      </div>

      {/* Parse results */}
      {preview && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <CheckCircle2 size={14} />
                {validContacts.length} valid
              </span>
              {errorContacts.length > 0 && (
                <span className="flex items-center gap-1.5 text-red-500">
                  <AlertCircle size={14} />
                  {errorContacts.length} with errors
                </span>
              )}
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-800 sticky top-0">
                <tr>
                  {['name', 'email', 'phone', 'company', 'city', 'status'].map(h => (
                    <th key={h} className="px-2 py-1.5 text-left text-zinc-500 dark:text-zinc-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 50).map((c, i) => (
                  <tr
                    key={i}
                    className={`border-t border-zinc-100 dark:border-zinc-800 ${c._error ? 'bg-red-50 dark:bg-red-900/10' : ''}`}
                  >
                    <td className="px-2 py-1">{[c.first_name, c.last_name].filter(Boolean).join(' ') || '—'}</td>
                    <td className="px-2 py-1 font-mono">{c.email || '—'}</td>
                    <td className="px-2 py-1">{c.phone ?? '—'}</td>
                    <td className="px-2 py-1">{c.company ?? '—'}</td>
                    <td className="px-2 py-1">{c.city ?? '—'}</td>
                    <td className="px-2 py-1">
                      {c._error
                        ? <span className="text-red-500">{c._error}</span>
                        : <span className="text-green-600 dark:text-green-400">OK</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 50 && (
              <p className="px-2 py-1 text-zinc-400 border-t border-zinc-100 dark:border-zinc-800">
                …and {preview.length - 50} more rows
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
