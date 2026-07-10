import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { loginUsouMetodoForte } from "@/lib/auth-2fa";

const ROTAS_PROTEGIDAS = ["/aluno", "/professor", "/admin", "/perfil"];
const COOKIE_MFA_VERIFICADO = "lu_mfa_verificado";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() força a validação/renovação do token — nunca confiar só no cookie.
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const rotaProtegida = ROTAS_PROTEGIDAS.some((p) => path.startsWith(p));

  if (rotaProtegida && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("proximo", path);
    return NextResponse.redirect(url);
  }

  if (user && rotaProtegida) {
    // 2FA por e-mail não é um fator MFA nativo do Supabase — o "portão" é
    // este cookie httpOnly, setado só pela server action depois de um
    // verifyOtp() bem-sucedido. Limpo no logout (ver (protegido)/actions.ts),
    // então é exigido de novo em cada novo login — exceto quando o próprio
    // login já foi feito por um método forte (Google OAuth ou Passkey), caso
    // em que a camada extra de e-mail é redundante.
    const mfaVerificado = request.cookies.get(COOKIE_MFA_VERIFICADO)?.value === "1";

    if (!mfaVerificado) {
      // "amr" (Authentication Methods Reference) vem do JWT da sessão atual e
      // reflete o método usado NESTE login (valores exatos definidos pelo
      // GoTrue: "oauth", "passkey", "password", etc — ver
      // supabase/auth internal/models/factor.go).
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const loginPorMetodoForte = loginUsouMetodoForte(aal?.currentAuthenticationMethods);

      if (loginPorMetodoForte) {
        supabaseResponse.cookies.set(COOKIE_MFA_VERIFICADO, "1", {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
        });
      } else {
        // Isenção restrita a contas de QA/teste (nunca setada via UI — ver
        // supabase/migrations/0004_mfa_isento.sql). Consulta leve, só quando
        // chegou até aqui (nem cookie, nem login forte).
        const { data: perfil } = await supabase
          .from("perfis")
          .select("mfa_isento")
          .eq("id", user.id)
          .single();

        if (!perfil?.mfa_isento) {
          const url = request.nextUrl.clone();
          url.pathname = "/mfa/verificar";
          url.searchParams.set("proximo", path);
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
