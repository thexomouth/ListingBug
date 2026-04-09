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

/** Resolve SendGrid API key: messaging_config → integration_connections → env var */
async function resolveSendGridKey(
  serviceClient: ReturnType<typeof createClient>,
  userId: string
): Promise<{ key: string; source: 'messaging_config' | 'integration' | 'env' } | null> {
  // 1. messaging_config (user-entered key via Setup UI)
  const { data: mc } = await serviceClient
    .from('messaging_config')
    .select('config')
    .eq('user_id', userId)
    .eq('platform', 'sendgrid')
    .maybeSingle();
  if (mc?.config?.api_key) return { key: mc.config.api_key, source: 'messaging_config' };

  // 2. integration_connections (existing connected SendGrid integration)
  const { data: conn } = await serviceClient
    .from('integration_connections')
    .select('credentials')
    .eq('user_id', userId)
    .eq('integration_id', 'sendgrid')
    .maybeSingle();
  if ((conn?.credentials as any)?.api_key) return { key: (conn.credentials as any).api_key, source: 'integration' };

  // 3. env var (admin fallback)
  const envKey = Deno.env.get('SENDGRID_ADMIN_KEY');
  if (envKey) return { key: envKey, source: 'env' };

  return null;
}

/** Resolve HubSpot access token from integration_connections */
async function resolveHubSpotCreds(
  serviceClient: ReturnType<typeof createClient>,
  userId: string
): Promise<{ accessToken: string } | null> {
  const { data: conn } = await serviceClient
    .from('integration_connections')
    .select('credentials')
    .eq('user_id', userId)
    .eq('integration_id', 'hubspot')
    .maybeSingle();
  const accessToken = (conn?.credentials as any)?.access_token;
  return accessToken ? { accessToken } : null;
}

