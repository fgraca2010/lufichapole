"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const COOKIE_MFA_VERIFICADO = "lu_mfa_verificado";

export async function enviarCodigoEmail() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { erro: "Não autenticado" };

  const { error } = await supabase.auth.signInWithOtp({
    email: user.email,
    options: { shouldCreateUser: false },
  });

  if (error) return { erro: error.message };
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
  cookieStore.set(COOKIE_MFA_VERIFICADO, "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });

  return { erro: null };
}
