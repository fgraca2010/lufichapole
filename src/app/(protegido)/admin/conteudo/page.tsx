import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MovimentoAdminRow } from "./MovimentoAdminRow";
import { criarMovimento, criarBloco } from "./actions";

export default async function ConteudoAdminPage() {
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
    .select("id, numero, nome, blocos(id, numero, nome, movimentos(id, nome, categoria, ativo))")
    .order("numero");

  type Movimento = { id: number; nome: string; categoria: string | null; ativo: boolean };
  type Bloco = { id: number; numero: number; nome: string | null; movimentos: Movimento[] | null };
  type Nivel = { id: number; numero: number; nome: string; blocos: Bloco[] | null };

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-8">
      <a href="/admin" className="text-sm text-terciaria underline">
        ← Voltar
      </a>
      <h1 className="text-xl font-semibold text-black">Blocos e movimentos</h1>

      {(niveis as unknown as Nivel[] | null ?? []).map((nivel) => (
        <section key={nivel.id}>
          <h2 className="mb-3 text-lg font-semibold text-black">
            Nível {nivel.numero} — {nivel.nome}
          </h2>

          {nivel.blocos
            ?.sort((a, b) => a.numero - b.numero)
            .map((bloco) => (
              <div key={bloco.id} className="mb-6">
                <h3 className="mb-2 text-sm font-semibold text-terciaria">
                  Bloco {bloco.numero}
                </h3>

                {bloco.movimentos?.map((m) => (
                  <MovimentoAdminRow
                    key={m.id}
                    id={m.id}
                    nome={m.nome}
                    categoria={m.categoria}
                    ativo={m.ativo}
                  />
                ))}

                <form action={criarMovimento} className="mt-2 flex items-center gap-2 text-sm">
                  <input type="hidden" name="bloco_id" value={bloco.id} />
                  <input
                    name="nome"
                    placeholder="Novo movimento"
                    required
                    className="min-w-40 flex-1 rounded border border-terciaria/20 px-2 py-1"
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
            ))}

          <form action={criarBloco} className="flex items-center gap-2 text-sm">
            <input type="hidden" name="nivel_id" value={nivel.id} />
            <input
              name="numero"
              type="number"
              placeholder="Nº do novo bloco"
              required
              className="w-40 rounded border border-terciaria/20 px-2 py-1"
            />
            <input
              name="nome"
              placeholder="Nome (opcional)"
              className="flex-1 rounded border border-terciaria/20 px-2 py-1"
            />
            <button className="rounded-full bg-terciaria px-3 py-1 text-xs font-medium text-terciaria-texto">
              Adicionar bloco
            </button>
          </form>
        </section>
      ))}
    </div>
  );
}
