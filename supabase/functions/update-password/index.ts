import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Extract token and verify it
    const token = authHeader.replace("Bearer ", "");
    
    // Create a client with the user's token to get their info
    const userClient = createClient(SUPABASE_URL, token);
    const { data: { user: authUser }, error: authError } = await userClient.auth.getUser();
    
    if (authError || !authUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Parse request body
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return new Response(
        JSON.stringify({ error: "Missing currentPassword or newPassword" }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: "New password must be at least 8 characters" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify current password by attempting to sign in with email + current password
    // Note: This is a workaround since Supabase doesn't provide a "verify password" API directly
    const verifyClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: verifyData, error: verifyError } = await verifyClient.auth.signInWithPassword({
      email: authUser.email!,
      password: currentPassword,
    });

    if (verifyError || !verifyData.session) {
      return new Response(
        JSON.stringify({ error: "Current password is incorrect" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Current password is verified, now update to new password
    const { data: updateData, error: updateError } = await userClient.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message || "Failed to update password" }),
        { status: 400, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Password updated successfully",
        user: updateData.user,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
