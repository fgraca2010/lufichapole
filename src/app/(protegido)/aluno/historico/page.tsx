import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const POR_PAGINA = 50;

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("persona")
    .eq("id", user.id)
    .single();
  if (perfil?.persona !== "aluno") redirect(`/${perfil?.persona ?? ""}`);

  const { pagina: paginaParam } = await searchParams;
  const pagina = Math.max(1, Number(paginaParam) || 1);
  const de = (pagina - 1) * POR_PAGINA;
  const ate = de + POR_PAGINA - 1;

  const { data: tentativas, count } = await supabase
    .from("tentativas_movimento")
    .select(
      "id, resultado, registrado_em, movimentos(nome, categoria, blocos(numero, niveis(numero)))",
      { count: "exact" }
    )
    .eq("aluno_id", user.id)
    .order("registrado_em", { ascending: false })
    .range(de, ate);

  type Linha = {
    id: number;
    resultado: "sucesso" | "erro";
    registrado_em: string;
    movimentos: {
      nome: string;
      categoria: string | null;
      blocos: { numero: number; niveis: { numero: number } | null } | null;
    } | null;
  };

  const linhas = (tentativas ?? []) as unknown as Linha[];
  const totalPaginas = Math.max(1, Math.ceil((count ?? 0) / POR_PAGINA));

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold text-black">
        Meu histórico de treinos
      </h1>
      <p className="text-sm text-terciaria">
        Cada tentativa registrada, mais recente primeiro — serve como
        histórico das suas aulas/atividades também.
      </p>

      <div className="flex flex-col">
        {linhas.map((t) => (
          <div
            key={t.id}
            className="flex flex-wrap items-center gap-2 border-b border-terciaria/10 py-2 text-sm"
          >
            <span className="w-full shrink-0 text-xs text-terciaria sm:w-36">
              {new Date(t.registrado_em).toLocaleString("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </span>
            {t.movimentos?.blocos?.niveis?.numero != null && (
              <span className="shrink-0 rounded-full bg-terciaria/10 px-2 py-0.5 text-xs text-terciaria">
                Nível {t.movimentos.blocos.niveis.numero}
              </span>
            )}
            {t.movimentos?.blocos?.numero != null && (
              <span className="shrink-0 rounded-full bg-terciaria/10 px-2 py-0.5 text-xs text-terciaria">
                Bloco {t.movimentos.blocos.numero}
              </span>
            )}
            {t.movimentos?.categoria && (
              <span className="shrink-0 rounded-full bg-terciaria/10 px-2 py-0.5 text-xs font-medium text-terciaria">
                {t.movimentos.categoria}
              </span>
            )}
            <span className="min-w-0 flex-1 truncate text-black">
              {t.movimentos?.nome ?? "Movimento removido"}
            </span>
            <span
              className={
                t.resultado === "sucesso"
                  ? "shrink-0 font-medium text-primaria"
                  : "shrink-0 font-medium text-secundaria"
              }
            >
              {t.resultado === "sucesso" ? "✓ Sucesso" : "✗ Errou"}
            </span>
          </div>
        ))}
        {linhas.length === 0 && (
          <p className="text-sm text-terciaria">
            Nenhuma tentativa registrada ainda. Vai lá treinar! 💪
          </p>
        )}
      </div>

      {totalPaginas > 1 && (
        <nav className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {pagina > 1 && (
            <a
              href={`/aluno/historico?pagina=${pagina - 1}`}
              className="rounded-full border border-terciaria/30 px-3 py-1.5 text-sm text-terciaria"
            >
              ← Mais recentes
            </a>
          )}
          <span className="text-sm text-terciaria">
            Página {pagina} de {totalPaginas}
          </span>
          {pagina < totalPaginas && (
            <a
              href={`/aluno/historico?pagina=${pagina + 1}`}
              className="rounded-full border border-terciaria/30 px-3 py-1.5 text-sm text-terciaria"
            >
              Mais antigas →
            </a>
          )}
        </nav>
      )}
    </div>
  );
}
