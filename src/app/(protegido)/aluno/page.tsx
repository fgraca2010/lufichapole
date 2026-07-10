import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MovimentoRow } from "./MovimentoRow";

type StatusMovimento = "em_andamento" | "pendente_avaliacao" | "aprovado";

export default async function AlunoPage({
  searchParams,
}: {
  searchParams: Promise<{ nivel?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("persona, professor_id")
    .eq("id", user.id)
    .single();

  if (perfil?.persona !== "aluno") {
    redirect(`/${perfil?.persona ?? ""}`);
  }

  const { data: professor } = perfil.professor_id
    ? await supabase
        .from("perfis")
        .select("nome_completo")
        .eq("id", perfil.professor_id)
        .single()
    : { data: null };

  const [{ data: resumo }, { data: config }, { data: niveis }, { data: status }] =
    await Promise.all([
      supabase.rpc("resumo_aluno").single(),
      supabase.from("configuracao_sistema").select("sucessos_necessarios").single(),
      supabase
        .from("niveis")
        .select("numero, nome, blocos(numero, movimentos(id, nome, categoria, ativo, ordem))")
        .order("numero"),
      supabase
        .from("aluno_movimento_status")
        .select("movimento_id, status, sucessos_consecutivos")
        .eq("aluno_id", user.id),
    ]);

  const necessarios = config?.sucessos_necessarios ?? 4;
  const statusPorMovimento = new Map(
    (status ?? []).map((s) => [s.movimento_id, s])
  );

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
      <p className="text-sm text-terciaria">
        Professor(a):{" "}
        <span className="font-medium text-black">
          {professor?.nome_completo ?? "ainda não vinculado"}
        </span>
      </p>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Estatistica rotulo="Treinos" valor={r?.treinos ?? 0} />
        <Estatistica rotulo="Exercícios completos" valor={r?.exercicios_completos ?? 0} />
        <Estatistica rotulo="Aguardando avaliação" valor={r?.exercicios_pendentes_avaliacao ?? 0} />
        <Estatistica rotulo="Blocos completos" valor={r?.blocos_completos ?? 0} />
      </section>

      <nav className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {(niveis ?? []).map((n) => (
            <a
              key={n.numero}
              href={`/aluno?nivel=${n.numero}`}
              className={
                n.numero === nivelSelecionado
                  ? "rounded-full bg-primaria px-3 py-1.5 text-sm font-medium text-primaria-texto"
                  : "rounded-full px-3 py-1.5 text-sm font-medium text-terciaria hover:bg-terciaria/10"
              }
            >
              Nível {n.numero}
            </a>
          ))}
        </div>
        <a
          href={`/aluno/ficha/${nivelSelecionado}/pdf`}
          className="rounded-full border border-terciaria/30 px-3 py-1.5 text-sm font-medium text-terciaria hover:bg-terciaria/10"
        >
          ⬇ Baixar ficha (PDF)
        </a>
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
                      return (
                        <MovimentoRow
                          key={mov.id}
                          movimentoId={mov.id}
                          nome={mov.nome}
                          categoria={mov.categoria}
                          status={(s?.status as StatusMovimento) ?? "em_andamento"}
                          sucessosConsecutivos={s?.sucessos_consecutivos ?? 0}
                          sucessosNecessarios={necessarios}
                        />
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
