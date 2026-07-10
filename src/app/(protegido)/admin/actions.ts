"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function souAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("perfis").select("persona").eq("id", user.id).single();
  return data?.persona === "admin";
}

export async function convidarAluno(formData: FormData) {
  if (!(await souAdmin())) return { erro: "Sem permissão" };

  const email = String(formData.get("email") ?? "");
  const nomeCompleto = String(formData.get("nome_completo") ?? "");
  const professorId = String(formData.get("professor_id") ?? "") || null;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { persona: "aluno", nome_completo: nomeCompleto, professor_id: professorId },
  });

  if (error) return { erro: error.message };
  revalidatePath("/admin");
  return { erro: null };
}

export async function convidarProfessor(formData: FormData) {
  if (!(await souAdmin())) return { erro: "Sem permissão" };

  const email = String(formData.get("email") ?? "");
  const nomeCompleto = String(formData.get("nome_completo") ?? "");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { persona: "professor", nome_completo: nomeCompleto },
  });

  if (error) return { erro: error.message };
  revalidatePath("/admin");
  return { erro: null };
}

export async function vincularProfessor(alunoId: string, professorId: string | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("perfis")
    .update({ professor_id: professorId })
    .eq("id", alunoId);

  if (error) return { erro: error.message };
  revalidatePath("/admin");
  return { erro: null };
}

export async function atualizarSucessosNecessarios(formData: FormData): Promise<void> {
  const valor = Number(formData.get("sucessos_necessarios"));
  if (!valor || valor < 1) throw new Error("Valor inválido");

  const supabase = await createClient();
  const { error } = await supabase
    .from("configuracao_sistema")
    .update({ sucessos_necessarios: valor })
    .eq("id", 1);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
