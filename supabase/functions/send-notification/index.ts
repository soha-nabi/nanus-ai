// Supabase Edge Function: send-notification
// Securely dispatches email and multi-channel notifications

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
    const { userId, familyId, eventType, title, message, dedupeKey, channel } = await req.json();

    if (!userId || !familyId || !title || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required notification fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: notificationId, error } = await supabase.rpc("send_notification", {
      p_user_id: userId,
      p_family_id: familyId,
      p_event_type: eventType || "general",
      p_title: title,
      p_message: message,
      p_dedupe_key: dedupeKey || `custom-${Date.now()}`,
      p_channel: channel || "in_app",
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, notificationId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
