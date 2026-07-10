-- Testa que um usuário não-admin não pode se autopromover trocando persona
-- ou professor_id via update direto na própria linha.
begin;
select plan(5);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000041', 'aluno-escalada@teste.local',
    jsonb_build_object('persona', 'aluno', 'nome_completo', 'Aluna Escalada')),
  ('00000000-0000-0000-0000-000000000042', 'professor-escalada@teste.local',
    jsonb_build_object('persona', 'professor', 'nome_completo', 'Professora Escalada')),
  ('00000000-0000-0000-0000-000000000043', 'admin-escalada@teste.local',
    jsonb_build_object('persona', 'admin', 'nome_completo', 'Admin Escalada'));

set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000041","role":"authenticated"}';

select throws_ok(
  $$ update perfis set persona = 'admin' where id = '00000000-0000-0000-0000-000000000041' $$,
  'Você não pode alterar sua própria persona.',
  'aluno não consegue se autopromover a admin'
);

select throws_ok(
  $$ update perfis set professor_id = '00000000-0000-0000-0000-000000000042' where id = '00000000-0000-0000-0000-000000000041' $$,
  'Só o Admin pode alterar o vínculo de professor.',
  'aluno não consegue trocar o próprio vínculo de professor'
);

select lives_ok(
  $$ update perfis set nome_completo = 'Aluna Escalada Editado' where id = '00000000-0000-0000-0000-000000000041' $$,
  'aluno ainda consegue editar o próprio nome normalmente'
);

reset role;
reset "request.jwt.claims";

select is(
  (select persona::text from perfis where id = '00000000-0000-0000-0000-000000000041'),
  'aluno', 'persona realmente não mudou'
);

-- admin continua podendo alterar (tela de gestão).
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000043","role":"authenticated"}';

select lives_ok(
  $$ update perfis set professor_id = '00000000-0000-0000-0000-000000000042' where id = '00000000-0000-0000-0000-000000000041' $$,
  'admin consegue vincular professor normalmente'
);

reset role;
reset "request.jwt.claims";

select * from finish();
rollback;
