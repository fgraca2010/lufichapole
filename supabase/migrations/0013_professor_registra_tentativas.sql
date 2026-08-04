-- lufichapole — Mudança de regra de negócio a pedido do owner (2026-08-04):
-- agora é o PROFESSOR (vinculado) quem registra as tentativas (sucesso/erro)
-- do aluno durante a aula, não mais o próprio aluno. O aluno passa a usar o
-- app só pra acompanhar (leitura: ficha, histórico, PDF) — não edita mais
-- nada. A regra de negócio em si (sequência de sucessos, aprovação em 2
-- passos, reprovar zera a contagem) não muda, só quem aciona.
--
-- registrar_tentativa_movimento() e avaliar_movimento() (0001_init.sql) não
-- precisam mudar — a lógica já opera em cima de aluno_id/movimento_id
-- passados pela chamada, independente de quem é o autor.

-- ===========================================================================
-- Auditoria: quem de fato registrou a tentativa (antes, sempre o próprio
-- aluno — agora pode ser o professor). Backfill honesto: tentativas já
-- existentes foram mesmo registradas pelo aluno da época, então
-- registrado_por = aluno_id pra elas; daqui pra frente, default = quem está
-- autenticado no momento do insert (o professor).
-- ===========================================================================
alter table tentativas_movimento add column registrado_por uuid references perfis (id);
update tentativas_movimento set registrado_por = aluno_id where registrado_por is null;
alter table tentativas_movimento alter column registrado_por set default auth.uid();
alter table tentativas_movimento alter column registrado_por set not null;

comment on column tentativas_movimento.registrado_por is
  'Quem clicou sucesso/erro — normalmente o professor vinculado (a partir de 2026-08-04); em tentativas antigas, o próprio aluno (backfill = aluno_id).';

-- ===========================================================================
-- RLS: troca o INSERT de "aluno registra a própria tentativa" para
-- "professor vinculado registra a tentativa do aluno dele".
-- ===========================================================================
drop policy if exists "tentativas_insert_aluno" on tentativas_movimento;
create policy "tentativas_insert_professor" on tentativas_movimento for insert to authenticated
  with check (
    (select minha_persona()) = 'professor'
    and aluno_id in (select id from perfis where professor_id = (select auth.uid()))
  );

-- ===========================================================================
-- "Recomeçar movimento aprovado": antes era ação voluntária do próprio
-- aluno (reiniciar_movimento_aprovado, 0006). Agora é o professor quem
-- decide reiniciar um movimento aprovado do aluno vinculado, com a mesma
-- semântica (perde o status, volta a em_andamento com contagem zerada).
-- A função antiga fica no histórico de migrations (nunca reescrevemos o
-- passado), mas revogamos o execute de authenticated — ninguém mais chama.
-- ===========================================================================
revoke execute on function reiniciar_movimento_aprovado(bigint) from authenticated;

comment on function reiniciar_movimento_aprovado is
  'DEPRECATED em 2026-08-04 (execute revogado) — ação de reiniciar passou a ser do professor vinculado, ver reiniciar_movimento_professor(uuid, bigint).';

create function reiniciar_movimento_professor(p_aluno_id uuid, p_movimento_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  vinculado boolean;
  status_atual status_movimento;
begin
  select (professor_id = auth.uid()) into vinculado from perfis where id = p_aluno_id;

  if vinculado is not true then
    raise exception 'Apenas o professor vinculado a este aluno pode reiniciar este movimento.';
  end if;

  select status into status_atual
  from aluno_movimento_status
  where aluno_id = p_aluno_id and movimento_id = p_movimento_id;

  if status_atual is distinct from 'aprovado' then
    raise exception 'Este movimento não está aprovado — não há o que reiniciar.';
  end if;

  update aluno_movimento_status
  set status = 'em_andamento',
      sucessos_consecutivos = 0,
      aprovado_em = null,
      avaliado_por = auth.uid(),
      pendente_desde = null
  where aluno_id = p_aluno_id and movimento_id = p_movimento_id;
end;
$$;

comment on function reiniciar_movimento_professor is 'Ação voluntária do professor vinculado: abre mão da aprovação de um movimento do aluno pra ele treinar de novo do zero. A UI deve avisar antes de chamar — é irreversível (perde o status).';

grant execute on function reiniciar_movimento_professor(uuid, bigint) to authenticated;
revoke execute on function reiniciar_movimento_professor(uuid, bigint) from public, anon;
