"use client";

import { useState, useTransition } from "react";
import { registrarTentativa, reiniciarMovimento } from "./actions";

type Props = {
  movimentoId: number;
  nome: string;
  categoria: string | null;
  status: "em_andamento" | "pendente_avaliacao" | "aprovado";
  sucessosConsecutivos: number;
  sucessosNecessarios: number;
};

const rotuloStatus: Record<Props["status"], string> = {
  em_andamento: "Em andamento",
  pendente_avaliacao: "Aguardando avaliação do professor",
  aprovado: "Aprovado",
};

export function MovimentoRow({
  movimentoId,
  nome,
  categoria,
  status,
  sucessosConsecutivos,
  sucessosNecessarios,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoReinicio, setConfirmandoReinicio] = useState(false);

  function registrar(resultado: "sucesso" | "erro") {
    setErro(null);
    startTransition(async () => {
      const r = await registrarTentativa(movimentoId, resultado);
      if (r.erro) setErro(r.erro);
    });
  }

  function reiniciar() {
    setErro(null);
    startTransition(async () => {
      const r = await reiniciarMovimento(movimentoId);
      if (r.erro) setErro(r.erro);
      else setConfirmandoReinicio(false);
    });
  }

  const podeRegistrar = status !== "aprovado";

  return (
    <div className="flex items-center justify-between gap-3 border-b border-terciaria/10 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {categoria && (
          <span className="shrink-0 rounded-full bg-terciaria/10 px-2 py-0.5 text-xs font-medium text-terciaria">
            {categoria}
          </span>
        )}
        <span className="truncate text-sm text-black">{nome}</span>
      </div>

      <div className="flex shrink-0 items-center gap-2 text-xs">
        <span
          className={
            status === "aprovado"
              ? "text-primaria"
              : status === "pendente_avaliacao"
                ? "text-secundaria"
                : "text-terciaria/60"
          }
        >
          {rotuloStatus[status]}
          {status !== "aprovado" && ` (${sucessosConsecutivos}/${sucessosNecessarios})`}
        </span>

        {podeRegistrar && (
          <>
            <button
              disabled={pending}
              onClick={() => registrar("sucesso")}
              className="rounded-full bg-primaria px-2 py-1 text-primaria-texto disabled:opacity-50"
              title="Registrar sucesso"
            >
              ✓
            </button>
            <button
              disabled={pending}
              onClick={() => registrar("erro")}
              className="rounded-full bg-secundaria px-2 py-1 text-secundaria-texto disabled:opacity-50"
              title="Registrar erro"
            >
              ✗
            </button>
          </>
        )}

        {status === "aprovado" && !confirmandoReinicio && (
          <button
            onClick={() => setConfirmandoReinicio(true)}
            className="text-terciaria/50 underline"
            title="Recomeçar este movimento do zero"
          >
            Recomeçar
          </button>
        )}
      </div>

      {status === "aprovado" && confirmandoReinicio && (
        <div className="w-full rounded-md bg-secundaria/10 p-2 text-xs">
          <p className="text-black">
            Se continuar, você <strong>perde a aprovação</strong> neste
            movimento e precisa treinar do zero de novo. Tem certeza?
          </p>
          <div className="mt-1 flex gap-2">
            <button
              disabled={pending}
              onClick={reiniciar}
              className="rounded-full bg-secundaria px-3 py-1 font-medium text-secundaria-texto disabled:opacity-50"
            >
              Sim, recomeçar
            </button>
            <button
              onClick={() => setConfirmandoReinicio(false)}
              className="rounded-full border border-terciaria/30 px-3 py-1 text-terciaria"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {erro && <p className="w-full text-xs text-secundaria">{erro}</p>}
    </div>
  );
}
