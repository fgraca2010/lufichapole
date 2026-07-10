import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ProfessorAlunosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("persona")
    .eq("id", user.id)
    .single();
  if (perfil?.persona !== "professor") redirect(`/${perfil?.persona ?? ""}`);

  const { data: alunos } = await supabase
    .from("perfis")
    .select("id, nome_completo")
    .eq("professor_id", user.id)
    .order("nome_completo");

  return (
    <div className="flex flex-1 flex-col gap-4 px-6 py-8">
      <h1 className="text-xl font-semibold text-black">Meus alunos</h1>

      <div className="flex flex-col gap-1">
        {(alunos ?? []).map((a) => (
          <Link
            key={a.id}
            href={`/professor/alunos/${a.id}`}
            className="border-b border-terciaria/10 py-1.5 text-sm text-black hover:text-primaria"
          >
            {a.nome_completo} →
          </Link>
        ))}
        {(alunos ?? []).length === 0 && (
          <p className="text-sm text-terciaria">Nenhum aluno vinculado ainda.</p>
        )}
      </div>
    </div>
  );
}
