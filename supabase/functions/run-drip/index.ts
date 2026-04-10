// verify_jwt = false — called by pg_cron via pg_net

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SENDGRID_API = 'https://api.sendgrid.com/v3/mail/send';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

function getPSTHour(): number {
  const pstStr = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
  return new Date(pstStr).getHours();
}

function getPSTDateString(): string {
  const pstStr = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
  const d = new Date(pstStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function randomDelay() {
  // 4–18 seconds between sends — looks organic
  return Math.round((4 + Math.random() * 14) * 1000);
}

type SgErrorClass =
  | 'ok'
  | 'rate_limited'       // 429 — too many requests, temporary
  | 'plan_limit_daily'   // 400/403 — daily sending limit exhausted
  | 'plan_limit_monthly' // 400/403 — monthly/plan credits exhausted
  | 'account_suspended'  // 403 — account suspended or send access revoked
  | 'invalid_api_key'    // 401 — bad or revoked API key
  | 'sender_unverified'  // 400 — from address not a verified sender identity
  | 'permanent_bounce'   // 550–553 — address doesn't exist / policy reject
  | 'spam_block'         // 554 / spam report
  | 'transient'          // 4xx/5xx retryable errors
  | 'unknown';

interface SgErrorResult {
  cls: SgErrorClass;
  message: string;        // human-readable for notification
  contactError: string;   // stored on the drip_contact row
  shouldBreak: boolean;   // stop processing this batch immediately
  runAction?: 'pause' | 'stop';
  notifLevel?: 'warning' | 'error' | 'critical';
}

function classifySendGridError(status: number, body: any, retryAfter?: string | null): SgErrorResult {
  const rawMsg: string = body?.errors?.[0]?.message || body?.message || `HTTP ${status}`;
  const msg = rawMsg.toLowerCase();

  // 429 — rate limited
  if (status === 429) {
    const wait = retryAfter ? ` SendGrid says retry after ${retryAfter}s.` : '';
    return {
      cls: 'rate_limited', shouldBreak: true, runAction: 'pause',
      notifLevel: 'warning',
      contactError: `Rate limited by SendGrid (429)`,
      message: `SendGrid rate limit hit — too many requests in a short window.${wait} Run paused; will resume next cycle.`,
    };
  }

  // 401 — invalid/revoked API key
  if (status === 401) {
    return {
      cls: 'invalid_api_key', shouldBreak: true, runAction: 'stop',
      notifLevel: 'critical',
      contactError: `Invalid SendGrid API key (401)`,
      message: 'SendGrid API key is invalid or has been revoked (401). Run stopped — update your API key in Messaging Setup.',
    };
  }

  if (status === 403) {
    if (msg.includes('send access') || msg.includes('not allowed to send') || msg.includes('suspended') || msg.includes('forbidden')) {
      return {
        cls: 'account_suspended', shouldBreak: true, runAction: 'stop',
        notifLevel: 'critical',
        contactError: `SendGrid account suspended or send access revoked (403)`,
        message: 'Your SendGrid account has been suspended or send access revoked (403). Run stopped — check your SendGrid account immediately.',
      };
    }
    // Generic 403
    return {
      cls: 'account_suspended', shouldBreak: true, runAction: 'stop',
      notifLevel: 'critical',
      contactError: `SendGrid access forbidden (403): ${rawMsg}`,
      message: `SendGrid returned 403 Forbidden: "${rawMsg}". Run stopped — check your SendGrid account.`,
    };
  }

  if (status === 400 || status === 402) {
    // Monthly / plan credit limit
    if (msg.includes('monthly') || msg.includes('credits') || msg.includes('plan limit') || msg.includes('upgrade') || msg.includes('maximum credits')) {
      return {
        cls: 'plan_limit_monthly', shouldBreak: true, runAction: 'stop',
        notifLevel: 'critical',
        contactError: `SendGrid monthly/plan send limit reached`,
        message: `SendGrid plan limit reached: "${rawMsg}". You have exhausted your monthly email credits. Run stopped — upgrade your SendGrid plan to continue.`,
      };
    }
    // Daily limit
    if (msg.includes('daily') || msg.includes('day limit') || msg.includes('sending limit') || msg.includes('per day')) {
      return {
        cls: 'plan_limit_daily', shouldBreak: true, runAction: 'pause',
        notifLevel: 'error',
        contactError: `SendGrid daily send limit reached`,
        message: `SendGrid daily send limit reached: "${rawMsg}". Run paused — will automatically resume tomorrow.`,
      };
    }
    // Sender not verified
    if (msg.includes('verified sender') || msg.includes('sender identity') || msg.includes('from address')) {
      return {
        cls: 'sender_unverified', shouldBreak: true, runAction: 'pause',
        notifLevel: 'error',
        contactError: `Sender identity not verified in SendGrid`,
        message: `SendGrid rejected the from address — sender identity is not verified: "${rawMsg}". Run paused — verify the sender in SendGrid settings.`,
      };
    }
    // No send access (sometimes comes as 400)
    if (msg.includes('send access') || msg.includes('not permitted') || msg.includes('account') && msg.includes('access')) {
      return {
        cls: 'account_suspended', shouldBreak: true, runAction: 'stop',
        notifLevel: 'critical',
        contactError: `SendGrid account lacks send access`,
        message: `SendGrid account does not have send access: "${rawMsg}". Run stopped — check your SendGrid account status.`,
      };
    }
  }

  // Permanent bounce codes (550–553)
  if (status >= 550 && status <= 553) {
    return {
      cls: 'permanent_bounce', shouldBreak: false,
      contactError: `Permanent bounce (${status}): ${rawMsg}`,
      message: '',
    };
  }

  // Spam / policy block (554)
  if (status === 554 || msg.includes('spam') || msg.includes('policy violation')) {
    return {
      cls: 'spam_block', shouldBreak: true, runAction: 'stop',
      notifLevel: 'critical',
      contactError: `Spam/policy block (${status}): ${rawMsg}`,
      message: `SendGrid reported a spam or policy violation (${status}): "${rawMsg}". Run stopped immediately to protect domain reputation.`,
    };
  }

  // 5xx transient
  if (status >= 500) {
    return {
      cls: 'transient', shouldBreak: false,
      contactError: `SendGrid server error (${status}): ${rawMsg}`,
      message: '',
    };
  }

  // Fallback unknown
  return {
    cls: 'unknown', shouldBreak: false,
    contactError: `SendGrid error (${status}): ${rawMsg}`,
    message: '',
  };
}

function resolveMergeTags(text: string, c: Record<string, string>): string {
  return text
    .replace(/\{\{first_name\}\}/gi, c.first_name || '')
    .replace(/\{\{last_name\}\}/gi, c.last_name || '')
    .replace(/\{\{city\}\}/gi, c.city || '')
    .replace(/\{\{company\}\}/gi, c.business_name || c.company || '');
}

async function checkSafety(
  supabase: ReturnType<typeof createClient>,
  runId: string
): Promise<{ safe: boolean; reason?: string; level?: string; newStatus?: string }> {
  const { data: recent } = await supabase
    .from('drip_contacts')
    .select('status, error_message')
    .eq('run_id', runId)
    .in('status', ['sent', 'failed'])
    .order('created_at', { ascending: false })
    .limit(50);

  if (!recent || recent.length < 10) return { safe: true };

  const failed = recent.filter((r: any) => r.status === 'failed');

  // Spam report — immediate stop
  const spamHit = failed.some((r: any) =>
    r.error_message?.toLowerCase().includes('spam') ||
    r.error_message?.toLowerCase().includes('554')
  );
  if (spamHit) {
    return {
      safe: false, newStatus: 'stopped', level: 'critical',
      reason: 'Spam report received from a receiving server. Run stopped immediately to protect domain reputation.',
    };
  }

  // Bounce detection
  const bounced = failed.filter((r: any) =>
    r.error_message?.toLowerCase().includes('bounce') ||
    /\b55[0-9]\b/.test(r.error_message || '')
  );
  const bounceRate = bounced.length / recent.length;

  if (bounceRate > 0.15 && recent.length >= 20) {
    return {
      safe: false, newStatus: 'paused', level: 'error',
      reason: `Bounce rate hit ${Math.round(bounceRate * 100)}% over last ${recent.length} sends (safe threshold: 15%). Auto-paused to protect domain.`,
    };
  }

  if (bounceRate > 0.08 && recent.length >= 20) {
    return {
      safe: false, newStatus: 'paused', level: 'warning',
      reason: `Bounce rate is ${Math.round(bounceRate * 100)}% over last ${recent.length} sends — approaching dangerous levels. Auto-paused.`,
    };
  }

  // Domain-level blocking
  const blocked = failed.filter((r: any) =>
    r.error_message?.toLowerCase().includes('block') ||
    r.error_message?.toLowerCase().includes('reject') ||
    r.error_message?.toLowerCase().includes('policy') ||
    /\b42[0-9]\b/.test(r.error_message || '') ||
    /\b45[0-9]\b/.test(r.error_message || '')
  );
  if (blocked.length >= 3) {
    return {
      safe: false, newStatus: 'paused', level: 'error',
      reason: `Receiving domain is actively blocking sends (${blocked.length} block events in last ${recent.length} attempts). Auto-paused.`,
    };
  }

  // 10 consecutive failures
  const last10 = recent.slice(0, 10);
  if (last10.length === 10 && last10.every((r: any) => r.status === 'failed')) {
    return {
      safe: false, newStatus: 'paused', level: 'error',
      reason: '10 consecutive send failures. Auto-paused — check SendGrid connection and API key.',
    };
  }

  return { safe: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Time gate: only run between 6am and 11:45pm PST
  const pstHour = getPSTHour();
  if (pstHour < 6) {
    return json({ skipped: true, reason: `Before 6am PST (current PST hour: ${pstHour})` });
  }

  const todayPST = getPSTDateString();

  const { data: runs, error: runsErr } = await supabase
    .from('drip_runs')
    .select('*')
    .eq('status', 'active');

  if (runsErr) return json({ error: runsErr.message }, 500);
  if (!runs || runs.length === 0) return json({ processed: 0, reason: 'No active drip runs' });

  // Resolve SendGrid key once (shared config)
  const { data: sgConfig } = await supabase
    .from('messaging_config')
    .select('config')
    .eq('platform', 'sendgrid')
    .maybeSingle();

  const sgKey: string | undefined = sgConfig?.config?.api_key || Deno.env.get('SENDGRID_API_KEY');

  // Resolve sender list once
  let senders: Array<{ id: string; from_email: string; from_name: string }> = [];
  if (sgKey) {
    try {
      const res = await fetch('https://api.sendgrid.com/v3/verified_senders', {
        headers: { Authorization: `Bearer ${sgKey}` },
      });
      if (res.ok) {
        const d = await res.json();
        senders = (d.results || []).map((s: any) => ({
          id: String(s.id),
          from_email: s.from_email,
          from_name: s.from_name || s.nickname || '',
        }));
      }
    } catch { /* ignore */ }
  }

  const summary: any[] = [];

  for (const run of runs) {
    if (!sgKey) {
      await supabase.from('drip_notifications').insert({
        run_id: run.id, level: 'error',
        message: 'No SendGrid API key found. Go to Messaging Setup to connect SendGrid.',
      });
      await supabase.from('drip_runs').update({
        status: 'paused', pause_reason: 'No SendGrid API key',
      }).eq('id', run.id);
      continue;
    }

    const sender = senders.find(s => s.id === run.sender_id) || senders[0];
    if (!sender) {
      await supabase.from('drip_notifications').insert({
        run_id: run.id, level: 'error',
        message: 'No verified SendGrid sender found. Add a sender in Messaging Setup.',
      });
      await supabase.from('drip_runs').update({
        status: 'paused', pause_reason: 'No verified sender',
      }).eq('id', run.id);
      continue;
    }

    // Reset daily counter on new day
    let sendsToday = run.sends_today;
    if (run.sends_today_date !== todayPST) {
      sendsToday = 0;
      await supabase.from('drip_runs').update({
        sends_today: 0,
        sends_today_date: todayPST,
      }).eq('id', run.id);
    }

    if (sendsToday >= run.daily_limit) {
      summary.push({ run_id: run.id, skipped: 'daily_limit_reached', sends_today: sendsToday });
      continue;
    }

    // Calculate batch size with ±20% jitter
    const hoursLeft = Math.max(1, 23 - pstHour);
    const intervalsLeft = hoursLeft * 4;
    const remaining = run.daily_limit - sendsToday;
    const baseBatch = Math.ceil(remaining / intervalsLeft);
    const jitter = 0.8 + Math.random() * 0.4;
    const batchSize = Math.max(1, Math.min(20, Math.round(baseBatch * jitter)));

    // Fetch next pending contacts
    const { data: contacts } = await supabase
      .from('drip_contacts')
      .select('*')
      .eq('run_id', run.id)
      .eq('status', 'pending')
      .order('list_order', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (!contacts || contacts.length === 0) {
      await supabase.from('drip_runs').update({
        status: 'completed', updated_at: new Date().toISOString(),
      }).eq('id', run.id);
      await supabase.from('drip_notifications').insert({
        run_id: run.id, level: 'info',
        message: `All ${run.total_sent} emails sent. Drip run completed successfully.`,
      });

      // Activate the next queued run if one exists
      const { data: nextQueued } = await supabase
        .from('drip_runs')
        .select('id, campaign_name')
        .eq('status', 'queued')
        .order('queue_position', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextQueued) {
        await supabase.from('drip_runs').update({
          status: 'active', updated_at: new Date().toISOString(),
        }).eq('id', nextQueued.id);
        await supabase.from('drip_notifications').insert({
          run_id: nextQueued.id, level: 'info',
          message: `Previous run completed. "${nextQueued.campaign_name}" is now active and sending.`,
        });
      }

      summary.push({ run_id: run.id, completed: true, activated_next: nextQueued?.id ?? null });
      continue;
    }

    // Update current list tracker
    if (contacts[0].list_name !== run.current_list_name) {
      await supabase.from('drip_runs').update({ current_list_name: contacts[0].list_name }).eq('id', run.id);
      await supabase.from('drip_notifications').insert({
        run_id: run.id, level: 'info',
        message: `Started sending to list: ${contacts[0].list_name}`,
      });
    }

    let sentCount = 0, failedCount = 0;
    let criticalBreak = false; // set true when a limit/account error requires stopping the batch

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const subject = resolveMergeTags(run.subject, contact);
      const bodyText = resolveMergeTags(run.body, contact);
      const unsubUrl = run.unsubscribe_url || '';
      const htmlBody = `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.6;max-width:580px;color:#222">${
        bodyText.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')
      }${unsubUrl ? `<p style="margin-top:2em;font-size:12px;color:#999"><a href="${unsubUrl}" style="color:#999">Unsubscribe</a></p>` : ''}</div>`;

      const sgPayload = {
        personalizations: [{ to: [{ email: contact.email, name: contact.business_name || contact.first_name || '' }] }],
        from: { email: sender.from_email, name: sender.from_name },
        subject,
        content: [
          { type: 'text/plain', value: bodyText + (unsubUrl ? `\n\nUnsubscribe: ${unsubUrl}` : '') },
          { type: 'text/html', value: htmlBody },
        ],
        tracking_settings: { click_tracking: { enable: true }, open_tracking: { enable: true } },
      };

      try {
        const res = await fetch(SENDGRID_API, {
          method: 'POST',
          headers: { Authorization: `Bearer ${sgKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(sgPayload),
        });

        if (res.ok || res.status === 202) {
          const msgId = res.headers.get('X-Message-Id') || null;
          await supabase.from('drip_contacts').update({
            status: 'sent', sent_at: new Date().toISOString(), sg_message_id: msgId,
          }).eq('id', contact.id);
          sentCount++;
        } else {
          const errData = await res.json().catch(() => ({}));
          const retryAfter = res.headers.get('Retry-After');
          const classified = classifySendGridError(res.status, errData, retryAfter);

          await supabase.from('drip_contacts').update({
            status: 'failed', error_message: classified.contactError,
          }).eq('id', contact.id);
          failedCount++;

          // If this is a limit/account/key error: notify + act on the run immediately
          if (classified.shouldBreak && classified.runAction && classified.message) {
            const newStatus = classified.runAction === 'stop' ? 'stopped' : 'paused';
            await supabase.from('drip_runs').update({
              status: newStatus,
              pause_reason: classified.message,
              sends_today: sendsToday + sentCount,
              total_sent: run.total_sent + sentCount,
              total_failed: run.total_failed + failedCount,
              updated_at: new Date().toISOString(),
            }).eq('id', run.id);
            await supabase.from('drip_notifications').insert({
              run_id: run.id,
              level: classified.notifLevel || 'error',
              message: classified.message,
            });
            criticalBreak = true;
            break; // stop sending to remaining contacts in this batch
          }
        }
      } catch (e: any) {
        await supabase.from('drip_contacts').update({
          status: 'failed', error_message: e?.message || 'Network error',
        }).eq('id', contact.id);
        failedCount++;
      }

      // Random delay between sends (skip after last one)
      if (!criticalBreak && i < contacts.length - 1) await sleep(randomDelay());
    }

    // Update run counters (skip if criticalBreak already wrote them)
    if (!criticalBreak) {
      await supabase.from('drip_runs').update({
        sends_today: sendsToday + sentCount,
        total_sent: run.total_sent + sentCount,
        total_failed: run.total_failed + failedCount,
        updated_at: new Date().toISOString(),
      }).eq('id', run.id);

      // Safety check after batch (bounce rate, domain blocks, etc.)
      if (sentCount + failedCount > 0) {
        const safety = await checkSafety(supabase, run.id);
        if (!safety.safe && safety.reason) {
          await supabase.from('drip_runs').update({
            status: safety.newStatus || 'paused',
            pause_reason: safety.reason,
          }).eq('id', run.id);
          await supabase.from('drip_notifications').insert({
            run_id: run.id, level: safety.level || 'error', message: safety.reason,
          });
        }
      }
    }

    summary.push({ run_id: run.id, sent: sentCount, failed: failedCount, batch_size: batchSize });
  }

  return json({ ok: true, summary });
});
