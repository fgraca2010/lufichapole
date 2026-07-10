"use client";

import { useState, useTransition } from "react";
import { trocarSenha } from "./actions-senha";
import { validarComplexidadeSenha } from "@/lib/senha";
import { mensagemErro } from "@/lib/erro";

export function TrocarSenha() {
  const [abrindo, setAbrindo] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mostrarSenhas, setMostrarSenhas] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [pending, startTransition] = useTransition();

  const problemasComplexidade = novaSenha ? validarComplexidadeSenha(novaSenha) : [];

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(false);

    if (problemasComplexidade.length > 0) {
      setErro(`A nova senha precisa ter: ${problemasComplexidade.join(", ")}.`);
      return;
    }
    if (novaSenha !== confirmacao) {
      setErro("As duas senhas novas não são iguais.");
      return;
    }

    startTransition(async () => {
      const r = await trocarSenha(senhaAtual, novaSenha);
      if (r.erro) {
        setErro(mensagemErro(r.erro));
      } else {
        setSucesso(true);
        setSenhaAtual("");
        setNovaSenha("");
        setConfirmacao("");
        setAbrindo(false);
      }
    });
  }

  if (!abrindo) {
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-black">Senha</span>
        <div className="flex items-center gap-2">
          {sucesso && <span className="text-xs text-primaria">Senha alterada!</span>}
          <button onClick={() => setAbrindo(true)} className="text-xs text-primaria underline">
            Trocar senha
          </button>
        </div>
      </div>
    );
  }

  const tipo = mostrarSenhas ? "text" : "password";

  return (
    <form onSubmit={enviar} className="flex flex-col gap-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-black">Trocar senha</span>
        <button
          type="button"
          onClick={() => setMostrarSenhas((v) => !v)}
          className="text-xs text-secundaria underline"
        >
          {mostrarSenhas ? "Esconder senhas" : "Mostrar senhas"}
        </button>
      </div>
      <input
        type={tipo}
        placeholder="Senha atual"
        value={senhaAtual}
        onChange={(e) => setSenhaAtual(e.target.value)}
        required
        autoComplete="current-password"
        className="rounded border border-terciaria/20 px-2 py-1"
      />
      <input
        type={tipo}
        placeholder="Nova senha"
        value={novaSenha}
        onChange={(e) => setNovaSenha(e.target.value)}
        required
        autoComplete="new-password"
        className="rounded border border-terciaria/20 px-2 py-1"
      />
      <input
        type={tipo}
        placeholder="Confirmar nova senha"
        value={confirmacao}
        onChange={(e) => setConfirmacao(e.target.value)}
        required
        autoComplete="new-password"
        className="rounded border border-terciaria/20 px-2 py-1"
      />
      <p className="text-xs text-terciaria/70">
        Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo.
      </p>
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
          onClick={() => setAbrindo(false)}
          className="rounded-full border border-secundaria px-4 py-1.5 text-secundaria"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
