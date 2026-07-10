import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente com a service_role key — bypassa RLS e tem acesso à Admin API do
 * GoTrue (criar/convidar usuários). NUNCA importar isto em código que roda no
 * browser (Client Components) — só em Server Actions / Route Handlers.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
