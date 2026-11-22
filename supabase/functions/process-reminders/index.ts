// Supabase Edge Function: process-reminders
// Invoked by Supabase Cron on scheduled intervals to process missed check-ins,
// overdue tasks, and upcoming appointment notifications.

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Process overdue care tasks and escalations
    const { data: overdueCount, error: taskError } = await supabase.rpc("check_overdue_tasks");
    if (taskError) throw taskError;

    // 2. Process missed caregiver shifts
    const { data: shiftCount, error: shiftError } = await supabase.rpc("check_missed_shifts");
    if (shiftError) throw shiftError;

    return new Response(
      JSON.stringify({
        success: true,
        overdueTasksProcessed: overdueCount,
        missedShiftsProcessed: shiftCount,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
