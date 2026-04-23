/**
 * Outlook OAuth utilities for frontend
 * Builds OAuth URLs and handles CSRF state validation
 */

// These will be read from Supabase secrets on the backend
// Frontend uses hardcoded client ID (public, not secret)
const OUTLOOK_CLIENT_ID = import.meta.env.VITE_OUTLOOK_CLIENT_ID || ''; // TODO: Add to .env

const OUTLOOK_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const OUTLOOK_SCOPES = [
  'Mail.Send',
  'Mail.ReadBasic',
  'User.Read',
  'offline_access',  // Request refresh token
  'openid',
  'email',
  'profile',
];

/**
 * Build the Outlook OAuth authorization URL
 * @param userId Current user's ID (embedded in state for verification)
 * @returns Full OAuth URL to redirect to
 */
export function buildOutlookAuthUrl(userId: string): string {
  // Generate a random nonce for CSRF protection
  const nonce = crypto.randomUUID();

  // State contains userId + nonce, base64 encoded
  const state = btoa(JSON.stringify({ userId, nonce, provider: 'outlook' }));

  // Store state in sessionStorage for verification on callback
  sessionStorage.setItem('outlook_oauth_state', state);
  sessionStorage.setItem('outlook_oauth_nonce', nonce);

  // Build redirect URI - must match what's configured in Azure AD
  const redirectUri = `${window.location.origin}/v2/integrations/outlook/callback`;

  const params = new URLSearchParams({
    client_id: OUTLOOK_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: OUTLOOK_SCOPES.join(' '),
    response_mode: 'query',
    state,
  });

  return `${OUTLOOK_AUTH_URL}?${params.toString()}`;
}

/**
 * Verify OAuth state parameter against stored value
 * @param state State parameter from OAuth callback
 * @returns True if state is valid, false otherwise
 */
export function verifyOutlookOAuthState(state: string): boolean {
  const storedState = sessionStorage.getItem('outlook_oauth_state');
  const storedNonce = sessionStorage.getItem('outlook_oauth_nonce');

  if (!storedState || !storedNonce || state !== storedState) {
    return false;
  }

  try {
    const decoded = JSON.parse(atob(state));
    return decoded.nonce === storedNonce && decoded.provider === 'outlook';
  } catch {
    return false;
  }
}

/**
 * Clear stored OAuth state after successful exchange
 */
export function clearOutlookOAuthState(): void {
  sessionStorage.removeItem('outlook_oauth_state');
  sessionStorage.removeItem('outlook_oauth_nonce');
}

/**
 * Get the redirect URI for Outlook OAuth
 */
export function getOutlookRedirectUri(): string {
  return `${window.location.origin}/v2/integrations/outlook/callback`;
}
