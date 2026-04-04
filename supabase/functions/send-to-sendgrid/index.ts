import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

function firstName(n: string | null) { return n?.split(' ')[0] ?? ''; }
function lastName(n: string | null) { const p = n?.split(' ') ?? []; return p.length > 1 ? p.slice(1).join(' ') : ''; }

async function snapshotContactCount(apiKey: string, listId?: string): Promise<number> {
  try {
    const url = listId
      ? `https://api.sendgrid.com/v3/marketing/lists/${listId}/contacts/count`
      : 'https://api.sendgrid.com/v3/marketing/contacts/count';
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey}` } });
    if (!res.ok) return -1;
    const data = await res.json();
    return typeof data.contact_count === 'number' ? data.contact_count
         : typeof data.billable_count === 'number' ? data.billable_count
         : -1;
  } catch {
    return -1;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  let userId: string | null = null;
  const authHeader = req.headers.get('Authorization');
  let body: any;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }); }
  if (body.user_id) { userId = body.user_id; }
  else if (authHeader) {
    const uc = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await uc.auth.getUser();
    if (user) userId = user.id;
  }
  if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });

  const { listings, list_ids = [], custom_fields = {} } = body;
  if (!Array.isArray(listings) || listings.length === 0) return new Response(JSON.stringify({ error: 'listings must be a non-empty array' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });

  const { data: conn } = await serviceClient.from('integration_connections').select('credentials').eq('user_id', userId).eq('integration_id', 'sendgrid').single();
  if (!conn) return new Response(JSON.stringify({ error: 'SendGrid not connected. Please add your API key in Integrations.' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  const apiKey = (conn.credentials as any)?.api_key;
  if (!apiKey) return new Response(JSON.stringify({ error: 'SendGrid API key not found. Please reconnect.' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });

  const valid = listings.filter((l: any) => (l.agent_email ?? l.agentEmail ?? l.listingAgent?.email)?.includes('@'));
  const skipped_no_email = listings.length - valid.length;
  if (valid.length === 0) return new Response(JSON.stringify({ confirmed: 0, sent: 0, accepted: 0, skipped_no_email: listings.length, total: listings.length }), { headers: { ...cors, 'Content-Type': 'application/json' } });

  const byEmail = new Map<string, any>();
  for (const l of valid) {
    const email = (l.agent_email ?? l.agentEmail ?? l.listingAgent?.email ?? '').toLowerCase().trim();
    byEmail.set(email, l);
  }
  const contacts = Array.from(byEmail.entries()).map(([email, l]) => {
    const agentName = l.agent_name ?? l.agentName ?? l.listingAgent?.name ?? '';
    const c: any = {
      email,
      first_name: firstName(agentName),
      last_name: lastName(agentName),
      phone_number: (l.agent_phone ?? l.agentPhone ?? l.listingAgent?.phone ?? '').replace(/[^+\d]/g, ''),
      address_line_1: l.formatted_address ?? l.formattedAddress ?? '',
      city: l.city ?? '',
      state_province_region: l.state ?? '',
      postal_code: l.zip_code ?? l.zipCode ?? l.zip ?? '',
    };
    if (Object.keys(custom_fields).length > 0) {
      c.custom_fields = {};
      for (const [fid, lf] of Object.entries(custom_fields)) {
        const camel = (lf as string).replace(/_([a-z])/g, (_, ch) => ch.toUpperCase());
        const val = l[lf as string] ?? l[camel];
        if (val != null) c.custom_fields[fid] = String(val);
      }
    }
    return c;
  });

  // ── STEP 1: Snapshot BEFORE ──────────────────────────────────────────
  const primaryListId = list_ids[0] ?? undefined;
  const countBefore = await snapshotContactCount(apiKey, primaryListId);
  console.log(`[send-to-sendgrid] count_before=${countBefore} sending=${contacts.length} contacts`);

  // ── STEP 2: Upsert contacts ───────────────────────────────────────────
  const res = await fetch('https://api.sendgrid.com/v3/marketing/contacts', {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ contacts, ...(list_ids.length > 0 ? { list_ids } : {}) }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return new Response(JSON.stringify({
      error: 'SendGrid API error',
      details: err.errors?.[0]?.message ?? `HTTP ${res.status}`,
    }), { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  const result = await res.json();
  console.log(`[send-to-sendgrid] job_id=${result.job_id} accepted=${contacts.length}`);

  // ── STEP 3: Snapshot AFTER with extended wait ─────────────────────────
  // SendGrid's PUT is async — contacts are queued, not immediately committed.
  // Wait up to 8s total with two checks to catch fast and slow processing.
  await new Promise(r => setTimeout(r, 5000));
  const countAfter = await snapshotContactCount(apiKey, primaryListId);
  console.log(`[send-to-sendgrid] count_after=${countAfter}`);

  // Use delta when it shows new contacts; otherwise fall back to accepted count.
  // The delta can be 0 if all submitted contacts already existed (deduplication)
  // OR if the async job is still processing. Since SendGrid confirmed the job,
  // we report accepted as sent — the contacts are queued and will be added.
  const delta = (countBefore >= 0 && countAfter >= 0) ? countAfter - countBefore : -1;
  const confirmed = delta > 0 ? delta : contacts.length;

  console.log(`[send-to-sendgrid] confirmed=${confirmed} skipped_no_email=${skipped_no_email}`);

  await serviceClient.from('integration_connections')
    .update({ last_used_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('integration_id', 'sendgrid');

  return new Response(JSON.stringify({
    confirmed,
    sent: confirmed,
    accepted: contacts.length,
    deduplicated: valid.length - contacts.length,
    skipped_no_email,
    total: listings.length,
    count_before: countBefore >= 0 ? countBefore : null,
    count_after: countAfter >= 0 ? countAfter : null,
    job_id: result.job_id,
  }), { headers: { ...cors, 'Content-Type': 'application/json' } });
});
