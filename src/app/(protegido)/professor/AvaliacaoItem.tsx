"use client";

import { useState, useTransition } from "react";
import { avaliarMovimento } from "./actions";

export function AvaliacaoItem({
  alunoId,
  alunoNome,
  movimentoId,
  movimentoNome,
  categoria,
  nivelNumero,
  blocoNumero,
}: {
  alunoId: string;
  alunoNome: string;
  movimentoId: number;
  movimentoNome: string;
  categoria: string | null;
  nivelNumero: number | null;
  blocoNumero: number | null;
}) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [decidido, setDecidido] = useState(false);

  function avaliar(confirmado: boolean) {
    setErro(null);
    startTransition(async () => {
      const r = await avaliarMovimento(alunoId, movimentoId, confirmado);
      if (r.erro) setErro(r.erro);
      else setDecidido(true);
    });
  }

  if (decidido) return null;

  return (
    <div className="flex flex-col gap-1 border-b border-terciaria/10 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm">
          <span className="font-medium text-black">{alunoNome}</span>
          <span className="text-terciaria">
            {" — "}
            {nivelNumero != null && `Nível ${nivelNumero} — `}
            {blocoNumero != null && `Bloco ${blocoNumero} — `}
          </span>
          {categoria && (
            <span className="mr-1 rounded-full bg-terciaria/10 px-2 py-0.5 text-xs font-medium text-terciaria">
              {categoria}
            </span>
          )}
          <span className="text-terciaria">{movimentoNome}</span>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            disabled={pending}
            onClick={() => avaliar(true)}
            className="rounded-full bg-primaria px-3 py-1 text-xs font-medium text-primaria-texto disabled:opacity-50"
          >
            Confirmar
          </button>
          <button
            disabled={pending}
            onClick={() => avaliar(false)}
            className="rounded-full bg-secundaria px-3 py-1 text-xs font-medium text-secundaria-texto disabled:opacity-50"
          >
            Treinar de novo
          </button>
        </div>
      </div>
      {erro && <p className="text-xs text-secundaria">{erro}</p>}
    </div>
  );
}
