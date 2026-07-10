"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { NavLink } from "./NavLink";

function BotaoSair({ className }: { className: string }) {
  // useFormStatus reflete o estado real do <form> pai (via action de
  // servidor) — evita clique duplo e dá feedback visual se a rede estiver
  // lenta, sem precisar de estado próprio nem duplicar lógica de sair().
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-50`}>
      {pending ? "Saindo..." : "Sair"}
    </button>
  );
}

export function NavPrincipal({
  itens,
  sair,
}: {
  itens: { href: string; rotulo: string }[];
  sair: () => void;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <nav className="relative">
      {/* Mobile: botão hambúrguer + menu suspenso */}
      <div className="sm:hidden">
        <button
          onClick={() => setAberto((v) => !v)}
          aria-label="Abrir menu"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-terciaria/30 text-terciaria"
        >
          {aberto ? "✕" : "☰"}
        </button>
        {aberto && (
          <div className="absolute right-0 top-12 z-20 flex w-56 flex-col gap-1 rounded-lg border border-terciaria/10 bg-background p-2 shadow-lg">
            {itens.map((item) => (
              <div key={item.href} onClick={() => setAberto(false)}>
                <NavLink href={item.href}>{item.rotulo}</NavLink>
              </div>
            ))}
            <form action={sair}>
              <BotaoSair className="w-full rounded-full px-3 py-1.5 text-left text-sm text-terciaria underline" />
            </form>
          </div>
        )}
      </div>

      {/* sm+: nav horizontal normal */}
      <div className="hidden flex-wrap items-center gap-1 sm:flex">
        {itens.map((item) => (
          <NavLink key={item.href} href={item.href}>
            {item.rotulo}
          </NavLink>
        ))}
        <form action={sair}>
          <BotaoSair className="ml-2 text-sm text-terciaria underline" />
        </form>
      </div>
    </nav>
  );
}
