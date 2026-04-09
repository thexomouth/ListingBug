/**
 * run-due-messaging-automations
 * Called by a cron job (pg_cron or Supabase cron) on a frequent interval (e.g. every hour).
 * Finds messaging_automations with schedule daily/weekly/monthly that are due, and fires sends.
 *
 * Auth: internal — called without user JWT. Service key only.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const FUNCTIONS_BASE = `${SUPABASE_URL.replace('https://', 'https://')}/functions/v1`;

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

/** Returns true if the automation is due based on schedule + last_run_at */
function isDue(schedule: string, lastRunAt: string | null): boolean {
  if (!lastRunAt) return true; // never run → always due

  const last = new Date(lastRunAt).getTime();
  const now = Date.now();
  const elapsed = now - last;

  const MS_HOUR  = 60 * 60 * 1000;
  const MS_DAY   = 24 * MS_HOUR;
  const MS_WEEK  = 7 * MS_DAY;
  const MS_MONTH = 30 * MS_DAY;

  if (schedule === 'daily'   && elapsed >= MS_DAY)   return true;
  if (schedule === 'weekly'  && elapsed >= MS_WEEK)  return true;
  if (schedule === 'monthly' && elapsed >= MS_MONTH) return true;
  return false;
}

/** Resolve SendGrid API key for a user: messaging_config → integration_connections → env */
async function resolveSendGridKey(
  serviceClient: ReturnType<typeof createClient>,
  userId: string
): Promise<string | null> {
  const { data: mc } = await serviceClient
    .from('messaging_config')
    .select('config')
    .eq('user_id', userId)
    .eq('platform', 'sendgrid')
    .maybeSingle();
  if (mc?.config?.api_key) return mc.config.api_key;

  const { data: conn } = await serviceClient
    .from('integration_connections')
    .select('credentials')
    .eq('user_id', userId)
    .eq('integration_id', 'sendgrid')
    .maybeSingle();
  if ((conn?.credentials as any)?.api_key) return (conn.credentials as any).api_key;

  const envKey = Deno.env.get('SENDGRID_ADMIN_KEY');
  return envKey ?? null;
}

