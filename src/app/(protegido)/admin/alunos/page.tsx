import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConvidarForm } from "../ConvidarForm";
import { VincularProfessor } from "../VincularProfessor";
import { ExcluirUsuarioButton } from "../ExcluirUsuarioButton";
import { convidarAluno } from "../actions";

export default async function AdminAlunosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("persona")
    .eq("id", user.id)
    .single();
  if (perfil?.persona !== "admin") redirect(`/${perfil?.persona ?? ""}`);

  const [{ data: alunos }, { data: professores }] = await Promise.all([
    supabase
      .from("perfis")
      .select("id, nome_completo, professor_id")
      .eq("persona", "aluno")
      .order("nome_completo"),
    supabase
      .from("perfis")
      .select("id, nome_completo")
      .eq("persona", "professor")
      .order("nome_completo"),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-8">
      <h1 className="text-xl font-semibold text-black">Alunos</h1>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-terciaria">Convidar novo aluno</h2>
        <ConvidarForm action={convidarAluno} professores={professores ?? []} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-terciaria">
          Todos os alunos ({alunos?.length ?? 0})
        </h2>
        <div className="flex flex-col gap-1">
          {(alunos ?? []).map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-2 border-b border-terciaria/10 py-1.5 text-sm"
            >
              <span className="text-black">{a.nome_completo}</span>
              <div className="flex items-center gap-3">
                <VincularProfessor
                  alunoId={a.id}
                  professorIdAtual={a.professor_id}
                  professores={professores ?? []}
                />
                <ExcluirUsuarioButton userId={a.id} nome={a.nome_completo} />
              </div>
            </div>
          ))}
          {(alunos ?? []).length === 0 && (
            <p className="text-sm text-terciaria">Nenhum aluno cadastrado ainda.</p>
          )}
        </div>
      </section>
    </div>
  );
}
