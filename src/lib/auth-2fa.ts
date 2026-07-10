/**
 * Métodos de autenticação (amr) que já são fortes o suficiente pra dispensar
 * a camada extra de 2FA por e-mail deste app: Google OAuth e Passkey/WebAuthn.
 *
 * Valores exatos como o GoTrue (Supabase Auth) grava no claim "amr" —
 * ver AuthenticationMethod.String() em supabase/auth
 * internal/models/factor.go (checado na fonte em 2026-07-10):
 *   OAuth        -> "oauth"
 *   PasswordGrant -> "password"
 *   PasskeyLogin -> "passkey"
 *   MFAWebAuthn  -> "mfa/webauthn" (fator MFA nativo, não é o nosso caso aqui)
 */
const METODOS_QUE_DISPENSAM_2FA_EMAIL = new Set(["oauth", "passkey"]);

/**
 * O SDK aceita dois formatos pro amr: array de strings (RFC-8176) ou array de
 * objetos `{ method, timestamp }` (formato detalhado que o GoTrue usa hoje).
 */
type EntradaAmr = string | { method: string };

export function loginUsouMetodoForte(
  metodosAutenticacao: EntradaAmr[] | null | undefined
): boolean {
  if (!metodosAutenticacao) return false;
  return metodosAutenticacao.some((m) => {
    const metodo = typeof m === "string" ? m : m.method;
    return METODOS_QUE_DISPENSAM_2FA_EMAIL.has(metodo);
  });
}
