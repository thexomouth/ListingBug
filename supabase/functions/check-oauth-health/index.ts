/**
 * check-oauth-health
 * Runs on session start to validate OAuth tokens for connections that are
 * actively powering live campaigns. Silently refreshes expired access tokens
 * where possible; flags connections that need full reauth.
 *
 * Returns: { healthy: boolean, issues: ConnectionIssue[] }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getValidAccessToken } from '../_shared/crypto.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GMAIL_CLIENT_ID = Deno.env.get('GMAIL_CLIENT_ID')!;
const GMAIL_CLIENT_SECRET = Deno.env.get('GMAIL_CLIENT_SECRET')!;
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

async function refreshGmailToken(refreshToken: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'GMAIL_REFRESH_FAILED');
  }
  const data = await res.json();
  return { access_token: data.access_token, expires_in: data.expires_in };
}

async function refreshOutlookToken(refreshToken: string) {
  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: OUTLOOK_CLIENT_ID,
      client_secret: OUTLOOK_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'OUTLOOK_REFRESH_FAILED');
  }
  const data = await res.json();
  return { access_token: data.access_token, refresh_token: data.refresh_token, expires_in: data.expires_in };
}

// Errors that mean the refresh token itself is gone — full reauth required
function isRevokedError(msg: string): boolean {
  return (
    msg.includes('invalid_grant') ||
    msg.includes('REFRESH_TOKEN_MISSING') ||
    msg.includes('invalid_client') ||
    msg.includes('unauthorized_client')
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Only check connections that are actually powering live campaigns.
    // This is the source of truth for what MUST be healthy.
    const { data: rows, error: queryErr } = await supabase
      .from('campaigns')
      .select(`
        id,
        campaign_name,
        sender:integration_connections!sender_id (
          id, integration_id, sending_email, display_name, status, credentials
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .not('sender_id', 'is', null);

    if (queryErr) {
      console.error('[check-oauth-health] Query error:', queryErr.message);
      return json({ error: 'Query failed' }, 500);
    }

    // Deduplicate by connection ID — one connection can back multiple campaigns
    const seen = new Set<string>();
    const connections: any[] = [];
    for (const row of (rows ?? [])) {
      const conn = (row as any).sender;
      if (conn && !seen.has(conn.id)) {
        seen.add(conn.id);
        connections.push(conn);
      }
    }

    if (connections.length === 0) {
      return json({ healthy: true, issues: [] });
    }

    const issues: Array<{
      connection_id: string;
      provider: string;
      email: string;
      issue: 'needs_reauth' | 'token_refresh_failed';
    }> = [];

    await Promise.all(connections.map(async (conn) => {
      const provider: string = conn.integration_id;

      // SMTP: can't silently refresh — surface existing bad status
      if (provider === 'smtp') {
        if (conn.status === 'expired' || conn.status === 'needs_reauth') {
          issues.push({ connection_id: conn.id, provider, email: conn.sending_email, issue: 'needs_reauth' });
        }
        return;
      }

      // Gmail / Outlook: attempt silent token refresh via getValidAccessToken
      const refreshFn = provider === 'gmail' ? refreshGmailToken : refreshOutlookToken;

      try {
        await getValidAccessToken(conn, supabase, refreshFn);
        // Refresh succeeded (or token still valid) — restore active status if degraded
        if (conn.status !== 'active') {
          await supabase
            .from('integration_connections')
            .update({ status: 'active' })
            .eq('id', conn.id);
        }
      } catch (err: any) {
        const msg: string = err.message || '';
        console.warn(`[check-oauth-health] Connection ${conn.id} (${provider}) unhealthy:`, msg);

        const issue = isRevokedError(msg) ? 'needs_reauth' : 'token_refresh_failed';

        // getValidAccessToken already marks expired, but ensure needs_reauth is set
        if (issue === 'needs_reauth') {
          await supabase
            .from('integration_connections')
            .update({ status: 'needs_reauth' })
            .eq('id', conn.id);
        }

        issues.push({ connection_id: conn.id, provider, email: conn.sending_email, issue });
      }
    }));

    console.log(`[check-oauth-health] user=${user.id} checked=${connections.length} issues=${issues.length}`);
    return json({ healthy: issues.length === 0, issues });

  } catch (err: any) {
    console.error('[check-oauth-health] Unexpected error:', err.message);
    return json({ error: 'Internal server error', details: err.message }, 500);
  }
});
