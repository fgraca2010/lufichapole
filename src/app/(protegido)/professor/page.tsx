import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProfessorDashboardPage() {
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
    .select("id, nome_completo, data_nascimento")
    .eq("professor_id", user.id)
    .order("nome_completo");

  const alunoIds = (alunos ?? []).map((a) => a.id);

  const { data: pendentes } = alunoIds.length
    ? await supabase
        .from("aluno_movimento_status")
        .select("aluno_id")
        .in("aluno_id", alunoIds)
        .eq("status", "pendente_avaliacao")
    : { data: [] };

  const { data: aprovados } = alunoIds.length
    ? await supabase
        .from("aluno_movimento_status")
        .select("aluno_id, movimentos(categoria, blocos(nivel_id))")
        .in("aluno_id", alunoIds)
        .eq("status", "aprovado")
    : { data: [] };

  type LinhaAprovada = {
    aluno_id: string;
    movimentos: { categoria: string | null; blocos: { nivel_id: number } | null } | null;
  };

  // "Nível atual" não é um campo direto — assumido aqui como o maior nível em
  // que o aluno já tem ao menos 1 movimento aprovado (default: nenhum).
  // Assunção de modelagem — revisar com a Lu se não bater com a expectativa
  // (ver docs/adr/0001-schema-inicial.md).
  const nivelPorAluno = new Map<string, number>();
  const porCategoria = new Map<string, number>();
  for (const linha of (aprovados ?? []) as unknown as LinhaAprovada[]) {
    const nivelId = linha.movimentos?.blocos?.nivel_id;
    if (nivelId) {
      const atual = nivelPorAluno.get(linha.aluno_id) ?? 0;
      if (nivelId > atual) nivelPorAluno.set(linha.aluno_id, nivelId);
    }
    const cat = linha.movimentos?.categoria ?? "sem categoria";
    porCategoria.set(cat, (porCategoria.get(cat) ?? 0) + 1);
  }
  const totalPorNivel = new Map<number, number>();
  for (const nivelId of nivelPorAluno.values()) {
    totalPorNivel.set(nivelId, (totalPorNivel.get(nivelId) ?? 0) + 1);
  }

  const mesAtual = new Date().getMonth() + 1;
  const aniversariantes = (alunos ?? []).filter((a) => {
    if (!a.data_nascimento) return false;
    return Number(a.data_nascimento.split("-")[1]) === mesAtual;
  });

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-8">
      <h1 className="text-xl font-semibold text-black">Dashboard</h1>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Estatistica rotulo="Total de alunos" valor={alunos?.length ?? 0} />
        <Estatistica rotulo="Aguardando avaliação" valor={pendentes?.length ?? 0} />
        <Estatistica rotulo="Aniversariantes do mês" valor={aniversariantes.length} />
        <Estatistica rotulo="Movimentos aprovados" valor={aprovados?.length ?? 0} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-terciaria">
          Alunos por nível (maior nível com aprovação)
        </h2>
        <div className="flex flex-wrap gap-3 text-sm">
          {[...totalPorNivel.entries()].sort().map(([nivel, total]) => (
            <span key={nivel} className="rounded-full bg-terciaria/10 px-3 py-1">
              Nível {nivel}: {total}
            </span>
          ))}
          {totalPorNivel.size === 0 && <span className="text-terciaria">Sem dados ainda.</span>}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-terciaria">
          Aprovações por categoria de dificuldade
        </h2>
        <div className="flex flex-wrap gap-3 text-sm">
          {[...porCategoria.entries()].sort().map(([cat, total]) => (
            <span key={cat} className="rounded-full bg-terciaria/10 px-3 py-1">
              {cat}: {total}
            </span>
          ))}
          {porCategoria.size === 0 && <span className="text-terciaria">Sem dados ainda.</span>}
        </div>
      </section>

      {aniversariantes.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-terciaria">Aniversariantes do mês</h2>
          <ul className="text-sm text-black">
            {aniversariantes.map((a) => (
              <li key={a.id}>{a.nome_completo}</li>
            ))}
          </ul>
        </section>
      )}
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
