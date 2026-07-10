"use client";

import { useState, useTransition } from "react";
import { atualizarDadosPessoais } from "./actions";

export function EditarDadosPessoais({
  nomeCompletoInicial,
  dataNascimentoInicial,
}: {
  nomeCompletoInicial: string;
  dataNascimentoInicial: string | null;
}) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(nomeCompletoInicial);
  const [dataNascimento, setDataNascimento] = useState(dataNascimentoInicial ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dataFormatada = dataNascimentoInicial
    ? new Date(dataNascimentoInicial + "T00:00:00").toLocaleDateString("pt-BR")
    : "—";

  if (!editando) {
    return (
      <dl className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-terciaria">Nome completo</dt>
          <dd className="text-black">{nomeCompletoInicial}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-terciaria">Data de nascimento</dt>
          <dd className="text-black">{dataFormatada}</dd>
        </div>
        <button
          onClick={() => setEditando(true)}
          className="self-start text-xs text-primaria underline"
        >
          Editar
        </button>
      </dl>
    );
  }

  function salvar(formData: FormData) {
    setErro(null);
    startTransition(async () => {
      const r = await atualizarDadosPessoais(formData);
      if (r.erro) setErro(r.erro);
      else setEditando(false);
    });
  }

  return (
    <form action={salvar} className="flex flex-col gap-3 text-sm">
      <div className="flex flex-col gap-1">
        <label htmlFor="nome_completo" className="text-terciaria">
          Nome completo
        </label>
        <input
          id="nome_completo"
          name="nome_completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          className="rounded border border-terciaria/20 px-2 py-1"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="data_nascimento" className="text-terciaria">
          Data de nascimento
        </label>
        <input
          id="data_nascimento"
          name="data_nascimento"
          type="date"
          value={dataNascimento}
          onChange={(e) => setDataNascimento(e.target.value)}
          className="rounded border border-terciaria/20 px-2 py-1"
        />
      </div>
      {erro && <p className="text-xs text-secundaria">{erro}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primaria px-4 py-1.5 font-medium text-primaria-texto disabled:opacity-50"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="rounded-full border border-terciaria/30 px-4 py-1.5 text-terciaria"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
