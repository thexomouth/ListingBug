/**
 * outlook-oauth-exchange
 * Exchanges Microsoft OAuth authorization code for access/refresh tokens
 * Stores encrypted tokens in integration_connections table
 *
 * Body: { code: string, redirectUri: string }
 * Returns: { success: boolean, connection_id?: string, email?: string }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encryptToken } from '../_shared/crypto.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const OUTLOOK_CLIENT_ID = Deno.env.get('OUTLOOK_CLIENT_ID')!;
const OUTLOOK_CLIENT_SECRET = Deno.env.get('OUTLOOK_CLIENT_SECRET')!;

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
    console.log('[outlook-oauth-exchange] Exchanging code for tokens');
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: OUTLOOK_CLIENT_ID,
        client_secret: OUTLOOK_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[outlook-oauth-exchange] Token exchange failed:', errorText);
      return json({ error: 'Failed to exchange code for tokens', details: errorText }, 400);
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in, scope } = tokens;

    if (!access_token || !refresh_token) {
      return json({ error: 'Missing access_token or refresh_token in response' }, 400);
    }

    // Fetch user info from Microsoft Graph
    console.log('[outlook-oauth-exchange] Fetching user info');
    const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error('[outlook-oauth-exchange] User info fetch failed:', errorText);
      return json({ error: 'Failed to fetch user info', details: errorText }, 400);
    }

    const userInfo = await userInfoResponse.json();

    // Microsoft Graph returns either 'mail' or 'userPrincipalName'
    // 'mail' can be null for accounts without Exchange mailbox
    const outlookEmail = userInfo.mail || userInfo.userPrincipalName;
    const outlookId = userInfo.id;  // Stable Microsoft user ID
    const displayName = userInfo.displayName || outlookEmail;

    if (!outlookEmail || !outlookId) {
      return json({ error: 'Missing email or id in Microsoft user info' }, 400);
    }

    console.log(`[outlook-oauth-exchange] User: ${outlookEmail}, ID: ${outlookId}`);

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

    // Check if Gmail is already connected and primary - if so, Outlook shouldn't be primary
    const { data: gmailSender } = await serviceClient
      .from('integration_connections')
      .select('is_primary_sender')
      .eq('user_id', user.id)
      .eq('integration_id', 'gmail')
      .eq('status', 'active')
      .maybeSingle();

    const shouldBePrimary = isFirstSender || (gmailSender && !gmailSender.is_primary_sender);

    // Upsert the connection
    const { data: connection, error: upsertError } = await serviceClient
      .from('integration_connections')
      .upsert(
        {
          user_id: user.id,
          integration_id: 'outlook',
          provider_account_id: outlookId,
          sending_email: outlookEmail,
          display_name: displayName,
          from_email: outlookEmail,
          from_name: displayName,
          is_sender: true,
          is_primary_sender: shouldBePrimary,
          credentials: {
            access_token_encrypted: encryptedAccessToken,
            refresh_token_encrypted: encryptedRefreshToken,
            expires_at: expiresAt,
            scope,
          },
          config: {
            provider: 'outlook',
            email: outlookEmail,
          },
          connected_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
          status: 'active',
          daily_limit: 300,  // Conservative Outlook limit (varies by account type)
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
      console.error('[outlook-oauth-exchange] Upsert failed:', upsertError);
      return json({ error: 'Failed to save connection', details: upsertError.message }, 500);
    }

    console.log(`[outlook-oauth-exchange] Connection saved: ${connection.id}`);

    return json({
      success: true,
      connection_id: connection.id,
      email: outlookEmail,
      is_primary: shouldBePrimary,
    });

  } catch (err: any) {
    console.error('[outlook-oauth-exchange] Unexpected error:', err);
    return json({ error: 'Internal server error', details: err.message }, 500);
  }
});
