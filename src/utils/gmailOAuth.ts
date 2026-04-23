/**
 * Gmail OAuth utilities for frontend
 * Builds OAuth URLs and handles CSRF state validation
 */

// These will be read from Supabase secrets on the backend
// Frontend uses hardcoded client ID (public, not secret)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''; // TODO: Add to .env

const GMAIL_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

/**
 * Build the Gmail OAuth authorization URL
 * @param userId Current user's ID (embedded in state for verification)
 * @returns Full OAuth URL to redirect to
 */
export function buildGmailAuthUrl(userId: string): string {
  // Generate a random nonce for CSRF protection
  const nonce = crypto.randomUUID();

  // State contains userId + nonce, base64 encoded
  const state = btoa(JSON.stringify({ userId, nonce, provider: 'gmail' }));

  // Store state in sessionStorage for verification on callback
  sessionStorage.setItem('gmail_oauth_state', state);
  sessionStorage.setItem('gmail_oauth_nonce', nonce);

  // Build redirect URI - must match what's configured in Google Cloud Console
  const redirectUri = `${window.location.origin}/v2/integrations/gmail/callback`;

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GMAIL_SCOPES.join(' '),
    access_type: 'offline',  // Request refresh token
    prompt: 'consent',       // Force consent screen to ensure refresh token
    state,
  });

  return `${GMAIL_AUTH_URL}?${params.toString()}`;
}

/**
 * Verify OAuth state parameter against stored value
 * @param state State parameter from OAuth callback
 * @returns True if state is valid, false otherwise
 */
export function verifyGmailOAuthState(state: string): boolean {
  const storedState = sessionStorage.getItem('gmail_oauth_state');
  const storedNonce = sessionStorage.getItem('gmail_oauth_nonce');

  if (!storedState || !storedNonce || state !== storedState) {
    return false;
  }

  try {
    const decoded = JSON.parse(atob(state));
    return decoded.nonce === storedNonce && decoded.provider === 'gmail';
  } catch {
    return false;
  }
}

/**
 * Clear stored OAuth state after successful exchange
 */
export function clearGmailOAuthState(): void {
  sessionStorage.removeItem('gmail_oauth_state');
  sessionStorage.removeItem('gmail_oauth_nonce');
}

/**
 * Get the redirect URI for Gmail OAuth
 */
export function getGmailRedirectUri(): string {
  return `${window.location.origin}/v2/integrations/gmail/callback`;
}
