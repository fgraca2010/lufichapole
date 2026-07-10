import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { sair } from "./actions";
import { NavLink } from "./NavLink";
import { Avatar } from "./Avatar";

const NAV_POR_PERSONA: Record<string, { href: string; rotulo: string }[]> = {
  aluno: [
    { href: "/aluno", rotulo: "Minha ficha" },
    { href: "/perfil", rotulo: "Meu perfil" },
  ],
  professor: [
    { href: "/professor", rotulo: "Dashboard" },
    { href: "/professor/avaliacoes", rotulo: "Avaliações" },
    { href: "/professor/alunos", rotulo: "Meus alunos" },
    { href: "/perfil", rotulo: "Meu perfil" },
  ],
  admin: [
    { href: "/admin", rotulo: "Dashboard" },
    { href: "/admin/alunos", rotulo: "Alunos" },
    { href: "/admin/professores", rotulo: "Professores" },
    { href: "/admin/conteudo", rotulo: "Conteúdo" },
    { href: "/admin/configuracoes", rotulo: "Configurações" },
    { href: "/perfil", rotulo: "Meu perfil" },
  ],
};

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
    .select("nome_completo, persona, avatar_url")
    .eq("id", user.id)
    .single();

  const nav = NAV_POR_PERSONA[perfil?.persona ?? "aluno"];

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex flex-col gap-3 border-b border-terciaria/10 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo-lu-fortuna.png" alt="Lu Fortuna Polesport" width={36} height={36} />
          <span className="flex items-center gap-2 text-sm font-medium text-terciaria">
            {perfil?.nome_completo ?? user.email}
            <Avatar avatarUrl={perfil?.avatar_url} nome={perfil?.nome_completo ?? "usuário"} tamanho={28} />
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-1">
          {nav.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.rotulo}
            </NavLink>
          ))}
          <form action={sair}>
            <button type="submit" className="ml-2 text-sm text-terciaria underline">
              Sair
            </button>
          </form>
        </nav>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
