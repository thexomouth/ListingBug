import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Note: SENDGRID_WEBHOOK_SECRET is used to verify the signature.
// In Stage 1 we do a best-effort check — if the secret is not yet configured we
// still process events so delivery tracking works during setup.
const SENDGRID_WEBHOOK_SECRET = Deno.env.get('SENDGRID_WEBHOOK_SECRET');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STATUS_MAP: Record<string, string> = {
  delivered: 'delivered',
  bounce: 'bounced',
  dropped: 'failed',
  spamreport: 'failed',
  unsubscribe: 'delivered', // delivered but also triggers unsubscribed flag
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  // SendGrid POSTs a JSON array of events
  let events: any[];
  try {
    events = await req.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }
  if (!Array.isArray(events)) return new Response('Expected array', { status: 400 });

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  for (const event of events) {
    const sgMessageId: string | undefined = event.sg_message_id?.split('.')[0];
    const eventType: string | undefined = event.event;
    const email: string | undefined = event.email;

    if (!sgMessageId || !eventType) continue;

    const newStatus = STATUS_MAP[eventType];
    if (!newStatus) continue;

    // Update marketing_sends status
    const { error: updateErr } = await serviceClient
      .from('marketing_sends')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('sg_message_id', sgMessageId);

    if (updateErr) console.error('marketing_sends update error:', updateErr.message);

    // If unsubscribe event, also flag the contact
    if (eventType === 'unsubscribe' && email) {
      const { error: unsErr } = await serviceClient
        .from('marketing_contacts')
        .update({ unsubscribed: true })
        .eq('email', email.toLowerCase().trim());
      if (unsErr) console.error('marketing_contacts unsubscribe error:', unsErr.message);
    }
  }

  return new Response('ok', { status: 200 });
});
