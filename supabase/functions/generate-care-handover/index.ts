// Supabase Edge Function: generate-care-handover
// Generates the signature Nanu's care handover aggregating completed activities,
// dual medication confirmations, and unresolved responsibilities.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.119.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { familyId, elderId, fromUserId } = await req.json();

    if (!familyId || !elderId || !fromUserId) {
      return new Response(
        JSON.stringify({ error: "Missing required handover parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: handoverId, error } = await supabase.rpc("generate_care_handover", {
      p_family_id: familyId,
      p_elder_id: elderId,
      p_from_user_id: fromUserId,
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, handoverId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
