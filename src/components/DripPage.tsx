import { useState, useEffect, useRef } from 'react';
import { Upload, Play, Pause, Square, Bell, BellOff, ChevronDown, ChevronRight, X, Loader2, CheckCircle, AlertTriangle, XCircle, Info, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PASSWORD = 'spitonthatthang';
const SESSION_KEY = 'lb_drip_auth';
const SUPABASE_FUNCTIONS = 'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1';

// ── Types ────────────────────────────────────────────────────────────────────

interface Campaign { id: string; name: string; subject: string; body: string; sender_id: string; unsubscribe_url: string | null; }
interface DripRun {
  id: string; campaign_name: string; subject: string; body: string;
  sender_id: string; daily_limit: number; status: string; pause_reason: string | null;
  sends_today: number; sends_today_date: string | null;
  total_sent: number; total_failed: number; total_contacts: number;
  current_list_name: string | null; queue_position: number; created_at: string; updated_at: string;
}
interface Notification { id: string; run_id: string; level: string; message: string; read: boolean; created_at: string; }
interface CsvFile { file: File; name: string; rowCount: number; rows: Record<string, string>[]; headers: string[]; campaignId: string; }

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const parseRow = (line: string): string[] => {
    const result: string[] = []; let inQ = false, cur = '';
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if (ch === ',' && !inQ) { result.push(cur); cur = ''; }
      else cur += ch;
    }
    result.push(cur); return result;
  };
  const headers = parseRow(lines[0]);
  return { headers, rows: lines.slice(1).map(l => { const v = parseRow(l); return Object.fromEntries(headers.map((h,i) => [h,(v[i]??'').trim()])); }) };
}

function statusColor(status: string) {
  return status === 'active'    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
       : status === 'paused'    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
       : status === 'queued'    ? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
       : status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
       : status === 'stopped'   ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
       : 'bg-zinc-100 text-zinc-500';
}

function notifIcon(level: string) {
  if (level === 'critical' || level === 'error') return <XCircle size={15} className="text-red-500 shrink-0 mt-0.5" />;
  if (level === 'warning') return <AlertTriangle size={15} className="text-yellow-500 shrink-0 mt-0.5" />;
  return <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />;
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.round(diff/60)}m ago`;
  if (diff < 86400) return `${Math.round(diff/3600)}h ago`;
  return `${Math.round(diff/86400)}d ago`;
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
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Drip Sender</p>
          <p className="text-sm text-zinc-400 mt-1">Admin access required</p>
        </div>
        <input type="password" value={value} autoFocus placeholder="Password"
          onChange={e => { setValue(e.target.value); setError(false); }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${error ? 'border-red-400' : 'border-zinc-200 dark:border-zinc-700'}`}
        />
        {error && <p className="text-xs text-red-500">Incorrect password.</p>}
        <button onClick={attempt} className="w-full py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold text-sm transition-colors">Enter</button>
      </div>
    </div>
  );
}

// ── Run card ─────────────────────────────────────────────────────────────────

