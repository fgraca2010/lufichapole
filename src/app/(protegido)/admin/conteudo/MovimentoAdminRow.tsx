"use client";

import { useState, useTransition } from "react";
import { atualizarMovimento } from "./actions";

const CATEGORIAS = ["A", "B", "C", "D", "E"];

export function MovimentoAdminRow({
  id,
  nome: nomeInicial,
  categoria: categoriaInicial,
  ativo: ativoInicial,
}: {
  id: number;
  nome: string;
  categoria: string | null;
  ativo: boolean;
}) {
  const [nome, setNome] = useState(nomeInicial);
  const [categoria, setCategoria] = useState(categoriaInicial ?? "");
  const [ativo, setAtivo] = useState(ativoInicial);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function salvar() {
    setErro(null);
    startTransition(async () => {
      const r = await atualizarMovimento(id, {
        nome,
        categoria: categoria || null,
        ativo,
      });
      if (r.erro) setErro(r.erro);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-terciaria/10 py-1.5 text-sm">
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        className="min-w-40 flex-1 rounded border border-terciaria/20 px-2 py-1"
      />
      <select
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        className="rounded border border-terciaria/20 px-2 py-1"
      >
        <option value="">—</option>
        {CATEGORIAS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-1 text-xs">
        <input
          type="checkbox"
          checked={ativo}
          onChange={(e) => setAtivo(e.target.checked)}
        />
        ativo
      </label>
      <button
        onClick={salvar}
        disabled={pending}
        className="rounded-full bg-primaria px-3 py-1 text-xs font-medium text-primaria-texto disabled:opacity-50"
      >
        Salvar
      </button>
      {erro && <span className="text-xs text-secundaria">{erro}</span>}
    </div>
  );
}
