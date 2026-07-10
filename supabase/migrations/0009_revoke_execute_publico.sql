-- lufichapole — Security Advisor: "Public Can Execute SECURITY DEFINER Function".
--
-- Postgres, por padrão, dá EXECUTE pra "public" (inclui o role anon, ou seja,
-- qualquer requisição não autenticada) em toda função nova, a menos que seja
-- revogado explicitamente. Nossas funções SECURITY DEFINER já tinham GRANT
-- explícito pra "authenticated" onde fazia sentido, mas nunca revogamos o
-- acesso de PUBLIC — então ficavam com os dois ao mesmo tempo.

revoke execute on function minha_persona() from public;
revoke execute on function meu_professor_id() from public;
revoke execute on function avaliar_movimento(uuid, bigint, boolean) from public;
revoke execute on function resumo_aluno(uuid) from public;
revoke execute on function reiniciar_movimento_aprovado(bigint) from public;
revoke execute on function handle_new_user() from public;
revoke execute on function recalcular_aprovacoes_apos_config() from public;
revoke execute on function registrar_tentativa_movimento() from public;

-- handle_new_user(), recalcular_aprovacoes_apos_config() e
-- registrar_tentativa_movimento() só são chamadas pelo próprio mecanismo de
-- trigger do Postgres (que roda com o dono da função, independente de GRANT
-- de EXECUTE) — não precisam de nenhum grant pra "authenticated" depois disso.

-- meu_professor_id() é usada dentro de uma policy de RLS avaliada como o role
-- "authenticated" — precisa continuar executável por ele (as outras funções
-- de RPC já tinham esse grant explícito desde que foram criadas).
grant execute on function meu_professor_id() to authenticated;

-- Endurecimento extra encontrado nesta revisão: em resumo_aluno(), se
-- p_aluno_id fosse NULL, a checagem de permissão (usando "if not (...)")
-- avaliava como NULL em vez de TRUE/FALSE, e o PL/pgSQL trata "if null" como
-- falso — ou seja, a exceção não era disparada. O resultado nesse caso
-- específico não expunha dado real (todas as métricas voltavam zeradas, por
-- não existir nenhum aluno com id NULL), mas o padrão está errado e merece
-- correção defensiva.
create or replace function resumo_aluno(p_aluno_id uuid default auth.uid())
returns table (
  treinos bigint,
  exercicios_completos bigint,
  exercicios_pendentes_avaliacao bigint,
  blocos_completos bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not coalesce(
    p_aluno_id = auth.uid()
    or exists (select 1 from perfis where id = p_aluno_id and professor_id = auth.uid())
    or minha_persona() = 'admin',
    false
  ) then
    raise exception 'Sem permissão para ver o resumo deste aluno.';
  end if;

  return query
  select
    (select count(distinct date_trunc('day', registrado_em))
       from tentativas_movimento where aluno_id = p_aluno_id) as treinos,
    (select count(*) from aluno_movimento_status
       where aluno_id = p_aluno_id and status = 'aprovado') as exercicios_completos,
    (select count(*) from aluno_movimento_status
       where aluno_id = p_aluno_id and status = 'pendente_avaliacao') as exercicios_pendentes_avaliacao,
    (select count(*) from blocos b
       where b.id in (select bloco_id from movimentos where ativo)
         and not exists (
           select 1 from movimentos m
           where m.bloco_id = b.id and m.ativo
             and not exists (
               select 1 from aluno_movimento_status s
               where s.aluno_id = p_aluno_id and s.movimento_id = m.id and s.status = 'aprovado'
             )
         )
    ) as blocos_completos;
end;
$$;

grant execute on function resumo_aluno(uuid) to authenticated;
