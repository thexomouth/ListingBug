import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2, XCircle, AlertCircle, Send, Eye, EyeOff,
  Copy, ChevronDown, ChevronRight, RefreshCw, Key, Webhook,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

const SUPABASE_FUNCTIONS = 'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1';
const WEBHOOK_URL = `${SUPABASE_FUNCTIONS}/sendgrid-event-webhook`;

type KeySource = 'messaging_config' | 'integration' | 'env' | null;

interface PlatformStatus {
  sendgrid: { connected: boolean; source: KeySource; key_masked: string | null };
  mailchimp: { connected: boolean; source: KeySource; audience_count: number };
  hubspot: { connected: boolean; source: KeySource };
  twilio: { connected: boolean; source: KeySource };
}

interface Sender {
  id: string;
  nickname: string;
  from_email: string;
  from_name: string;
}

function copy(text: string, label = 'Copied') {
  navigator.clipboard.writeText(text);
  toast.success(label);
}

function StatusBadge({ connected, label }: { connected: boolean; label?: string }) {
  return connected ? (
    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
      <CheckCircle2 size={12} /> {label ?? 'Connected'}
    </span>
  ) : (
    <span className="flex items-center gap-1 text-xs text-zinc-400 font-medium">
      <XCircle size={12} /> {label ?? 'Not connected'}
    </span>
  );
}

function PlatformCard({
  title, subtitle, connected, source, extra, children, defaultOpen = false,
}: {
  title: string;
  subtitle: string;
  connected: boolean;
  source: KeySource;
  extra?: React.ReactNode;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{title}</p>
            <p className="text-xs text-zinc-400">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {extra}
          <StatusBadge connected={connected} />
          {open ? <ChevronDown size={15} className="text-zinc-400" /> : <ChevronRight size={15} className="text-zinc-400" />}
        </div>
      </button>
      {open && children && <div className="p-4 space-y-5 border-t border-zinc-200 dark:border-zinc-700">{children}</div>}
    </div>
  );
}

