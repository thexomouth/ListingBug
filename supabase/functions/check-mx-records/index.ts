// verify_jwt = false — public utility endpoint, no user auth needed

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

async function hasMxRecord(domain: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return false;
    const data = await res.json();
    // Status 0 = NOERROR, Answer array present = MX records exist
    return data.Status === 0 && Array.isArray(data.Answer) && data.Answer.length > 0;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  if (req.method !== 'POST') return json({ error: 'POST required' }, 405);

  let domains: string[];
  try {
    const body = await req.json();
    domains = body.domains;
    if (!Array.isArray(domains) || domains.length === 0) {
      return json({ error: 'domains array required' }, 400);
    }
    if (domains.length > 2000) {
      return json({ error: 'max 2000 domains per request' }, 400);
    }
  } catch {
    return json({ error: 'invalid JSON body' }, 400);
  }

  // Deduplicate
  const unique = [...new Set(domains.map(d => d.toLowerCase().trim()))];

  // Batch into groups of 50 and resolve concurrently within each batch
  // to avoid overwhelming Google DNS or hitting timeouts
  const BATCH_SIZE = 50;
  const results: Record<string, boolean> = {};

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);
    const checks = await Promise.all(
      batch.map(async (domain) => ({ domain, hasMx: await hasMxRecord(domain) }))
    );
    for (const { domain, hasMx } of checks) {
      results[domain] = hasMx;
    }
  }

  return json({ results });
});
