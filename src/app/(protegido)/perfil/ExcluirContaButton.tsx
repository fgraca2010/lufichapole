"use client";

import { useState, useTransition } from "react";
import { excluirConta } from "../actions";

export function ExcluirContaButton({ userId }: { userId: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!confirmando) {
    return (
      <button
        onClick={() => setConfirmando(true)}
        className="rounded-full border border-secundaria px-4 py-2 text-sm font-medium text-secundaria"
      >
        Excluir minha conta
      </button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-secundaria/40 p-4">
      <p className="text-sm text-black">
        Tem certeza? Isso apaga seu cadastro e todo o seu histórico de
        evolução permanentemente. Não tem como desfazer.
      </p>
      <div className="flex gap-2">
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await excluirConta(userId);
              if (r?.erro) setErro(r.erro);
            })
          }
          className="rounded-full bg-secundaria px-4 py-2 text-sm font-medium text-secundaria-texto disabled:opacity-50"
        >
          Sim, excluir permanentemente
        </button>
        <button
          onClick={() => setConfirmando(false)}
          className="rounded-full border border-terciaria/30 px-4 py-2 text-sm text-terciaria"
        >
          Cancelar
        </button>
      </div>
      {erro && <p className="text-xs text-secundaria">{erro}</p>}
    </div>
  );
}
