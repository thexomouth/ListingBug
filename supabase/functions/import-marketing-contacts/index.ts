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

  let body: any;
  try { body = await req.json(); } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { contacts, list_ids = [], new_list_name } = body;
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return json({ error: 'contacts must be a non-empty array' }, 400);
  }

  // Upsert contacts
  const rows = contacts.map((c: any) => ({
    user_id: user.id,
    email: (c.email ?? '').toLowerCase().trim(),
    first_name: c.first_name ?? null,
    last_name: c.last_name ?? null,
    role: c.role ?? null,
    city: c.city ?? null,
    phone: c.phone ?? null,
    company: c.company ?? null,
    tags: c.tags ?? null,
    source: 'csv-upload',
  })).filter((r: any) => r.email.includes('@'));

  if (rows.length === 0) return json({ error: 'No valid email addresses found' }, 400);

  const { data: upserted, error: upsertErr } = await serviceClient
    .from('marketing_contacts')
    .upsert(rows, { onConflict: 'user_id,email', ignoreDuplicates: false })
    .select('id, email');

  if (upsertErr) return json({ error: upsertErr.message }, 500);

  // Build list of all target list IDs
  const targetListIds: string[] = [...list_ids];

  if (new_list_name?.trim()) {
    const { data: newList, error: listErr } = await serviceClient
      .from('marketing_lists')
      .insert({ user_id: user.id, name: new_list_name.trim() })
      .select('id')
      .single();
    if (listErr) return json({ error: listErr.message }, 500);
    targetListIds.push(newList.id);
  }

  // Assign contacts to lists
  if (targetListIds.length > 0 && upserted && upserted.length > 0) {
    // Fetch definitive contact IDs for this user+email combo (upsert may return stale IDs)
    const emails = rows.map((r: any) => r.email);
    const { data: freshContacts } = await serviceClient
      .from('marketing_contacts')
      .select('id')
      .eq('user_id', user.id)
      .in('email', emails);

    const contactIds = (freshContacts ?? []).map((c: any) => c.id);
    const memberships = contactIds.flatMap((cid: string) =>
      targetListIds.map((lid: string) => ({ contact_id: cid, list_id: lid }))
    );
    if (memberships.length > 0) {
      const { error: memberErr } = await serviceClient
        .from('marketing_contacts_lists')
        .upsert(memberships, { onConflict: 'contact_id,list_id', ignoreDuplicates: true });
      if (memberErr) return json({ error: memberErr.message }, 500);
    }
  }

  return json({
    imported: rows.length,
    updated: upserted?.length ?? 0,
    skipped: contacts.length - rows.length,
    list_ids: targetListIds,
  });
});
