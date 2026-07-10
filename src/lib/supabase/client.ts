import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso em Client Components (browser).
 * Usa as chaves públicas (URL + anon key) — nunca a service_role aqui.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Habilita signInWithPasskey/registerPasskey/auth.passkey.* (login
        // biométrico — Face ID/Touch ID/Windows Hello via WebAuthn). Recurso
        // experimental do supabase-js, ver docs do pacote @supabase/auth-js.
        experimental: { passkey: true },
      },
    }
  );
}
