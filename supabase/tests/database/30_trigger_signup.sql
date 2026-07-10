-- Testa o trigger handle_new_user(): criação automática de perfis no signup.
begin;
select plan(4);

-- 1) Signup "organico" (sem metadata de persona) -> vira aluno, sem professor.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000021', 'organico@teste.local', '{"full_name":"Fulano Orgânico"}'::jsonb);

select is(
  (select persona::text from perfis where id = '00000000-0000-0000-0000-000000000021'),
  'aluno', 'signup orgânico vira persona aluno por padrão'
);
select is(
  (select nome_completo from perfis where id = '00000000-0000-0000-0000-000000000021'),
  'Fulano Orgânico', 'nome_completo lido de full_name (metadata do OAuth)'
);

-- 2) Convite do Admin (metadata completa) -> persona e vínculo corretos.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000022', 'professor-convidado@teste.local',
    jsonb_build_object('persona', 'professor', 'nome_completo', 'Professora Convidada'));

insert into auth.users (id, email, raw_user_meta_data) values (
  '00000000-0000-0000-0000-000000000023',
  'aluno-convidado@teste.local',
  jsonb_build_object(
    'persona', 'aluno',
    'nome_completo', 'Aluna Convidada',
    'professor_id', '00000000-0000-0000-0000-000000000022'
  )
);

select is(
  (select nome_completo from perfis where id = '00000000-0000-0000-0000-000000000023'),
  'Aluna Convidada', 'convite do admin: nome_completo da metadata explícita'
);
select is(
  (select professor_id from perfis where id = '00000000-0000-0000-0000-000000000023'),
  '00000000-0000-0000-0000-000000000022'::uuid, 'convite do admin: professor_id vinculado corretamente'
);

select * from finish();
rollback;
