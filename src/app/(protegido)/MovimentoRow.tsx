"use client";

import { useEffect, useState, useTransition } from "react";
import {
  registrarTentativaProfessor,
  reiniciarMovimentoProfessor,
  avaliarMovimento,
} from "./professor/actions";
import { listarSucessosMovimento } from "./actions";

type Status = "em_andamento" | "pendente_avaliacao" | "aprovado";

type Props = {
  movimentoId: number;
  nome: string;
  categoria: string | null;
  status: Status;
  sucessosConsecutivos: number;
  sucessosNecessarios: number;
  /** Data (ISO) em que o movimento foi aprovado — mostrada abaixo de "Aprovado". */
  aprovadoEm?: string | null;
  /**
   * Presente só na ficha que o PROFESSOR abre de um aluno vinculado — habilita
   * marcar sucesso/erro, aprovar/reprovar e reiniciar. Ausente = visão
   * somente leitura (o aluno, a partir de 2026-08-04, só acompanha o que o
   * professor já marcou — ver vault/_index.md).
   */
  controlesProfessor?: { alunoId: string };
};

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

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
  aprovadoEm,
  controlesProfessor,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoReinicio, setConfirmandoReinicio] = useState(false);

  const [expandido, setExpandido] = useState(false);
  const [carregandoDatas, startCarregamentoDatas] = useTransition();
  const [datasSucesso, setDatasSucesso] = useState<string[] | null>(null);
  const [erroDatas, setErroDatas] = useState<string | null>(null);

  const alunoId = controlesProfessor?.alunoId;

  // Refaz a busca sempre que o painel está aberto E a contagem/status muda —
  // não só no clique. Isso corrige o cache ficar "preso" com datas antigas
  // depois de aprovar/reprovar/marcar sucesso ou erro sem precisar recarregar
  // a página: assim que o servidor confirma a mudança (revalidatePath) e este
  // componente recebe as novas props, o efeito dispara de novo.
  useEffect(() => {
    if (!expandido || status === "aprovado") return;
    startCarregamentoDatas(async () => {
      setErroDatas(null);
      const r = await listarSucessosMovimento(movimentoId, sucessosConsecutivos, alunoId);
      if (r.erro) setErroDatas(r.erro);
      else setDatasSucesso(r.datas);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandido, sucessosConsecutivos, status]);

  function alternarExpandido() {
    setExpandido((v) => !v);
  }

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
            ou pendente_avaliacao) — clicável, expande as datas dos sucessos
            da sequência atual. Verde quando aprovado, com a data embaixo. */}
        <div className="flex flex-col items-start gap-0.5">
          {status === "aprovado" ? (
            <span className="rounded-full bg-primaria px-2 py-0.5 font-medium text-primaria-texto">
              {rotuloStatus[status]}
            </span>
          ) : (
            <button
              type="button"
              onClick={alternarExpandido}
              className="rounded-full bg-atencao px-2 py-0.5 font-medium text-atencao-texto hover:brightness-95"
              title="Ver as datas dos sucessos desta sequência"
            >
              {rotuloStatus[status]} ({sucessosConsecutivos}/{sucessosNecessarios})
            </button>
          )}
          {status === "aprovado" && aprovadoEm && (
            <span className="text-[11px] text-terciaria/60">em {formatarDataHora(aprovadoEm)}</span>
          )}
        </div>

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

      {expandido && status !== "aprovado" && (
        <div className="w-full rounded-md bg-atencao/10 p-2 text-xs">
          {carregandoDatas && datasSucesso === null && (
            <p className="text-terciaria">Carregando…</p>
          )}
          {erroDatas && <p className="text-secundaria">{erroDatas}</p>}
          {datasSucesso?.length === 0 && (
            <p className="text-terciaria">Nenhum sucesso registrado ainda nesta sequência.</p>
          )}
          {datasSucesso && datasSucesso.length > 0 && (
            <ul className="flex flex-col gap-0.5">
              {datasSucesso.map((data, i) => (
                <li key={i} className="text-terciaria">
                  ✓ {formatarDataHora(data)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {erro && <p className="w-full text-xs text-secundaria">{erro}</p>}
    </div>
  );
}
