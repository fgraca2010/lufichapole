import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { atualizarSucessosNecessarios } from "../actions";

export default async function AdminConfiguracoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("persona")
    .eq("id", user.id)
    .single();
  if (perfil?.persona !== "admin") redirect(`/${perfil?.persona ?? ""}`);

  const { data: config } = await supabase
    .from("configuracao_sistema")
    .select("sucessos_necessarios")
    .single();

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-8">
      <h1 className="text-xl font-semibold text-black">Configurações</h1>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-terciaria">Regra de aprovação</h2>
        <form action={atualizarSucessosNecessarios} className="flex items-end gap-2 text-sm">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-terciaria">
              Sucessos consecutivos necessários (vale pra todos os movimentos)
            </label>
            <input
              name="sucessos_necessarios"
              type="number"
              min={1}
              defaultValue={config?.sucessos_necessarios ?? 4}
              className="w-24 rounded border border-terciaria/20 px-2 py-1"
            />
          </div>
          <button className="rounded-full bg-primaria px-4 py-1.5 font-medium text-primaria-texto">
            Salvar
          </button>
        </form>
        <p className="mt-2 max-w-md text-xs text-terciaria/70">
          Quem já tinha atingido o número anterior continua aprovado. Se você
          diminuir o valor, quem já tinha sucessos suficientes pra nova
          quantidade entra automaticamente na fila de avaliação do professor.
        </p>
      </section>
    </div>
  );
}
