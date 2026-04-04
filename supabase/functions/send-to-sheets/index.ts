/**
 * send-to-sheets
 *
 * Appends (or overwrites) listing rows into a Google Sheet.
 *
 * Body: { user_id: string, listings: unknown[], config?: Record<string,unknown> }
 *
 * Reads spreadsheet_id, sheet_name, and write_mode from:
 *   1. integration_connections.config  (set by user on Integrations page)
 *   2. body.config overrides (destination_config from automation row)
 *
 * Uses the OAuth access_token stored in integration_connections.credentials.
 *
 * Columns written: Address, Price, Beds, Baths, Sqft, City, State, ZIP,
 *                  Agent Name, Agent Email, Agent Phone, Status, Listing Date
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // ── Resolve user_id ──────────────────────────────────────────────────────
  let userId: string | null = null;
  let body: any;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  if (body.user_id) {
    userId = body.user_id;
  } else {
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const uc = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await uc.auth.getUser();
      if (user) userId = user.id;
    }
  }
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const { listings = [], config: bodyConfig = {} } = body as {
    listings: any[];
    config: Record<string, unknown>;
  };

  if (!Array.isArray(listings) || listings.length === 0) {
    return new Response(JSON.stringify({ error: "listings must be a non-empty array" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // ── Load connection (credentials + config) ───────────────────────────────
  const { data: conn } = await serviceClient
    .from("integration_connections")
    .select("credentials, config")
    .eq("user_id", userId)
    .eq("integration_id", "google")
    .maybeSingle();

  if (!conn) {
    return new Response(JSON.stringify({ error: "Google Sheets not connected. Please connect in Integrations." }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const credentials = (conn.credentials ?? {}) as Record<string, unknown>;
  const connConfig  = (conn.config    ?? {}) as Record<string, unknown>;

  // body.config (destination_config) overrides connection config
  const mergedConfig = { ...connConfig, ...bodyConfig };

  const accessToken   = String(credentials.access_token ?? "");
  const spreadsheetId = String(mergedConfig.spreadsheet_id ?? "");
  const sheetName     = String(mergedConfig.sheet_name ?? "Sheet1");
  const writeMode     = String(mergedConfig.write_mode ?? "append");

  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Google OAuth token not found. Please reconnect Google Sheets." }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  if (!spreadsheetId) {
    return new Response(JSON.stringify({ error: "No spreadsheet configured. Please set a spreadsheet in Integrations → Google Sheets settings." }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // ── Build rows ────────────────────────────────────────────────────────────
  const rows: string[][] = listings.map((l: any) => [
    l.formatted_address ?? l.formattedAddress ?? l.address ?? "",
    l.price != null ? String(l.price) : "",
    l.bedrooms != null ? String(l.bedrooms) : "",
    l.bathrooms != null ? String(l.bathrooms) : "",
    l.squareFootage ?? l.square_footage ?? l.sqft ?? "",
    l.city ?? "",
    l.state ?? "",
    l.zip_code ?? l.zipCode ?? l.zip ?? "",
    l.agent_name ?? l.agentName ?? l.listingAgent?.name ?? "",
    l.agent_email ?? l.agentEmail ?? l.listingAgent?.email ?? "",
    l.agent_phone ?? l.agentPhone ?? l.listingAgent?.phone ?? "",
    l.status ?? "",
    l.listedDate ?? l.listed_date ?? l.listing_date ?? "",
  ]);

  const encodedSheet = encodeURIComponent(sheetName);
  const authHeader = { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" };

  try {
    if (writeMode === "overwrite") {
      // Clear the sheet first
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedSheet}!A1:M:clear`,
        { method: "POST", headers: authHeader }
      );
      // Write from row 1
      const writeRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedSheet}!A1?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          headers: authHeader,
          body: JSON.stringify({ values: rows }),
        }
      );
      if (!writeRes.ok) {
        const err = await writeRes.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? `Sheets API ${writeRes.status}`);
      }
      const result = await writeRes.json();
      const written = result.updatedRows ?? rows.length;
      console.log(`[send-to-sheets] overwrite: wrote ${written} rows to ${spreadsheetId}`);
      await serviceClient.from("integration_connections")
        .update({ last_used_at: new Date().toISOString() })
        .eq("user_id", userId).eq("integration_id", "google");
      return new Response(JSON.stringify({ sent: written, total: listings.length }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    } else {
      // Append
      const appendRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedSheet}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: "POST",
          headers: authHeader,
          body: JSON.stringify({ values: rows }),
        }
      );
      if (!appendRes.ok) {
        const err = await appendRes.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? `Sheets API ${appendRes.status}`);
      }
      const result = await appendRes.json();
      const written = result.updates?.updatedRows ?? rows.length;
      console.log(`[send-to-sheets] append: wrote ${written} rows to ${spreadsheetId}`);
      await serviceClient.from("integration_connections")
        .update({ last_used_at: new Date().toISOString() })
        .eq("user_id", userId).eq("integration_id", "google");
      return new Response(JSON.stringify({ sent: written, total: listings.length }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  } catch (err: unknown) {
    const e = err as Error;
    console.error("[send-to-sheets] error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 502, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
