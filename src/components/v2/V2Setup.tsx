import { useState, useEffect, useCallback } from 'react';
import { Mail, Server, CheckCircle2, ChevronDown, ChevronRight, Star, Unlink, Loader2, RefreshCw, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SMTPSetupModal } from '../SMTPSetupModal';
import { Input } from '../ui/input';
import { buildGmailAuthUrl } from '../../utils/gmailOAuth';
import { buildOutlookAuthUrl } from '../../utils/outlookOAuth';
import { toast } from 'sonner';

interface Sender {
  id: string;
  display_name: string;
  from_email: string;
  from_name: string | null;
  integration_id: string;
  connected_at: string | null;
  config: Record<string, any> | null;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SenderCard({
  title, subtitle, icon, connected, isDefault, open, onToggle, children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  connected: boolean;
  isDefault: boolean;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#1a1a1a]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
          connected
            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
            : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500'
        }`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 dark:text-white">{title}</span>
            {isDefault && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: '#FFCE0A22', color: '#92700a' }}>
                Default
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{subtitle}</div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {connected ? (
            <span className="hidden sm:flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Connected
            </span>
          ) : (
            <span className="hidden sm:block text-xs text-gray-400 dark:text-gray-500">Not connected</span>
          )}
          {open
            ? <ChevronDown className="w-4 h-4 text-gray-400" />
            : <ChevronRight className="w-4 h-4 text-gray-400" />
          }
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-white/10 px-5 py-5">
          {children}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-white/10 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

function ConnectPrompt({
  description, buttonLabel, onClick,
}: {
  description: string;
  buttonLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors hover:brightness-95"
        style={{ background: '#FFCE0A', color: '#342e37' }}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function ConnectedDetails({
  sender, isDefault, disconnecting, settingDefault,
  editingFromName, fromNameValue, savingFromName,
  onStartEdit, onFromNameChange, onSaveFromName, onCancelEdit,
  onSetDefault, onDisconnect, onReconnect,
}: {
  sender: Sender;
  isDefault: boolean;
  disconnecting: boolean;
  settingDefault: boolean;
  editingFromName: boolean;
  fromNameValue: string;
  savingFromName: boolean;
  onStartEdit: () => void;
  onFromNameChange: (v: string) => void;
  onSaveFromName: () => void;
  onCancelEdit: () => void;
  onSetDefault: () => void;
  onDisconnect: () => void;
  onReconnect?: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Detail rows */}
      <div>
        <DetailRow label="Email" value={sender.from_email} />

        {/* From name — inline editable */}
        <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-white/10">
          <span className="text-sm text-gray-500 dark:text-gray-400">From name</span>
          {editingFromName ? (
            <div className="flex items-center gap-2">
              <Input
                value={fromNameValue}
                onChange={e => onFromNameChange(e.target.value)}
                className="h-7 text-sm w-44"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') onSaveFromName();
                  if (e.key === 'Escape') onCancelEdit();
                }}
              />
              <button
                type="button"
                onClick={onSaveFromName}
                disabled={savingFromName || !fromNameValue.trim()}
                className="text-xs px-2.5 py-1 rounded-lg font-semibold disabled:opacity-50"
                style={{ background: '#FFCE0A', color: '#342e37' }}
              >
                {savingFromName ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {sender.from_name || <span className="text-gray-400 italic">Not set</span>}
              </span>
              <button
                type="button"
                onClick={onStartEdit}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Edit from name"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {sender.connected_at && (
          <DetailRow
            label="Connected"
            value={new Date(sender.connected_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          />
        )}

        {sender.config?.host && (
          <DetailRow label="SMTP host" value={`${sender.config.host}:${sender.config.port ?? 587}`} />
        )}
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {!isDefault && (
            <button
              type="button"
              onClick={onSetDefault}
              disabled={settingDefault}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/15 text-gray-600 dark:text-gray-400 hover:border-[#FFCE0A] hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
            >
              <Star className="w-3 h-3" />
              {settingDefault ? 'Updating…' : 'Set as default'}
            </button>
          )}
          {isDefault && (
            <span className="flex items-center gap-1.5 text-xs text-[#92700a] dark:text-[#FFCE0A] font-medium">
              <Star className="w-3 h-3" /> Default sender
            </span>
          )}
          {onReconnect && (
            <button
              type="button"
              onClick={onReconnect}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/15 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/25 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Reconnect
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onDisconnect}
          disabled={disconnecting}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors disabled:opacity-50"
        >
          <Unlink className="w-3 h-3" />
          {disconnecting ? 'Disconnecting…' : 'Disconnect'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function V2Setup() {
  const [userId, setUserId] = useState<string | null>(null);
  const [contactName, setContactName] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [defaultSenderId, setDefaultSenderId] = useState<string | null>(null);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<'gmail' | 'outlook' | 'smtp' | null>(null);
  const [smtpModalOpen, setSmtpModalOpen] = useState(false);

  // Inline from-name editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fromNameValue, setFromNameValue] = useState('');
  const [savingFromName, setSavingFromName] = useState(false);

  // Action loading states
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [{ data: userData }, { data: sendersData }] = await Promise.all([
        supabase
          .from('users')
          .select('contact_name, business_name, default_sender_id')
          .eq('id', user.id)
          .single(),
        supabase
          .from('integration_connections')
          .select('id, display_name, from_email, from_name, integration_id, connected_at, config')
          .eq('user_id', user.id)
          .eq('is_sender', true)
          .eq('status', 'active')
          .order('connected_at', { ascending: false }),
      ]);

      if (userData) {
        setContactName(userData.contact_name ?? null);
        setBusinessName(userData.business_name ?? null);
        setDefaultSenderId(userData.default_sender_id ?? null);
      }
      setSenders(sendersData ?? []);
    } catch (err) {
      console.error('[V2Setup] Load failed:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();

    // Handle OAuth return
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');

    if (success === 'gmail_connected') {
      toast.success('Gmail connected!');
      window.history.replaceState({}, '', window.location.pathname);
      setExpandedCard('gmail');
    } else if (success === 'outlook_connected') {
      toast.success('Outlook connected!');
      window.history.replaceState({}, '', window.location.pathname);
      setExpandedCard('outlook');
    } else if (error) {
      const msgs: Record<string, string> = {
        gmail_canceled: 'Gmail connection was canceled',
        gmail_invalid: 'Invalid Gmail authorization',
        gmail_exchange_failed: 'Failed to connect Gmail',
        outlook_canceled: 'Outlook connection was canceled',
        outlook_invalid: 'Invalid Outlook authorization',
        outlook_exchange_failed: 'Failed to connect Outlook',
        state_mismatch: 'Security verification failed — please try again',
      };
      if (msgs[error]) toast.error(msgs[error]);
    }
  }, [loadData]);

  const handleGmailConnect = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Session expired — please refresh'); return; }
      window.location.href = await buildGmailAuthUrl(session.user.id);
    } catch {
      toast.error('Failed to initiate Gmail connection');
    }
  };

  const handleOutlookConnect = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Session expired — please refresh'); return; }
      window.location.href = await buildOutlookAuthUrl(session.user.id);
    } catch {
      toast.error('Failed to initiate Outlook connection');
    }
  };

  const handleSetDefault = async (senderId: string) => {
    if (!userId) return;
    setSettingDefault(senderId);
    const { error } = await supabase.from('users').update({ default_sender_id: senderId }).eq('id', userId);
    if (error) toast.error('Failed to update default sender');
    else { setDefaultSenderId(senderId); toast.success('Default sender updated'); }
    setSettingDefault(null);
  };

  const handleDisconnect = async (sender: Sender) => {
    const label = sender.from_email || sender.display_name;
    if (!window.confirm(`Disconnect ${label}?\n\nAny active campaigns using this sender will stop delivering until you reconnect.`)) return;
    setDisconnecting(sender.id);
    const { error } = await supabase
      .from('integration_connections')
      .update({ status: 'inactive' })
      .eq('id', sender.id);
    if (error) {
      toast.error('Failed to disconnect');
    } else {
      toast.success(`${label} disconnected`);
      setSenders(prev => prev.filter(s => s.id !== sender.id));
      if (defaultSenderId === sender.id && userId) {
        setDefaultSenderId(null);
        await supabase.from('users').update({ default_sender_id: null }).eq('id', userId);
      }
    }
    setDisconnecting(null);
  };

  const handleSaveFromName = async (senderId: string) => {
    const trimmed = fromNameValue.trim();
    if (!trimmed) return;
    setSavingFromName(true);
    const { error } = await supabase
      .from('integration_connections')
      .update({ from_name: trimmed })
      .eq('id', senderId);
    if (error) {
      toast.error('Failed to save from name');
    } else {
      setSenders(prev => prev.map(s => s.id === senderId ? { ...s, from_name: trimmed } : s));
      toast.success('From name updated');
      setEditingId(null);
    }
    setSavingFromName(false);
  };

  // For SMTP reconnect: deactivate existing SMTP connection then open modal
  const handleSmtpReconnect = async () => {
    const existing = senders.find(s => s.integration_id === 'smtp');
    if (existing) {
      await supabase.from('integration_connections').update({ status: 'inactive' }).eq('id', existing.id);
      setSenders(prev => prev.filter(s => s.id !== existing.id));
      if (defaultSenderId === existing.id && userId) {
        setDefaultSenderId(null);
        await supabase.from('users').update({ default_sender_id: null }).eq('id', userId);
      }
    }
    setSmtpModalOpen(true);
  };

  const gmailSender = senders.find(s => s.integration_id === 'gmail');
  const outlookSender = senders.find(s => s.integration_id === 'outlook');
  const smtpSender = senders.find(s => s.integration_id === 'smtp');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0F1115] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F1115]">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sender Identities</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
            Connect the email accounts ListingBug sends from on your behalf.
          </p>
        </div>

        {/* Sender cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">

          {/* Gmail */}
          <SenderCard
            title="Gmail"
            subtitle={gmailSender ? gmailSender.from_email : 'Send via Google OAuth — no password required'}
            icon={<Mail className="w-5 h-5" />}
            connected={!!gmailSender}
            isDefault={defaultSenderId === gmailSender?.id}
            open={expandedCard === 'gmail'}
            onToggle={() => setExpandedCard(prev => prev === 'gmail' ? null : 'gmail')}
          >
            {gmailSender ? (
              <ConnectedDetails
                sender={gmailSender}
                isDefault={defaultSenderId === gmailSender.id}
                disconnecting={disconnecting === gmailSender.id}
                settingDefault={settingDefault === gmailSender.id}
                editingFromName={editingId === gmailSender.id}
                fromNameValue={fromNameValue}
                savingFromName={savingFromName}
                onStartEdit={() => { setEditingId(gmailSender.id); setFromNameValue(gmailSender.from_name ?? ''); }}
                onFromNameChange={setFromNameValue}
                onSaveFromName={() => handleSaveFromName(gmailSender.id)}
                onCancelEdit={() => setEditingId(null)}
                onSetDefault={() => handleSetDefault(gmailSender.id)}
                onDisconnect={() => handleDisconnect(gmailSender)}
              />
            ) : (
              <ConnectPrompt
                description="Connect your Google account and send emails directly from your Gmail address. ListingBug only requests permission to send — it cannot read your inbox."
                buttonLabel="Connect with Google"
                onClick={handleGmailConnect}
              />
            )}
          </SenderCard>

          {/* Outlook */}
          <SenderCard
            title="Outlook"
            subtitle={outlookSender ? outlookSender.from_email : 'Send via Microsoft OAuth — works with Outlook.com and Microsoft 365'}
            icon={<Mail className="w-5 h-5" />}
            connected={!!outlookSender}
            isDefault={defaultSenderId === outlookSender?.id}
            open={expandedCard === 'outlook'}
            onToggle={() => setExpandedCard(prev => prev === 'outlook' ? null : 'outlook')}
          >
            {outlookSender ? (
              <ConnectedDetails
                sender={outlookSender}
                isDefault={defaultSenderId === outlookSender.id}
                disconnecting={disconnecting === outlookSender.id}
                settingDefault={settingDefault === outlookSender.id}
                editingFromName={editingId === outlookSender.id}
                fromNameValue={fromNameValue}
                savingFromName={savingFromName}
                onStartEdit={() => { setEditingId(outlookSender.id); setFromNameValue(outlookSender.from_name ?? ''); }}
                onFromNameChange={setFromNameValue}
                onSaveFromName={() => handleSaveFromName(outlookSender.id)}
                onCancelEdit={() => setEditingId(null)}
                onSetDefault={() => handleSetDefault(outlookSender.id)}
                onDisconnect={() => handleDisconnect(outlookSender)}
              />
            ) : (
              <ConnectPrompt
                description="Connect your Microsoft account to send emails directly from Outlook.com, Hotmail, or a Microsoft 365 work address. Authorization is handled securely via OAuth."
                buttonLabel="Connect with Microsoft"
                onClick={handleOutlookConnect}
              />
            )}
          </SenderCard>

          {/* Custom SMTP */}
          <SenderCard
            title="Custom SMTP"
            subtitle={smtpSender ? smtpSender.from_email : 'Connect any SMTP provider — SendGrid, Amazon SES, Postmark, and more'}
            icon={<Server className="w-5 h-5" />}
            connected={!!smtpSender}
            isDefault={defaultSenderId === smtpSender?.id}
            open={expandedCard === 'smtp'}
            onToggle={() => setExpandedCard(prev => prev === 'smtp' ? null : 'smtp')}
          >
            {smtpSender ? (
              <ConnectedDetails
                sender={smtpSender}
                isDefault={defaultSenderId === smtpSender.id}
                disconnecting={disconnecting === smtpSender.id}
                settingDefault={settingDefault === smtpSender.id}
                editingFromName={editingId === smtpSender.id}
                fromNameValue={fromNameValue}
                savingFromName={savingFromName}
                onStartEdit={() => { setEditingId(smtpSender.id); setFromNameValue(smtpSender.from_name ?? ''); }}
                onFromNameChange={setFromNameValue}
                onSaveFromName={() => handleSaveFromName(smtpSender.id)}
                onCancelEdit={() => setEditingId(null)}
                onSetDefault={() => handleSetDefault(smtpSender.id)}
                onDisconnect={() => handleDisconnect(smtpSender)}
                onReconnect={handleSmtpReconnect}
              />
            ) : (
              <ConnectPrompt
                description="Connect any SMTP mail server to send from your own domain. Works with SendGrid, Amazon SES, Postmark, Zoho Mail, or your company's mail server."
                buttonLabel="Set up SMTP"
                onClick={() => setSmtpModalOpen(true)}
              />
            )}
          </SenderCard>
        </div>

        <p className="mt-6 text-xs text-gray-400 dark:text-gray-500 text-center">
          The <span className="font-medium text-gray-500 dark:text-gray-400">default sender</span> is selected automatically when creating a new campaign. You can change it per campaign.
        </p>
      </div>

      {smtpModalOpen && userId && (
        <SMTPSetupModal
          isOpen={smtpModalOpen}
          onClose={() => setSmtpModalOpen(false)}
          onSuccess={() => {
            setSmtpModalOpen(false);
            loadData();
            setExpandedCard('smtp');
          }}
          userId={userId}
          userContactName={contactName}
          userBusinessName={businessName}
        />
      )}
    </div>
  );
}
