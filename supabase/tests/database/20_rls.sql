-- Testes de RLS: cada persona só vê/edita o que a regra de negócio permite.
begin;
select plan(9);

-- ------------------------------------------------------------------------
-- Fixtures (como postgres, bypassa RLS)
-- ------------------------------------------------------------------------
-- perfis é criado automaticamente pelo trigger handle_new_user() a partir da metadata.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000013', 'professor-vinculado@teste.local',
    jsonb_build_object('persona', 'professor', 'nome_completo', 'Professora Vinculada')),
  ('00000000-0000-0000-0000-000000000014', 'professor-outro@teste.local',
    jsonb_build_object('persona', 'professor', 'nome_completo', 'Professora Outra')),
  ('00000000-0000-0000-0000-000000000015', 'admin@teste.local',
    jsonb_build_object('persona', 'admin', 'nome_completo', 'Admin'));

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000011', 'aluno-a@teste.local',
    jsonb_build_object('persona', 'aluno', 'nome_completo', 'Aluna A',
      'professor_id', '00000000-0000-0000-0000-000000000013')),
  ('00000000-0000-0000-0000-000000000012', 'aluno-b@teste.local',
    jsonb_build_object('persona', 'aluno', 'nome_completo', 'Aluna B'));

select id as movimento_1 into temp t_mov from movimentos order by id limit 1;
grant select on t_mov to authenticated;

-- ------------------------------------------------------------------------
-- perfis: aluno só vê o próprio
-- ------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000011","role":"authenticated"}';

select is(
  (select count(*)::int from perfis where id = '00000000-0000-0000-0000-000000000012'),
  0, 'aluno A não vê o perfil do aluno B'
);
select is(
  (select count(*)::int from perfis where id = '00000000-0000-0000-0000-000000000011'),
  1, 'aluno A vê o próprio perfil'
);

reset role;
reset "request.jwt.claims";

-- ------------------------------------------------------------------------
-- perfis: professor vinculado vê o aluno; professor não vinculado não vê
-- ------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000013","role":"authenticated"}';

select is(
  (select count(*)::int from perfis where id = '00000000-0000-0000-0000-000000000011'),
  1, 'professor vinculado vê o perfil da aluna A'
);

reset role;
reset "request.jwt.claims";

set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000014","role":"authenticated"}';

select is(
  (select count(*)::int from perfis where id = '00000000-0000-0000-0000-000000000011'),
  0, 'professor NÃO vinculado não vê o perfil da aluna A'
);

reset role;
reset "request.jwt.claims";

-- ------------------------------------------------------------------------
-- perfis: admin vê todos
-- ------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000015","role":"authenticated"}';

select is(
  (select count(*)::int from perfis),
  5, 'admin vê todos os perfis'
);

reset role;
reset "request.jwt.claims";

-- ------------------------------------------------------------------------
-- tentativas_movimento: aluno só insere pra si mesmo
-- ------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000011","role":"authenticated"}';

select throws_like(
  $$ insert into tentativas_movimento (aluno_id, movimento_id, resultado)
     select '00000000-0000-0000-0000-000000000012', movimento_1, 'sucesso' from t_mov $$,
  '%',
  'aluno A não pode registrar tentativa em nome do aluno B'
);

select lives_ok(
  $$ insert into tentativas_movimento (aluno_id, movimento_id, resultado)
     select '00000000-0000-0000-0000-000000000011', movimento_1, 'sucesso' from t_mov $$,
  'aluno A pode registrar a própria tentativa'
);

reset role;
reset "request.jwt.claims";

-- ------------------------------------------------------------------------
-- tentativas_movimento: professor vinculado lê; professor não vinculado não lê
-- ------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000013","role":"authenticated"}';

select is(
  (select count(*)::int from tentativas_movimento where aluno_id = '00000000-0000-0000-0000-000000000011'),
  1, 'professor vinculado lê a tentativa da aluna A'
);

reset role;
reset "request.jwt.claims";

set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000014","role":"authenticated"}';

select is(
  (select count(*)::int from tentativas_movimento where aluno_id = '00000000-0000-0000-0000-000000000011'),
  0, 'professor NÃO vinculado não lê a tentativa da aluna A'
);

reset role;
reset "request.jwt.claims";

select * from finish();
rollback;
