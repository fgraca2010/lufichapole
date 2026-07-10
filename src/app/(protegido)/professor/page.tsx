import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AvaliacaoItem } from "./AvaliacaoItem";

export default async function ProfessorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("persona")
    .eq("id", user.id)
    .single();

  if (perfil?.persona !== "professor") {
    redirect(`/${perfil?.persona ?? ""}`);
  }

  const { data: alunos } = await supabase
    .from("perfis")
    .select("id, nome_completo, data_nascimento")
    .eq("professor_id", user.id)
    .order("nome_completo");

  const alunoIds = (alunos ?? []).map((a) => a.id);

  const { data: pendentes } = alunoIds.length
    ? await supabase
        .from("aluno_movimento_status")
        .select(
          "aluno_id, movimento_id, movimentos(nome, categoria, blocos(numero, niveis(numero)))"
        )
        .in("aluno_id", alunoIds)
        .eq("status", "pendente_avaliacao")
    : { data: [] };

  const { data: aprovados } = alunoIds.length
    ? await supabase
        .from("aluno_movimento_status")
        .select("aluno_id, movimentos(categoria, bloco_id, blocos(nivel_id))")
        .in("aluno_id", alunoIds)
        .eq("status", "aprovado")
    : { data: [] };

  const nomesPorId = new Map((alunos ?? []).map((a) => [a.id, a.nome_completo]));

  // "Nível atual" não é um campo direto — assumido aqui como o maior nível em
  // que o aluno já tem ao menos 1 movimento aprovado (default: nível 1).
  // Assunção de modelagem, não um requisito explícito — revisar se não bater
  // com a expectativa da Lu (ver docs/adr/0001-schema-inicial.md).
  const nivelPorAluno = new Map<string, number>();
  const porCategoria = new Map<string, number>();
  for (const a of aprovados ?? []) {
    type Linha = { aluno_id: string; movimentos: { categoria: string | null; blocos: { nivel_id: number } | null } | null };
    const linha = a as unknown as Linha;
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
    const mes = Number(a.data_nascimento.split("-")[1]);
    return mes === mesAtual;
  });

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-8">
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
        <div className="flex gap-3 text-sm">
          {[...totalPorNivel.entries()].sort().map(([nivel, total]) => (
            <span key={nivel} className="rounded-full bg-terciaria/10 px-3 py-1">
              Nível {nivel}: {total}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-terciaria">
          Aprovações por categoria de dificuldade
        </h2>
        <div className="flex gap-3 text-sm">
          {[...porCategoria.entries()].sort().map(([cat, total]) => (
            <span key={cat} className="rounded-full bg-terciaria/10 px-3 py-1">
              {cat}: {total}
            </span>
          ))}
        </div>
      </section>

      {aniversariantes.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-terciaria">
            Aniversariantes do mês
          </h2>
          <ul className="text-sm text-black">
            {aniversariantes.map((a) => (
              <li key={a.id}>{a.nome_completo}</li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-lg font-semibold text-black">
          Fila de avaliação
        </h2>
        {(pendentes ?? []).length === 0 && (
          <p className="text-sm text-terciaria">Nenhuma avaliação pendente.</p>
        )}
        {(pendentes ?? []).map((p) => {
          type Linha = {
            aluno_id: string;
            movimento_id: number;
            movimentos: { nome: string; categoria: string | null } | null;
          };
          const linha = p as unknown as Linha;
          return (
            <AvaliacaoItem
              key={`${linha.aluno_id}-${linha.movimento_id}`}
              alunoId={linha.aluno_id}
              alunoNome={nomesPorId.get(linha.aluno_id) ?? "?"}
              movimentoId={linha.movimento_id}
              movimentoNome={linha.movimentos?.nome ?? "?"}
              categoria={linha.movimentos?.categoria ?? null}
            />
          );
        })}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-black">Meus alunos</h2>
        <ul className="text-sm text-black">
          {(alunos ?? []).map((a) => (
            <li key={a.id} className="border-b border-terciaria/10 py-1">
              {a.nome_completo}
            </li>
          ))}
        </ul>
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
