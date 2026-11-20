import { createClient } from "@supabase/supabase-js";

// Safe fallbacks during static build / prerender when environment variables are not yet configured in CI/CD
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://placeholder-revive-project.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-anon-key-revive-clinic-2026";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getSupabaseAdmin() {
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    supabaseAnonKey;

  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
