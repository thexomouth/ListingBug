import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Unauthorized' }, 401);

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let body: any;
  try { body = await req.json(); } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { integration } = body;
  if (!integration) return json({ error: 'integration is required' }, 400);

  const { data: conn } = await serviceClient
    .from('integration_connections')
    .select('credentials, config')
    .eq('user_id', user.id)
    .eq('integration_id', integration)
    .single();

  if (!conn) return json({ error: `${integration} is not connected` }, 400);

  // ── Mailchimp ────────────────────────────────────────────────────────────────
  if (integration === 'mailchimp') {
    const creds = conn.credentials as any;
    const config = conn.config as any;
    const accessToken = creds?.access_token;
    const dc = config?.dc ?? creds?.dc ?? 'us1';

    if (!accessToken) return json({ error: 'No Mailchimp access token. Please reconnect.' }, 400);

    // First check if a "ListingBug" audience already exists
    const listRes = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists?count=100`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (listRes.ok) {
      const listData = await listRes.json();
      const existing = (listData.lists ?? []).find((l: any) =>
        l.name.toLowerCase() === 'listingbug'
      );
      if (existing) {
        return json({ id: existing.id, name: existing.name, existed: true });
      }
    }

    // Create new audience named "ListingBug"
    const fromEmail = user.email ?? 'noreply@listingbug.com';
    const payload = {
      name: 'ListingBug',
      contact: {
        company: 'ListingBug',
        address1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
      },
      permission_reminder:
        'You are receiving this because you are a real estate agent whose listing was discovered via ListingBug.',
      email_type_option: false,
      campaign_defaults: {
        from_name: 'ListingBug',
        from_email: fromEmail,
        subject: 'New Listing Update',
        language: 'en',
      },
    };

    const createRes = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const createData = await createRes.json().catch(() => ({}));
    if (!createRes.ok) {
      const detail = createData.detail ?? createData.title ?? `HTTP ${createRes.status}`;
      console.error('[create-integration-audience] Mailchimp create failed:', detail, createData);
      return json({ error: `Failed to create Mailchimp audience: ${detail}` }, 502);
    }

    return json({ id: createData.id, name: createData.name, existed: false });
  }

  // ── SendGrid ─────────────────────────────────────────────────────────────────
  if (integration === 'sendgrid') {
    const apiKey = (conn.credentials as any)?.api_key;
    if (!apiKey) return json({ error: 'No SendGrid API key. Please reconnect.' }, 400);

    // Check if "ListingBug" list already exists
    const listsRes = await fetch('https://api.sendgrid.com/v3/marketing/lists?page_size=100', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (listsRes.ok) {
      const listsData = await listsRes.json();
      const existing = (listsData.result ?? []).find((l: any) =>
        l.name.toLowerCase() === 'listingbug'
      );
      if (existing) {
        return json({ id: existing.id, name: existing.name, existed: true });
      }
    }

    // Create new list named "ListingBug"
    const createRes = await fetch('https://api.sendgrid.com/v3/marketing/lists', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'ListingBug' }),
    });

    const createData = await createRes.json().catch(() => ({}));
    if (!createRes.ok) {
      const detail = createData.errors?.[0]?.message ?? `HTTP ${createRes.status}`;
      console.error('[create-integration-audience] SendGrid create failed:', detail);
      return json({ error: `Failed to create SendGrid list: ${detail}` }, 502);
    }

    return json({ id: createData.id, name: createData.name, existed: false });
  }

  // ── Twilio ────────────────────────────────────────────────────────────────────
  if (integration === 'twilio') {
    const creds = conn.credentials as any;
    const accountSid = creds?.account_sid;
    const authToken = creds?.auth_token;
    if (!accountSid || !authToken) return json({ error: 'Twilio credentials incomplete. Please reconnect.' }, 400);

    const basicAuth = btoa(`${accountSid}:${authToken}`);
    const syncBase = `https://sync.twilio.com/v1/Services/default`;
    const uniqueName = 'listingbug';

    // Try to create — 409 means it already exists
    const createRes = await fetch(`${syncBase}/Lists`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ UniqueName: uniqueName }),
    });

    if (createRes.ok) {
      const data = await createRes.json();
      return json({ id: data.sid, name: data.unique_name, existed: false });
    }

    if (createRes.status === 409) {
      const getRes = await fetch(`${syncBase}/Lists/${uniqueName}`, {
        headers: { Authorization: `Basic ${basicAuth}` },
      });
      if (getRes.ok) {
        const data = await getRes.json();
        return json({ id: data.sid, name: data.unique_name, existed: true });
      }
    }

    const errText = await createRes.text();
    return json({ error: `Failed to create Twilio Sync List: ${errText.slice(0, 200)}` }, 502);
  }

  // ── HubSpot ───────────────────────────────────────────────────────────────────
  if (integration === 'hubspot') {
    const creds = conn.credentials as any;
    const accessToken = creds?.access_token;
    if (!accessToken) return json({ error: 'No HubSpot access token. Please reconnect.' }, 400);

    // Check if "ListingBug" list already exists (search by name)
    const searchRes = await fetch(
      'https://api.hubapi.com/crm/v3/lists/search',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'ListingBug',
          count: 10,
          listType: 'STATIC',
          processingTypes: ['MANUAL'],
        }),
      }
    );
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const existing = (searchData.lists ?? []).find(
        (l: any) => l.name?.toLowerCase() === 'listingbug'
      );
      if (existing) {
        return json({ id: String(existing.listId ?? existing.id), name: existing.name, existed: true });
      }
    }

    // Create new static contact list named "ListingBug"
    const createRes = await fetch('https://api.hubapi.com/crm/v3/lists', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'ListingBug',
        objectTypeId: '0-1', // Contacts
        processingType: 'MANUAL',
      }),
    });

    const createData = await createRes.json().catch(() => ({}));
    if (!createRes.ok) {
      const detail = createData.message ?? createData.error ?? `HTTP ${createRes.status}`;
      console.error('[create-integration-audience] HubSpot create failed:', detail);
      return json({ error: `Failed to create HubSpot list: ${detail}` }, 502);
    }

    const listId = createData.listId ?? createData.id;
    return json({ id: String(listId), name: createData.name ?? 'ListingBug', existed: false });
  }

  return json({ error: `Audience creation is not supported for ${integration}` }, 400);
});
