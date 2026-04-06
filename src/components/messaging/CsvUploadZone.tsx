import { useRef, useState } from 'react';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

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

const VALID_ROLES = new Set(['Buyer', 'Seller', 'Agent', 'Broker', 'Investor', 'Landlord']);

function parseCSV(text: string): ParsedContact[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));

  return lines.slice(1).map(line => {
    // Simple CSV split (handles basic quoted fields)
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
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });

    const contact: ParsedContact = {
      email: row['email'] ?? '',
      first_name: row['first_name'] ?? row['firstname'] ?? '',
      last_name: row['last_name'] ?? row['lastname'] ?? undefined,
      role: row['role'] ?? undefined,
      city: row['city'] ?? undefined,
      phone: row['phone'] ?? undefined,
      company: row['company'] ?? undefined,
      tags: row['tags'] ?? undefined,
    };

    const errors: string[] = [];
    if (!contact.email.includes('@')) errors.push('invalid email');
    if (!contact.first_name) errors.push('missing first_name');
    if (contact.role && !VALID_ROLES.has(contact.role)) errors.push(`unknown role "${contact.role}"`);

    if (errors.length > 0) contact._error = errors.join('; ');
    return contact;
  });
}

export function CsvUploadZone({ onParsed }: CsvUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<ParsedContact[] | null>(null);
  const [fileName, setFileName] = useState('');

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setPreview(parsed);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) handleFile(file);
  };

  const validContacts = preview?.filter(c => !c._error) ?? [];
  const errorContacts = preview?.filter(c => c._error) ?? [];

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10'
            : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={24} className="mx-auto mb-2 text-zinc-400" />
        <p className="text-sm text-zinc-600 dark:text-zinc-300 font-medium">
          {fileName ? fileName : 'Drop a CSV here or click to browse'}
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          Required columns: <span className="font-mono">email</span>, <span className="font-mono">first_name</span>
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {preview && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle2 size={14} />
                {validContacts.length} valid
              </span>
              {errorContacts.length > 0 && (
                <span className="flex items-center gap-1 text-red-500">
                  <AlertCircle size={14} />
                  {errorContacts.length} with errors
                </span>
              )}
            </div>
            <button
              onClick={() => onParsed(preview)}
              disabled={validContacts.length === 0}
              className="px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-zinc-900 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Confirm import
            </button>
          </div>

          {/* Preview table */}
          <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-800 sticky top-0">
                <tr>
                  {['email', 'first_name', 'city', 'role', 'status'].map(h => (
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
                    <td className="px-2 py-1">{c.email}</td>
                    <td className="px-2 py-1">{c.first_name}</td>
                    <td className="px-2 py-1">{c.city ?? '—'}</td>
                    <td className="px-2 py-1">{c.role ?? '—'}</td>
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
