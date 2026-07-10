import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { sair } from "./actions";

export default async function ProtegidoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome_completo, persona")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-terciaria/10 px-6 py-3">
        <div className="flex items-center gap-3">
          <Image src="/logo-lu-fortuna.png" alt="Lu Fortuna Polesport" width={36} height={36} />
          <span className="text-sm font-medium text-terciaria">
            {perfil?.nome_completo ?? user.email}
            {perfil?.persona && (
              <span className="ml-2 rounded-full bg-terciaria px-2 py-0.5 text-xs text-terciaria-texto">
                {perfil.persona}
              </span>
            )}
          </span>
        </div>
        <form action={sair}>
          <button type="submit" className="text-sm text-terciaria underline">
            Sair
          </button>
        </form>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
