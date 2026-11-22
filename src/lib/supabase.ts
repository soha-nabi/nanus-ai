import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Anon (public) key only. Never reference a service-role key in frontend code.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured: boolean = Boolean(url && key);

// When env vars are missing, the app runs in demo mode and this client is null.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, key!)
  : null;
