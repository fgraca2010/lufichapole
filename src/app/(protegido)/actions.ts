"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { COOKIE_MFA_VERIFICADO } from "@/lib/auth-2fa";

/**
 * Datas dos sucessos que compõem a sequência ATUAL de um movimento — usado
 * pra expandir o badge amarelo na ficha (aluno vendo a própria, ou professor
 * vendo a de um aluno vinculado). RLS de tentativas_movimento já garante que
 * só o próprio aluno ou o professor vinculado conseguem ler essas linhas.
 * `alunoId` omitido = usa o próprio usuário logado (visão do aluno).
 */
export async function listarSucessosMovimento(
  movimentoId: number,
  limite: number,
  alunoId?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erro: "Não autenticado", datas: [] as string[] };
  if (limite <= 0) return { erro: null, datas: [] as string[] };

  const { data, error } = await supabase
    .from("tentativas_movimento")
    .select("registrado_em")
    .eq("aluno_id", alunoId ?? user.id)
    .eq("movimento_id", movimentoId)
    .eq("resultado", "sucesso")
    .order("registrado_em", { ascending: false })
    .limit(limite);

  if (error) return { erro: error.message, datas: [] as string[] };
  return { erro: null, datas: (data ?? []).map((d) => d.registrado_em as string) };
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete(COOKIE_MFA_VERIFICADO);
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
    (await cookies()).delete(COOKIE_MFA_VERIFICADO);
    redirect("/login");
  }

  return { erro: null };
}
