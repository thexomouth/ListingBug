import { useState, useRef } from 'react';
import { Upload, Download, X, CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

const SUPABASE_FUNCTIONS = 'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1';
const PASSWORD = 'spitonthatthang';
const SESSION_KEY = 'lb_clean_auth';

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
  'yopmail.com','yopmail.fr','cool.fr.nf','jetable.fr.nf',
  'nospam.ze.tc','nomail.xl.cx','mega.zik.dj','speed.1s.fr',
  'courriel.fr.nf','moncourrier.fr.nf','monemail.fr.nf',
  'monmail.fr.nf','dispostable.com','mailnull.com','spamgourmet.com',
  'maildrop.cc','getairmail.com','fakeinbox.com','mailnesia.com',
  'discard.email','spamthisplease.com','binkmail.com','bobmail.info',
  'chammy.info','devnullmail.com','dinke.net','dnetc.net',
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RiskReason = 'clean' | 'consumer' | 'disposable' | 'blocked_domain' | 'invalid_syntax' | 'no_email' | 'no_mx';

interface ProcessedRow {
  original: Record<string, string>;
  email: string;
  domain: string;
  risk: RiskReason;
}

interface Results {
  filename: string;
  clean: ProcessedRow[];
  risky: ProcessedRow[];
  counts: Record<RiskReason, number>;
}

function classifyLocal(email: string): RiskReason | null {
  if (!email) return 'no_email';
  if (!EMAIL_RE.test(email)) return 'invalid_syntax';
  const domain = email.split('@')[1].toLowerCase();
  if (DISPOSABLE_DOMAINS.has(domain)) return 'disposable';
  if (BLOCKED_DOMAINS.has(domain)) return 'blocked_domain';
  if (CONSUMER_DOMAINS.has(domain)) return 'consumer';
  return null; // needs MX check
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let inQuotes = false;
    let current = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
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
  const escape = (v: string) => v.includes(',') || v.includes('"') || v.includes('\n')
    ? `"${v.replace(/"/g, '""')}"` : v;
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h] ?? '')).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Password gate ────────────────────────────────────────────────────────────

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const attempt = () => {
    if (value === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      onUnlock();
    } else {
      setError(true);
      setValue('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-5">
        <div className="text-center">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">List Cleaner</p>
          <p className="text-sm text-zinc-400 mt-1">Enter password to continue</p>
        </div>
        <input
          type="password"
          value={value}
          onChange={e => { setValue(e.target.value); setError(false); }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          autoFocus
          placeholder="Password"
          className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${error ? 'border-red-400' : 'border-zinc-200 dark:border-zinc-700'}`}
        />
        {error && <p className="text-xs text-red-500">Incorrect password.</p>}
        <button
          onClick={attempt}
          className="w-full py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold text-sm transition-colors"
        >
          Enter
        </button>
      </div>
    </div>
  );
}

// ── Risk badge ───────────────────────────────────────────────────────────────

const RISK_LABELS: Record<RiskReason, string> = {
  clean: 'Clean',
  consumer: 'Consumer',
  disposable: 'Disposable',
  blocked_domain: 'Blocked',
  invalid_syntax: 'Invalid',
  no_email: 'No Email',
  no_mx: 'No MX',
};

const RISK_COLORS: Record<RiskReason, string> = {
  clean: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  consumer: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  disposable: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  blocked_domain: 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300',
  invalid_syntax: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  no_email: 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400',
  no_mx: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

function RiskBadge({ risk }: { risk: RiskReason }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${RISK_COLORS[risk]}`}>
      {RISK_LABELS[risk]}
    </span>
  );
}

// ── Main tool ────────────────────────────────────────────────────────────────

export function CleanPageInner() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [results, setResults] = useState<Results | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => { setFile(null); setResults(null); setHeaders([]); setProgress(''); };

  const processFile = async (f: File) => {
    setFile(f);
    setResults(null);
    setProcessing(true);
    setProgress('Parsing CSV…');

    const text = await f.text();
    const { headers: hdrs, rows } = parseCSV(text);
    setHeaders(hdrs);

    if (!hdrs.includes('email')) {
      setProgress('');
      setProcessing(false);
      alert('No "email" column found in this CSV.');
      return;
    }

    // Step 1 — local classification
    setProgress('Running local checks…');
    const processed: ProcessedRow[] = rows.map(row => {
      const email = (row['email'] ?? '').trim().toLowerCase();
      const domain = email.includes('@') ? email.split('@')[1] : '';
      const local = classifyLocal(email);
      return { original: row, email, domain, risk: local ?? 'clean' };
    });

    // Step 2 — collect domains that need MX check (passed local, have a domain)
    const needsMx = [...new Set(
      processed.filter(r => r.risk === 'clean' && r.domain).map(r => r.domain)
    )];

    let mxResults: Record<string, boolean> = {};
    if (needsMx.length > 0) {
      setProgress(`Checking MX records for ${needsMx.length} domains…`);
      try {
        // Batch into chunks of 500 domains per request
        const CHUNK = 500;
        for (let i = 0; i < needsMx.length; i += CHUNK) {
          const chunk = needsMx.slice(i, i + CHUNK);
          const res = await fetch(`${SUPABASE_FUNCTIONS}/check-mx-records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domains: chunk }),
          });
          if (res.ok) {
            const data = await res.json();
            Object.assign(mxResults, data.results);
          }
          if (needsMx.length > CHUNK) {
            setProgress(`Checking MX records… (${Math.min(i + CHUNK, needsMx.length)}/${needsMx.length})`);
          }
        }
      } catch {
        // If MX check fails, don't block — skip MX validation
        setProgress('MX check failed — skipping MX validation…');
      }
    }

    // Apply MX results
    for (const row of processed) {
      if (row.risk === 'clean' && row.domain) {
        if (mxResults[row.domain] === false) {
          row.risk = 'no_mx';
        }
      }
    }

    // Split
    const clean = processed.filter(r => r.risk === 'clean');
    const risky = processed.filter(r => r.risk !== 'clean');

    const counts: Record<RiskReason, number> = {
      clean: clean.length, consumer: 0, disposable: 0,
      blocked_domain: 0, invalid_syntax: 0, no_email: 0, no_mx: 0,
    };
    for (const r of risky) counts[r.risk] = (counts[r.risk] ?? 0) + 1;

    setResults({ filename: f.name, clean, risky, counts });
    setProgress('');
    setProcessing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith('.csv')) processFile(f);
  };

  const downloadClean = () => {
    if (!results) return;
    const rows = results.clean.map(r => r.original);
    const base = results.filename.replace(/\.csv$/i, '');
    downloadCSV(rows, headers, `cleaned_${base}.csv`);
  };

  const downloadRisky = () => {
    if (!results) return;
    const rows = results.risky.map(r => ({ ...r.original, risk_reason: r.risk }));
    const riskyHeaders = [...headers, 'risk_reason'];
    const base = results.filename.replace(/\.csv$/i, '');
    downloadCSV(rows, riskyHeaders, `risky_${base}.csv`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">List Cleaner</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Upload a CSV with an <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">email</code> column.
          Get back a cleaned file and a risky file.
        </p>
      </div>

      {/* Upload zone */}
      {!results && (
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer py-16 transition-colors ${
            isDragging
              ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
              : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-zinc-50 dark:bg-zinc-900/40'
          }`}
        >
          <Upload size={28} className="text-zinc-400" />
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            {processing ? progress : 'Drop a CSV here or click to browse'}
          </p>
          {processing && <Loader2 size={18} className="animate-spin text-yellow-500" />}
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ''; }}
          />
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Summary bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{results.filename}</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {results.clean.length + results.risky.length} total rows processed
              </p>
            </div>
            <button onClick={reset} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
              <X size={18} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 text-center">
              <CheckCircle size={20} className="mx-auto text-green-500 mb-1" />
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{results.counts.clean}</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Clean</p>
            </div>
            <div className="rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4 text-center">
              <AlertTriangle size={20} className="mx-auto text-yellow-500 mb-1" />
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{results.counts.consumer}</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">Consumer</p>
            </div>
            <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-4 text-center">
              <AlertTriangle size={20} className="mx-auto text-orange-500 mb-1" />
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{results.counts.no_mx}</p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">No MX</p>
            </div>
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-center">
              <XCircle size={20} className="mx-auto text-red-500 mb-1" />
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {results.counts.invalid_syntax + results.counts.no_email + results.counts.disposable + results.counts.blocked_domain}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Invalid / Blocked</p>
            </div>
          </div>

          {/* Breakdown */}
          {results.risky.length > 0 && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Risky breakdown
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-64 overflow-y-auto">
                {(['consumer','no_mx','invalid_syntax','disposable','blocked_domain','no_email'] as RiskReason[])
                  .filter(r => results.counts[r] > 0)
                  .map(r => (
                    <div key={r} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <RiskBadge risk={r} />
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">{results.counts[r]} emails</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Download buttons */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={downloadClean}
              disabled={results.clean.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download size={15} />
              Download Cleaned ({results.clean.length})
            </button>
            <button
              onClick={downloadRisky}
              disabled={results.risky.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download size={15} />
              Download Risky ({results.risky.length})
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm transition-colors"
            >
              Upload another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CleanPage() {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === '1'
  );
  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  return <CleanPageInner />;
}
