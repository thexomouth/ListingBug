import { useState, useEffect } from 'react';
import { Send, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { MergeTagFooter } from './MergeTagFooter';
import { TemplateDropdown } from './TemplateDropdown';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface Recipient {
  email: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  company?: string;
  contact_id?: string;
}

interface Sender {
  id: string;
  nickname: string;
  from_email: string;
  from_name: string;
}

interface CreateTabProps {
  selectedRecipients: Recipient[];
  onClearRecipients: () => void;
  onCampaignSent: () => void;
}

export function CreateTab({ selectedRecipients, onClearRecipients, onCampaignSent }: CreateTabProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [senderId, setSenderId] = useState('');
  const [senders, setSenders] = useState<Sender[]>([]);
  const [sendersLoading, setSendersLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [lastResult, setLastResult] = useState<{ sent: number; failed: number } | null>(null);

  useEffect(() => {
    const load = async () => {
      setSendersLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(`${SUPABASE_URL}/functions/v1/get-marketing-config?action=senders`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSenders(data.senders ?? []);
          if (data.senders?.length > 0) setSenderId(data.senders[0].id);
        }
      } catch {
        // Senders unavailable — key not yet configured
      }
      setSendersLoading(false);
    };
    load();
  }, []);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) { toast.error('Subject and body are required.'); return; }
    if (!senderId) { toast.error('Select a sender identity first.'); return; }
    if (selectedRecipients.length === 0) { toast.error('No recipients selected. Choose contacts in the Contacts tab.'); return; }

    setSending(true);
    setLastResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Not authenticated.'); return; }

      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-marketing-email`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients: selectedRecipients,
          subject: subject.trim(),
          body: body.trim(),
          campaign_name: campaignName.trim() || subject.trim(),
          sender_id: senderId,
        }),
      });

      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Send failed.'); return; }

      setLastResult({ sent: data.sent, failed: data.failed });
      toast.success(`Sent ${data.sent} email${data.sent !== 1 ? 's' : ''}${data.failed > 0 ? ` (${data.failed} failed)` : ''}.`);
      onClearRecipients();
      onCampaignSent();
    } catch (e: any) {
      toast.error(e?.message ?? 'Unexpected error.');
    } finally {
      setSending(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!saveTemplateName.trim()) { toast.error('Template name is required.'); return; }
    setSavingTemplate(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('marketing_templates').insert({
      user_id: user.id,
      name: saveTemplateName.trim(),
      channel: 'email',
      subject: subject.trim() || null,
      body: body.trim() || null,
    });
    setSavingTemplate(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Template saved.');
    setShowSaveTemplate(false);
    setSaveTemplateName('');
  };

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Compose Email</h2>
        <TemplateDropdown
          channel="email"
          onSelect={(t) => {
            if (t.subject) setSubject(t.subject);
            if (t.body) setBody(t.body);
          }}
        />
      </div>

      {/* Recipients */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          To
        </label>
        {selectedRecipients.length === 0 ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-400">
            <AlertCircle size={14} />
            No recipients selected — go to Contacts tab and select contacts, then return here.
          </div>
        ) : (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 text-sm">
            <span className="text-yellow-800 dark:text-yellow-300 font-medium">
              {selectedRecipients.length} recipient{selectedRecipients.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={onClearRecipients}
              className="text-xs text-yellow-600 dark:text-yellow-400 underline hover:no-underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Campaign name */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Campaign name <span className="text-zinc-400 font-normal">(optional — defaults to subject)</span>
        </label>
        <input
          type="text"
          value={campaignName}
          onChange={e => setCampaignName(e.target.value)}
          placeholder="e.g. April Outreach — Downtown Agents"
          className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {/* Sender */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">From</label>
        {sendersLoading ? (
          <div className="px-3 py-2 text-sm text-zinc-400 rounded-lg border border-zinc-200 dark:border-zinc-700">Loading sender identities…</div>
        ) : senders.length === 0 ? (
          <div className="px-3 py-2 text-sm text-amber-600 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
            No verified senders found. Add SENDGRID_ADMIN_KEY to Supabase secrets, then verify a sender in SendGrid.
          </div>
        ) : (
          <select
            value={senderId}
            onChange={e => setSenderId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            {senders.map(s => (
              <option key={s.id} value={s.id}>
                {s.nickname} &lt;{s.from_email}&gt;
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder='e.g. New listings in {{city}}, {{first_name}}'
          className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Body</label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={"Hi {{first_name}},\n\nHere are this week's new listings in {{city}}..."}
          rows={10}
          className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono resize-y"
        />
      </div>

      {/* SMS stub */}
      <div className="relative rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 opacity-50 pointer-events-none select-none">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">SMS channel</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400">Coming in Stage 2</span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">SMS sending via SendGrid or Twilio. Not yet available.</p>
      </div>

      {/* Last result */}
      {lastResult && (
        <div className="text-sm text-zinc-600 dark:text-zinc-400 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
          Last send: <span className="text-green-700 dark:text-green-400 font-medium">{lastResult.sent} sent</span>
          {lastResult.failed > 0 && <span className="text-red-500 ml-2">{lastResult.failed} failed</span>}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleSend}
          disabled={sending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={15} />
          {sending ? 'Sending…' : 'Send'}
        </button>

        <button
          onClick={() => setShowSaveTemplate(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm transition-colors"
        >
          <Save size={15} />
          Save as template
        </button>
      </div>

      {/* Save template inline */}
      {showSaveTemplate && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Template name"
            value={saveTemplateName}
            onChange={e => setSaveTemplateName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSaveTemplate(); }}
            className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            onClick={handleSaveTemplate}
            disabled={savingTemplate}
            className="px-3 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-zinc-900 text-sm font-semibold disabled:opacity-60 transition-colors"
          >
            {savingTemplate ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}

      <MergeTagFooter />
    </div>
  );
}
