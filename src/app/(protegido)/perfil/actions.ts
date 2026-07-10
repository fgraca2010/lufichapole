"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function atualizarDadosPessoais(formData: FormData) {
  const nomeCompleto = String(formData.get("nome_completo") ?? "").trim();
  const dataNascimento = String(formData.get("data_nascimento") ?? "") || null;

  if (!nomeCompleto) return { erro: "Nome não pode ficar vazio." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erro: "Não autenticado" };

  const { error } = await supabase
    .from("perfis")
    .update({ nome_completo: nomeCompleto, data_nascimento: dataNascimento })
    .eq("id", user.id);

  if (error) return { erro: error.message };

  revalidatePath("/perfil");
  return { erro: null };
}
