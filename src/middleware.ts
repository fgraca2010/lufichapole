import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROTAS_PROTEGIDAS = ["/aluno", "/professor", "/admin"];
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
    // então é exigido de novo em cada novo login, independente do método.
    const mfaVerificado = request.cookies.get(COOKIE_MFA_VERIFICADO)?.value === "1";

    if (!mfaVerificado) {
      const url = request.nextUrl.clone();
      url.pathname = "/mfa/verificar";
      url.searchParams.set("proximo", path);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