function RunCard({ run, onRefresh }: { run: DripRun; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [acting, setActing] = useState(false);

  const pct = run.total_contacts > 0 ? Math.round((run.total_sent / run.total_contacts) * 100) : 0;
  const todayPct = run.daily_limit > 0 ? Math.round((run.sends_today / run.daily_limit) * 100) : 0;

  const act = async (action: 'pause' | 'resume' | 'stop') => {
    setActing(true);
    const newStatus = action === 'pause' ? 'paused' : action === 'resume' ? 'active' : 'stopped';
    await supabase.from('drip_runs').update({
      status: newStatus,
      pause_reason: action === 'stop' ? 'Manually stopped' : action === 'pause' ? 'Manually paused' : null,
    }).eq('id', run.id);
    onRefresh();
    setActing(false);
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 py-4 bg-white dark:bg-zinc-900 flex-wrap">
        <button onClick={() => setExpanded(e => !e)} className="shrink-0 mt-0.5 text-zinc-400 hover:text-zinc-600">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{run.campaign_name}</p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(run.status)}`}>
              {run.status}
            </span>
          </div>
          {run.current_list_name && run.status === 'active' && (
            <p className="text-xs text-zinc-400">Currently sending: <span className="text-zinc-600 dark:text-zinc-300">{run.current_list_name}</span></p>
          )}
          {run.pause_reason && run.status !== 'active' && (
            <p className="text-xs text-amber-600 dark:text-amber-400">{run.pause_reason}</p>
          )}

          {/* Overall progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Overall: {run.total_sent.toLocaleString()} / {run.total_contacts.toLocaleString()}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div className="h-full bg-yellow-400 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Today's sends */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Today: {run.sends_today} / {run.daily_limit} limit</span>
              <span>{todayPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div className="h-full bg-blue-400 transition-all" style={{ width: `${Math.min(100, todayPct)}%` }} />
            </div>
          </div>

          {run.total_failed > 0 && (
            <p className="text-xs text-red-500">{run.total_failed.toLocaleString()} failed sends</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {run.status === 'active' && (
            <button onClick={() => act('pause')} disabled={acting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium disabled:opacity-50 transition-colors">
              <Pause size={12} /> Pause
            </button>
          )}
          {run.status === 'paused' && (
            <button onClick={() => act('resume')} disabled={acting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-zinc-900 text-xs font-semibold disabled:opacity-50 transition-colors">
              <Play size={12} /> Resume
            </button>
          )}
          {(run.status === 'active' || run.status === 'paused') && (
            <button onClick={() => { if (confirm('Stop this run permanently?')) act('stop'); }} disabled={acting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-medium disabled:opacity-50 transition-colors">
              <Square size={12} /> Stop
            </button>
          )}
        </div>
      </div>

      {/* Expanded stats */}
      {expanded && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">{run.total_sent.toLocaleString()}</p>
            <p className="text-xs text-zinc-400 mt-0.5">Sent</p>
          </div>
          <div>
            <p className="text-xl font-bold text-zinc-500">{(run.total_contacts - run.total_sent - run.total_failed).toLocaleString()}</p>
            <p className="text-xs text-zinc-400 mt-0.5">Pending</p>
          </div>
          <div>
            <p className="text-xl font-bold text-red-500">{run.total_failed.toLocaleString()}</p>
            <p className="text-xs text-zinc-400 mt-0.5">Failed</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

function DripPageInner() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [runs, setRuns] = useState<DripRun[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Create form state
  const [dailyLimit, setDailyLimit] = useState(500);
  const [csvFiles, setCsvFiles] = useState<CsvFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const load = async () => {
    setLoading(true);
    const [{ data: cData }, { data: rData }, { data: nData }] = await Promise.all([
      supabase.from('messaging_automations').select('id, name, subject, body, sender_id, unsubscribe_url').order('created_at', { ascending: false }),
      supabase.from('drip_runs').select('*').order('created_at', { ascending: false }),
      supabase.from('drip_notifications').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    setCampaigns(cData || []);
    setRuns(rData || []);
    setNotifications(nData || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addCsvFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.name.endsWith('.csv'));
    for (const file of arr) {
      const text = await file.text();
      const { headers, rows } = parseCSV(text);
      if (!headers.includes('email')) { alert(`"${file.name}" has no email column — skipped.`); continue; }
      setCsvFiles(prev => [...prev, { file, name: file.name, rowCount: rows.length, rows, headers, campaignId: '' }]);
    }
  };

  const removeCsv = (i: number) => setCsvFiles(prev => prev.filter((_, idx) => idx !== i));

  const setCsvCampaign = (i: number, campaignId: string) => {
    setCsvFiles(prev => prev.map((f, idx) => idx === i ? { ...f, campaignId } : f));
  };

  const allAssigned = csvFiles.length > 0 && csvFiles.every(f => f.campaignId !== '');
  const totalQueueContacts = csvFiles.reduce((s, f) => s + f.rowCount, 0);
  const estDays = dailyLimit > 0 ? Math.ceil(totalQueueContacts / dailyLimit) : 0;

  const createQueue = async () => {
    if (!allAssigned) { alert('Assign a campaign to every list.'); return; }

    setCreating(true);
    try {
      // Determine current max queue position so new runs slot after any existing queued/active runs
      const existingActive = runs.filter(r => r.status === 'active' || r.status === 'queued');
      const maxPos = existingActive.length > 0 ? Math.max(...existingActive.map(r => r.queue_position ?? 0)) : -1;

      for (let fi = 0; fi < csvFiles.length; fi++) {
        const csvFile = csvFiles[fi];
        const campaign = campaigns.find(c => c.id === csvFile.campaignId)!;
        const queuePos = maxPos + 1 + fi;
        // First in queue is active if no existing active run, otherwise queued
        const isFirst = fi === 0 && !runs.some(r => r.status === 'active');
        const status = isFirst ? 'active' : 'queued';

        const { data: run, error: runErr } = await supabase
          .from('drip_runs')
          .insert({
            campaign_name: campaign.name,
            subject: campaign.subject,
            body: campaign.body,
            sender_id: campaign.sender_id,
            unsubscribe_url: campaign.unsubscribe_url,
            daily_limit: dailyLimit,
            total_contacts: csvFile.rowCount,
            status,
            queue_position: queuePos,
          })
          .select('id')
          .single();

        if (runErr || !run) { alert(`Failed to create run for "${csvFile.name}": ${runErr?.message}`); break; }

        // Insert contacts in batches of 200
        const contactRows = csvFile.rows.map(row => ({
          run_id: run.id,
          list_name: csvFile.name,
          list_order: 0,
          email: (row['email'] || '').toLowerCase().trim(),
          first_name: row['first_name'] || row['name']?.split(' ')[0] || '',
          last_name: row['last_name'] || row['name']?.split(' ').slice(1).join(' ') || '',
          business_name: row['business_name'] || row['company'] || '',
          city: row['city'] || '',
          state: row['state'] || '',
        })).filter(r => r.email);

        const CHUNK = 200;
        for (let i = 0; i < contactRows.length; i += CHUNK) {
          await supabase.from('drip_contacts').insert(contactRows.slice(i, i + CHUNK));
        }

        await supabase.from('drip_notifications').insert({
          run_id: run.id, level: 'info',
          message: status === 'active'
            ? `Run started — ${csvFile.rowCount.toLocaleString()} contacts, ${dailyLimit}/day from 6am PST.`
            : `Queued at position ${queuePos + 1} — will activate automatically when the previous run completes.`,
        });
      }

      setCsvFiles([]);
      setShowCreate(false);
      load();
    } catch (e: any) {
      alert(e?.message || 'Unexpected error creating queue.');
    }
    setCreating(false);
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('drip_notifications').update({ read: true }).in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  const activeRuns = runs.filter(r => r.status === 'active' || r.status === 'paused');
  const queuedRuns = runs.filter(r => r.status === 'queued').sort((a, b) => (a.queue_position ?? 0) - (b.queue_position ?? 0));
  const completedRuns = runs.filter(r => r.status === 'completed' || r.status === 'stopped');

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Drip Sender</h1>
          <p className="text-sm text-zinc-500 mt-1">Set and forget — sends {dailyLimit}/day from 6am PST with human-like spacing.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Notifications bell */}
          <button onClick={() => { setNotifOpen(o => !o); if (unreadCount > 0) markAllRead(); }}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm transition-colors">
            {unreadCount > 0 ? <Bell size={15} className="text-yellow-500" /> : <BellOff size={15} />}
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{unreadCount}</span>
            )}
          </button>
          <button onClick={load} className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            <RefreshCw size={15} />
          </button>
          <button onClick={() => setShowCreate(s => !s)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold text-sm transition-colors">
            {showCreate ? <X size={14} /> : <Play size={14} />}
            {showCreate ? 'Cancel' : 'New Run'}
          </button>
        </div>
      </div>

      {/* Notifications panel */}
      {notifOpen && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Notifications</p>
            <button onClick={markAllRead} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">Mark all read</button>
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-zinc-400 text-center">No notifications yet.</p>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-72 overflow-y-auto">
              {notifications.map(n => (
                <div key={n.id} className={`flex items-start gap-2.5 px-4 py-3 text-sm ${!n.read ? 'bg-yellow-50 dark:bg-yellow-900/10' : 'bg-white dark:bg-zinc-900'}`}>
                  {notifIcon(n.level)}
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-700 dark:text-zinc-300 leading-snug">{n.message}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create queue form */}
      {showCreate && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">Build Send Queue</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Upload your CSVs, assign a campaign to each, then queue them all. Runs fire in order automatically.</p>
          </div>

          {/* Daily limit */}
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Daily send limit</label>
              <input type="number" min={1} max={5000} value={dailyLimit} onChange={e => setDailyLimit(Number(e.target.value))}
                className="w-28 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            {totalQueueContacts > 0 && (
              <div className="pt-4 text-xs text-zinc-400">
                <span className="font-semibold text-zinc-600 dark:text-zinc-300">{totalQueueContacts.toLocaleString()}</span> total contacts
                {' · est. '}
                <span className="font-semibold text-zinc-600 dark:text-zinc-300">{estDays} day{estDays !== 1 ? 's' : ''}</span> to complete
              </div>
            )}
          </div>

          {/* CSV upload zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); addCsvFiles(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer text-sm transition-colors ${
              isDragging ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
              : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-500 dark:text-zinc-400'
            }`}
          >
            <Upload size={15} />
            <span>{csvFiles.length > 0 ? 'Drop more CSVs to add them' : 'Drop cleaned CSVs here or click to browse'}</span>
            <input ref={fileRef} type="file" accept=".csv" multiple className="hidden"
              onChange={e => { if (e.target.files) addCsvFiles(e.target.files); if (e.target) e.target.value = ''; }} />
          </div>

          {/* Per-CSV campaign assignment */}
          {csvFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-500">Assign a campaign to each list — they'll run in this order:</p>
              {csvFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate text-zinc-800 dark:text-zinc-200">{f.name}</p>
                    <p className="text-xs text-zinc-400">{f.rowCount.toLocaleString()} contacts</p>
                  </div>
                  <select
                    value={f.campaignId}
                    onChange={e => setCsvCampaign(i, e.target.value)}
                    className={`shrink-0 px-2 py-1.5 rounded-lg border text-xs bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                      f.campaignId ? 'border-green-300 dark:border-green-700' : 'border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    <option value="">Select campaign…</option>
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button onClick={() => removeCsv(i)} className="shrink-0 text-zinc-400 hover:text-zinc-600"><X size={13} /></button>
                </div>
              ))}
            </div>
          )}

          {campaigns.length === 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400">No saved campaigns yet — save one in the Messaging tab first.</p>
          )}

          <button onClick={createQueue} disabled={creating || !allAssigned}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {creating
              ? <><Loader2 size={14} className="animate-spin" /> Queuing…</>
              : <><Play size={14} /> Queue {csvFiles.length > 0 ? `${csvFiles.length} Run${csvFiles.length !== 1 ? 's' : ''}` : 'All'}</>}
          </button>
        </div>
      )}

      {/* Active / paused runs */}
      {activeRuns.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Active</p>
          {activeRuns.map(r => <RunCard key={r.id} run={r} onRefresh={load} />)}
        </div>
      )}

      {/* Queued runs */}
      {queuedRuns.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Queue ({queuedRuns.length})</p>
          {queuedRuns.map((r, i) => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 bg-white dark:bg-zinc-900">
              <span className="shrink-0 w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-xs font-bold flex items-center justify-center">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{r.campaign_name}</p>
                <p className="text-xs text-zinc-400">{r.total_contacts.toLocaleString()} contacts · {r.current_list_name || 'awaiting activation'}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor('queued')}`}>queued</span>
              <button onClick={() => { if (confirm('Remove this run from queue?')) supabase.from('drip_runs').update({ status: 'stopped', pause_reason: 'Removed from queue' }).eq('id', r.id).then(load); }}
                className="shrink-0 text-zinc-300 hover:text-red-400 transition-colors">
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Completed / stopped runs */}
      {completedRuns.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">History</p>
          {completedRuns.map(r => <RunCard key={r.id} run={r} onRefresh={load} />)}
        </div>
      )}

      {runs.length === 0 && !showCreate && (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <Play size={32} className="text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm font-medium text-zinc-500">No drip runs yet.</p>
          <p className="text-xs text-zinc-400 max-w-xs">Create a run to start sending your cleaned lists on autopilot.</p>
          <button onClick={() => setShowCreate(true)} className="mt-2 px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold text-sm transition-colors">
            Create First Run
          </button>
        </div>
      )}
    </div>
  );
}

// ── Export ───────────────────────────────────────────────────────────────────

export function DripPage() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  return <DripPageInner />;
}
