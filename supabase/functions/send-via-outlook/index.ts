import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getValidAccessToken } from '../_shared/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshOutlookToken(refreshToken: string) {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('OUTLOOK_CLIENT_ID')!,
      client_secret: Deno.env.get('OUTLOOK_CLIENT_SECRET')!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!response.ok) throw new Error('OUTLOOK_REFRESH_FAILED');
  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
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

    const accessToken = await getValidAccessToken(email.sender, supabase, refreshOutlookToken);

    // Sending email is the OAuth account's address
    const fromEmail: string = email.sender.sending_email || email.sender.from_email || '';
    const fromName: string = email.from_name || email.sender.from_name || fromEmail;

    const messagePayload: Record<string, unknown> = {
      subject: email.subject,
      body: { contentType: 'HTML', content: email.body_html ?? '' },
      toRecipients: [{ emailAddress: { address: email.to_email } }],
      from: { emailAddress: { name: fromName, address: fromEmail } },
    };

    if (email.reply_to) {
      messagePayload.replyTo = [{ emailAddress: { address: email.reply_to } }];
    }

    const sendResponse = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: messagePayload, saveToSentItems: true }),
    });

    if (!sendResponse.ok) {
      const error = await sendResponse.text();
      throw new Error(`Graph API error: ${error}`);
    }

    console.log(`[send-via-outlook] Sent to ${email.to_email}`);

    return new Response(JSON.stringify({ ok: true, messageId: null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('[send-via-outlook] Error:', err.message);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