export function SetupTab() {
  const [platforms, setPlatforms] = useState<PlatformStatus | null>(null);
  const [platformsLoading, setPlatformsLoading] = useState(true);

  // SendGrid key management
  const [senders, setSenders] = useState<Sender[]>([]);
  const [sendersLoading, setSendersLoading] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [showKeyValue, setShowKeyValue] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  // Webhook
  const [showWebhookUrl, setShowWebhookUrl] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState('');
  const [savingWebhookSecret, setSavingWebhookSecret] = useState(false);
  const [webhookSecretSaved, setWebhookSecretSaved] = useState(false);

  // Test send
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const loadPlatforms = useCallback(async () => {
    setPlatformsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;
      const res = await fetch(`${SUPABASE_FUNCTIONS}/get-marketing-config?action=platforms`, {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });
      if (res.ok) setPlatforms(await res.json());
    } catch { /* ignore */ }
    setPlatformsLoading(false);
  }, []);

  const loadSenders = useCallback(async () => {
    setSendersLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;
      const res = await fetch(`${SUPABASE_FUNCTIONS}/get-marketing-config?action=senders`, {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSenders(data.senders ?? []);
      } else {
        setSenders([]);
      }
    } catch { setSenders([]); }
    setSendersLoading(false);
  }, []);

  useEffect(() => {
    loadPlatforms();
  }, []);

  useEffect(() => {
    if (platforms?.sendgrid.connected) loadSenders();
  }, [platforms?.sendgrid.connected]);

  // Check for saved webhook secret
  useEffect(() => {
    const checkWebhookSecret = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('messaging_config')
        .select('config')
        .eq('user_id', user.id)
        .eq('platform', 'sendgrid')
        .maybeSingle();
      if (data?.config?.webhook_secret) setWebhookSecretSaved(true);
    };
    checkWebhookSecret();
  }, []);

  const handleSaveKey = async () => {
    const trimmed = newKey.trim();
    if (!trimmed.startsWith('SG.')) {
      toast.error('SendGrid API keys start with "SG."');
      return;
    }
    setSavingKey(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Read existing config to merge (don't overwrite webhook_secret)
      const { data: existing } = await supabase
        .from('messaging_config')
        .select('config')
        .eq('user_id', user.id)
        .eq('platform', 'sendgrid')
        .maybeSingle();

      const mergedConfig = { ...(existing?.config ?? {}), api_key: trimmed };
      const { error } = await supabase
        .from('messaging_config')
        .upsert(
          { user_id: user.id, platform: 'sendgrid', config: mergedConfig, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,platform' }
        );

      if (error) { toast.error(error.message); setSavingKey(false); return; }

      // Verify the key works by loading senders
      const { data: session } = await supabase.auth.getSession();
      if (session.session) {
        const res = await fetch(`${SUPABASE_FUNCTIONS}/get-marketing-config?action=senders`, {
          headers: { Authorization: `Bearer ${session.session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSenders(data.senders ?? []);
          toast.success('API key saved and verified.');
          setNewKey('');
          setShowKeyInput(false);
          await loadPlatforms();
        } else {
          // Key saved but invalid — warn user
          toast.error('Key saved but SendGrid returned an error. Double-check the key.');
          await loadPlatforms();
        }
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Unexpected error.');
    }
    setSavingKey(false);
  };

  const handleSaveWebhookSecret = async () => {
    const trimmed = webhookSecret.trim();
    if (!trimmed) { toast.error('Paste the webhook signing key from SendGrid.'); return; }
    setSavingWebhookSecret(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingWebhookSecret(false); return; }

    const { data: existing } = await supabase
      .from('messaging_config')
      .select('config')
      .eq('user_id', user.id)
      .eq('platform', 'sendgrid')
      .maybeSingle();

    const mergedConfig = { ...(existing?.config ?? {}), webhook_secret: trimmed };
    const { error } = await supabase
      .from('messaging_config')
      .upsert(
        { user_id: user.id, platform: 'sendgrid', config: mergedConfig, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,platform' }
      );

    if (error) { toast.error(error.message); }
    else { toast.success('Webhook signing key saved.'); setWebhookSecretSaved(true); setWebhookSecret(''); }
    setSavingWebhookSecret(false);
  };

  const handleTestEmail = async () => {
    if (!testEmail.trim() || !testEmail.includes('@')) { toast.error('Enter a valid email address.'); return; }
    if (senders.length === 0) { toast.error('No verified senders available.'); return; }
    setTesting(true);
    setTestResult(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;
      const res = await fetch(`${SUPABASE_FUNCTIONS}/send-marketing-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: [{ email: testEmail.trim(), first_name: 'Admin' }],
          subject: 'ListingBug Messaging — Test Email',
          body: '<p>This is a test email from the ListingBug Messaging setup. If you received this, SendGrid is configured correctly.</p>',
          campaign_name: '_setup_test_',
          sender_id: senders[0].id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.sent > 0) {
        setTestResult(`✓ Sent to ${testEmail}. Check your inbox.`);
        toast.success('Test email sent.');
      } else {
        setTestResult(`✗ ${data.error ?? JSON.stringify(data.errors?.[0])}`);
        toast.error('Test send failed — check the error below.');
      }
    } catch (e: any) {
      setTestResult(`✗ ${e?.message}`);
    }
    setTesting(false);
  };

  const sourceLabel: Record<string, string> = {
    messaging_config: 'Custom key (entered in Setup)',
    integration: 'Connected integration',
    env: 'Server secret (SENDGRID_ADMIN_KEY)',
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Setup</h2>
        <button
          onClick={loadPlatforms}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
        >
          <RefreshCw size={12} className={platformsLoading ? 'animate-spin' : ''} />
          Refresh status
        </button>
      </div>

      {/* ── SendGrid ─────────────────────────────────────────────────── */}
      <PlatformCard
        title="SendGrid"
        subtitle="Email sends, delivery tracking, sender identities"
        connected={platforms?.sendgrid.connected ?? false}
        source={platforms?.sendgrid.source ?? null}
        defaultOpen={true}
      >
        {/* Key source */}
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
            <Key size={14} /> API Key
          </p>
          {platformsLoading ? (
            <p className="text-sm text-zinc-400">Checking…</p>
          ) : platforms?.sendgrid.connected ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                <div>
                  <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                    {sourceLabel[platforms.sendgrid.source ?? ''] ?? 'Key configured'}
                  </p>
                  {platforms.sendgrid.key_masked && (
                    <p className="text-xs font-mono text-green-600 dark:text-green-500 mt-0.5">{platforms.sendgrid.key_masked}</p>
                  )}
                </div>
                {platforms.sendgrid.source !== 'env' && (
                  <button
                    onClick={() => setShowKeyInput(v => !v)}
                    className="text-xs text-zinc-500 underline hover:no-underline"
                  >
                    Replace
                  </button>
                )}
              </div>
              {showKeyInput && <KeyInputForm newKey={newKey} setNewKey={setNewKey} showKeyValue={showKeyValue} setShowKeyValue={setShowKeyValue} savingKey={savingKey} onSave={handleSaveKey} onCancel={() => { setShowKeyInput(false); setNewKey(''); }} />}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
                No SendGrid API key found. Enter one below, or connect SendGrid in{' '}
                <span className="font-medium">Account → Integrations</span>.
              </div>
              <KeyInputForm newKey={newKey} setNewKey={setNewKey} showKeyValue={showKeyValue} setShowKeyValue={setShowKeyValue} savingKey={savingKey} onSave={handleSaveKey} onCancel={undefined} />
            </div>
          )}
        </div>

        {/* Verified senders */}
        {platforms?.sendgrid.connected && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Verified sender identities</p>
              <button onClick={loadSenders} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 flex items-center gap-1">
                <RefreshCw size={11} className={sendersLoading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
            {sendersLoading ? (
              <p className="text-sm text-zinc-400">Loading…</p>
            ) : senders.length === 0 ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                No verified senders found. Add one in SendGrid → Settings → Sender Authentication → Sender Management.
              </p>
            ) : (
              <div className="space-y-1">
                {senders.map(s => (
                  <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-100 dark:border-zinc-800 text-sm">
                    <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{s.nickname}</span>
                    <span className="text-zinc-400 text-xs">&lt;{s.from_email}&gt;</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Test send */}
        {platforms?.sendgrid.connected && senders.length > 0 && (
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Test send</p>
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <button
                onClick={handleTestEmail}
                disabled={testing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-zinc-900 text-sm font-semibold disabled:opacity-60 transition-colors"
              >
                <Send size={13} />
                {testing ? 'Sending…' : 'Send test'}
              </button>
            </div>
            {testResult && (
              <p className={`mt-2 text-xs ${testResult.startsWith('✓') ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {testResult}
              </p>
            )}
          </div>
        )}

        {/* Webhook setup */}
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
            <Webhook size={14} />
            Delivery tracking webhook
            {webhookSecretSaved && (
              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 size={11} /> Configured
              </span>
            )}
          </p>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex-none w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-bold flex items-center justify-center">1</span>
              <div className="flex-1">
                <p className="text-zinc-700 dark:text-zinc-300 mb-1">Copy the webhook URL</p>
                <div className="flex items-center gap-2">
                  {showWebhookUrl
                    ? <code className="flex-1 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 break-all">{WEBHOOK_URL}</code>
                    : <code className="flex-1 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-zinc-400">{'*'.repeat(40)}</code>
                  }
                  <button onClick={() => setShowWebhookUrl(v => !v)} className="text-zinc-400 hover:text-zinc-600">
                    {showWebhookUrl ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button
                    onClick={() => copy(WEBHOOK_URL, 'Webhook URL copied')}
                    className="flex items-center gap-1 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Copy size={11} /> Copy
                  </button>
                </div>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-none w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-bold flex items-center justify-center">2</span>
              <p className="text-zinc-600 dark:text-zinc-400 pt-0.5">
                Open <span className="font-medium text-zinc-700 dark:text-zinc-300">SendGrid Dashboard</span> → Settings → Mail Settings → Event Webhook
              </p>
            </li>

            <li className="flex gap-3">
              <span className="flex-none w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-bold flex items-center justify-center">3</span>
              <p className="text-zinc-600 dark:text-zinc-400 pt-0.5">
                Paste the URL into <span className="font-medium text-zinc-700 dark:text-zinc-300">HTTP Post URL</span>
              </p>
            </li>

            <li className="flex gap-3">
              <span className="flex-none w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-bold flex items-center justify-center">4</span>
              <div className="pt-0.5">
                <p className="text-zinc-600 dark:text-zinc-400">Enable these events:</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {['Delivered', 'Bounce', 'Dropped', 'Spam Report', 'Unsubscribe'].map(e => (
                    <span key={e} className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">{e}</span>
                  ))}
                </div>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-none w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-bold flex items-center justify-center">5</span>
              <p className="text-zinc-600 dark:text-zinc-400 pt-0.5">
                Toggle <span className="font-medium text-zinc-700 dark:text-zinc-300">Event Webhook</span> on and click <span className="font-medium text-zinc-700 dark:text-zinc-300">Save</span>
              </p>
            </li>

            <li className="flex gap-3">
              <span className="flex-none w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-bold flex items-center justify-center">6</span>
              <div className="flex-1">
                <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                  Copy the <span className="font-medium text-zinc-700 dark:text-zinc-300">Webhook Signing Key</span> from SendGrid and save it here:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="Paste signing key…"
                    value={webhookSecret}
                    onChange={e => setWebhookSecret(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <button
                    onClick={handleSaveWebhookSecret}
                    disabled={savingWebhookSecret || !webhookSecret.trim()}
                    className="px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-zinc-900 text-sm font-semibold disabled:opacity-60 transition-colors"
                  >
                    {savingWebhookSecret ? 'Saving…' : 'Save'}
                  </button>
                </div>
                {webhookSecretSaved && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Webhook signing key saved. Delivery events will update send status automatically.
                  </p>
                )}
              </div>
            </li>
          </ol>
        </div>
      </PlatformCard>

      {/* ── Mailchimp ────────────────────────────────────────────────── */}
      <PlatformCard
        title="Mailchimp"
        subtitle="Audience contacts + email templates"
        connected={platforms?.mailchimp.connected ?? false}
        source={platforms?.mailchimp.source ?? null}
        extra={
          platforms?.mailchimp.connected
            ? <span className="text-xs text-zinc-400">{platforms.mailchimp.audience_count} audience{platforms.mailchimp.audience_count !== 1 ? 's' : ''}</span>
            : undefined
        }
      >
        {platforms?.mailchimp.connected ? (
          <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
              <p>Mailchimp is connected. Audiences are available in the <span className="font-medium text-zinc-700 dark:text-zinc-300">Contacts tab</span> and templates appear in the <span className="font-medium text-zinc-700 dark:text-zinc-300">template dropdown</span> in Create.</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
              <p>Sending via Mailchimp campaigns is available in Stage 2. Currently you can load Mailchimp contacts as recipients and send through SendGrid.</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Connect Mailchimp in <span className="font-medium text-zinc-700 dark:text-zinc-300">Account → Integrations</span> to load audiences and templates here.
          </p>
        )}
      </PlatformCard>

      {/* ── HubSpot ──────────────────────────────────────────────────── */}
      <PlatformCard
        title="HubSpot"
        subtitle="Contact lists"
        connected={platforms?.hubspot.connected ?? false}
        source={platforms?.hubspot.source ?? null}
      >
        {platforms?.hubspot.connected ? (
          <div className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
            <p>HubSpot is connected. Loading HubSpot contact lists as a contact source is coming in Stage 2.</p>
          </div>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Connect HubSpot in <span className="font-medium text-zinc-700 dark:text-zinc-300">Account → Integrations</span>.
          </p>
        )}
      </PlatformCard>

      {/* ── Twilio ───────────────────────────────────────────────────── */}
      <PlatformCard
        title="Twilio"
        subtitle="SMS — coming in Stage 2"
        connected={platforms?.twilio.connected ?? false}
        source={platforms?.twilio.source ?? null}
      >
        <div className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
          {platforms?.twilio.connected && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 size={14} /> Twilio is connected and ready for Stage 2 SMS wiring.
            </div>
          )}
          <p>SMS sending configuration will appear here in Stage 2. From-number strategy (shared vs. per-user) is pending a decision.</p>
        </div>
      </PlatformCard>
    </div>
  );
}

/** Extracted key input form to avoid repetition */
function KeyInputForm({
  newKey, setNewKey, showKeyValue, setShowKeyValue, savingKey, onSave, onCancel,
}: {
  newKey: string;
  setNewKey: (v: string) => void;
  showKeyValue: boolean;
  setShowKeyValue: (v: boolean) => void;
  savingKey: boolean;
  onSave: () => void;
  onCancel?: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type={showKeyValue ? 'text' : 'password'}
            placeholder="SG.xxxxxxxxxxxxxxxx…"
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onSave(); }}
            className="w-full px-3 py-2 pr-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            type="button"
            onClick={() => setShowKeyValue(v => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            {showKeyValue ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
        <button
          onClick={onSave}
          disabled={savingKey || !newKey.trim()}
          className="px-3 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-zinc-900 text-sm font-semibold disabled:opacity-60 transition-colors whitespace-nowrap"
        >
          {savingKey ? 'Saving…' : 'Verify & Save'}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            Cancel
          </button>
        )}
      </div>
      <p className="text-xs text-zinc-400">
        Key stored securely in your account. The value is never shown again after saving.
        Get one in SendGrid → Settings → API Keys (scope: Mail Send + Senders Read).
      </p>
    </div>
  );
}