function applyMergeTags(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? '');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Load all active scheduled automations (daily/weekly/monthly)
  const { data: automations, error: autoErr } = await serviceClient
    .from('messaging_automations')
    .select('*')
    .eq('status', 'active')
    .in('schedule', ['daily', 'weekly', 'monthly']);

  if (autoErr) {
    console.error('[run-due-messaging-automations] query error:', autoErr.message);
    return json({ error: autoErr.message }, 500);
  }

  if (!automations || automations.length === 0) {
    return json({ processed: 0, message: 'No scheduled automations found.' });
  }

  const due = automations.filter((a: any) => isDue(a.schedule, a.last_run_at));
  console.log(`[run-due-messaging-automations] ${automations.length} scheduled, ${due.length} due`);

  if (due.length === 0) return json({ processed: 0, message: 'No automations due.' });

  let processed = 0;
  let totalSent = 0;
  const errors: { id: string; name: string; error: string }[] = [];

  for (const auto of due) {
    try {
      // Resolve SendGrid key
      const apiKey = await resolveSendGridKey(serviceClient, auto.user_id);
      if (!apiKey) {
        errors.push({ id: auto.id, name: auto.name, error: 'No SendGrid key configured' });
        continue;
      }

      // Load list members (non-unsubscribed)
      const { data: memberships } = await serviceClient
        .from('marketing_contacts_lists')
        .select('contact_id')
        .eq('list_id', auto.list_id);

      if (!memberships || memberships.length === 0) {
        console.log(`[run-due-messaging-automations] automation ${auto.id} list empty — skipping`);
        continue;
      }

      const contactIds = memberships.map((m: any) => m.contact_id);
      const { data: contacts } = await serviceClient
        .from('marketing_contacts')
        .select('id, email, first_name, last_name, city, company')
        .in('id', contactIds)
        .eq('user_id', auto.user_id)
        .eq('unsubscribed', false);

      if (!contacts || contacts.length === 0) {
        console.log(`[run-due-messaging-automations] automation ${auto.id} no sendable contacts — skipping`);
        continue;
      }

      // Load global + campaign suppression lists
      const campaignId = crypto.randomUUID();
      const { data: suppressedRows } = await serviceClient
        .from('suppression_list')
        .select('email')
        .eq('user_id', auto.user_id);
      const suppressedEmails = new Set((suppressedRows ?? []).map((r: any) => r.email.toLowerCase()));

      const sendable = contacts.filter((c: any) => !suppressedEmails.has(c.email.toLowerCase()));
      if (sendable.length === 0) {
        console.log(`[run-due-messaging-automations] automation ${auto.id} all contacts suppressed — skipping`);
        continue;
      }

      // Insert campaign row
      await serviceClient.from('marketing_campaigns').insert({
        id: campaignId,
        user_id: auto.user_id,
        name: auto.name,
        subject: auto.subject,
        channel: 'email',
        sender_id: auto.sender_id,
        recipient_count: sendable.length,
      });

      // Load sender identity from SendGrid
      const sendersRes = await fetch('https://api.sendgrid.com/v3/senders', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!sendersRes.ok) {
        errors.push({ id: auto.id, name: auto.name, error: 'Failed to load senders from SendGrid' });
        continue;
      }
      const sendersData: any[] = await sendersRes.json();
      const sender = sendersData.find((s: any) => String(s.id) === String(auto.sender_id));
      if (!sender) {
        errors.push({ id: auto.id, name: auto.name, error: `Sender ID ${auto.sender_id} not found` });
        continue;
      }

      const fromEmail = sender.from?.email ?? '';
      const fromName  = sender.from?.name  ?? '';
      const unsubscribeUrl = auto.unsubscribe_url ?? `https://www.thelistingbug.com/unsubscribe/${auto.user_id}/${campaignId}`;

      // Send to each recipient
      let sent = 0;
      let failed = 0;

      for (const contact of sendable) {
        const mergeData: Record<string, string> = {
          first_name: contact.first_name ?? 'there',
          last_name:  contact.last_name  ?? '',
          city:       contact.city       ?? '',
          company:    contact.company    ?? '',
        };

        const unsubHref = (() => {
          try {
            const u = new URL(unsubscribeUrl);
            u.searchParams.set('email', contact.email);
            return u.toString();
          } catch {
            return `${unsubscribeUrl}?email=${encodeURIComponent(contact.email)}`;
          }
        })();

        const unsubFooter = `<br><br><hr style="border:none;border-top:1px solid #eee;margin:32px 0"><p style="font-size:11px;color:#aaa;text-align:center;margin:0;line-height:1.7">You are receiving this email because your contact information appears in a public real estate listing.<br>This message was sent by a ListingBug user. &nbsp;·&nbsp; <a href="${unsubHref}" style="color:#aaa;text-decoration:underline">Unsubscribe</a> &nbsp;·&nbsp; <a href="https://www.thelistingbug.com" style="color:#aaa;text-decoration:none">ListingBug</a></p>`;

        const payload = {
          personalizations: [{ to: [{ email: contact.email }] }],
          from: { email: fromEmail, name: fromName },
          subject: applyMergeTags(auto.subject ?? '', mergeData),
          content: [{ type: 'text/html', value: applyMergeTags(auto.body ?? '', mergeData) + unsubFooter }],
        };

        let sgMessageId: string | null = null;
        let status = 'pending';
        let errorMsg: string | null = null;

        try {
          const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (sgRes.ok || sgRes.status === 202) {
            sgMessageId = sgRes.headers.get('X-Message-Id');
            sent++;
          } else {
            const errText = await sgRes.text();
            status = 'failed';
            errorMsg = `SendGrid ${sgRes.status}: ${errText}`;
            failed++;
          }
        } catch (e: any) {
          status = 'failed';
          errorMsg = e?.message ?? 'Network error';
          failed++;
        }

        await serviceClient.from('marketing_sends').insert({
          campaign_id: campaignId,
          contact_id: contact.id,
          email: contact.email,
          status,
          sg_message_id: sgMessageId,
          error: errorMsg,
          sent_at: new Date().toISOString(),
        });
      }

      // Update automation stats
      await serviceClient.from('messaging_automations').update({
        last_run_at: new Date().toISOString(),
        total_sent: (auto.total_sent ?? 0) + sent,
        updated_at: new Date().toISOString(),
      }).eq('id', auto.id);

      console.log(`[run-due-messaging-automations] automation ${auto.id} (${auto.name}): sent=${sent} failed=${failed}`);
      processed++;
      totalSent += sent;
    } catch (e: any) {
      console.error(`[run-due-messaging-automations] automation ${auto.id} threw:`, e?.message);
      errors.push({ id: auto.id, name: auto.name, error: e?.message ?? 'Unknown error' });
    }
  }

  return json({ processed, totalSent, errors });
});
