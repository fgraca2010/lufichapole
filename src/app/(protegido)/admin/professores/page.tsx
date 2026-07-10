import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConvidarForm } from "../ConvidarForm";
import { ExcluirUsuarioButton } from "../ExcluirUsuarioButton";
import { convidarProfessor } from "../actions";

export default async function AdminProfessoresPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("persona")
    .eq("id", user.id)
    .single();
  if (perfil?.persona !== "admin") redirect(`/${perfil?.persona ?? ""}`);

  const { data: professores } = await supabase
    .from("perfis")
    .select("id, nome_completo, alunos:perfis!professor_id(id)")
    .eq("persona", "professor")
    .order("nome_completo");

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-8">
      <h1 className="text-xl font-semibold text-black">Professores</h1>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-terciaria">Convidar novo professor</h2>
        <ConvidarForm action={convidarProfessor} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-terciaria">
          Todos os professores ({professores?.length ?? 0})
        </h2>
        <div className="flex flex-col gap-1">
          {(professores ?? []).map((p) => {
            const totalAlunos = Array.isArray(p.alunos) ? p.alunos.length : 0;
            return (
              <div
                key={p.id}
                className="flex items-center justify-between gap-2 border-b border-terciaria/10 py-1.5 text-sm"
              >
                <span className="text-black">
                  {p.nome_completo}{" "}
                  <span className="text-terciaria">({totalAlunos} aluno{totalAlunos === 1 ? "" : "s"})</span>
                </span>
                <ExcluirUsuarioButton
                  userId={p.id}
                  nome={p.nome_completo}
                  avisoExtra={totalAlunos > 0 ? `Os ${totalAlunos} alunos vinculados ficam sem professor.` : undefined}
                />
              </div>
            );
          })}
          {(professores ?? []).length === 0 && (
            <p className="text-sm text-terciaria">Nenhum professor cadastrado ainda.</p>
          )}
        </div>
      </section>
    </div>
  );
}
