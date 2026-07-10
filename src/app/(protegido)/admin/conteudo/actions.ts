"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function criarMovimento(formData: FormData): Promise<void> {
  const blocoId = Number(formData.get("bloco_id"));
  const nome = String(formData.get("nome") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "") || null;

  if (!blocoId || !nome) throw new Error("Bloco e nome são obrigatórios");

  const supabase = await createClient();
  const { error } = await supabase.from("movimentos").insert({
    bloco_id: blocoId,
    nome,
    categoria,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/conteudo");
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
