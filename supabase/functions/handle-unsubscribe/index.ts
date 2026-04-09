/**
 * handle-unsubscribe
 * Public GET endpoint — no JWT required.
 * Called when a recipient clicks the unsubscribe link in a marketing email.
 *
 * Query params: user_id, campaign_id, email
 *
 * Actions:
 *   1. Adds to campaign_suppressions (prevents resend for this campaign)
 *   2. Marks marketing_contacts.unsubscribed = true for this user + email
 *   3. Returns a branded HTML "You've been unsubscribed" confirmation page
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function htmlPage(title: string, heading: string, body: string, isError = false) {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — ListingBug</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f9f9f9;
      color: #1a1a1a;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #fff;
      border-radius: 16px;
      border: 1px solid #e4e4e7;
      padding: 48px 40px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      font-size: 24px;
      background: ${isError ? '#fef2f2' : '#fefce8'};
    }
    h1 { font-size: 22px; font-weight: 700; color: #18181b; margin-bottom: 12px; }
    p { font-size: 15px; color: #71717a; line-height: 1.6; }
    .brand { margin-top: 36px; font-size: 13px; color: #a1a1aa; }
    .brand a { color: #a1a1aa; text-decoration: none; }
    .brand a:hover { text-decoration: underline; }
    @media (prefers-color-scheme: dark) {
      body { background: #0f0f0f; color: #f4f4f5; }
      .card { background: #18181b; border-color: #27272a; }
      h1 { color: #f4f4f5; }
      p { color: #a1a1aa; }
      .icon { background: ${isError ? '#450a0a' : '#1c1a00'}; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${isError ? '⚠️' : '✓'}</div>
    <h1>${heading}</h1>
    <p>${body}</p>
    <div class="brand"><a href="https://www.thelistingbug.com">ListingBug</a></div>
  </div>
</body>
</html>`,
    {
      status: isError ? 400 : 200,
      headers: { ...cors, 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const url = new URL(req.url);
  const user_id = url.searchParams.get('user_id');
  const campaign_id = url.searchParams.get('campaign_id');
  const email = url.searchParams.get('email');

  if (!user_id || !campaign_id || !email || !email.includes('@')) {
    return htmlPage(
      'Invalid link',
      'Invalid unsubscribe link',
      'This unsubscribe link appears to be malformed or expired. If you\'d like to stop receiving emails, please reply directly to the sender.',
      true
    );
  }

  const normalizedEmail = email.toLowerCase().trim();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1. Add to campaign-specific suppression list
  const { error: supErr } = await supabase
    .from('campaign_suppressions')
    .upsert(
      { user_id, campaign_id, email: normalizedEmail },
      { onConflict: 'user_id,campaign_id,email', ignoreDuplicates: true }
    );

  if (supErr) {
    console.error('[handle-unsubscribe] suppression insert error:', supErr.message);
    return htmlPage(
      'Error',
      'Something went wrong',
      'We were unable to process your unsubscribe request. Please try again or reply directly to the sender.',
      true
    );
  }

  // 2. Mark marketing_contacts as unsubscribed for this user + email
  const { error: updateErr } = await supabase
    .from('marketing_contacts')
    .update({ unsubscribed: true })
    .eq('user_id', user_id)
    .eq('email', normalizedEmail);

  if (updateErr) {
    console.error('[handle-unsubscribe] contact update error:', updateErr.message);
    // Non-fatal — suppression is already recorded
  }

  console.log(`[handle-unsubscribe] ${normalizedEmail} unsubscribed from campaign ${campaign_id}`);

  return htmlPage(
    'Unsubscribed',
    'You\'ve been unsubscribed',
    `<strong>${normalizedEmail}</strong> has been removed from this mailing list. You won't receive any further emails from this campaign.`
  );
});
