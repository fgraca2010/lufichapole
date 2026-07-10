import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("persona")
    .eq("id", user.id)
    .single();
  if (perfil?.persona !== "admin") redirect(`/${perfil?.persona ?? ""}`);

  const [
    { count: totalAlunos },
    { count: totalProfessores },
    { count: totalMovimentos },
    { count: totalAprovados },
    { count: totalPendentes },
    { count: alunosSemProfessor },
    { data: config },
  ] = await Promise.all([
    supabase.from("perfis").select("id", { count: "exact", head: true }).eq("persona", "aluno"),
    supabase.from("perfis").select("id", { count: "exact", head: true }).eq("persona", "professor"),
    supabase.from("movimentos").select("id", { count: "exact", head: true }).eq("ativo", true),
    supabase.from("aluno_movimento_status").select("aluno_id", { count: "exact", head: true }).eq("status", "aprovado"),
    supabase.from("aluno_movimento_status").select("aluno_id", { count: "exact", head: true }).eq("status", "pendente_avaliacao"),
    supabase.from("perfis").select("id", { count: "exact", head: true }).eq("persona", "aluno").is("professor_id", null),
    supabase.from("configuracao_sistema").select("sucessos_necessarios").single(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-8">
      <h1 className="text-xl font-semibold text-black">Dashboard</h1>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Estatistica rotulo="Alunos" valor={totalAlunos ?? 0} />
        <Estatistica rotulo="Professores" valor={totalProfessores ?? 0} />
        <Estatistica rotulo="Alunos sem professor" valor={alunosSemProfessor ?? 0} />
        <Estatistica rotulo="Movimentos ativos" valor={totalMovimentos ?? 0} />
        <Estatistica rotulo="Aprovações no sistema" valor={totalAprovados ?? 0} />
        <Estatistica rotulo="Aguardando avaliação" valor={totalPendentes ?? 0} />
      </section>

      <section className="rounded-lg border border-terciaria/10 p-4 text-sm text-terciaria">
        Sucessos consecutivos necessários pra aprovação:{" "}
        <span className="font-semibold text-black">{config?.sucessos_necessarios ?? 4}</span>
        {" — "}
        <a href="/admin/configuracoes" className="underline">
          alterar
        </a>
      </section>
    </div>
  );
}

function Estatistica({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="rounded-lg border border-terciaria/10 p-4 text-center">
      <div className="text-2xl font-semibold text-primaria">{valor}</div>
      <div className="text-xs text-terciaria">{rotulo}</div>
    </div>
  );
}
