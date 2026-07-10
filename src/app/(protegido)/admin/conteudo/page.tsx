import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MovimentoAdminRow } from "./MovimentoAdminRow";
import { criarMovimento, criarBloco } from "./actions";

export default async function ConteudoAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ nivel?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("persona")
    .eq("id", user.id)
    .single();
  if (perfil?.persona !== "admin") redirect(`/${perfil?.persona ?? ""}`);

  const { data: niveis } = await supabase
    .from("niveis")
    .select("id, numero, nome, blocos(id, numero, nome, movimentos(id, nome, categoria, ativo, ordem))")
    .order("numero");

  type Movimento = { id: number; nome: string; categoria: string | null; ativo: boolean; ordem: number };
  type Bloco = { id: number; numero: number; nome: string | null; movimentos: Movimento[] | null };
  type Nivel = { id: number; numero: number; nome: string; blocos: Bloco[] | null };

  const todosNiveis = (niveis as unknown as Nivel[] | null) ?? [];
  const { nivel: nivelParam } = await searchParams;
  const nivelSelecionado = Number(nivelParam) || todosNiveis[0]?.numero || 1;
  const nivelAtual = todosNiveis.find((n) => n.numero === nivelSelecionado);

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-xl font-semibold text-black">Blocos e movimentos</h1>

      <nav className="flex flex-wrap gap-2">
        {todosNiveis.map((n) => (
          <a
            key={n.numero}
            href={`/admin/conteudo?nivel=${n.numero}`}
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
          <h2 className="mb-3 text-lg font-semibold text-black">
            Nível {nivelAtual.numero} — {nivelAtual.nome}
          </h2>

          {nivelAtual.blocos
            ?.sort((a, b) => a.numero - b.numero)
            .map((bloco) => (
              <details key={bloco.id} className="mb-3 rounded-lg border border-terciaria/10 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-terciaria">
                  Bloco {bloco.numero} ({bloco.movimentos?.length ?? 0} movimentos)
                </summary>

                <div className="mt-2">
                  {bloco.movimentos?.sort((a, b) => a.ordem - b.ordem).map((m) => (
                    <MovimentoAdminRow
                      key={m.id}
                      id={m.id}
                      nome={m.nome}
                      categoria={m.categoria}
                      ativo={m.ativo}
                    />
                  ))}

                  <form action={criarMovimento} className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <input type="hidden" name="bloco_id" value={bloco.id} />
                    <input
                      name="nome"
                      placeholder="Novo movimento"
                      required
                      className="min-w-0 flex-1 basis-full rounded border border-terciaria/20 px-2 py-1 sm:min-w-40 sm:basis-auto"
                    />
                    <select name="categoria" className="rounded border border-terciaria/20 px-2 py-1">
                      <option value="">—</option>
                      {["A", "B", "C", "D", "E"].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <button className="rounded-full bg-terciaria px-3 py-1 text-xs font-medium text-terciaria-texto">
                      Adicionar
                    </button>
                  </form>
                </div>
              </details>
            ))}

          <form action={criarBloco} className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <input type="hidden" name="nivel_id" value={nivelAtual.id} />
            <input
              name="numero"
              type="number"
              placeholder="Nº do novo bloco"
              required
              className="w-full rounded border border-terciaria/20 px-2 py-1 sm:w-40"
            />
            <input
              name="nome"
              placeholder="Nome (opcional)"
              className="min-w-0 flex-1 rounded border border-terciaria/20 px-2 py-1"
            />
            <button className="rounded-full bg-terciaria px-3 py-1 text-xs font-medium text-terciaria-texto">
              Adicionar bloco
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
