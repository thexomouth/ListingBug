import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_COLUMNS = [
  'address','city','state','zip','county',
  'price','bedrooms','bathrooms','sqft','lot_size','year_built',
  'property_type','status','listed_date','days_on_market','price_reduced','mls_number',
  'agent_name','agent_phone','agent_email','agent_website',
  'office_name','office_phone','office_email',
  'latitude','longitude','listing_id','synced_at',
];

const COLUMN_HEADERS: Record<string, string> = {
  address:'Property Address',city:'City',state:'State',zip:'ZIP Code',county:'County',
  price:'List Price',bedrooms:'Bedrooms',bathrooms:'Bathrooms',sqft:'Sq Ft',
  lot_size:'Lot Size',year_built:'Year Built',property_type:'Property Type',
  status:'Status',listed_date:'Listed Date',days_on_market:'Days on Market',
  price_reduced:'Price Reduced',mls_number:'MLS #',
  agent_name:'Agent Name',agent_phone:'Agent Phone',agent_email:'Agent Email',
  agent_website:'Agent Website',office_name:'Brokerage',office_phone:'Office Phone',
  office_email:'Office Email',latitude:'Latitude',longitude:'Longitude',
  listing_id:'Listing ID',synced_at:'Synced At',
};

function extractValue(listing: any, col: string): string {
  const l = listing;
  const map: Record<string, any> = {
    address: l.formatted_address ?? l.formattedAddress ?? '',
    city: l.city ?? '', state: l.state ?? '', zip: l.zip_code ?? l.zipCode ?? '',
    county: l.county ?? '', price: l.price ?? '', bedrooms: l.bedrooms ?? '',
    bathrooms: l.bathrooms ?? '', sqft: l.square_footage ?? l.squareFootage ?? '',
    lot_size: l.lot_size ?? l.lotSize ?? '', year_built: l.year_built ?? l.yearBuilt ?? '',
    property_type: l.property_type ?? l.propertyType ?? '', status: l.status ?? '',
    listed_date: l.listed_date ?? l.listedDate ?? '',
    days_on_market: l.days_on_market ?? l.daysOnMarket ?? '',
    price_reduced: (l.price_reduced ?? l.priceReduced ?? false) ? 'Yes' : 'No',
    mls_number: l.mls_number ?? l.mlsNumber ?? '',
    agent_name: l.agent_name ?? l.listingAgent?.name ?? '',
    agent_phone: l.agent_phone ?? l.listingAgent?.phone ?? '',
    agent_email: l.agent_email ?? l.listingAgent?.email ?? '',
    agent_website: l.agent_website ?? l.listingAgent?.website ?? '',
    office_name: l.office_name ?? l.listingOffice?.name ?? '',
    office_phone: l.office_phone ?? l.listingOffice?.phone ?? '',
    office_email: l.office_email ?? l.listingOffice?.email ?? '',
    latitude: l.latitude ?? '', longitude: l.longitude ?? '',
    listing_id: l.id ?? '', synced_at: new Date().toISOString(),
  };
  return String(map[col] ?? '');
}

async function refreshGoogleToken(serviceClient: any, userId: string, creds: any): Promise<string> {
  const expiresAt = creds.expires_at ? new Date(creds.expires_at) : null;
  if (expiresAt && expiresAt > new Date(Date.now() + 300000)) return creds.access_token;
  if (!creds.refresh_token) throw new Error('No refresh token. Please reconnect Google Sheets.');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token', refresh_token: creds.refresh_token,
      client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
    }),
  });
  if (!res.ok) throw new Error('Failed to refresh Google token. Please reconnect Google Sheets.');
  const tokens = await res.json();
  await serviceClient.from('integration_connections').update({
    credentials: { ...creds, access_token: tokens.access_token, expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString() },
    last_used_at: new Date().toISOString(),
  }).eq('user_id', userId).eq('integration_id', 'google');
  return tokens.access_token;
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
    const { data: { user }, error } = await userClient.auth.getUser();
    if (!error && user) userId = user.id;
  }
  if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });

  const { listings, spreadsheet_id, sheet_name = 'Sheet1', include_header = true, write_mode = 'append', columns = DEFAULT_COLUMNS } = body;
  if (!spreadsheet_id) return new Response(JSON.stringify({ error: 'spreadsheet_id is required' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  if (!Array.isArray(listings) || listings.length === 0) return new Response(JSON.stringify({ error: 'listings must be a non-empty array' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });

  const { data: conn, error: connErr } = await serviceClient.from('integration_connections').select('credentials,config').eq('user_id', userId).eq('integration_id', 'google').single();
  if (connErr || !conn) return new Response(JSON.stringify({ error: 'Google Sheets not connected. Please connect in Integrations.' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });

  let accessToken: string;
  try { accessToken = await refreshGoogleToken(serviceClient, userId, conn.credentials as any); }
  catch (e: any) { return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }); }

  const validColumns = columns.filter((c: string) => DEFAULT_COLUMNS.includes(c));
  if (validColumns.length === 0) return new Response(JSON.stringify({ error: 'No valid columns specified' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });

  const sheetsBase = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}`;
  const authHeaders = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
  const range = `${sheet_name}!A1`;

  if (write_mode === 'overwrite') {
    await fetch(`${sheetsBase}/values/${encodeURIComponent(range)}:clear`, { method: 'POST', headers: authHeaders });
  }

  let writeHeader = false;
  if (include_header) {
    const checkRes = await fetch(`${sheetsBase}/values/${encodeURIComponent(sheet_name + '!A1')}`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    if (checkRes.ok) {
      const checkData = await checkRes.json();
      writeHeader = !checkData.values || checkData.values.length === 0;
    } else { writeHeader = true; }
  }

  const rows: string[][] = [];
  if (writeHeader) rows.push(validColumns.map((c: string) => COLUMN_HEADERS[c] ?? c));
  for (const listing of listings) rows.push(validColumns.map((c: string) => extractValue(listing, c)));

  const appendUrl = `${sheetsBase}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const appendRes = await fetch(appendUrl, { method: 'POST', headers: authHeaders, body: JSON.stringify({ values: rows }) });

  if (!appendRes.ok) {
    const errData = await appendRes.json().catch(() => ({}));
    return new Response(JSON.stringify({ error: 'Google Sheets API error', details: errData?.error?.message ?? `HTTP ${appendRes.status}` }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  const result = await appendRes.json();
  const rowsAppended = result.updates?.updatedRows ?? rows.length;
  const dataRows = writeHeader ? rowsAppended - 1 : rowsAppended;
  await serviceClient.from('integration_connections').update({ last_used_at: new Date().toISOString() }).eq('user_id', userId).eq('integration_id', 'google');

  return new Response(JSON.stringify({ sent: listings.length, rows_written: dataRows, header_written: writeHeader, spreadsheet_id, sheet_name }), { headers: { ...cors, 'Content-Type': 'application/json' } });
});
