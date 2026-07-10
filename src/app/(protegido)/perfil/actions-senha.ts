"use server";

import { createClient } from "@/lib/supabase/server";
import { validarComplexidadeSenha } from "@/lib/senha";
import { mensagemErro } from "@/lib/erro";

export async function trocarSenha(senhaAtual: string, novaSenha: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { erro: "Não autenticado" };

  const problemas = validarComplexidadeSenha(novaSenha);
  if (problemas.length > 0) {
    return { erro: `A nova senha precisa ter: ${problemas.join(", ")}.` };
  }

  // Supabase não tem "trocar senha com verificação da senha atual" nativo —
  // a verificação é feita tentando autenticar de novo com a senha informada.
  const { error: erroSenhaAtual } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: senhaAtual,
  });
  if (erroSenhaAtual) return { erro: "Senha atual incorreta." };

  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  if (error) return { erro: mensagemErro(error, "Não foi possível trocar a senha. Tente de novo.") };

  return { erro: null };
}
