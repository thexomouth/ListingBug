import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const STATUS_MAP: Record<string, string> = {
  delivered: 'delivered',
  bounce: 'bounced',
  dropped: 'failed',
  spamreport: 'failed',
  unsubscribe: 'delivered', // still delivered; also sets unsubscribed flag
};

/**
 * Verify a SendGrid signed event webhook payload.
 *
 * SendGrid signs: timestamp + rawBody using ECDSA P-256 / SHA-256.
 * The public key is the "Webhook Signing Key" from SendGrid Dashboard
 * → Settings → Mail Settings → Event Webhook (base64-encoded SPKI DER).
 *
 * Returns true if valid, false if invalid. Throws if the key is malformed.
 */
async function verifySignature(
  publicKeyBase64: string,
  signatureBase64: string,
  timestamp: string,
  rawBody: string,
): Promise<boolean> {
  // Strip PEM headers if the user copied a PEM block instead of raw base64
  const cleaned = publicKeyBase64
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s+/g, '');

  const keyBytes = Uint8Array.from(atob(cleaned), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'spki',
    keyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify'],
  );

  const sigBytes = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));
  const payload = new TextEncoder().encode(timestamp + rawBody);

  return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, cryptoKey, sigBytes, payload);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok');

  const rawBody = await req.text();

  // ── Signature verification ───────────────────────────────────────────────
  // If a webhook signing key has been saved in messaging_config, enforce it.
  // If not saved yet (initial setup), accept the request so tracking still works.
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: configRow } = await serviceClient
    .from('messaging_config')
    .select('config')
    .eq('platform', 'sendgrid')
    .not('config->webhook_secret', 'is', null)
    .limit(1)
    .maybeSingle();

  const storedSecret: string | null = configRow?.config?.webhook_secret ?? null;

  if (storedSecret) {
    const signature = req.headers.get('X-Twilio-Email-Event-Webhook-Signature') ?? '';
    const timestamp = req.headers.get('X-Twilio-Email-Event-Webhook-Timestamp') ?? '';

    if (!signature || !timestamp) {
      console.warn('[sendgrid-event-webhook] Signing key configured but headers missing — rejecting');
      return new Response('Unauthorized: missing signature headers', { status: 401 });
    }

    let valid = false;
    try {
      valid = await verifySignature(storedSecret, signature, timestamp, rawBody);
    } catch (e: any) {
      console.error('[sendgrid-event-webhook] Signature verification threw:', e?.message);
    }

    if (!valid) {
      console.warn('[sendgrid-event-webhook] Signature verification failed — rejecting');
      return new Response('Unauthorized: invalid signature', { status: 401 });
    }
  } else {
    console.log('[sendgrid-event-webhook] No signing key stored — accepting without verification');
  }

  // ── Parse events ─────────────────────────────────────────────────────────
  let events: any[];
  try {
    events = JSON.parse(rawBody);
  } catch {
    return new Response('Bad request: invalid JSON', { status: 400 });
  }
  if (!Array.isArray(events)) return new Response('Expected JSON array', { status: 400 });

  for (const event of events) {
    const sgMessageId: string | undefined = event.sg_message_id?.split('.')[0];
    const eventType: string | undefined = event.event;
    const email: string | undefined = event.email;

    if (!sgMessageId || !eventType) continue;

    const newStatus = STATUS_MAP[eventType];
    if (!newStatus) continue;

    const { error: updateErr } = await serviceClient
      .from('marketing_sends')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('sg_message_id', sgMessageId);

    if (updateErr) console.error('[sendgrid-event-webhook] send update error:', updateErr.message);

    if (eventType === 'unsubscribe' && email) {
      const { error: unsErr } = await serviceClient
        .from('marketing_contacts')
        .update({ unsubscribed: true })
        .eq('email', email.toLowerCase().trim());
      if (unsErr) console.error('[sendgrid-event-webhook] unsubscribe update error:', unsErr.message);
    }
  }

  return new Response('ok', { status: 200 });
});
