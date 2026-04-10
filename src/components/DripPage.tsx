import { useState, useEffect, useRef } from 'react';
import { Upload, Play, Pause, Square, Bell, BellOff, ChevronDown, ChevronRight, X, Loader2, AlertTriangle, XCircle, Info, RefreshCw, ListChecks } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PASSWORD = 'spitonthatthang';
const SESSION_KEY = 'lb_drip_auth';

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

// ── History run card (compact, for completed/stopped) ────────────────────────

function HistoryCard({ run, onRefresh }: { run: DripRun; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const pct = run.total_contacts > 0 ? Math.round((run.total_sent / run.total_contacts) * 100) : 0;
  return (
    <div className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setExpanded(e => !e)} className="shrink-0 text-zinc-300 hover:text-zinc-500">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate">{run.campaign_name}</p>
          <p className="text-xs text-zinc-400">{run.current_list_name || '—'}</p>
        </div>
        <span className="text-xs text-zinc-400 shrink-0">{run.total_sent.toLocaleString()} sent</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusColor(run.status)}`}>{run.status}</span>
      </div>
      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div className="h-full bg-blue-400" style={{ width: `${pct}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div><p className="font-semibold text-green-600 dark:text-green-400">{run.total_sent.toLocaleString()}</p><p className="text-zinc-400">sent</p></div>
            <div><p className="font-semibold text-zinc-500">{(run.total_contacts - run.total_sent - run.total_failed).toLocaleString()}</p><p className="text-zinc-400">pending</p></div>
            <div><p className="font-semibold text-red-500">{run.total_failed.toLocaleString()}</p><p className="text-zinc-400">failed</p></div>
          </div>
          {run.pause_reason && <p className="text-xs text-zinc-400 italic">{run.pause_reason}</p>}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function DripPageInner() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [runs, setRuns] = useState<DripRun[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

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

  const readyFiles = csvFiles.filter(f => f.campaignId !== '');
  const totalQueueContacts = csvFiles.reduce((s, f) => s + f.rowCount, 0);
  const estDays = dailyLimit > 0 ? Math.ceil(totalQueueContacts / dailyLimit) : 0;

  const createQueue = async () => {
    if (readyFiles.length === 0) { alert('Assign a campaign to at least one list.'); return; }
    setCreating(true);
    try {
      const existingActive = runs.filter(r => r.status === 'active' || r.status === 'queued');
      const maxPos = existingActive.length > 0 ? Math.max(...existingActive.map(r => r.queue_position ?? 0)) : -1;

      for (let fi = 0; fi < readyFiles.length; fi++) {
        const csvFile = readyFiles[fi];
        const campaign = campaigns.find(c => c.id === csvFile.campaignId)!;
        const queuePos = maxPos + 1 + fi;
        const isFirst = fi === 0 && !runs.some(r => r.status === 'active');
        const status = isFirst ? 'active' : 'queued';

        const { data: run, error: runErr } = await supabase
          .from('drip_runs')
          .insert({
            campaign_name: campaign.name, subject: campaign.subject, body: campaign.body,
            sender_id: campaign.sender_id, unsubscribe_url: campaign.unsubscribe_url,
            daily_limit: dailyLimit, total_contacts: csvFile.rowCount, status, queue_position: queuePos,
          })
          .select('id').single();

        if (runErr || !run) { alert(`Failed to create run for "${csvFile.name}": ${runErr?.message}`); break; }

        const contactRows = csvFile.rows.map(row => ({
          run_id: run.id, list_name: csvFile.name, list_order: 0,
          email: (row['email'] || '').toLowerCase().trim(),
          first_name: row['first_name'] || row['name']?.split(' ')[0] || '',
          last_name: row['last_name'] || row['name']?.split(' ').slice(1).join(' ') || '',
          business_name: row['business_name'] || row['company'] || '',
          city: row['city'] || '', state: row['state'] || '',
        })).filter(r => r.email);

        const CHUNK = 200;
        for (let i = 0; i < contactRows.length; i += CHUNK) {
          await supabase.from('drip_contacts').insert(contactRows.slice(i, i + CHUNK));
        }

        await supabase.from('drip_notifications').insert({
          run_id: run.id, level: 'info',
          message: status === 'active'
            ? `Run started — ${csvFile.rowCount.toLocaleString()} contacts, ${dailyLimit}/day from 6am PST.`
            : `Queued at position ${queuePos + 1} — activates automatically when previous run completes.`,
        });
      }

      // Remove queued files, keep unassigned ones so user can still assign them
      setCsvFiles(prev => prev.filter(f => f.campaignId === ''));
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

  const actOnRun = async (id: string, action: 'pause' | 'resume' | 'stop') => {
    const newStatus = action === 'pause' ? 'paused' : action === 'resume' ? 'active' : 'stopped';
    await supabase.from('drip_runs').update({
      status: newStatus,
      pause_reason: action === 'stop' ? 'Manually stopped' : action === 'pause' ? 'Manually paused' : null,
    }).eq('id', id);
    load();
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
  const hasTable = activeRuns.length > 0 || queuedRuns.length > 0 || csvFiles.length > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Drip Sender</h1>
          <p className="text-sm text-zinc-500 mt-1">Set and forget — sends from 6am PST with human-like spacing.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Daily limit */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <span className="text-xs text-zinc-400 whitespace-nowrap">Daily limit</span>
            <input type="number" min={1} max={5000} value={dailyLimit} onChange={e => setDailyLimit(Number(e.target.value))}
              className="w-16 text-xs text-zinc-900 dark:text-zinc-100 bg-transparent focus:outline-none text-right font-semibold"
            />
          </div>
          {/* Upload */}
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-medium transition-colors">
            <Upload size={14} /> Upload CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" multiple className="hidden"
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); addCsvFiles(e.dataTransfer.files); }}
            onChange={e => { if (e.target.files) addCsvFiles(e.target.files); if (e.target) e.target.value = ''; }} />
          {/* Notifications */}
          <button onClick={() => { setNotifOpen(o => !o); if (unreadCount > 0) markAllRead(); }}
            className="relative p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            {unreadCount > 0 ? <Bell size={15} className="text-yellow-500" /> : <BellOff size={15} />}
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{unreadCount}</span>
            )}
          </button>
          <button onClick={load} className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Drop overlay hint */}
      {isDragging && (
        <div className="rounded-xl border-2 border-dashed border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-6 text-center text-sm text-yellow-700 dark:text-yellow-300 font-medium">
          Drop CSVs here
        </div>
      )}

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

      {/* ── Unified run table ─────────────────────────────────────────────── */}
      {hasTable ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-900">

          {/* Table header */}
          <div className="grid grid-cols-[28px_1fr_140px_72px_auto] items-center gap-x-4 px-4 py-2 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
            <span></span>
            <span>List</span>
            <span>Campaign</span>
            <span className="text-right">Contacts</span>
            <span>Status</span>
          </div>

          {/* ── Running / paused ─────────────────────────────────────────── */}
          {activeRuns.map(r => {
            const pct = r.total_contacts > 0 ? Math.round((r.total_sent / r.total_contacts) * 100) : 0;
            const todayPct = r.daily_limit > 0 ? Math.min(100, Math.round((r.sends_today / r.daily_limit) * 100)) : 0;
            return (
              <div key={r.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <div className="grid grid-cols-[28px_1fr_140px_72px_auto] items-center gap-x-4 px-4 py-3">
                  {/* Position indicator */}
                  <div className="flex items-center justify-center">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center ${r.status === 'active' ? 'bg-green-100 dark:bg-green-900/40' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                      {r.status === 'active'
                        ? <Play size={9} className="text-green-600 dark:text-green-400 fill-current ml-0.5" />
                        : <Pause size={9} className="text-yellow-600 dark:text-yellow-400" />}
                    </span>
                  </div>
                  {/* List name */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{r.current_list_name || r.campaign_name}</p>
                    {r.pause_reason && <p className="text-xs text-amber-500 truncate">{r.pause_reason}</p>}
                  </div>
                  {/* Campaign */}
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{r.campaign_name}</p>
                  {/* Contacts */}
                  <p className="text-xs text-right text-zinc-500">{r.total_contacts.toLocaleString()}</p>
                  {/* Status + actions */}
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(r.status)}`}>{r.status}</span>
                    {r.status === 'active' && (
                      <button onClick={() => actOnRun(r.id, 'pause')} title="Pause"
                        className="p-1 rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <Pause size={12} />
                      </button>
                    )}
                    {r.status === 'paused' && (
                      <button onClick={() => actOnRun(r.id, 'resume')} title="Resume"
                        className="p-1 rounded text-zinc-400 hover:text-green-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <Play size={12} />
                      </button>
                    )}
                    <button onClick={() => { if (confirm('Stop this run permanently?')) actOnRun(r.id, 'stop'); }} title="Stop"
                      className="p-1 rounded text-zinc-300 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                      <Square size={12} />
                    </button>
                  </div>
                </div>
                {/* Progress bars */}
                <div className="px-4 pb-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-yellow-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-zinc-400 w-24 text-right">{r.total_sent.toLocaleString()} / {r.total_contacts.toLocaleString()} · {pct}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-blue-400 transition-all" style={{ width: `${todayPct}%` }} />
                    </div>
                    <span className="text-[10px] text-zinc-400 w-24 text-right">Today: {r.sends_today} / {r.daily_limit}</span>
                  </div>
                  {r.total_failed > 0 && <p className="text-[10px] text-red-400">{r.total_failed.toLocaleString()} failed</p>}
                </div>
              </div>
            );
          })}

          {/* ── Queued ───────────────────────────────────────────────────── */}
          {queuedRuns.length > 0 && (
            <div className="border-b border-zinc-100 dark:border-zinc-800">
              <div className="px-4 py-1.5 bg-zinc-50/80 dark:bg-zinc-800/40">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Queue</p>
              </div>
              {queuedRuns.map((r, i) => (
                <div key={r.id} className="grid grid-cols-[28px_1fr_140px_72px_auto] items-center gap-x-4 px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 first:border-0">
                  <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-[10px] font-bold flex items-center justify-center mx-auto">{i + 2}</span>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 truncate">{r.current_list_name || r.campaign_name}</p>
                  <p className="text-xs text-zinc-400 truncate">{r.campaign_name}</p>
                  <p className="text-xs text-right text-zinc-400">{r.total_contacts.toLocaleString()}</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor('queued')}`}>queued</span>
                    <button onClick={() => { if (confirm('Remove from queue?')) supabase.from('drip_runs').update({ status: 'stopped', pause_reason: 'Removed from queue' }).eq('id', r.id).then(load); }}
                      className="p-1 rounded text-zinc-300 hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Pending uploads (need campaign assignment) ───────────────── */}
          {csvFiles.length > 0 && (
            <div>
              <div className="px-4 py-1.5 bg-amber-50 dark:bg-amber-900/10 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Uploaded — assign a campaign to queue</p>
              </div>
              {csvFiles.map((f, i) => (
                <div key={i} className="grid grid-cols-[28px_1fr_140px_72px_auto] items-center gap-x-4 px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
                  {/* No position number yet */}
                  <span className="w-5 h-5 rounded-full border-2 border-dashed border-zinc-200 dark:border-zinc-700 mx-auto" />
                  {/* List name */}
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-700 dark:text-zinc-200 truncate">{f.name}</p>
                  </div>
                  {/* Campaign dropdown */}
                  <select
                    value={f.campaignId}
                    onChange={e => setCsvCampaign(i, e.target.value)}
                    className={`px-2 py-1.5 rounded-lg border text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 truncate ${
                      f.campaignId ? 'border-green-300 dark:border-green-700' : 'border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    <option value="">Select campaign…</option>
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {/* Contacts */}
                  <p className="text-xs text-right text-zinc-400">{f.rowCount.toLocaleString()}</p>
                  {/* Status + remove */}
                  <div className="flex items-center gap-1.5">
                    {f.campaignId
                      ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">ready</span>
                      : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">needs campaign</span>
                    }
                    <button onClick={() => removeCsv(i)} className="p-1 rounded text-zinc-300 hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Queue footer */}
              <div className="flex items-center justify-between gap-4 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-200 dark:border-zinc-700">
                <div className="text-xs text-zinc-400">
                  {totalQueueContacts > 0 && (
                    <><span className="font-semibold text-zinc-600 dark:text-zinc-300">{totalQueueContacts.toLocaleString()}</span> contacts · est. <span className="font-semibold text-zinc-600 dark:text-zinc-300">{estDays} day{estDays !== 1 ? 's' : ''}</span></>
                  )}
                </div>
                {campaigns.length === 0
                  ? <p className="text-xs text-amber-500">No saved campaigns — create one in Messaging first.</p>
                  : (
                    <button onClick={createQueue} disabled={creating || readyFiles.length === 0}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      {creating
                        ? <><Loader2 size={13} className="animate-spin" /> Queuing…</>
                        : <><Play size={13} /> Queue {readyFiles.length} Run{readyFiles.length !== 1 ? 's' : ''}</>}
                    </button>
                  )
                }
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <ListChecks size={36} className="text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm font-medium text-zinc-500">No runs yet.</p>
          <p className="text-xs text-zinc-400 max-w-xs">Upload cleaned CSVs, assign each a campaign, and queue them. They'll run in order on autopilot.</p>
          <button onClick={() => fileRef.current?.click()} className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold text-sm transition-colors">
            <Upload size={13} /> Upload CSVs
          </button>
        </div>
      )}

      {/* ── History ────────────────────────────────────────────────────────── */}
      {completedRuns.length > 0 && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <button onClick={() => setHistoryOpen(o => !o)}
            className="flex items-center justify-between w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">History ({completedRuns.length})</p>
            {historyOpen ? <ChevronDown size={14} className="text-zinc-400" /> : <ChevronRight size={14} className="text-zinc-400" />}
          </button>
          {historyOpen && (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {completedRuns.map(r => <HistoryCard key={r.id} run={r} onRefresh={load} />)}
            </div>
          )}
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
