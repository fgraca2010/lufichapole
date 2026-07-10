import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExcluirContaButton } from "./ExcluirContaButton";

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome_completo, persona, data_nascimento, telefone")
    .eq("id", user.id)
    .single();

  const dataNascimentoFormatada = perfil?.data_nascimento
    ? new Date(perfil.data_nascimento + "T00:00:00").toLocaleDateString("pt-BR")
    : "—";

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-xl font-semibold text-black">Meu perfil</h1>

      <dl className="flex flex-col gap-3 rounded-lg border border-terciaria/10 p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-terciaria">Nome completo</dt>
          <dd className="text-black">{perfil?.nome_completo ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-terciaria">E-mail</dt>
          <dd className="text-black">{user.email}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-terciaria">Data de nascimento</dt>
          <dd className="text-black">{dataNascimentoFormatada}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-terciaria">Telefone</dt>
          <dd className="text-black">{perfil?.telefone ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-terciaria">Perfil</dt>
          <dd className="text-black capitalize">{perfil?.persona}</dd>
        </div>
      </dl>

      <p className="text-xs text-terciaria/70">
        Pra alterar algum desses dados, fale com a administração da Lu Fortuna
        Polesport.
      </p>

      {perfil?.persona !== "admin" && (
        <div className="mt-4">
          <ExcluirContaButton userId={user.id} />
        </div>
      )}
    </div>
  );
}
