/**
 * get-oauth-config
 * Returns public OAuth configuration (client IDs and redirect URIs)
 * Client IDs are public values, safe to expose to frontend
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const config = {
      gmail: {
        clientId: Deno.env.get('GMAIL_CLIENT_ID') || '',
        redirectUri: Deno.env.get('GMAIL_REDIRECT_URI') || '',
      },
      outlook: {
        clientId: Deno.env.get('OUTLOOK_CLIENT_ID') || '',
        redirectUri: Deno.env.get('OUTLOOK_REDIRECT_URI') || '',
      },
    };

    return new Response(JSON.stringify(config), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
