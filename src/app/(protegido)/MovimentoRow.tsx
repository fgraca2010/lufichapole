"use client";

import { useState, useTransition } from "react";
import {
  registrarTentativaProfessor,
  reiniciarMovimentoProfessor,
  avaliarMovimento,
} from "./professor/actions";

type Status = "em_andamento" | "pendente_avaliacao" | "aprovado";

type Props = {
  movimentoId: number;
  nome: string;
  categoria: string | null;
  status: Status;
  sucessosConsecutivos: number;
  sucessosNecessarios: number;
  /**
   * Presente só na ficha que o PROFESSOR abre de um aluno vinculado — habilita
   * marcar sucesso/erro, aprovar/reprovar e reiniciar. Ausente = visão
   * somente leitura (o aluno, a partir de 2026-08-04, só acompanha o que o
   * professor já marcou — ver vault/_index.md).
   */
  controlesProfessor?: { alunoId: string };
};

const rotuloStatus: Record<Status, string> = {
  em_andamento: "Em andamento",
  pendente_avaliacao: "Aguardando avaliação",
  aprovado: "Aprovado",
};

export function MovimentoRow({
  movimentoId,
  nome,
  categoria,
  status,
  sucessosConsecutivos,
  sucessosNecessarios,
  controlesProfessor,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoReinicio, setConfirmandoReinicio] = useState(false);

  const alunoId = controlesProfessor?.alunoId;

  function registrar(resultado: "sucesso" | "erro") {
    if (!alunoId) return;
    setErro(null);
    startTransition(async () => {
      const r = await registrarTentativaProfessor(alunoId, movimentoId, resultado);
      if (r.erro) setErro(r.erro);
    });
  }

  function avaliar(confirmado: boolean) {
    if (!alunoId) return;
    setErro(null);
    startTransition(async () => {
      const r = await avaliarMovimento(alunoId, movimentoId, confirmado);
      if (r.erro) setErro(r.erro);
    });
  }

  function reiniciar() {
    if (!alunoId) return;
    setErro(null);
    startTransition(async () => {
      const r = await reiniciarMovimentoProfessor(alunoId, movimentoId);
      if (r.erro) setErro(r.erro);
      else setConfirmandoReinicio(false);
    });
  }

  // Mesmo com avaliação pendente, o professor pode continuar marcando
  // sucesso/erro (um erro nesse meio tempo derruba de volta a em_andamento —
  // ver registrar_tentativa_movimento() no banco).
  const podeMarcar = Boolean(alunoId) && status !== "aprovado";
  const podeAvaliar = Boolean(alunoId) && status === "pendente_avaliacao";
  const podeReiniciar = Boolean(alunoId) && status === "aprovado";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-terciaria/10 py-2">
      <div className="flex min-w-0 basis-full items-center gap-2 sm:basis-auto sm:flex-1">
        {categoria && (
          <span className="shrink-0 rounded-full bg-terciaria/10 px-2 py-0.5 text-xs font-medium text-terciaria">
            {categoria}
          </span>
        )}
        <span className="truncate text-sm text-black">{nome}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* O "box" do movimento: amarelo enquanto não aprovado (em_andamento
            ou pendente_avaliacao), verde quando aprovado. */}
        <span
          className={
            "rounded-full px-2 py-0.5 font-medium " +
            (status === "aprovado"
              ? "bg-primaria text-primaria-texto"
              : "bg-atencao text-atencao-texto")
          }
        >
          {rotuloStatus[status]}
          {status !== "aprovado" && ` (${sucessosConsecutivos}/${sucessosNecessarios})`}
        </span>

        {podeMarcar && (
          <>
            <button
              disabled={pending}
              onClick={() => registrar("sucesso")}
              className="flex h-9 min-w-9 items-center justify-center rounded-full bg-primaria text-primaria-texto disabled:opacity-50"
              title="Registrar sucesso"
            >
              ✓
            </button>
            <button
              disabled={pending}
              onClick={() => registrar("erro")}
              className="flex h-9 min-w-9 items-center justify-center rounded-full bg-secundaria text-secundaria-texto disabled:opacity-50"
              title="Registrar erro"
            >
              ✗
            </button>
          </>
        )}

        {podeAvaliar && (
          <>
            <button
              disabled={pending}
              onClick={() => avaliar(true)}
              className="rounded-full bg-primaria px-3 py-1.5 font-medium text-primaria-texto disabled:opacity-50"
            >
              Confirmar
            </button>
            <button
              disabled={pending}
              onClick={() => avaliar(false)}
              className="rounded-full bg-secundaria px-3 py-1.5 font-medium text-secundaria-texto disabled:opacity-50"
            >
              Treinar de novo
            </button>
          </>
        )}

        {podeReiniciar && !confirmandoReinicio && (
          <button
            onClick={() => setConfirmandoReinicio(true)}
            className="text-terciaria/50 underline"
            title="Recomeçar este movimento do zero"
          >
            Recomeçar
          </button>
        )}
      </div>

      {podeReiniciar && confirmandoReinicio && (
        <div className="w-full rounded-md bg-secundaria/10 p-2 text-xs">
          <p className="text-black">
            Se continuar, o aluno <strong>perde a aprovação</strong> neste
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
