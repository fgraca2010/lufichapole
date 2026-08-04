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

/**
 * Nome único do cookie httpOnly que representa "já passou pelo 2FA por
 * e-mail neste login" — exportado daqui pra evitar a string literal
 * duplicada (histórico: já chegou a divergir entre middleware.ts,
 * mfa/verificar/actions.ts e (protegido)/actions.ts).
 */
export const COOKIE_MFA_VERIFICADO = "lu_mfa_verificado";

/**
 * Duração do cookie de 2FA — alinhada aos 400 dias que o @supabase/ssr usa
 * por padrão pro cookie de sessão (DEFAULT_COOKIE_OPTIONS.maxAge em
 * @supabase/ssr/dist/module/utils/constants.js), já que o refresh token do
 * Supabase não tem expiração configurada (supabase/config.toml).
 *
 * Bug corrigido em 2026-08-03: sem maxAge explícito, este cookie virava um
 * "session cookie" do navegador (some ao fechar a aba/janela) enquanto a
 * sessão do Supabase persistia por muito mais tempo — resultado: usuário já
 * logado E já verificado era jogado pra tela de 2FA de novo ao reabrir o
 * navegador, mesmo com a sessão ainda válida.
 */
const MFA_COOKIE_MAX_AGE_SEGUNDOS = 400 * 24 * 60 * 60;

export const mfaCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: MFA_COOKIE_MAX_AGE_SEGUNDOS,
};
