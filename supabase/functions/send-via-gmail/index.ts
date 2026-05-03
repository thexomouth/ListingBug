import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getValidAccessToken } from '../_shared/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshGmailToken(refreshToken: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GMAIL_CLIENT_ID')!,
      client_secret: Deno.env.get('GMAIL_CLIENT_SECRET')!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!response.ok) throw new Error('GMAIL_REFRESH_FAILED');
  const data = await response.json();
  return { access_token: data.access_token, expires_in: data.expires_in };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { emailQueueId } = await req.json();

    const { data: email, error: fetchErr } = await supabase
      .from('email_queue')
      .select('*, sender:integration_connections!sender_id(*)')
      .eq('id', emailQueueId)
      .single();

    if (fetchErr || !email?.sender) throw new Error('Email queue item or sender not found');

    const accessToken = await getValidAccessToken(email.sender, supabase, refreshGmailToken);

    // Sending email is the OAuth account's address
    const fromEmail: string = email.sender.sending_email || email.sender.from_email || '';
    const fromName: string = email.from_name || email.sender.from_name || fromEmail;

    const headers = [
      `To: ${email.to_email}`,
      `From: ${fromName} <${fromEmail}>`,
      `Subject: ${email.subject}`,
      ...(email.reply_to ? [`Reply-To: ${email.reply_to}`] : []),
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
    ];

    const message = [...headers, '', email.body_html ?? ''].join('\r\n');

    // btoa with unicode safety
    const encodedMessage = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    if (!sendResponse.ok) {
      const error = await sendResponse.text();
      throw new Error(`Gmail API error: ${error}`);
    }

    const result = await sendResponse.json().catch(() => ({}));
    console.log(`[send-via-gmail] Sent to ${email.to_email} — id: ${result.id}`);

    return new Response(JSON.stringify({ ok: true, messageId: result.id ?? null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('[send-via-gmail] Error:', err.message);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
