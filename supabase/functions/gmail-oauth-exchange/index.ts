/**
 * gmail-oauth-exchange
 * Exchanges Google OAuth authorization code for access/refresh tokens
 * Stores encrypted tokens in integration_connections table
 *
 * Body: { code: string, redirectUri: string }
 * Returns: { success: boolean, connection_id?: string, email?: string }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encryptToken } from '../_shared/crypto.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GMAIL_CLIENT_ID = Deno.env.get('GMAIL_CLIENT_ID')!;
const GMAIL_CLIENT_SECRET = Deno.env.get('GMAIL_CLIENT_SECRET')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    // Parse request body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const { code, redirectUri } = body;

    if (!code || !redirectUri) {
      return json({ error: 'Missing code or redirectUri' }, 400);
    }

    // Exchange code for tokens
    console.log('[gmail-oauth-exchange] Exchanging code for tokens');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GMAIL_CLIENT_ID,
        client_secret: GMAIL_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[gmail-oauth-exchange] Token exchange failed:', errorText);
      return json({ error: 'Failed to exchange code for tokens', details: errorText }, 400);
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in, scope } = tokens;

    if (!access_token || !refresh_token) {
      return json({ error: 'Missing access_token or refresh_token in response' }, 400);
    }

    // Fetch user info from Google
    console.log('[gmail-oauth-exchange] Fetching user info');
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error('[gmail-oauth-exchange] User info fetch failed:', errorText);
      return json({ error: 'Failed to fetch user info', details: errorText }, 400);
    }

    const userInfo = await userInfoResponse.json();
    const googleEmail = userInfo.email;
    const googleId = userInfo.id;  // Stable Google user ID
    const displayName = userInfo.name || googleEmail;

    if (!googleEmail || !googleId) {
      return json({ error: 'Missing email or id in Google user info' }, 400);
    }

    console.log(`[gmail-oauth-exchange] User: ${googleEmail}, ID: ${googleId}`);

    // Encrypt tokens before storage
    const encryptedAccessToken = await encryptToken(access_token);
    const encryptedRefreshToken = await encryptToken(refresh_token);

    const expiresAt = Date.now() + (expires_in * 1000);

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Check if this is the first sender for this user
    const { data: existingSenders } = await serviceClient
      .from('integration_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_sender', true)
      .eq('status', 'active');

    const isFirstSender = !existingSenders || existingSenders.length === 0;

    // Upsert the connection
    const { data: connection, error: upsertError } = await serviceClient
      .from('integration_connections')
      .upsert(
        {
          user_id: user.id,
          integration_id: 'gmail',
          provider_account_id: googleId,
          sending_email: googleEmail,
          display_name: displayName,
          from_email: googleEmail,
          from_name: displayName,
          is_sender: true,
          is_primary_sender: isFirstSender,  // First sender becomes primary
          credentials: {
            access_token_encrypted: encryptedAccessToken,
            refresh_token_encrypted: encryptedRefreshToken,
            expires_at: expiresAt,
            scope,
          },
          config: {
            provider: 'gmail',
            email: googleEmail,
          },
          connected_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
          status: 'active',
          daily_limit: 500,  // Gmail API limit
          emails_sent_today: 0,
          last_reset_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,integration_id,provider_account_id',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('[gmail-oauth-exchange] Upsert failed:', upsertError);
      return json({ error: 'Failed to save connection', details: upsertError.message }, 500);
    }

    console.log(`[gmail-oauth-exchange] Connection saved: ${connection.id}`);

    return json({
      success: true,
      connection_id: connection.id,
      email: googleEmail,
      is_primary: isFirstSender,
    });

  } catch (err: any) {
    console.error('[gmail-oauth-exchange] Unexpected error:', err);
    return json({ error: 'Internal server error', details: err.message }, 500);
  }
});
