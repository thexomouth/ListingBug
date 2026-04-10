import { useState, useRef } from 'react';
import { Upload, Download, X, CheckCircle, AlertTriangle, XCircle, Loader2, ChevronDown, ChevronRight } from 'lucide-react';

const SUPABASE_FUNCTIONS = 'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1';
const PASSWORD = 'spitonthatthang';
const SESSION_KEY = 'lb_clean_auth';
const BATCH_SIZE = 1000;

const CONSUMER_DOMAINS = new Set([
  'gmail.com','googlemail.com',
  'yahoo.com','yahoo.co.uk','yahoo.ca','yahoo.com.au','ymail.com',
  'hotmail.com','hotmail.co.uk','hotmail.fr','hotmail.es','hotmail.it',
  'outlook.com','outlook.co.uk','outlook.fr','outlook.es',
  'icloud.com','me.com','mac.com',
  'aol.com','aol.co.uk',
  'protonmail.com','proton.me',
  'live.com','live.co.uk','live.fr','live.com.au',
  'msn.com','comcast.net','att.net','verizon.net',
  'sbcglobal.net','bellsouth.net','cox.net','charter.net',
  'earthlink.net','roadrunner.com','optonline.net',
]);

const BLOCKED_DOMAINS = new Set([
  'compass.com','remax.net','remax.com','kw.com','kwrealty.com',
  'coldwellbanker.com','sothebysrealty.com','cbre.com','jll.com',
  'reafco.com','mlsgrid.com','guestcardlead.com','firstcash.com',
  'lhmtg.com','cmgfi.com','dilussorealestate.com','mcconnellgroup.com',
  'thedesignquad.com','boardroompr.com','abm.com',
]);

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','tempmail.com','throwam.com',
  'sharklasers.com','guerrillamailblock.com','grr.la','guerrillamail.info',
  'spam4.me','trashmail.com','trashmail.me','trashmail.net',
  'yopmail.com','yopmail.fr','dispostable.com','mailnull.com',
  'spamgourmet.com','maildrop.cc','getairmail.com','fakeinbox.com',
  'mailnesia.com','discard.email','spamthisplease.com',
]);

const ROLE_PREFIXES = new Set([
  'info','contact','admin','support','help','hello','noreply','no-reply',
  'sales','office','mail','team','enquiries','enquiry','feedback',
  'webmaster','postmaster','marketing','press','media','accounts',
  'billing','hr','jobs','careers','legal','privacy','security',
  'service','services','customerservice','reception','general',
  'news','newsletter','notifications','donotreply','do-not-reply',
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RiskReason = 'clean' | 'consumer' | 'disposable' | 'blocked_domain' | 'role_based' | 'invalid_syntax' | 'no_email' | 'no_mx' | 'duplicate';

const RISK_LABELS: Record<RiskReason, string> = {
  clean: 'Clean', consumer: 'Consumer', disposable: 'Disposable',
  blocked_domain: 'Blocked', role_based: 'Role-based',
  invalid_syntax: 'Invalid', no_email: 'No Email', no_mx: 'No MX', duplicate: 'Duplicate',
};

const RISK_COLORS: Record<RiskReason, string> = {
  clean:          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  consumer:       'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  role_based:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  disposable:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  blocked_domain: 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300',
  invalid_syntax: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  no_email:       'bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400',
  no_mx:          'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  duplicate:      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

interface ProcessedRow {
  original: Record<string, string>;
  email: string;
  domain: string;
  risk: RiskReason;
}

interface FileResult {
  filename: string;
  headers: string[];
  batches: ProcessedRow[][];   // clean rows split into ≤1000 chunks
  risky: ProcessedRow[];
  counts: Record<RiskReason, number>;
  topDomains: { domain: string; count: number }[];
}

// ── CSV helpers ──────────────────────────────────────────────────────────────

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let inQuotes = false, current = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
      else current += ch;
    }
    result.push(current);
    return result;
  };
  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map(line => {
    const vals = parseRow(line);
    return Object.fromEntries(headers.map((h, i) => [h, (vals[i] ?? '').trim()]));
  });
  return { headers, rows };
}

function downloadCSV(rows: Record<string, string>[], headers: string[], filename: string) {
  const escape = (v: string) =>
    v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"` : v;
  const lines = [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h] ?? '')).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Classification ───────────────────────────────────────────────────────────

function classifyLocal(email: string): RiskReason | null {
  if (!email) return 'no_email';
  if (!EMAIL_RE.test(email)) return 'invalid_syntax';
  const [prefix, domain] = email.split('@');
  const d = domain.toLowerCase();
  const p = prefix.toLowerCase().replace(/[._+-].*$/, ''); // strip suffix variants
  if (DISPOSABLE_DOMAINS.has(d)) return 'disposable';
  if (BLOCKED_DOMAINS.has(d)) return 'blocked_domain';
  if (CONSUMER_DOMAINS.has(d)) return 'consumer';
  if (ROLE_PREFIXES.has(p)) return 'role_based';
  return null; // needs MX check
}

