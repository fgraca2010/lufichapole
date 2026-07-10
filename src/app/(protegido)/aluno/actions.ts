"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function registrarTentativa(movimentoId: number, resultado: "sucesso" | "erro") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erro: "Não autenticado" };

  const { error } = await supabase.from("tentativas_movimento").insert({
    aluno_id: user.id,
    movimento_id: movimentoId,
    resultado,
  });

  if (error) return { erro: error.message };

  revalidatePath("/aluno");
  return { erro: null };
}

/** Ação voluntária: abre mão de uma aprovação já conquistada pra treinar de novo do zero. */
export async function reiniciarMovimento(movimentoId: number) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reiniciar_movimento_aprovado", {
    p_movimento_id: movimentoId,
  });

  if (error) return { erro: error.message };

  revalidatePath("/aluno");
  return { erro: null };
}
