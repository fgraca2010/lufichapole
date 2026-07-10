"use client";

import { useState, useTransition } from "react";
import { vincularProfessor } from "./actions";

export function VincularProfessor({
  alunoId,
  professorIdAtual,
  professores,
}: {
  alunoId: string;
  professorIdAtual: string | null;
  professores: { id: string; nome_completo: string }[];
}) {
  const [valor, setValor] = useState(professorIdAtual ?? "");
  const [pending, startTransition] = useTransition();

  function alterar(novoValor: string) {
    setValor(novoValor);
    startTransition(() => {
      vincularProfessor(alunoId, novoValor || null);
    });
  }

  return (
    <select
      value={valor}
      disabled={pending}
      onChange={(e) => alterar(e.target.value)}
      className="rounded border border-terciaria/20 px-2 py-1 text-xs"
    >
      <option value="">— sem professor —</option>
      {professores.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nome_completo}
        </option>
      ))}
    </select>
  );
}
