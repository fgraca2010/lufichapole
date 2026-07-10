"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete("lu_mfa_verificado");
  redirect("/login");
}

/**
 * Exclui uma conta. Duas situações permitidas:
 * - O próprio usuário excluindo a própria conta (nunca admin, por segurança —
 *   troca de admin é feita direto no painel do Supabase).
 * - Um admin excluindo a conta de um aluno ou professor (não de outro admin).
 *
 * Se for professor, os alunos vinculados ficam sem professor automaticamente
 * (FK com ON DELETE SET NULL — ver supabase/migrations/0003_ajustes.sql).
 */
export async function excluirConta(userIdAlvo: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erro: "Não autenticado" };

  const { data: euPerfil } = await supabase
    .from("perfis")
    .select("persona")
    .eq("id", user.id)
    .single();

  const excluindoAPropria = userIdAlvo === user.id;

  if (excluindoAPropria) {
    if (euPerfil?.persona === "admin") {
      return { erro: "Contas de admin não podem se autoexcluir por aqui." };
    }
  } else {
    if (euPerfil?.persona !== "admin") {
      return { erro: "Sem permissão." };
    }
    const { data: alvoPerfil } = await supabase
      .from("perfis")
      .select("persona")
      .eq("id", userIdAlvo)
      .single();
    if (alvoPerfil?.persona === "admin") {
      return { erro: "Contas de admin não podem ser excluídas por aqui." };
    }
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userIdAlvo);
  if (error) return { erro: error.message };

  if (excluindoAPropria) {
    await supabase.auth.signOut();
    (await cookies()).delete("lu_mfa_verificado");
    redirect("/login");
  }

  return { erro: null };
}
