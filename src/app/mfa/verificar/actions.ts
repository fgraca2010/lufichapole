"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { mensagemErro } from "@/lib/erro";
import { COOKIE_MFA_VERIFICADO, mfaCookieOptions } from "@/lib/auth-2fa";

export async function enviarCodigoEmail() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { erro: "Não autenticado" };

  const { error } = await supabase.auth.signInWithOtp({
    email: user.email,
    options: { shouldCreateUser: false },
  });

  if (error) {
    return { erro: mensagemErro(error, "Não foi possível enviar o código. Tente de novo.") };
  }
  return { erro: null };
}

export async function confirmarCodigoEmail(codigo: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { erro: "Não autenticado" };

  const { error } = await supabase.auth.verifyOtp({
    email: user.email,
    token: codigo,
    type: "email",
  });

  if (error) return { erro: "Código inválido ou expirado. Tente de novo." };

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_MFA_VERIFICADO, "1", mfaCookieOptions);

  return { erro: null };
}
