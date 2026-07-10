import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExcluirContaButton } from "./ExcluirContaButton";
import { AvatarUpload } from "./AvatarUpload";
import { VinculosSociais } from "./VinculosSociais";
import { EditarDadosPessoais } from "./EditarDadosPessoais";

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome_completo, persona, data_nascimento, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-xl font-semibold text-black">Meu perfil</h1>

      <AvatarUpload userId={user.id} avatarUrlInicial={perfil?.avatar_url ?? null} />

      <div className="rounded-lg border border-terciaria/10 p-4">
        <EditarDadosPessoais
          nomeCompletoInicial={perfil?.nome_completo ?? ""}
          dataNascimentoInicial={perfil?.data_nascimento ?? null}
        />
        <div className="mt-3 flex justify-between gap-4 border-t border-terciaria/10 pt-3 text-sm">
          <span className="text-terciaria">E-mail</span>
          <span className="text-black">{user.email}</span>
        </div>
        <div className="mt-3 flex justify-between gap-4 text-sm">
          <span className="text-terciaria">Perfil</span>
          <span className="capitalize text-black">{perfil?.persona}</span>
        </div>
      </div>

      <VinculosSociais />

      <p className="text-xs text-terciaria/70">
        E-mail e perfil (aluno/professor/admin) não podem ser alterados por
        aqui — fale com a administração da Lu Fortuna Polesport.
      </p>

      {perfil?.persona !== "admin" && (
        <div className="mt-4">
          <ExcluirContaButton userId={user.id} />
        </div>
      )}
    </div>
  );
}
