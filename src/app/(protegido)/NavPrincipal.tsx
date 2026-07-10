"use client";

import { useState } from "react";
import { NavLink } from "./NavLink";

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
              <button
                type="submit"
                className="w-full rounded-full px-3 py-1.5 text-left text-sm text-terciaria underline"
              >
                Sair
              </button>
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
          <button type="submit" className="ml-2 text-sm text-terciaria underline">
            Sair
          </button>
        </form>
      </div>
    </nav>
  );
}
