import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Mail } from 'lucide-react';

const SUPABASE_FUNCTIONS = 'https://ynqmisrlahjberhmlviz.supabase.co/functions/v1';

export function UnsubscribePage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const e = params.get('email');
    if (e) setEmail(decodeURIComponent(e));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`${SUPABASE_FUNCTIONS}/unsubscribe-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (res.ok) {
        setStatus('success');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            ListingBug
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm">
          {status === 'success' ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle size={48} className="text-green-500" />
              </div>
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                You're unsubscribed
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{email}</span> has been removed from all ListingBug marketing emails. You won't receive any further outreach from this platform.
              </p>
              <p className="text-xs text-zinc-400 mt-4">
                If you didn't request this or believe this was a mistake, you can contact the sender directly or reach us at{' '}
                <a href="mailto:support@thelistingbug.com" className="underline hover:no-underline">
                  support@thelistingbug.com
                </a>.
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-5">
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Mail size={22} className="text-zinc-500 dark:text-zinc-400" />
                </div>
              </div>

              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 text-center mb-2">
                Unsubscribe from emails
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-6">
                Enter your email address below to stop receiving marketing emails sent through ListingBug.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                {status === 'error' && (
                  <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                    <AlertCircle size={14} className="shrink-0" />
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-700 dark:hover:bg-zinc-300 text-white dark:text-zinc-900 font-semibold text-sm disabled:opacity-60 transition-colors"
                >
                  {status === 'loading' ? 'Unsubscribing…' : 'Unsubscribe'}
                </button>
              </form>

              <p className="text-xs text-zinc-400 text-center mt-5">
                ListingBug is a real estate data platform. Marketing emails are sent by independent users of the platform. Unsubscribing here will prevent all ListingBug-powered emails to this address.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
