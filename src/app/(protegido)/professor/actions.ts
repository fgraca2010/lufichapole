"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Registra uma tentativa (sucesso/erro) do aluno vinculado — a partir de
 * 2026-08-04 é o professor quem marca, não mais o próprio aluno (mudança de
 * regra de negócio a pedido do owner, ver vault/_index.md). A RLS de
 * tentativas_movimento garante que só o professor vinculado a esse aluno
 * consegue inserir; a lógica de sequência/aprovação continua inteira no
 * trigger registrar_tentativa_movimento() do banco.
 */
export async function registrarTentativaProfessor(
  alunoId: string,
  movimentoId: number,
  resultado: "sucesso" | "erro"
) {
  const supabase = await createClient();
  const { error } = await supabase.from("tentativas_movimento").insert({
    aluno_id: alunoId,
    movimento_id: movimentoId,
    resultado,
  });

  if (error) return { erro: error.message };

  revalidatePath(`/professor/alunos/${alunoId}`);
  return { erro: null };
}

/** Ação voluntária do professor: abre mão de uma aprovação já conquistada pelo aluno pra ele treinar de novo do zero. */
export async function reiniciarMovimentoProfessor(alunoId: string, movimentoId: number) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reiniciar_movimento_professor", {
    p_aluno_id: alunoId,
    p_movimento_id: movimentoId,
  });

  if (error) return { erro: error.message };

  revalidatePath(`/professor/alunos/${alunoId}`);
  return { erro: null };
}

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
  revalidatePath(`/professor/alunos/${alunoId}`);
  return { erro: null };
}
