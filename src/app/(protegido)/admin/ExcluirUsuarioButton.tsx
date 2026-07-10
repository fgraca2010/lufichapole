"use client";

import { useState, useTransition } from "react";
import { excluirConta } from "../actions";

export function ExcluirUsuarioButton({
  userId,
  nome,
  avisoExtra,
}: {
  userId: string;
  nome: string;
  avisoExtra?: string;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (confirmando) {
    return (
      <span className="flex items-center gap-2 text-xs">
        <span className="text-secundaria">Excluir {nome}? {avisoExtra}</span>
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await excluirConta(userId);
              if (r?.erro) setErro(r.erro);
              else setConfirmando(false);
            })
          }
          className="rounded-full bg-secundaria px-2 py-1 text-secundaria-texto disabled:opacity-50"
        >
          Confirmar
        </button>
        <button onClick={() => setConfirmando(false)} className="text-terciaria underline">
          Cancelar
        </button>
        {erro && <span className="text-secundaria">{erro}</span>}
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      className="text-xs text-secundaria underline"
    >
      Excluir
    </button>
  );
}
