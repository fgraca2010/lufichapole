import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ROTULO_STATUS: Record<string, string> = {
  em_andamento: "Em andamento",
  pendente_avaliacao: "Aguardando avaliação",
  aprovado: "Aprovado",
};

export default async function FichaAlunoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nivel?: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("persona")
    .eq("id", user.id)
    .single();
  if (perfil?.persona !== "professor") redirect(`/${perfil?.persona ?? ""}`);

  const { data: aluno } = await supabase
    .from("perfis")
    .select("nome_completo, professor_id")
    .eq("id", id)
    .single();

  if (!aluno || aluno.professor_id !== user.id) notFound();

  const [{ data: resumo }, { data: niveis }, { data: status }] = await Promise.all([
    supabase.rpc("resumo_aluno", { p_aluno_id: id }).single(),
    supabase
      .from("niveis")
      .select("numero, nome, blocos(numero, movimentos(id, nome, categoria, ativo, ordem))")
      .order("numero"),
    supabase
      .from("aluno_movimento_status")
      .select("movimento_id, status, sucessos_consecutivos")
      .eq("aluno_id", id),
  ]);

  const statusPorMovimento = new Map((status ?? []).map((s) => [s.movimento_id, s]));
  const r = resumo as {
    treinos: number;
    exercicios_completos: number;
    exercicios_pendentes_avaliacao: number;
    blocos_completos: number;
  } | null;

  const { nivel: nivelParam } = await searchParams;
  const nivelSelecionado = Number(nivelParam) || niveis?.[0]?.numero || 1;
  const nivelAtual = (niveis ?? []).find((n) => n.numero === nivelSelecionado);

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-8">
      <h1 className="text-xl font-semibold text-black">{aluno.nome_completo}</h1>
      <p className="text-xs text-terciaria">Visualização somente leitura — só o aluno edita a própria ficha.</p>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Estatistica rotulo="Treinos" valor={r?.treinos ?? 0} />
        <Estatistica rotulo="Exercícios completos" valor={r?.exercicios_completos ?? 0} />
        <Estatistica rotulo="Aguardando avaliação" valor={r?.exercicios_pendentes_avaliacao ?? 0} />
        <Estatistica rotulo="Blocos completos" valor={r?.blocos_completos ?? 0} />
      </section>

      <nav className="flex flex-wrap gap-2">
        {(niveis ?? []).map((n) => (
          <a
            key={n.numero}
            href={`/professor/alunos/${id}?nivel=${n.numero}`}
            className={
              n.numero === nivelSelecionado
                ? "rounded-full bg-primaria px-3 py-1.5 text-sm font-medium text-primaria-texto"
                : "rounded-full px-3 py-1.5 text-sm font-medium text-terciaria hover:bg-terciaria/10"
            }
          >
            Nível {n.numero}
          </a>
        ))}
      </nav>

      {nivelAtual && (
        <section>
          {nivelAtual.blocos
            ?.sort((a, b) => a.numero - b.numero)
            .map((bloco) => (
              <details key={bloco.numero} className="mb-2 rounded-lg border border-terciaria/10 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-terciaria">
                  Bloco {bloco.numero}
                </summary>
                <div className="mt-2">
                  {bloco.movimentos
                    ?.filter((m) => m.ativo)
                    .sort((a, b) => a.ordem - b.ordem)
                    .map((mov) => {
                      const s = statusPorMovimento.get(mov.id);
                      const st = s?.status ?? "em_andamento";
                      return (
                        <div
                          key={mov.id}
                          className="flex items-center justify-between gap-3 border-b border-terciaria/10 py-1.5 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {mov.categoria && (
                              <span className="rounded-full bg-terciaria/10 px-2 py-0.5 text-xs font-medium text-terciaria">
                                {mov.categoria}
                              </span>
                            )}
                            <span className="text-black">{mov.nome}</span>
                          </div>
                          <span
                            className={
                              st === "aprovado"
                                ? "text-xs text-primaria"
                                : st === "pendente_avaliacao"
                                  ? "text-xs text-secundaria"
                                  : "text-xs text-terciaria/60"
                            }
                          >
                            {ROTULO_STATUS[st]}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </details>
            ))}
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
