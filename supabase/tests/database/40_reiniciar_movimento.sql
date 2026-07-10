-- Testa reiniciar_movimento_aprovado(): reset voluntário de aprovação.
begin;
select plan(5);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000031', 'aluno-reinicio@teste.local',
    jsonb_build_object('persona', 'aluno', 'nome_completo', 'Aluna Reinício')),
  ('00000000-0000-0000-0000-000000000032', 'outro-aluno-reinicio@teste.local',
    jsonb_build_object('persona', 'aluno', 'nome_completo', 'Outra Aluna'));

select id as movimento_1 into temp t_mov from movimentos order by id limit 1;
grant select on t_mov to authenticated;

-- Fixture: movimento já aprovado (bypassa o fluxo normal só pra montar o cenário do teste).
insert into aluno_movimento_status (aluno_id, movimento_id, status, sucessos_consecutivos, aprovado_em)
  select '00000000-0000-0000-0000-000000000031', movimento_1, 'aprovado', 4, now() from t_mov;

-- 1) Não é o dono: não reinicia nada (não afeta a linha de outro aluno).
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000032","role":"authenticated"}';

select throws_ok(
  $$ select reiniciar_movimento_aprovado((select movimento_1 from t_mov)) $$,
  'Este movimento não está aprovado — não há o que reiniciar.',
  'outro aluno não consegue reiniciar movimento que não é dele'
);

reset role;
reset "request.jwt.claims";

select is(
  (select status::text from aluno_movimento_status s, t_mov where s.aluno_id = '00000000-0000-0000-0000-000000000031' and s.movimento_id = t_mov.movimento_1),
  'aprovado', 'e a linha do dono continua aprovada (não foi afetada)'
);

-- 2) O dono reinicia com sucesso.
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000031","role":"authenticated"}';

select lives_ok(
  $$ select reiniciar_movimento_aprovado((select movimento_1 from t_mov)) $$,
  'dono consegue reiniciar o próprio movimento aprovado'
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