/** Resolve Mailchimp credentials from integration_connections */
async function resolveMailchimpCreds(
  serviceClient: ReturnType<typeof createClient>,
  userId: string
): Promise<{ accessToken: string; dc: string } | null> {
  const { data: conn } = await serviceClient
    .from('integration_connections')
    .select('credentials, config')
    .eq('user_id', userId)
    .eq('integration_id', 'mailchimp')
    .maybeSingle();
  if (!conn) return null;
  const creds = conn.credentials as any;
  const cfg = conn.config as any;
  const accessToken = creds?.access_token;
  const dc = cfg?.dc ?? creds?.dc ?? 'us1';
  if (!accessToken) return null;
  return { accessToken, dc };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  // Auth: validate JWT manually
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Unauthorized' }, 401);
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  // ── action=platforms ─────────────────────────────────────────────────────
  if (action === 'platforms') {
    const [sgKey, mcCreds, hubspotConn, twilioConn] = await Promise.all([
      resolveSendGridKey(serviceClient, user.id),
      resolveMailchimpCreds(serviceClient, user.id),
      serviceClient.from('integration_connections').select('credentials').eq('user_id', user.id).eq('integration_id', 'hubspot').maybeSingle(),
      serviceClient.from('integration_connections').select('credentials').eq('user_id', user.id).eq('integration_id', 'twilio').maybeSingle(),
    ]);

    // For Mailchimp: get audience count
    let mailchimpAudienceCount = 0;
    if (mcCreds) {
      try {
        const res = await fetch(`https://${mcCreds.dc}.api.mailchimp.com/3.0/lists?count=100&fields=total_items`, {
          headers: { Authorization: `Bearer ${mcCreds.accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          mailchimpAudienceCount = data.total_items ?? 0;
        }
      } catch { /* ignore */ }
    }

    return json({
      sendgrid: {
        connected: !!sgKey,
        source: sgKey?.source ?? null,
        // Mask the key — first 8 chars + asterisks
        key_masked: sgKey ? `${sgKey.key.slice(0, 8)}${'*'.repeat(12)}` : null,
      },
      mailchimp: {
        connected: !!mcCreds,
        source: mcCreds ? 'integration' : null,
        audience_count: mailchimpAudienceCount,
      },
      hubspot: {
        connected: !!(hubspotConn.data),
        source: hubspotConn.data ? 'integration' : null,
      },
      twilio: {
        connected: !!(twilioConn.data),
        source: twilioConn.data ? 'integration' : null,
      },
    });
  }

  // ── action=senders ───────────────────────────────────────────────────────
  if (action === 'senders') {
    const sgKey = await resolveSendGridKey(serviceClient, user.id);
    if (!sgKey) return json({ error: 'No SendGrid API key configured. Add one in Setup.' }, 400);

    const res = await fetch('https://api.sendgrid.com/v3/senders', {
      headers: { Authorization: `Bearer ${sgKey.key}` },
    });
    if (!res.ok) {
      const text = await res.text();
      return json({ error: `SendGrid error: ${res.status}`, detail: text }, 502);
    }
    const data: any[] = await res.json();
    const senders = data.map((s: any) => ({
      id: String(s.id),
      nickname: s.nickname ?? '',
      from_email: s.from?.email ?? '',
      from_name: s.from?.name ?? '',
    }));
    return json({ senders, key_source: sgKey.source });
  }

  // ── action=mailchimp-lists ───────────────────────────────────────────────
  if (action === 'mailchimp-lists') {
    const mcCreds = await resolveMailchimpCreds(serviceClient, user.id);
    if (!mcCreds) return json({ error: 'Mailchimp not connected.' }, 400);

    const res = await fetch(
      `https://${mcCreds.dc}.api.mailchimp.com/3.0/lists?count=100&fields=lists.id,lists.name,lists.stats.member_count`,
      { headers: { Authorization: `Bearer ${mcCreds.accessToken}` } }
    );
    if (!res.ok) return json({ error: `Mailchimp error: ${res.status}` }, 502);
    const data = await res.json();
    const lists = (data.lists ?? []).map((l: any) => ({
      id: l.id,
      name: l.name,
      member_count: l.stats?.member_count ?? 0,
    }));
    return json({ lists });
  }

  // ── action=mailchimp-members ─────────────────────────────────────────────
  if (action === 'mailchimp-members') {
    const listId = url.searchParams.get('list_id');
    if (!listId) return json({ error: 'list_id required' }, 400);

    const mcCreds = await resolveMailchimpCreds(serviceClient, user.id);
    if (!mcCreds) return json({ error: 'Mailchimp not connected.' }, 400);

    const res = await fetch(
      `https://${mcCreds.dc}.api.mailchimp.com/3.0/lists/${listId}/members?count=1000&status=subscribed&fields=members.email_address,members.status,members.merge_fields`,
      { headers: { Authorization: `Bearer ${mcCreds.accessToken}` } }
    );
    if (!res.ok) return json({ error: `Mailchimp error: ${res.status}` }, 502);
    const data = await res.json();
    const members = (data.members ?? []).map((m: any) => ({
      email: m.email_address,
      first_name: m.merge_fields?.FNAME ?? '',
      last_name: m.merge_fields?.LNAME ?? '',
      company: m.merge_fields?.COMPANY ?? m.merge_fields?.BROKERAGE ?? '',
      city: m.merge_fields?.CITY ?? '',
      phone: m.merge_fields?.PHONE ?? '',
    }));
    return json({ members });
  }

  // ── action=mailchimp-templates ───────────────────────────────────────────
  if (action === 'mailchimp-templates') {
    const mcCreds = await resolveMailchimpCreds(serviceClient, user.id);
    if (!mcCreds) return json({ error: 'Mailchimp not connected.' }, 400);

    const res = await fetch(
      `https://${mcCreds.dc}.api.mailchimp.com/3.0/templates?count=100&type=user&fields=templates.id,templates.name,templates.subject_line`,
      { headers: { Authorization: `Bearer ${mcCreds.accessToken}` } }
    );
    if (!res.ok) return json({ error: `Mailchimp error: ${res.status}` }, 502);
    const data = await res.json();
    const templates = (data.templates ?? []).map((t: any) => ({
      id: String(t.id),
      name: t.name ?? '',
      subject: t.subject_line ?? '',
    }));
    return json({ templates });
  }

  // ── action=hubspot-lists ─────────────────────────────────────────────────
  if (action === 'hubspot-lists') {
    const hsCreds = await resolveHubSpotCreds(serviceClient, user.id);
    if (!hsCreds) return json({ error: 'HubSpot not connected.' }, 400);

    const res = await fetch(
      'https://api.hubapi.com/crm/v3/lists?objectTypeId=0-1&count=100',
      { headers: { Authorization: `Bearer ${hsCreds.accessToken}` } }
    );
    if (!res.ok) return json({ error: `HubSpot error: ${res.status}` }, 502);
    const data = await res.json();
    const lists = (data.lists ?? []).map((l: any) => ({
      listId: String(l.listId),
      name: l.name ?? '',
      size: l.size ?? 0,
    }));
    return json({ lists });
  }

  // ── action=hubspot-members ───────────────────────────────────────────────
  if (action === 'hubspot-members') {
    const listId = url.searchParams.get('list_id');
    if (!listId) return json({ error: 'list_id required' }, 400);

    const hsCreds = await resolveHubSpotCreds(serviceClient, user.id);
    if (!hsCreds) return json({ error: 'HubSpot not connected.' }, 400);

    // Step 1: get contact IDs from list memberships
    const memberRes = await fetch(
      `https://api.hubapi.com/crm/v3/lists/${listId}/memberships?limit=100`,
      { headers: { Authorization: `Bearer ${hsCreds.accessToken}` } }
    );
    if (!memberRes.ok) return json({ error: `HubSpot error: ${memberRes.status}` }, 502);
    const memberData = await memberRes.json();
    const contactIds: string[] = (memberData.results ?? []).map((m: any) => String(m.recordId));

    if (contactIds.length === 0) return json({ members: [] });

    // Step 2: batch read contact properties
    const batchRes = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts/batch/read',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hsCreds.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: contactIds.map(id => ({ id })),
          properties: ['email', 'firstname', 'lastname', 'city', 'company', 'phone'],
        }),
      }
    );
    if (!batchRes.ok) return json({ error: `HubSpot batch error: ${batchRes.status}` }, 502);
    const batchData = await batchRes.json();
    const members = (batchData.results ?? [])
      .filter((c: any) => c.properties?.email)
      .map((c: any) => ({
        email: c.properties.email ?? '',
        first_name: c.properties.firstname ?? '',
        last_name: c.properties.lastname ?? '',
        city: c.properties.city ?? '',
        company: c.properties.company ?? '',
        phone: c.properties.phone ?? '',
      }));
    return json({ members });
  }

  return json({ error: `Unknown action: ${action}` }, 400);
});
