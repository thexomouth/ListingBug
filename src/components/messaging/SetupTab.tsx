import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Send, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface Sender {
  id: string;
  nickname: string;
  from_email: string;
  from_name: string;
}

const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/sendgrid-event-webhook`;

export function SetupTab() {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [keyConfigured, setKeyConfigured] = useState<boolean | null>(null);
  const [loadingSenders, setLoadingSenders] = useState(true);
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [showWebhook, setShowWebhook] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingSenders(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(`${SUPABASE_URL}/functions/v1/get-marketing-config?action=senders`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSenders(data.senders ?? []);
          setKeyConfigured(true);
        } else {
          const data = await res.json();
          setKeyConfigured(data.error?.includes('not configured') ? false : null);
        }
      } catch {
        setKeyConfigured(null);
      }
      setLoadingSenders(false);
    };
    load();
  }, []);

  const handleTestEmail = async () => {
    if (!testEmail.trim() || !testEmail.includes('@')) { toast.error('Enter a valid email address.'); return; }
    if (senders.length === 0) { toast.error('No verified senders available.'); return; }

    setTesting(true);
    setTestResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-marketing-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: [{ email: testEmail.trim(), first_name: 'Admin' }],
          subject: 'ListingBug Messaging — Test Email',
          body: '<p>This is a test email from the ListingBug Messaging setup. If you received this, SendGrid is configured correctly.</p>',
          campaign_name: '_test_email_',
          sender_id: senders[0].id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.sent > 0) {
        setTestResult(`Sent successfully to ${testEmail}. Check your inbox.`);
        toast.success('Test email sent.');
      } else {
        setTestResult(`Failed: ${data.error ?? JSON.stringify(data.errors)}`);
        toast.error('Test send failed.');
      }
    } catch (e: any) {
      setTestResult(`Error: ${e?.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Setup</h2>

      {/* SendGrid section */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
          <h3 className="font-medium text-zinc-800 dark:text-zinc-200">SendGrid (Email)</h3>
        </div>
        <div className="p-4 space-y-4">

          {/* API key status */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {loadingSenders ? (
                <div className="w-4 h-4 rounded-full border-2 border-zinc-300 border-t-zinc-600 animate-spin" />
              ) : keyConfigured === true ? (
                <CheckCircle2 size={16} className="text-green-500" />
              ) : keyConfigured === false ? (
                <XCircle size={16} className="text-red-500" />
              ) : (
                <XCircle size={16} className="text-amber-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                SENDGRID_ADMIN_KEY secret
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {loadingSenders
                  ? 'Checking…'
                  : keyConfigured === true
                    ? 'Configured. Key value is never exposed to the client.'
                    : 'Not configured. Add SENDGRID_ADMIN_KEY to Supabase Edge Function Secrets.'
                }
              </p>
            </div>
          </div>

          {/* Verified senders */}
          {keyConfigured === true && (
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Verified sender identities</p>
              {loadingSenders ? (
                <p className="text-sm text-zinc-400">Loading…</p>
              ) : senders.length === 0 ? (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  No verified senders found. Add one in SendGrid → Settings → Sender Authentication → Sender Management.
                </p>
              ) : (
                <div className="space-y-1">
                  {senders.map(s => (
                    <div key={s.id} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">{s.nickname}</span>
                      <span className="text-zinc-400">&lt;{s.from_email}&gt;</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Send test email */}
          {keyConfigured === true && senders.length > 0 && (
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Send test email</p>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  placeholder="admin@example.com"
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
                <p className={`mt-2 text-xs ${testResult.startsWith('Failed') || testResult.startsWith('Error') ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                  {testResult}
                </p>
              )}
            </div>
          )}

          {/* Webhook URL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Event webhook URL</p>
              <button
                onClick={() => setShowWebhook(v => !v)}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 flex items-center gap-1"
              >
                {showWebhook ? <EyeOff size={12} /> : <Eye size={12} />}
                {showWebhook ? 'Hide' : 'Show'}
              </button>
            </div>
            {showWebhook ? (
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 font-mono break-all">
                  {WEBHOOK_URL}
                </code>
                <button
                  onClick={() => { navigator.clipboard.writeText(WEBHOOK_URL); toast.success('Copied.'); }}
                  className="px-2 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Copy
                </button>
              </div>
            ) : (
              <p className="text-xs text-zinc-400">
                Register this URL in SendGrid → Settings → Mail Settings → Event Webhook. Enable: Delivered, Bounce, Dropped, Spam Report, Unsubscribe.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SMS stub */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden opacity-50 pointer-events-none select-none">
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
          <h3 className="font-medium text-zinc-800 dark:text-zinc-200">SMS</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500">Coming in Stage 2</span>
        </div>
        <div className="p-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            SMS sending will be available via SendGrid or Twilio. Configuration will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
