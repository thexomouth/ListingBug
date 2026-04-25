import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { verifyOutlookOAuthState, clearOutlookOAuthState } from '../../../utils/outlookOAuth';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export function OutlookCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing Outlook connection...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Handle OAuth errors (user canceled, etc.)
        if (error) {
          console.error('[OutlookCallback] OAuth error:', error, errorDescription);
          setStatus('error');
          setMessage(`Outlook connection failed: ${errorDescription || error}`);
          setTimeout(() => navigate('/v2/onboarding?error=outlook_canceled'), 3000);
          return;
        }

        if (!code || !state) {
          setStatus('error');
          setMessage('Missing authorization code or state');
          setTimeout(() => navigate('/v2/onboarding?error=outlook_invalid'), 3000);
          return;
        }

        // Verify CSRF state
        if (!verifyOutlookOAuthState(state)) {
          console.error('[OutlookCallback] State mismatch - possible CSRF attack');
          setStatus('error');
          setMessage('Security verification failed. Please try again.');
          setTimeout(() => navigate('/v2/onboarding?error=state_mismatch'), 3000);
          return;
        }

        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setStatus('error');
          setMessage('Not authenticated. Please sign in.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Get OAuth config to ensure redirect URI matches what was used in auth request
        const { data: configData } = await supabase.functions.invoke('get-oauth-config');
        const redirectUri = configData?.outlook?.redirectUri || `${window.location.origin}/v2/integrations/outlook/callback`;

        // Exchange code for tokens via edge function
        const { data, error: exchangeError } = await supabase.functions.invoke('outlook-oauth-exchange', {
          body: { code, redirectUri },
        });

        if (exchangeError || !data?.success) {
          console.error('[OutlookCallback] Exchange failed:', exchangeError || data);
          setStatus('error');
          setMessage(data?.error || 'Failed to connect Outlook account');
          setTimeout(() => navigate('/v2/onboarding?error=outlook_exchange_failed'), 3000);
          return;
        }

        // Success!
        console.log('[OutlookCallback] Outlook connected:', data.email);
        setStatus('success');
        setMessage(`Outlook account ${data.email} connected successfully!`);
        clearOutlookOAuthState();

        setTimeout(() => navigate('/v2/onboarding?success=outlook_connected'), 1500);

      } catch (err: any) {
        console.error('[OutlookCallback] Unexpected error:', err);
        setStatus('error');
        setMessage('An unexpected error occurred');
        setTimeout(() => navigate('/v2/onboarding?error=outlook_unexpected'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0F1115]">
      <div className="max-w-md w-full text-center px-4">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 mx-auto text-[#FFCE0A] animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Connecting Outlook
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Success!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Redirecting back to onboarding...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Connection Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Redirecting back to onboarding...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
