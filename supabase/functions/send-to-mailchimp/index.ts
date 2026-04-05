import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getFirstName(fullName: string | null): string {
  if (!fullName) return '';
  return fullName.split(' ')[0] ?? '';
}

function getLastName(fullName: string | null): string {
  if (!fullName) return '';
  const parts = fullName.split(' ');
  return parts.length > 1 ? parts.slice(1).join(' ') : '';
}

async function md5(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('MD5', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function normalizeListing(l: any) {
  return {
    agent_email:    (l.agent_email   ?? l.agentEmail   ?? l.listingAgent?.email   ?? '').toLowerCase().trim(),
    agent_name:     l.agent_name    ?? l.agentName    ?? l.listingAgent?.name    ?? '',
    agent_phone:    l.agent_phone   ?? l.agentPhone   ?? l.listingAgent?.phone   ?? '',
    agent_website:  l.agent_website ?? l.agentWebsite ?? l.listingAgent?.website ?? '',
    office_name:    l.office_name   ?? l.officeName   ?? l.listingOffice?.name   ?? l.brokerage ?? '',
    office_phone:   l.office_phone  ?? l.officePhone  ?? l.listingOffice?.phone  ?? '',
    office_website: l.office_website ?? l.officeWebsite ?? l.listingOffice?.website ?? '',
    formatted_address: l.formatted_address ?? l.formattedAddress ?? l.address ?? '',
    city:           l.city  ?? '',
    state:          l.state ?? '',
    zip:            l.zip_code ?? l.zip ?? l.zipCode ?? '',
    price:          l.price ?? null,
    property_type:  l.property_type ?? l.propertyType ?? '',
    mls_number:     l.mls_number ?? l.mlsNumber ?? '',
  };
}

// Snapshot the member count of a Mailchimp audience list.
// Returns -1 on failure so callers can detect and skip delta logic.
async function snapshotMemberCount(dc: string, accessToken: string, listId: string): Promise<number> {
  try {
    const res = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${listId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    if (!res.ok) return -1;
    const data = await res.json();
    return typeof data.stats?.member_count === 'number' ? data.stats.member_count : -1;
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
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  if (body.user_id) {
    userId = body.user_id;
  } else if (authHeader) {
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (!authErr && user) userId = user.id;
  }

  if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });

  const {
    listings,
    list_id,
    tags = [],
    double_opt_in = false,
    update_existing = true,
    status: memberStatus = 'subscribed',
  } = body;

  if (!list_id) return new Response(JSON.stringify({ error: 'list_id is required' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  if (!Array.isArray(listings) || listings.length === 0) return new Response(JSON.stringify({ error: 'listings must be a non-empty array' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });

  const { data: conn, error: connErr } = await serviceClient
    .from('integration_connections')
    .select('credentials, config')
    .eq('user_id', userId)
    .eq('integration_id', 'mailchimp')
    .single();

  if (connErr || !conn) {
    return new Response(JSON.stringify({ error: 'Mailchimp not connected. Please connect in Integrations.' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  const creds = conn.credentials as any;
  const config = conn.config as any;
  const accessToken = creds?.access_token;
  const dc = config?.dc ?? creds?.dc ?? 'us1';

  if (!accessToken) return new Response(JSON.stringify({ error: 'No Mailchimp access token. Please reconnect.' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });

  // ── STEP 1: Snapshot member count BEFORE ─────────────────────────────────
  const countBefore = await snapshotMemberCount(dc, accessToken, list_id);
  console.log(`[send-to-mailchimp] count_before=${countBefore} sending=${listings.length} listings`);

  // Fetch audience merge fields
  const audienceMergeFields = new Set<string>(['FNAME', 'LNAME']);
  const mergeFieldTypes: Record<string, string> = {};
  try {
    const mfRes = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${list_id}/merge-fields?count=100`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    if (mfRes.ok) {
      const mfData = await mfRes.json();
      if (Array.isArray(mfData.merge_fields)) {
        mfData.merge_fields.forEach((f: any) => {
          audienceMergeFields.add(f.tag);
          mergeFieldTypes[f.tag] = f.type;
        });
      }
    }
  } catch (e: any) { console.error('[send-to-mailchimp] merge-fields exception:', e?.message); }

  // ── STEP 2: Normalize and deduplicate ────────────────────────────────────
  const normalized = listings.map(normalizeListing);
  const withEmail = normalized.filter(l => l.agent_email.includes('@'));
  const skipped_no_email = listings.length - withEmail.length;

  const seen = new Set<string>();
  const validListings = withEmail.filter(l => {
    if (seen.has(l.agent_email)) return false;
    seen.add(l.agent_email);
    return true;
  });
  const skipped_duplicate = withEmail.length - validListings.length;

  console.log(`[send-to-mailchimp] valid=${validListings.length} skipped_no_email=${skipped_no_email} skipped_duplicate=${skipped_duplicate}`);

  if (validListings.length === 0) {
    return new Response(JSON.stringify({
      confirmed: 0, sent: 0, failed: 0,
      skipped_no_email: listings.length, total: listings.length,
      count_before: countBefore >= 0 ? countBefore : null, count_after: countBefore >= 0 ? countBefore : null,
      errors: ['No listings had valid agent email addresses'],
    }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  // ── STEP 3: Batch subscribe ───────────────────────────────────────────────
  const finalStatus = double_opt_in ? 'pending' : memberStatus;
  let apiReportedSent = 0, totalFailed = 0;
  const allErrors: string[] = [];
  const BATCH_SIZE = 500;

  const textFields: Record<string, (l: ReturnType<typeof normalizeListing>) => string> = {
    PHONE:    (l) => l.agent_phone,
    COMPANY:  (l) => l.office_name,
    BROKERAGE:(l) => l.office_name,
    CITY:     (l) => l.city,
    STATE:    (l) => l.state,
    ZIP:      (l) => l.zip,
    PRICE:    (l) => l.price ? String(l.price) : '',
    PROPTYPE: (l) => l.property_type,
    MLS:      (l) => l.mls_number,
    STREET:   (l) => l.formatted_address,
    WEBSITE:  (l) => l.agent_website || l.office_website,
    OFFPHONE: (l) => l.office_phone,
  };

  const tagNames: string[] = Array.isArray(tags) ? tags.filter(Boolean) : [];

  for (let i = 0; i < validListings.length; i += BATCH_SIZE) {
    const batch = validListings.slice(i, i + BATCH_SIZE);

    const members = batch.map((l) => {
      const merge_fields: Record<string, any> = {
        FNAME: getFirstName(l.agent_name),
        LNAME: getLastName(l.agent_name),
      };
      for (const [tag, getter] of Object.entries(textFields)) {
        if (audienceMergeFields.has(tag) && mergeFieldTypes[tag] !== 'address') {
          merge_fields[tag] = getter(l);
        }
      }
      if (audienceMergeFields.has('ADDRESS') && mergeFieldTypes['ADDRESS'] === 'address') {
        merge_fields['ADDRESS'] = { addr1: l.formatted_address, city: l.city, state: l.state, zip: l.zip, country: 'US' };
      }
      return { email_address: l.agent_email, status: finalStatus, status_if_new: finalStatus, merge_fields };
    });

    const batchRes = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${list_id}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ members, update_existing }),
    });

    const result = await batchRes.json().catch(() => null);
    const isBatchResponse = result && ('new_members' in result || 'updated_members' in result || 'errors' in result || 'error_count' in result);

    if (!isBatchResponse) {
      const errDetail = result?.detail ?? result?.title ?? result?.message ?? `HTTP ${batchRes.status}`;
      console.error('[send-to-mailchimp] non-batch error:', batchRes.status, errDetail);
      allErrors.push(`Mailchimp API error (${batchRes.status}): ${errDetail}`);
      totalFailed += batch.length;
      if (batchRes.status === 401 || batchRes.status === 403) break;
      continue;
    }

    const errorCount = result.error_count ?? 0;
    // new_members = net-new, updated_members = existing updated
    // Both count as "sent" for our purposes
    apiReportedSent += (result.new_members?.length ?? 0) + (result.updated_members?.length ?? 0);
    totalFailed += errorCount;
    if (result.errors?.length > 0) {
      result.errors.slice(0, 5).forEach((e: any) => {
        const fieldErrs = Array.isArray(e.errors) ? e.errors.map((fe: any) => `${fe.field}: ${fe.message}`).join('; ') : '';
        allErrors.push(`${e.email_address}: ${e.error}${fieldErrs ? ` (${fieldErrs})` : ''}`);
      });
    }

    console.log(`[send-to-mailchimp] batch ${i/BATCH_SIZE+1}: new=${result.new_members?.length ?? 0} updated=${result.updated_members?.length ?? 0} errors=${errorCount}`);

    if (tagNames.length > 0) {
      const allMembers = [...(result.new_members ?? []), ...(result.updated_members ?? [])];
      await Promise.allSettled(allMembers.map(async (m: any) => {
        const hash = await md5(m.email_address.toLowerCase());
        await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${list_id}/members/${hash}/tags`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: tagNames.map((t: string) => ({ name: t, status: 'active' })) }),
        });
      }));
    }
  }

  // ── STEP 4: Snapshot AFTER ────────────────────────────────────────────────
  const countAfter = await snapshotMemberCount(dc, accessToken, list_id);
  console.log(`[send-to-mailchimp] count_after=${countAfter} api_reported_sent=${apiReportedSent}`);

  // API-reported (new + updated) is the primary metric; delta only used as fallback when API gives 0
  const confirmed = apiReportedSent > 0
    ? apiReportedSent
    : (countBefore >= 0 && countAfter >= 0 ? Math.max(0, countAfter - countBefore) : 0);

  console.log(`[send-to-mailchimp] confirmed=${confirmed} skipped=${skipped_no_email + skipped_duplicate} failed=${totalFailed}`);

  await serviceClient.from('integration_connections')
    .update({ last_used_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('integration_id', 'mailchimp');

  return new Response(JSON.stringify({
    confirmed,
    sent: confirmed,
    failed: totalFailed,
    skipped_no_email: skipped_no_email + skipped_duplicate,
    total: listings.length,
    count_before: countBefore >= 0 ? countBefore : null,
    count_after: countAfter >= 0 ? countAfter : null,
    errors: allErrors.length > 0 ? allErrors : undefined,
  }), { headers: { ...cors, 'Content-Type': 'application/json' } });
});
