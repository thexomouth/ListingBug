import { useState, useEffect } from 'react';
import { Plus, Play, Pause, Trash2, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

const SUPABASE_FUNCTIONS = 'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1';

interface MessagingAutomation {
  id: string;
  name: string;
  status: 'active' | 'paused';
  template_id: string | null;
  subject: string | null;
  body: string | null;
  list_id: string;
  list_name?: string;
  sender_id: string;
  schedule: 'on_sync' | 'manual' | 'daily' | 'weekly' | 'monthly';
  last_run_at: string | null;
  total_sent: number;
}

interface Template { id: string; name: string; subject: string | null; body: string | null; }
interface ContactList { id: string; name: string; count: number; }
interface Sender { id: string; nickname: string; from_email: string; }

const SCHEDULES = [
  { value: 'on_sync', label: 'On Sync', hint: 'Sends automatically whenever a search automation updates this list.' },
  { value: 'manual',  label: 'Manual only', hint: 'Only sends when you click Run now.' },
  { value: 'daily',   label: 'Daily',   hint: null },
  { value: 'weekly',  label: 'Weekly',  hint: null },
  { value: 'monthly', label: 'Monthly', hint: null },
];

export function AutomateTab({ onGoToSetup }: { onGoToSetup: () => void }) {
  const [automations, setAutomations] = useState<(MessagingAutomation & { unsubscribe_url?: string })[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [running, setRunning] = useState<string | null>(null); // automation id being run

  // Form state
  const [formName, setFormName] = useState('');
  const [formTemplateId, setFormTemplateId] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formListId, setFormListId] = useState('');
  const [formSenderId, setFormSenderId] = useState('');
  const [formSchedule, setFormSchedule] = useState<'on_sync' | 'manual' | 'daily' | 'weekly' | 'monthly'>('on_sync');
  const [formUnsubscribeUrl, setFormUnsubscribeUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: autos }, { data: tmpls }, { data: listsData }, { data: memberships }] = await Promise.all([
      supabase.from('messaging_automations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('marketing_templates').select('id, name, subject, body').eq('user_id', user.id).eq('channel', 'email').order('updated_at', { ascending: false }),
      supabase.from('marketing_lists').select('id, name').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('marketing_contacts_lists').select('list_id'),
    ]);

    const listCountMap = new Map<string, number>();
    for (const m of memberships ?? []) {
      listCountMap.set(m.list_id, (listCountMap.get(m.list_id) ?? 0) + 1);
    }

    const listMap = new Map((listsData ?? []).map((l: any) => [l.id, l.name]));

    setTemplates(tmpls ?? []);
    setLists((listsData ?? []).map((l: any) => ({ id: l.id, name: l.name, count: listCountMap.get(l.id) ?? 0 })));
    setAutomations((autos ?? []).map((a: any) => ({ ...a, list_name: listMap.get(a.list_id) ?? '—' })));

    // Load senders
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const res = await fetch(`${SUPABASE_FUNCTIONS}/get-marketing-config?action=senders`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSenders(data.senders ?? []);
          if (data.senders?.length > 0 && !formSenderId) setFormSenderId(data.senders[0].id);
        }
      }
    } catch { /* not configured */ }

    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  // When template selected, pre-fill subject/body
  const handleTemplateChange = (id: string) => {
    setFormTemplateId(id);
    const t = templates.find(t => t.id === id);
    if (t) {
      setFormSubject(t.subject ?? '');
      setFormBody(t.body ?? '');
    }
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error('Automation name is required.'); return; }
    if (!formListId) { toast.error('Select a contact list.'); return; }
    if (!formSenderId) { toast.error('Select a sender. Go to Setup to configure SendGrid first.'); return; }
    if (!formSubject.trim()) { toast.error('Subject is required.'); return; }
    if (!formBody.trim()) { toast.error('Body is required.'); return; }
    if (!formUnsubscribeUrl.trim()) { toast.error('Unsubscribe URL is required for legal compliance with outbound marketing laws.'); return; }
    try { new URL(formUnsubscribeUrl.trim()); } catch { toast.error('Unsubscribe URL must be a valid URL (e.g. https://yourdomain.com/unsubscribe).'); return; }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error } = await supabase.from('messaging_automations').insert({
      user_id: user.id,
      name: formName.trim(),
      template_id: formTemplateId || null,
      subject: formSubject.trim(),
      body: formBody.trim(),
      list_id: formListId,
      sender_id: formSenderId,
      schedule: formSchedule,
      status: 'active',
      unsubscribe_url: formUnsubscribeUrl.trim(),
    });

    setSaving(false);
    if (error) { toast.error(error.message); return; }

    toast.success('Automation created.');
    setShowForm(false);
    setFormName(''); setFormTemplateId(''); setFormSubject(''); setFormBody('');
    setFormListId(''); setFormSchedule('manual'); setFormUnsubscribeUrl('');
    await loadAll();
  };

  const handleToggleStatus = async (a: MessagingAutomation) => {
    const next = a.status === 'active' ? 'paused' : 'active';
    const { error } = await supabase.from('messaging_automations')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', a.id);
    if (error) { toast.error(error.message); return; }
    setAutomations(prev => prev.map(x => x.id === a.id ? { ...x, status: next } : x));
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('messaging_automations').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setAutomations(prev => prev.filter(x => x.id !== id));
    toast.success('Automation deleted.');
  };

  const handleRunNow = async (a: MessagingAutomation) => {
    setRunning(a.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load list members
      const { data: memberships } = await supabase
        .from('marketing_contacts_lists')
        .select('contact_id')
        .eq('list_id', a.list_id);

      if (!memberships || memberships.length === 0) {
        toast.error('This list has no contacts.');
        return;
      }

      const contactIds = memberships.map((m: any) => m.contact_id);
      const { data: contacts } = await supabase
        .from('marketing_contacts')
        .select('id, email, first_name, last_name, city, company')
        .in('id', contactIds)
        .eq('user_id', user.id)
        .eq('unsubscribed', false);

      if (!contacts || contacts.length === 0) {
        toast.error('No sendable contacts in this list (all may be unsubscribed).');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${SUPABASE_FUNCTIONS}/send-marketing-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unsubscribe_url: a.unsubscribe_url ?? '',
          recipients: contacts.map((c: any) => ({
            email: c.email,
            first_name: c.first_name ?? '',
            last_name: c.last_name ?? undefined,
            city: c.city ?? undefined,
            company: c.company ?? undefined,
            contact_id: c.id,
          })),
          subject: a.subject,
          body: a.body,
          campaign_name: a.name,
          sender_id: a.sender_id,
        }),
      });

      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Send failed.'); return; }

      // Update last_run_at and total_sent
      await supabase.from('messaging_automations').update({
        last_run_at: new Date().toISOString(),
        total_sent: a.total_sent + data.sent,
        updated_at: new Date().toISOString(),
      }).eq('id', a.id);

      toast.success(`Sent ${data.sent} email${data.sent !== 1 ? 's' : ''}${data.failed > 0 ? ` (${data.failed} failed)` : ''}.`);
      await loadAll();
    } catch (e: any) {
      toast.error(e?.message ?? 'Unexpected error.');
    } finally {
      setRunning(null);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Messaging Automations</h2>
          <p className="text-sm text-zinc-400 mt-0.5">Send a campaign to a list on a schedule or on demand.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold text-sm transition-colors"
        >
          {showForm ? <ChevronUp size={15} /> : <Plus size={15} />}
          {showForm ? 'Cancel' : 'New automation'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 space-y-4 bg-zinc-50 dark:bg-zinc-900/50">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">New automation</p>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Automation name</label>
            <input
              type="text"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="e.g. Monthly stager outreach"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* List */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Audience list</label>
              {lists.length === 0 ? (
                <p className="text-xs text-zinc-400 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  No lists yet — import contacts and create a list in the Contacts tab.
                </p>
              ) : (
                <select
                  value={formListId}
                  onChange={e => setFormListId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="">Select list…</option>
                  {lists.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.count} contacts)</option>
                  ))}
                </select>
              )}
            </div>

            {/* Sender */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">From</label>
              {senders.length === 0 ? (
                <p className="text-xs text-red-500 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
                  No senders.{' '}
                  <button onClick={onGoToSetup} className="underline font-medium hover:no-underline">Setup SendGrid →</button>
                </p>
              ) : (
                <select
                  value={formSenderId}
                  onChange={e => setFormSenderId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  {senders.map(s => (
                    <option key={s.id} value={s.id}>{s.nickname} &lt;{s.from_email}&gt;</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Template picker */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Template <span className="font-normal text-zinc-400">(optional — pre-fills subject & body)</span>
            </label>
            <select
              value={formTemplateId}
              onChange={e => handleTemplateChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="">No template — compose below</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Subject</label>
            <input
              type="text"
              value={formSubject}
              onChange={e => setFormSubject(e.target.value)}
              placeholder="e.g. New listings in {{city}}, {{first_name}}"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Body</label>
            <textarea
              value={formBody}
              onChange={e => setFormBody(e.target.value)}
              rows={6}
              placeholder={"Hi {{first_name}},\n\n..."}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono resize-y"
            />
          </div>

          {/* Unsubscribe URL */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Unsubscribe URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={formUnsubscribeUrl}
              onChange={e => setFormUnsubscribeUrl(e.target.value)}
              placeholder="https://yourdomain.com/unsubscribe"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <p className="mt-1 text-xs text-zinc-400">Required by law. An unsubscribe link is automatically appended to every email sent by this automation.</p>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Schedule</label>
            <div className="flex items-center gap-2 flex-wrap">
              {SCHEDULES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setFormSchedule(s.value as any)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                    formSchedule === s.value
                      ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 font-medium'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {(() => {
              const s = SCHEDULES.find(s => s.value === formSchedule);
              if (s?.hint) return <p className="text-xs text-zinc-400 mt-1.5">{s.hint}</p>;
              if (formSchedule !== 'manual' && formSchedule !== 'on_sync') return <p className="text-xs text-zinc-400 mt-1.5">Scheduled sends will run automatically once scheduling is wired in a future update. For now, use Run now to send manually.</p>;
              return null;
            })()}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold text-sm disabled:opacity-60 transition-colors"
            >
              {saving ? 'Saving…' : 'Save automation'}
            </button>
          </div>
        </div>
      )}

      {/* Automations list */}
      {loading ? (
        <div className="text-sm text-zinc-400 text-center py-12">Loading…</div>
      ) : automations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-400">
          <Zap size={36} className="opacity-20" />
          <p className="text-sm">No automations yet. Create one above to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map(a => (
            <div
              key={a.id}
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{a.name}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                      a.status === 'active'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                    }`}>
                      {a.status}
                    </span>
                    <span className="text-xs text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-full">
                      {SCHEDULES.find(s => s.value === a.schedule)?.label}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 flex-wrap text-xs text-zinc-400">
                    <span>List: <span className="text-zinc-600 dark:text-zinc-300">{a.list_name}</span></span>
                    <span>Last run: <span className="text-zinc-600 dark:text-zinc-300">{formatDate(a.last_run_at)}</span></span>
                    <span>Total sent: <span className="text-zinc-600 dark:text-zinc-300">{a.total_sent.toLocaleString()}</span></span>
                  </div>
                  {a.subject && (
                    <p className="mt-1 text-xs text-zinc-400 truncate max-w-md">
                      Subject: <span className="text-zinc-500 dark:text-zinc-300">{a.subject}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleRunNow(a)}
                    disabled={running === a.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-zinc-900 text-xs font-semibold disabled:opacity-60 transition-colors"
                  >
                    <Play size={11} />
                    {running === a.id ? 'Sending…' : 'Run now'}
                  </button>
                  <button
                    onClick={() => handleToggleStatus(a)}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    title={a.status === 'active' ? 'Pause' : 'Activate'}
                  >
                    {a.status === 'active' ? <Pause size={13} /> : <Play size={13} />}
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
