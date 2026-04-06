import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

function applyMergeTags(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? '');
}

/** Resolve SendGrid API key: messaging_config → integration_connections only.
 *  No platform-level fallback — users must configure their own key. */
async function resolveSendGridKey(
  serviceClient: ReturnType<typeof createClient>,
  userId: string
): Promise<string | null> {
  // 1. messaging_config (key entered via Messaging → Setup)
  const { data: mc } = await serviceClient
    .from('messaging_config')
    .select('config')
    .eq('user_id', userId)
    .eq('platform', 'sendgrid')
    .maybeSingle();
  if (mc?.config?.api_key) return mc.config.api_key;

  // 2. integration_connections (connected via Integrations page)
  const { data: conn } = await serviceClient
    .from('integration_connections')
    .select('credentials')
    .eq('user_id', userId)
    .eq('integration_id', 'sendgrid')
    .maybeSingle();
  if ((conn?.credentials as any)?.api_key) return (conn.credentials as any).api_key;

  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Unauthorized' }, 401);
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let body: any;
  try { body = await req.json(); } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { recipients, subject, body: emailBody, campaign_name, sender_id } = body;
  if (!Array.isArray(recipients) || recipients.length === 0) return json({ error: 'recipients required' }, 400);
  if (!subject || !emailBody) return json({ error: 'subject and body required' }, 400);
  if (!sender_id) return json({ error: 'sender_id required' }, 400);

  // Resolve API key via priority chain
  const apiKey = await resolveSendGridKey(serviceClient, user.id);
  if (!apiKey) return json({ error: 'No SendGrid API key configured. Add one in Messaging → Setup.' }, 400);

  // Look up sender identity
  const sendersRes = await fetch('https://api.sendgrid.com/v3/senders', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!sendersRes.ok) return json({ error: 'Failed to load sender identities from SendGrid.' }, 502);
  const sendersData: any[] = await sendersRes.json();
  const sender = sendersData.find((s: any) => String(s.id) === String(sender_id));
  if (!sender) return json({ error: `Sender ID ${sender_id} not found in SendGrid.` }, 400);

  const fromEmail = sender.from?.email ?? '';
  const fromName = sender.from?.name ?? '';

  // Insert campaign row
  const campaignId = crypto.randomUUID();
  const { error: campErr } = await serviceClient.from('marketing_campaigns').insert({
    id: campaignId,
    user_id: user.id,
    name: campaign_name ?? subject,
    subject,
    channel: 'email',
    sender_id: String(sender_id),
    recipient_count: recipients.length,
  });
  if (campErr) return json({ error: campErr.message }, 500);

  let sent = 0;
  let failed = 0;
  const errors: { email: string; error: string }[] = [];

  for (const recipient of recipients) {
    const mergeData: Record<string, string> = {
      first_name: recipient.first_name ?? 'there',
      last_name: recipient.last_name ?? '',
      city: recipient.city ?? '',
      company: recipient.company ?? '',
    };
    const personalizedSubject = applyMergeTags(subject, mergeData);
    const personalizedBody = applyMergeTags(emailBody, mergeData);

    const payload = {
      personalizations: [{ to: [{ email: recipient.email }] }],
      from: { email: fromEmail, name: fromName },
      subject: personalizedSubject,
      content: [{ type: 'text/html', value: personalizedBody }],
    };

    let sgMessageId: string | null = null;
    let status = 'pending';
    let errorMsg: string | null = null;

    try {
      const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (sgRes.ok || sgRes.status === 202) {
        sgMessageId = sgRes.headers.get('X-Message-Id');
        status = 'pending';
        sent++;
      } else {
        const errText = await sgRes.text();
        status = 'failed';
        errorMsg = `SendGrid ${sgRes.status}: ${errText}`;
        failed++;
        errors.push({ email: recipient.email, error: errorMsg });
      }
    } catch (e: any) {
      status = 'failed';
      errorMsg = e?.message ?? 'Network error';
      failed++;
      errors.push({ email: recipient.email, error: errorMsg });
    }

    const { error: sendErr } = await serviceClient.from('marketing_sends').insert({
      campaign_id: campaignId,
      contact_id: recipient.contact_id ?? null,
      email: recipient.email,
      status,
      sg_message_id: sgMessageId,
      error: errorMsg,
      sent_at: new Date().toISOString(),
    });
    if (sendErr) console.error('marketing_sends insert error:', sendErr.message);
  }

  return json({ campaign_id: campaignId, sent, failed, errors });
});
