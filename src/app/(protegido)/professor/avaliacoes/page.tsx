import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AvaliacaoItem } from "../AvaliacaoItem";

export default async function ProfessorAvaliacoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("persona")
    .eq("id", user.id)
    .single();
  if (perfil?.persona !== "professor") redirect(`/${perfil?.persona ?? ""}`);

  const { data: alunos } = await supabase
    .from("perfis")
    .select("id, nome_completo")
    .eq("professor_id", user.id);

  const alunoIds = (alunos ?? []).map((a) => a.id);
  const nomesPorId = new Map((alunos ?? []).map((a) => [a.id, a.nome_completo]));

  const { data: pendentes } = alunoIds.length
    ? await supabase
        .from("aluno_movimento_status")
        .select(
          "aluno_id, movimento_id, movimentos(nome, categoria, blocos(numero, niveis(numero)))"
        )
        .in("aluno_id", alunoIds)
        .eq("status", "pendente_avaliacao")
    : { data: [] };

  type Linha = {
    aluno_id: string;
    movimento_id: number;
    movimentos: {
      nome: string;
      categoria: string | null;
      blocos: { numero: number; niveis: { numero: number } | null } | null;
    } | null;
  };

  return (
    <div className="flex flex-1 flex-col gap-4 px-6 py-8">
      <h1 className="text-xl font-semibold text-black">Fila de avaliação</h1>
      <p className="text-sm text-terciaria">
        Esses alunos já bateram a sequência de sucessos e estão esperando você
        confirmar o movimento (feito fora do app) ou mandar treinar de novo.
      </p>

      {(pendentes ?? []).length === 0 && (
        <p className="text-sm text-terciaria">Nenhuma avaliação pendente 🎉</p>
      )}

      {((pendentes ?? []) as unknown as Linha[]).map((linha) => (
        <AvaliacaoItem
          key={`${linha.aluno_id}-${linha.movimento_id}`}
          alunoId={linha.aluno_id}
          alunoNome={nomesPorId.get(linha.aluno_id) ?? "?"}
          movimentoId={linha.movimento_id}
          movimentoNome={linha.movimentos?.nome ?? "?"}
          categoria={linha.movimentos?.categoria ?? null}
          nivelNumero={linha.movimentos?.blocos?.niveis?.numero ?? null}
          blocoNumero={linha.movimentos?.blocos?.numero ?? null}
        />
      ))}
    </div>
  );
}
