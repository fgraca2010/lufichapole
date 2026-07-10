-- lufichapole — aluno pode reiniciar voluntariamente um movimento já
-- aprovado, perdendo o status (2026-07-10). Diferente do fluxo automático de
-- tentativas (que nunca reverte "aprovado" — essa é uma ação deliberada e
-- explícita do próprio aluno, com aviso na UI antes de confirmar).

create function reiniciar_movimento_aprovado(p_movimento_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  status_atual status_movimento;
begin
  select status into status_atual
  from aluno_movimento_status
  where aluno_id = auth.uid() and movimento_id = p_movimento_id;

  if status_atual is distinct from 'aprovado' then
    raise exception 'Este movimento não está aprovado — não há o que reiniciar.';
  end if;

  update aluno_movimento_status
  set status = 'em_andamento',
      sucessos_consecutivos = 0,
      aprovado_em = null,
      pendente_desde = null
  where aluno_id = auth.uid() and movimento_id = p_movimento_id;
end;
$$;

grant execute on function reiniciar_movimento_aprovado(bigint) to authenticated;

comment on function reiniciar_movimento_aprovado is 'Ação voluntária do aluno: abre mão da aprovação de um movimento pra treinar de novo do zero. A UI deve avisar antes de chamar — é irreversível (perde o status).';
