-- Testa reiniciar_movimento_professor(): a partir de 2026-08-04, quem reinicia
-- voluntariamente um movimento aprovado é o PROFESSOR vinculado (antes era o
-- próprio aluno — reiniciar_movimento_aprovado ficou deprecated, execute
-- revogado, ver migration 0013).
begin;
select plan(5);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000033', 'professor-reinicio@teste.local',
    jsonb_build_object('persona', 'professor', 'nome_completo', 'Professor Reinício')),
  ('00000000-0000-0000-0000-000000000034', 'professor-outro-reinicio@teste.local',
    jsonb_build_object('persona', 'professor', 'nome_completo', 'Professor Outro Reinício'));

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000031', 'aluno-reinicio@teste.local',
    jsonb_build_object('persona', 'aluno', 'nome_completo', 'Aluna Reinício',
      'professor_id', '00000000-0000-0000-0000-000000000033'));

select id as movimento_1 into temp t_mov from movimentos order by id limit 1;
grant select on t_mov to authenticated;

-- Fixture: movimento já aprovado (bypassa o fluxo normal só pra montar o cenário do teste).
insert into aluno_movimento_status (aluno_id, movimento_id, status, sucessos_consecutivos, aprovado_em)
  select '00000000-0000-0000-0000-000000000031', movimento_1, 'aprovado', 4, now() from t_mov;

-- 1) Professor NÃO vinculado não consegue reiniciar.
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000034","role":"authenticated"}';

select throws_ok(
  $$ select reiniciar_movimento_professor(
       '00000000-0000-0000-0000-000000000031', (select movimento_1 from t_mov)
     ) $$,
  'Apenas o professor vinculado a este aluno pode reiniciar este movimento.',
  'professor NÃO vinculado não consegue reiniciar movimento do aluno'
);

reset role;
reset "request.jwt.claims";

select is(
  (select status::text from aluno_movimento_status s, t_mov where s.aluno_id = '00000000-0000-0000-0000-000000000031' and s.movimento_id = t_mov.movimento_1),
  'aprovado', 'e a linha continua aprovada (não foi afetada)'
);

-- 2) Professor vinculado reinicia com sucesso.
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000033","role":"authenticated"}';

select lives_ok(
  $$ select reiniciar_movimento_professor(
       '00000000-0000-0000-0000-000000000031', (select movimento_1 from t_mov)
     ) $$,
  'professor vinculado consegue reiniciar o movimento aprovado do aluno'
);

reset role;
reset "request.jwt.claims";

select is(
  (select status::text from aluno_movimento_status s, t_mov where s.aluno_id = '00000000-0000-0000-0000-000000000031' and s.movimento_id = t_mov.movimento_1),
  'em_andamento', 'volta a em_andamento'
);
select is(
  (select sucessos_consecutivos from aluno_movimento_status s, t_mov where s.aluno_id = '00000000-0000-0000-0000-000000000031' and s.movimento_id = t_mov.movimento_1),
  0, 'zera a sequência'
);

select * from finish();
rollback;
