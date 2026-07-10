"use server";

import { createClient } from "@/lib/supabase/server";

export async function enviarLinkRedefinicao(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { erro: "Informe um e-mail." };

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?proximo=${encodeURIComponent("/redefinir-senha")}`,
  });

  // Não revela se o e-mail existe ou não na base (evita enumeração de contas)
  // — sempre responde sucesso, igual a maioria dos apps sérios faz.
  if (error) {
    console.error("Erro ao enviar link de redefinição:", error.message);
  }

  return { erro: null };
}
