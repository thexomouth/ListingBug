import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getValidAccessToken } from '../_shared/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Outlook API refresh function
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

  if (!response.ok) {
    throw new Error('OUTLOOK_REFRESH_FAILED');
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token, // Outlook MAY return new refresh token
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

    const { emailQueueId, senderId } = await req.json();

    // Fetch email queue item and sender
    const { data: email } = await supabase
      .from('email_queue')
      .select('*, sender:integration_connections!sender_id(*)')
      .eq('id', emailQueueId)
      .single();

    if (!email?.sender) {
      throw new Error('Sender not found');
    }

    // Get valid access token (auto-refreshes if needed)
    const accessToken = await getValidAccessToken(
      email.sender,
      supabase,
      refreshOutlookToken
    );

    // Send via Microsoft Graph API
    const sendResponse = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject: email.subject,
          body: {
            contentType: 'HTML',
            content: email.body,
          },
          toRecipients: [
            { emailAddress: { address: email.to_email } },
          ],
          from: {
            emailAddress: {
              name: email.from_name,
              address: email.from_email,
            },
          },
        },
        saveToSentItems: true,
      }),
    });

    if (!sendResponse.ok) {
      const error = await sendResponse.text();
      throw new Error(`Graph API error: ${error}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('[send-via-outlook] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
