"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function criarMovimento(formData: FormData): Promise<void> {
  const blocoId = Number(formData.get("bloco_id"));
  const nome = String(formData.get("nome") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "") || null;

  if (!blocoId || !nome) throw new Error("Bloco e nome são obrigatórios");

  const supabase = await createClient();

  const { data: maiorOrdem } = await supabase
    .from("movimentos")
    .select("ordem")
    .eq("bloco_id", blocoId)
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("movimentos").insert({
    bloco_id: blocoId,
    nome,
    categoria,
    ordem: (maiorOrdem?.ordem ?? 0) + 1,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/conteudo");
}

/** Troca a ordem de um movimento com o vizinho imediatamente acima/abaixo no mesmo bloco. */
export async function moverMovimento(movimentoId: number, direcao: "cima" | "baixo") {
  const supabase = await createClient();

  const { data: atual } = await supabase
    .from("movimentos")
    .select("id, bloco_id, ordem")
    .eq("id", movimentoId)
    .single();

  if (!atual) return { erro: "Movimento não encontrado" };

  let query = supabase.from("movimentos").select("id, ordem").eq("bloco_id", atual.bloco_id);
  query =
    direcao === "cima"
      ? query.lt("ordem", atual.ordem).order("ordem", { ascending: false })
      : query.gt("ordem", atual.ordem).order("ordem", { ascending: true });

  const { data: vizinho } = await query.limit(1).maybeSingle();

  if (!vizinho) return { erro: null }; // já está na ponta, não faz nada

  const { error: e1 } = await supabase
    .from("movimentos")
    .update({ ordem: vizinho.ordem })
    .eq("id", atual.id);
  const { error: e2 } = await supabase
    .from("movimentos")
    .update({ ordem: atual.ordem })
    .eq("id", vizinho.id);

  if (e1 || e2) return { erro: e1?.message ?? e2?.message ?? "Erro ao reordenar" };

  revalidatePath("/admin/conteudo");
  return { erro: null };
}

export async function atualizarMovimento(
  id: number,
  campos: { nome?: string; categoria?: string | null; ativo?: boolean }
) {
  const supabase = await createClient();
  const { error } = await supabase.from("movimentos").update(campos).eq("id", id);

  if (error) return { erro: error.message };
  revalidatePath("/admin/conteudo");
  return { erro: null };
}

export async function criarBloco(formData: FormData): Promise<void> {
  const nivelId = Number(formData.get("nivel_id"));
  const numero = Number(formData.get("numero"));
  const nome = String(formData.get("nome") ?? "") || null;

  if (!nivelId || !numero) throw new Error("Nível e número são obrigatórios");

  const supabase = await createClient();
  const { error } = await supabase.from("blocos").insert({
    nivel_id: nivelId,
    numero,
    nome,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/conteudo");
}
