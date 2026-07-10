import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MovimentoRow } from "./MovimentoRow";

type StatusMovimento = "em_andamento" | "pendente_avaliacao" | "aprovado";

export default async function AlunoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("persona")
    .eq("id", user.id)
    .single();

  if (perfil?.persona !== "aluno") {
    redirect(`/${perfil?.persona ?? ""}`);
  }

  const [{ data: resumo }, { data: config }, { data: niveis }, { data: status }] =
    await Promise.all([
      supabase.rpc("resumo_aluno").single(),
      supabase.from("configuracao_sistema").select("sucessos_necessarios").single(),
      supabase
        .from("niveis")
        .select("numero, nome, blocos(numero, movimentos(id, nome, categoria, ativo))")
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

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-8">
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
                <h3 className="mb-1 text-sm font-semibold text-terciaria">
                  Bloco {bloco.numero}
                </h3>
                {bloco.movimentos
                  ?.filter((m) => m.ativo)
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
