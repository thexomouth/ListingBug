import { useState, useEffect, useRef } from 'react';
import { Send, Save, AlertCircle, TriangleAlert, Eye, Paperclip, X, Mail, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TemplateDropdown } from './TemplateDropdown';
import { EmailPreviewModal } from './EmailPreviewModal';
import { toast } from 'sonner';

const SUPABASE_FUNCTIONS = 'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1';

const MERGE_TAGS: Record<string, { label: string; value: string }[]> = {
  email: [
    { label: 'First name', value: '{{first_name}}' },
    { label: 'Last name',  value: '{{last_name}}' },
    { label: 'City',       value: '{{city}}' },
    { label: 'Company',    value: '{{company}}' },
  ],
  // sms: [...] when SMS is added
};

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

interface PlatformStatus {
  mailchimp: boolean;
  hubspot: boolean;
  twilio: boolean;
}

interface CreateTabProps {
  selectedRecipients: Recipient[];
  onClearRecipients: () => void;
  onCampaignSent: () => void;
  onGoToSetup: () => void;
}

export function CreateTab({ selectedRecipients, onClearRecipients, onCampaignSent, onGoToSetup }: CreateTabProps) {
  const [channel, setChannel] = useState<'email' | 'sms'>('email');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [senderId, setSenderId] = useState('');
  const [senders, setSenders] = useState<Sender[]>([]);
  const [sendersLoading, setSendersLoading] = useState(true);
  const [platformStatus, setPlatformStatus] = useState<PlatformStatus>({ mailchimp: false, hubspot: false, twilio: false });
  const [webhookConfigured, setWebhookConfigured] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [showWebhookWarning, setShowWebhookWarning] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [lastResult, setLastResult] = useState<{ sent: number; failed: number } | null>(null);
  const [useCustomUnsub, setUseCustomUnsub] = useState(false);
  const [customUnsubUrl, setCustomUnsubUrl] = useState('');
  const [attachments, setAttachments] = useState<Array<{ id: string; fileName: string; mimeType: string; base64: string; size: number }>>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const insertMergeTag = (tag: string) => {
    const el = bodyRef.current;
    if (!el) { setBody(prev => prev + tag); return; }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + tag + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + tag.length;
      el.focus();
    });
  };

  useEffect(() => {
    const load = async () => {
      setSendersLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Load senders
        const res = await fetch(`${SUPABASE_FUNCTIONS}/get-marketing-config?action=senders`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSenders(data.senders ?? []);
          if (data.senders?.length > 0) setSenderId(data.senders[0].id);
        }

        // Check webhook_secret + platform connection status
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: mc } = await supabase
            .from('messaging_config')
            .select('config')
            .eq('user_id', user.id)
            .eq('platform', 'sendgrid')
            .maybeSingle();
          setWebhookConfigured(!!(mc?.config?.webhook_secret));
        }

        // Load platform status for the selector strip
        try {
          const platformRes = await fetch(`${SUPABASE_FUNCTIONS}/get-marketing-config?action=platforms`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (platformRes.ok) {
            const p = await platformRes.json();
            setPlatformStatus({
              mailchimp: p.mailchimp?.connected ?? false,
              hubspot: p.hubspot?.connected ?? false,
              twilio: p.twilio?.connected ?? false,
            });
          }
        } catch { /* ignore */ }
      } catch {
        // SendGrid not yet configured
      }
      setSendersLoading(false);
    };
    load();
  }, []);

  const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB per file
  const MAX_TOTAL_BYTES = 30 * 1024 * 1024; // 30 MB total (SendGrid limit)

  const processFiles = (files: FileList | File[]) => {
    const incoming = Array.from(files);
    const totalExisting = attachments.reduce((sum, a) => sum + a.size, 0);
    let runningTotal = totalExisting;

    incoming.forEach(file => {
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name} exceeds the 25 MB per-file limit.`);
        return;
      }
      if (runningTotal + file.size > MAX_TOTAL_BYTES) {
        toast.error(`Adding ${file.name} would exceed the 30 MB total attachment limit.`);
        return;
      }
      runningTotal += file.size;

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        setAttachments(prev => [...prev, {
          id: crypto.randomUUID(),
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          base64,
          size: file.size,
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => setAttachments(prev => prev.filter(a => a.id !== id));

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Validation: returns an error string or null if all clear
  const validate = (): string | null => {
    if (selectedRecipients.length === 0) return 'No recipients selected. Choose contacts in the Contacts tab.';
    if (!senderId) return 'No sender selected. Add a sender identity in Setup.';
    if (senders.length === 0) return 'No SendGrid sender configured. Go to Setup to connect an integration and verify a sender.';
    if (!subject.trim()) return 'Subject is required.';
    if (!body.trim()) return 'Body is required.';
    if (useCustomUnsub) {
      if (!customUnsubUrl.trim()) return 'Enter a custom unsubscribe URL or switch back to ListingBug.';
      try { new URL(customUnsubUrl.trim()); } catch { return 'Custom unsubscribe URL must be a valid URL (e.g. https://yourdomain.com/unsubscribe).'; }
    }
    return null;
  };

  const doSend = async () => {
    setSending(true);
    setLastResult(null);
    setShowWebhookWarning(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Not authenticated.'); return; }

      const campaignId = crypto.randomUUID();
      const unsubscribeUrl = useCustomUnsub
        ? customUnsubUrl.trim()
        : `${SUPABASE_FUNCTIONS}/handle-unsubscribe?user_id=${session.user.id}&campaign_id=${campaignId}`;

      const res = await fetch(`${SUPABASE_FUNCTIONS}/send-marketing-email`, {
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
          campaign_id: campaignId,
          unsubscribe_url: unsubscribeUrl,
          attachments: attachments.map(({ fileName, mimeType, base64 }) => ({ fileName, mimeType, base64 })),
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

  const handleSend = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }

    // Warn if webhook not configured — performance metrics will be unavailable
    if (!webhookConfigured) {
      setShowWebhookWarning(true);
      return;
    }

    await doSend();
  };

  const handleSaveCampaign = async () => {
    if (!senderId) { toast.error('Select a sender before saving a campaign.'); return; }
    if (!subject.trim()) { toast.error('Subject is required.'); return; }
    if (!body.trim()) { toast.error('Body is required.'); return; }

    const name = (campaignName.trim() || subject.trim()).slice(0, 120);
    setSavingCampaign(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Not signed in.'); return; }

      if (useCustomUnsub && !customUnsubUrl.trim()) { toast.error('Enter a custom unsubscribe URL or switch back to ListingBug.'); return; }
      if (useCustomUnsub) { try { new URL(customUnsubUrl.trim()); } catch { toast.error('Custom unsubscribe URL must be a valid URL.'); return; } }

      // Fetch all existing automations with this name (maybeSingle errors on duplicates)
      const { data: existingAutos } = await supabase
        .from('messaging_automations')
        .select('id, list_id, unsubscribe_url')
        .eq('user_id', user.id)
        .eq('name', name);

      const existingAuto = existingAutos?.[0] ?? null;

      // Delete all (clears any duplicates that may have accumulated)
      if (existingAutos && existingAutos.length > 0) {
        await supabase
          .from('messaging_automations')
          .delete()
          .eq('user_id', user.id)
          .eq('name', name);
      }

      // Preserve first existing ID/URL so suppressions stay valid
      const automationId = existingAuto?.id ?? crypto.randomUUID();
      const unsubscribeUrl = useCustomUnsub
        ? customUnsubUrl.trim()
        : (existingAuto?.unsubscribe_url ?? `${SUPABASE_FUNCTIONS}/handle-unsubscribe?user_id=${user.id}&campaign_id=${automationId}`);

      // Reuse or create the campaign's marketing list
      let listId: string;
      if (existingAuto?.list_id) {
        listId = existingAuto.list_id;
      } else {
        const { data: existingList } = await supabase
          .from('marketing_lists')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', name)
          .maybeSingle();

        if (existingList) {
          listId = existingList.id;
        } else {
          const { data: newList, error: listErr } = await supabase
            .from('marketing_lists')
            .insert({ user_id: user.id, name })
            .select('id')
            .single();
          if (listErr || !newList) { toast.error('Failed to create campaign list.'); return; }
          listId = newList.id;
        }
      }

      const payload = {
        user_id: user.id,
        name,
        subject: subject.trim(),
        body: body.trim(),
        sender_id: String(senderId),
        list_id: listId,
        schedule: 'manual',
        status: 'active',
        unsubscribe_url: unsubscribeUrl,
        updated_at: new Date().toISOString(),
      };

      // Always insert (deleted above); preserves ID so suppressions stay valid
      const { error: saveError } = await supabase
        .from('messaging_automations')
        .insert({ id: automationId, ...payload });

      if (saveError) { toast.error(saveError.message); return; }
      toast.success(`Campaign "${name}" ${existingAuto ? 'updated' : 'saved'}.`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Unexpected error.');
    } finally {
      setSavingCampaign(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Create Campaign</h2>
          {/* Channel toggle */}
          <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden text-sm">
            <button
              onClick={() => setChannel('email')}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                channel === 'email'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <Mail size={13} /> Email
            </button>
            <button
              onClick={() => setChannel('sms')}
              className={`flex items-center gap-1.5 px-3 py-1.5 border-l border-zinc-200 dark:border-zinc-700 transition-colors ${
                channel === 'sms'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <MessageSquare size={13} /> SMS
            </button>
          </div>
        </div>
        <TemplateDropdown
          channel={channel}
          onSelect={(c) => {
            if (c.name) setCampaignName(c.name);
            if (c.subject) setSubject(c.subject);
            if (c.body) setBody(c.body);
            if (c.sender_id) setSenderId(c.sender_id);
          }}
        />
      </div>

      {/* SMS coming soon */}
      {channel === 'sms' && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-center px-6">
          <MessageSquare size={36} className="text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">SMS sending coming soon</p>
          <p className="text-sm text-zinc-400 max-w-sm">
            SMS outreach via Twilio is being wired in a future update. Connect Twilio in{' '}
            <button onClick={onGoToSetup} className="underline hover:no-underline text-zinc-500 dark:text-zinc-300">
              Messaging Setup
            </button>{' '}
            to be ready when it launches.
          </p>
        </div>
      )}

      {/* Platform strip — shown when email channel active and other integrations connected */}
      {channel === 'email' && (platformStatus.mailchimp || platformStatus.hubspot) && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Sending via:</span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 font-medium">SendGrid</span>
          {platformStatus.mailchimp && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400">
              Mailchimp contacts available · direct send coming
            </span>
          )}
          {platformStatus.hubspot && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400">
              HubSpot contacts available · direct send requires Marketing Hub
            </span>
          )}
        </div>
      )}

      {/* Email form — hidden when SMS selected */}
      {channel === 'email' && <>

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
          <div className="px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
            No verified senders found. Go to{' '}
            <button onClick={onGoToSetup} className="underline font-medium hover:no-underline">Setup</button>
            {' '}to connect an integration and verify a sender before sending.
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
          ref={bodyRef}
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={"Hi {{first_name}},\n\nHere are this week's new listings in {{city}}..."}
          rows={10}
          className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono resize-y"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {(MERGE_TAGS['email'] ?? []).map(tag => (
            <button
              key={tag.value}
              type="button"
              onClick={() => insertMergeTag(tag.value)}
              className="px-2 py-0.5 rounded font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:border-yellow-300 dark:hover:border-yellow-600 hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors"
            >
              {tag.value}
            </button>
          ))}
        </div>
      </div>

      {/* Attachments */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Attachments <span className="text-zinc-400 font-normal">(optional — 25 MB per file, 30 MB total)</span>
        </label>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDraggingOver(true); }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={e => { e.preventDefault(); setIsDraggingOver(false); processFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors text-sm ${
            isDraggingOver
              ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
              : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <Paperclip size={16} className="shrink-0" />
          <span>Click or drag files here to attach</span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={e => { if (e.target.files) { processFiles(e.target.files); e.target.value = ''; } }}
          />
        </div>

        {/* Attached file list */}
        {attachments.length > 0 && (
          <ul className="mt-2 space-y-1">
            {attachments.map(a => (
              <li key={a.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Paperclip size={13} className="text-zinc-400 shrink-0" />
                  <span className="truncate text-zinc-800 dark:text-zinc-200">{a.fileName}</span>
                  <span className="text-zinc-400 shrink-0">{formatBytes(a.size)}</span>
                </div>
                <button
                  onClick={() => removeAttachment(a.id)}
                  className="shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                  aria-label={`Remove ${a.fileName}`}
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Unsubscribe link */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Unsubscribe link
        </label>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setUseCustomUnsub(false)}
            className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              !useCustomUnsub
                ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            ListingBug (automatic)
          </button>
          <button
            type="button"
            onClick={() => setUseCustomUnsub(true)}
            className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              useCustomUnsub
                ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            Custom URL
          </button>
        </div>

        {!useCustomUnsub ? (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="shrink-0 mt-0.5 text-green-500">✓</span>
            <span>ListingBug generates a unique opt-out link for this campaign. Recipients who click it are added to your campaign suppression list automatically — no setup required.</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            <input
              type="url"
              value={customUnsubUrl}
              onChange={e => setCustomUnsubUrl(e.target.value)}
              placeholder="https://yourdomain.com/unsubscribe"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <p className="text-xs text-zinc-400">
              Your custom unsubscribe page URL. An opt-out link will be appended to every email — managing the suppression list is your responsibility.
            </p>
          </div>
        )}
      </div>

      {/* Last result */}
      {lastResult && (
        <div className="text-sm text-zinc-600 dark:text-zinc-400 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
          Last send: <span className="text-green-700 dark:text-green-400 font-medium">{lastResult.sent} sent</span>
          {lastResult.failed > 0 && <span className="text-red-500 ml-2">{lastResult.failed} failed</span>}
        </div>
      )}

      {/* Webhook warning confirmation */}
      {showWebhookWarning && (
        <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <TriangleAlert size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Email performance metrics are not active for this account.
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                Delivery tracking, bounce alerts, and open rates won't be recorded.{' '}
                <button
                  onClick={() => { setShowWebhookWarning(false); onGoToSetup(); }}
                  className="underline font-medium hover:no-underline"
                >
                  Setup is easy →
                </button>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => setShowWebhookWarning(false)}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={doSend}
              disabled={sending}
              className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-zinc-900 text-sm font-semibold disabled:opacity-60 transition-colors"
            >
              {sending ? 'Sending…' : 'Send anyway'}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleSend}
          disabled={sending || showWebhookWarning}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={15} />
          {sending ? 'Sending…' : 'Send'}
        </button>

        <button
          onClick={handleSaveCampaign}
          disabled={savingCampaign}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-semibold disabled:opacity-60 transition-colors"
        >
          <Save size={15} />
          {savingCampaign ? 'Saving…' : 'Save Campaign'}
        </button>

        <button
          onClick={() => setShowPreview(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm transition-colors"
        >
          <Eye size={15} />
          Preview
        </button>

      </div>

      {showPreview && (
        <EmailPreviewModal
          subject={subject}
          body={body}
          fromName={senders.find(s => s.id === senderId)?.from_name ?? senders.find(s => s.id === senderId)?.nickname ?? ''}
          fromEmail={senders.find(s => s.id === senderId)?.from_email ?? ''}
          sampleRecipient={selectedRecipients[0]}
          onClose={() => setShowPreview(false)}
        />
      )}

      </> /* end email form */}
    </div>
  );
}
