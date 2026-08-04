"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { listarAlunosVinculados } from "../../actions";
import { Avatar } from "../../../Avatar";

type Aluno = { id: string; nome_completo: string; avatar_url: string | null };

/**
 * Clicar no nome do aluno na ficha abre este modal com os outros alunos
 * vinculados ao professor logado, pra trocar de ficha sem precisar voltar
 * pra lista. Só faz sentido pro professor (dono da própria lista de
 * vinculados) — a própria rota `/professor/alunos/[id]` já redireciona quem
 * não é professor antes de este componente sequer renderizar.
 */
export function TrocarAlunoModal({ alunoAtualId, alunoAtualNome }: { alunoAtualId: string; alunoAtualNome: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [carregando, startCarregamento] = useTransition();
  const [alunos, setAlunos] = useState<Aluno[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function abrir() {
    setAberto(true);
    if (alunos === null) {
      setErro(null);
      startCarregamento(async () => {
        const r = await listarAlunosVinculados();
        if (r.erro) setErro(r.erro);
        else setAlunos(r.alunos);
      });
    }
  }

  function selecionar(id: string) {
    setAberto(false);
    if (id !== alunoAtualId) router.push(`/professor/alunos/${id}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="flex items-center gap-1 text-xl font-semibold text-black hover:text-primaria"
        title="Trocar de aluno"
      >
        {alunoAtualNome}
        <span className="text-sm text-terciaria">▾</span>
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setAberto(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-sm flex-col gap-3 rounded-lg bg-white p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-black">Trocar de aluno</h2>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="text-terciaria hover:text-black"
                title="Fechar"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-1 overflow-y-auto">
              {carregando && alunos === null && (
                <p className="text-sm text-terciaria">Carregando…</p>
              )}
              {erro && <p className="text-sm text-secundaria">{erro}</p>}
              {alunos?.length === 0 && (
                <p className="text-sm text-terciaria">Nenhum outro aluno vinculado.</p>
              )}
              {alunos?.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => selecionar(a.id)}
                  disabled={a.id === alunoAtualId}
                  className={
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm " +
                    (a.id === alunoAtualId
                      ? "bg-primaria/10 font-medium text-primaria"
                      : "text-black hover:bg-terciaria/10")
                  }
                >
                  <Avatar avatarUrl={a.avatar_url} nome={a.nome_completo} />
                  {a.nome_completo}
                  {a.id === alunoAtualId && <span className="ml-auto text-xs">atual</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
