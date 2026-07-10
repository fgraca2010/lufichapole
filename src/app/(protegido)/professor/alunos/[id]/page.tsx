import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ROTULO_STATUS: Record<string, string> = {
  em_andamento: "Em andamento",
  pendente_avaliacao: "Aguardando avaliação",
  aprovado: "Aprovado",
};

export default async function FichaAlunoPage({
  params,
}: {
  params: Promise<{ id: string }>;
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
      .select("numero, nome, blocos(numero, movimentos(id, nome, categoria, ativo))")
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

      {(niveis ?? []).map((nivel) => (
        <section key={nivel.numero}>
          <h2 className="mb-3 text-lg font-semibold text-black">
            Nível {nivel.numero}
            {nivel.nome ? ` — ${nivel.nome}` : ""}
          </h2>
          {nivel.blocos
            ?.sort((a, b) => a.numero - b.numero)
            .map((bloco) => (
              <div key={bloco.numero} className="mb-4">
                <h3 className="mb-1 text-sm font-semibold text-terciaria">Bloco {bloco.numero}</h3>
                {bloco.movimentos
                  ?.filter((m) => m.ativo)
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
            ))}
        </section>
      ))}
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
