import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConvidarForm } from "./ConvidarForm";
import { VincularProfessor } from "./VincularProfessor";
import { convidarAluno, convidarProfessor, atualizarSucessosNecessarios } from "./actions";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("persona")
    .eq("id", user.id)
    .single();
  if (perfil?.persona !== "admin") redirect(`/${perfil?.persona ?? ""}`);

  const [{ data: alunos }, { data: professores }, { data: config }] = await Promise.all([
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
    supabase.from("configuracao_sistema").select("sucessos_necessarios").single(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-10 px-6 py-8">
      <a href="/admin/conteudo" className="text-sm text-terciaria underline">
        Gerenciar blocos e movimentos →
      </a>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-black">
          Configuração de aprovação
        </h2>
        <form action={atualizarSucessosNecessarios} className="flex items-end gap-2 text-sm">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-terciaria">
              Sucessos consecutivos necessários (vale pra todos os movimentos)
            </label>
            <input
              name="sucessos_necessarios"
              type="number"
              min={1}
              defaultValue={config?.sucessos_necessarios ?? 4}
              className="w-24 rounded border border-terciaria/20 px-2 py-1"
            />
          </div>
          <button className="rounded-full bg-primaria px-4 py-1.5 font-medium text-primaria-texto">
            Salvar
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-black">Convidar professor</h2>
        <ConvidarForm action={convidarProfessor} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-black">Convidar aluno</h2>
        <ConvidarForm action={convidarAluno} professores={professores ?? []} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-black">
          Professores ({professores?.length ?? 0})
        </h2>
        <ul className="text-sm text-black">
          {(professores ?? []).map((p) => (
            <li key={p.id} className="border-b border-terciaria/10 py-1">
              {p.nome_completo}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-black">
          Alunos ({alunos?.length ?? 0})
        </h2>
        <div className="flex flex-col gap-1">
          {(alunos ?? []).map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-2 border-b border-terciaria/10 py-1.5 text-sm"
            >
              <span className="text-black">{a.nome_completo}</span>
              <VincularProfessor
                alunoId={a.id}
                professorIdAtual={a.professor_id}
                professores={professores ?? []}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
