import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SENDGRID_ADMIN_KEY = Deno.env.get('SENDGRID_ADMIN_KEY');

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

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  if (!SENDGRID_ADMIN_KEY) return json({ error: 'SENDGRID_ADMIN_KEY not configured' }, 500);

  if (action === 'senders') {
    const res = await fetch('https://api.sendgrid.com/v3/senders', {
      headers: { Authorization: `Bearer ${SENDGRID_ADMIN_KEY}` },
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
    return json({ senders });
  }

  return json({ error: `Unknown action: ${action}` }, 400);
});