function topDomains(rows: ProcessedRow[]): { domain: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.domain] = (counts[r.domain] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([domain, count]) => ({ domain, count }));
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ── Password gate ────────────────────────────────────────────────────────────

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const attempt = () => {
    if (value === PASSWORD) { sessionStorage.setItem(SESSION_KEY, '1'); onUnlock(); }
    else { setError(true); setValue(''); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-5">
        <div className="text-center">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">List Cleaner</p>
          <p className="text-sm text-zinc-400 mt-1">Enter password to continue</p>
        </div>
        <input
          type="password" value={value} autoFocus placeholder="Password"
          onChange={e => { setValue(e.target.value); setError(false); }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${error ? 'border-red-400' : 'border-zinc-200 dark:border-zinc-700'}`}
        />
        {error && <p className="text-xs text-red-500">Incorrect password.</p>}
        <button onClick={attempt} className="w-full py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold text-sm transition-colors">
          Enter
        </button>
      </div>
    </div>
  );
}

// ── Risk badge ───────────────────────────────────────────────────────────────

function RiskBadge({ risk }: { risk: RiskReason }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${RISK_COLORS[risk]}`}>
      {RISK_LABELS[risk]}
    </span>
  );
}

// ── File result row ──────────────────────────────────────────────────────────

function FileResultRow({ result }: { result: FileResult }) {
  const [expanded, setExpanded] = useState(false);
  const cleanCount = result.batches.reduce((s, b) => s + b.length, 0);
  const total = cleanCount + result.risky.length;
  const base = result.filename.replace(/\.csv$/i, '');

  const riskyReasons = (['consumer','role_based','no_mx','duplicate','invalid_syntax','disposable','blocked_domain','no_email'] as RiskReason[])
    .filter(r => (result.counts[r] ?? 0) > 0);

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 flex-wrap">
        <button onClick={() => setExpanded(e => !e)} className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{result.filename}</p>
          <p className="text-xs text-zinc-400">
            {total.toLocaleString()} rows · <span className="text-green-600 dark:text-green-400">{cleanCount.toLocaleString()} clean</span>
            {' · '}<span className="text-red-500">{result.risky.length.toLocaleString()} risky</span>
            {result.batches.length > 1 && <span className="text-zinc-400"> · {result.batches.length} batches</span>}
          </p>
        </div>

        {/* Download buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {result.batches.map((batch, i) => (
            <button
              key={i}
              onClick={() => downloadCSV(batch.map(r => r.original), result.headers,
                result.batches.length > 1 ? `cleaned_${base}_batch${i + 1}.csv` : `cleaned_${base}.csv`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold text-xs transition-colors"
            >
              <Download size={13} />
              {result.batches.length > 1 ? `Batch ${i + 1} (${batch.length.toLocaleString()})` : `Clean (${batch.length.toLocaleString()})`}
            </button>
          ))}
          {result.risky.length > 0 && (
            <button
              onClick={() => downloadCSV(
                result.risky.map(r => ({ ...r.original, risk_reason: r.risk })),
                [...result.headers, 'risk_reason'],
                `risky_${base}.csv`
              )}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors"
            >
              <Download size={13} />
              Risky ({result.risky.length.toLocaleString()})
            </button>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-4 space-y-4">
          {/* Risk breakdown */}
          {riskyReasons.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Risky breakdown</p>
              <div className="flex flex-wrap gap-2">
                {riskyReasons.map(r => (
                  <div key={r} className="flex items-center gap-1.5">
                    <RiskBadge risk={r} />
                    <span className="text-xs text-zinc-500">{result.counts[r]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top domains */}
          {result.topDomains.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Top clean domains</p>
              <div className="flex flex-wrap gap-2">
                {result.topDomains.map(({ domain, count }) => (
                  <span key={domain} className="px-2 py-0.5 rounded-full text-xs bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    {domain} <span className="font-semibold">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preview — first 8 clean rows */}
          {result.batches[0]?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Preview (first 8 clean)</p>
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-zinc-100 dark:bg-zinc-800">
                    <tr>
                      {['email','business_name','city','state','category'].filter(h => result.headers.includes(h)).map(h => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-zinc-500 dark:text-zinc-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {result.batches[0].slice(0, 8).map((row, i) => (
                      <tr key={i} className="bg-white dark:bg-zinc-900">
                        {['email','business_name','city','state','category'].filter(h => result.headers.includes(h)).map(h => (
                          <td key={h} className="px-3 py-1.5 text-zinc-700 dark:text-zinc-300 max-w-[200px] truncate">{row.original[h] ?? ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main tool ────────────────────────────────────────────────────────────────

export function CleanPageInner() {
  const [results, setResults] = useState<FileResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Global seen set for cross-file deduplication
  const globalSeen = useRef<Set<string>>(new Set());

  const reset = () => {
    setResults([]);
    globalSeen.current = new Set();
  };

  const processFiles = async (files: File[]) => {
    const csvFiles = files.filter(f => f.name.endsWith('.csv'));
    if (csvFiles.length === 0) return;

    setProcessing(true);

    for (let fi = 0; fi < csvFiles.length; fi++) {
      const file = csvFiles[fi];
      setProgressMsg(`Processing ${file.name} (${fi + 1}/${csvFiles.length})…`);

      const text = await file.text();
      const { headers, rows } = parseCSV(text);

      if (!headers.includes('email')) {
        alert(`"${file.name}" has no email column — skipped.`);
        continue;
      }

      // Step 1 — local classification
      const processed: ProcessedRow[] = rows.map(row => {
        const email = (row['email'] ?? '').trim().toLowerCase();
        const domain = email.includes('@') ? email.split('@')[1] : '';
        const local = classifyLocal(email);
        return { original: row, email, domain, risk: local ?? 'clean' };
      });

      // Step 2 — cross-file deduplication (only on locally-clean rows)
      for (const row of processed) {
        if (row.risk === 'clean') {
          if (globalSeen.current.has(row.email)) {
            row.risk = 'duplicate';
          } else {
            globalSeen.current.add(row.email);
          }
        }
      }

      // Step 3 — MX check for remaining clean rows
      const needsMx = [...new Set(
        processed.filter(r => r.risk === 'clean' && r.domain).map(r => r.domain)
      )];

      if (needsMx.length > 0) {
        setProgressMsg(`${file.name} — checking ${needsMx.length} domains via MX…`);
        const mxResults: Record<string, boolean> = {};
        const CHUNK = 500;
        try {
          for (let i = 0; i < needsMx.length; i += CHUNK) {
            const chunk = needsMx.slice(i, i + CHUNK);
            const res = await fetch(`${SUPABASE_FUNCTIONS}/check-mx-records`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ domains: chunk }),
            });
            if (res.ok) Object.assign(mxResults, (await res.json()).results);
          }
        } catch { /* skip MX if unavailable */ }

        for (const row of processed) {
          if (row.risk === 'clean' && row.domain && mxResults[row.domain] === false) {
            row.risk = 'no_mx';
          }
        }
      }

      // Step 4 — split and build result
      const clean = processed.filter(r => r.risk === 'clean');
      const risky = processed.filter(r => r.risk !== 'clean');
      const counts = {} as Record<RiskReason, number>;
      for (const r of [...clean, ...risky]) counts[r.risk] = (counts[r.risk] ?? 0) + 1;

      const result: FileResult = {
        filename: file.name,
        headers,
        batches: chunkArray(clean, BATCH_SIZE),
        risky,
        counts,
        topDomains: topDomains(clean),
      };

      setResults(prev => [...prev, result]);
    }

    setProcessing(false);
    setProgressMsg('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  const totalClean = results.reduce((s, r) => s + r.batches.reduce((ss, b) => ss + b.length, 0), 0);
  const totalRisky = results.reduce((s, r) => s + r.risky.length, 0);
  const totalBatches = results.reduce((s, r) => s + r.batches.length, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">List Cleaner</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Drop one or more CSVs. Get back clean batches + risky files, ready to send.
          </p>
        </div>
        {results.length > 0 && (
          <button onClick={reset} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 transition-colors">
            <X size={14} /> Clear all
          </button>
        )}
      </div>

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !processing && fileRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-12 transition-colors ${
          processing ? 'cursor-default border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40'
          : isDragging ? 'cursor-copy border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
          : 'cursor-pointer border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-zinc-50 dark:bg-zinc-900/40'
        }`}
      >
        {processing
          ? <Loader2 size={24} className="animate-spin text-yellow-500" />
          : <Upload size={24} className="text-zinc-400" />}
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          {processing ? progressMsg : results.length > 0 ? 'Drop more CSVs to add them' : 'Drop CSVs here or click to browse — multiple files supported'}
        </p>
        <input
          ref={fileRef} type="file" accept=".csv" multiple className="hidden"
          onChange={e => { if (e.target.files) processFiles(Array.from(e.target.files)); e.target.value = ''; }}
        />
      </div>

      {/* Global summary bar */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 text-center">
            <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Files</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{results.length}</p>
          </div>
          <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 text-center">
            <CheckCircle size={16} className="mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{totalClean.toLocaleString()}</p>
            <p className="text-xs text-green-600 dark:text-green-400">Clean</p>
          </div>
          <div className="rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4 text-center">
            <AlertTriangle size={16} className="mx-auto text-yellow-500 mb-1" />
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{totalRisky.toLocaleString()}</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400">Risky</p>
          </div>
          <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 text-center">
            <XCircle size={16} className="mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalBatches}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">Send Batches</p>
          </div>
        </div>
      )}

      {/* Per-file results table */}
      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Ready to download</p>
          {results.map((r, i) => <FileResultRow key={i} result={r} />)}
        </div>
      )}
    </div>
  );
}

export function CleanPage() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  return <CleanPageInner />;
}
