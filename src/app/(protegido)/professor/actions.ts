"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function avaliarMovimento(
  alunoId: string,
  movimentoId: number,
  confirmado: boolean
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("avaliar_movimento", {
    p_aluno_id: alunoId,
    p_movimento_id: movimentoId,
    p_confirmado: confirmado,
  });

  if (error) return { erro: error.message };

  revalidatePath("/professor");
  return { erro: null };
}
