-- Testes funcionais/regressão: trigger de tentativas, avaliação do professor,
-- recálculo de config e resumo gamificado. Ver vault/_index.md e
-- docs/adr/0001-schema-inicial.md para as regras de negócio testadas aqui.
begin;
select plan(24);

-- ------------------------------------------------------------------------
-- Fixtures (como postgres, bypassa RLS)
-- ------------------------------------------------------------------------
-- perfis é criado automaticamente pelo trigger handle_new_user() a partir da metadata.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000002', 'professor1@teste.local',
    jsonb_build_object('persona', 'professor', 'nome_completo', 'Professora 1')),
  ('00000000-0000-0000-0000-000000000003', 'professor2@teste.local',
    jsonb_build_object('persona', 'professor', 'nome_completo', 'Professora 2'));

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000001', 'aluno1@teste.local',
    jsonb_build_object('persona', 'aluno', 'nome_completo', 'Aluna 1',
      'professor_id', '00000000-0000-0000-0000-000000000002'));

update configuracao_sistema set sucessos_necessarios = 3 where id = 1;

-- Dois movimentos do mesmo bloco (Nível 1 / Bloco 1), pra também testar "bloco completo".
select m.id as movimento_1 into temp t_mov1 from movimentos m
  join blocos b on b.id = m.bloco_id join niveis n on n.id = b.nivel_id
  where n.numero = 1 and b.numero = 1 order by m.id limit 1;

select m.id as movimento_2 into temp t_mov2 from movimentos m
  join blocos b on b.id = m.bloco_id join niveis n on n.id = b.nivel_id
  where n.numero = 1 and b.numero = 1 order by m.id offset 1 limit 1;

-- Necessário pra role "authenticated" (usada nos blocos "set local role" abaixo)
-- conseguir ler essas tabelas temporárias de fixture.
grant select on t_mov1 to authenticated;
grant select on t_mov2 to authenticated;

-- ------------------------------------------------------------------------
-- 1) Sucessos abaixo do necessário: fica em_andamento
-- ------------------------------------------------------------------------
insert into tentativas_movimento (aluno_id, movimento_id, resultado)
  select '00000000-0000-0000-0000-000000000001', movimento_1, 'sucesso' from t_mov1;
insert into tentativas_movimento (aluno_id, movimento_id, resultado)
  select '00000000-0000-0000-0000-000000000001', movimento_1, 'sucesso' from t_mov1;

select is(
  (select status::text from aluno_movimento_status s, t_mov1 where s.aluno_id = '00000000-0000-0000-0000-000000000001' and s.movimento_id = t_mov1.movimento_1),
  'em_andamento', '2 sucessos (necessário 3): ainda em_andamento'
);
select is(
  (select sucessos_consecutivos from aluno_movimento_status s, t_mov1 where s.aluno_id = '00000000-0000-0000-0000-000000000001' and s.movimento_id = t_mov1.movimento_1),
  2, '2 sucessos consecutivos registrados'
);

-- ------------------------------------------------------------------------
-- 2) Erro zera a sequência
-- ------------------------------------------------------------------------
insert into tentativas_movimento (aluno_id, movimento_id, resultado)
  select '00000000-0000-0000-0000-000000000001', movimento_1, 'erro' from t_mov1;

select is(
  (select sucessos_consecutivos from aluno_movimento_status s, t_mov1 where s.aluno_id = '00000000-0000-0000-0000-000000000001' and s.movimento_id = t_mov1.movimento_1),
  0, 'erro zera a sequência de sucessos'
);

-- ------------------------------------------------------------------------
-- 3) Bate a sequência necessária -> pendente_avaliacao (não aprova direto)
-- ------------------------------------------------------------------------
insert into tentativas_movimento (aluno_id, movimento_id, resultado)
  select '00000000-0000-0000-0000-000000000001', movimento_1, 'sucesso' from t_mov1;
insert into tentativas_movimento (aluno_id, movimento_id, resultado)
  select '00000000-0000-0000-0000-000000000001', movimento_1, 'sucesso' from t_mov1;
insert into tentativas_movimento (aluno_id, movimento_id, resultado)
  select '00000000-0000-0000-0000-000000000001', movimento_1, 'sucesso' from t_mov1;

select is(
  (select status::text from aluno_movimento_status s, t_mov1 where s.aluno_id = '00000000-0000-0000-0000-000000000001' and s.movimento_id = t_mov1.movimento_1),
  'pendente_avaliacao', '3 sucessos consecutivos (necessário 3): pendente_avaliacao, NÃO aprovado automaticamente'
);

-- ------------------------------------------------------------------------
-- 4) Aluno continua registrando mesmo com avaliação pendente
-- ------------------------------------------------------------------------
insert into tentativas_movimento (aluno_id, movimento_id, resultado)
  select '00000000-0000-0000-0000-000000000001', movimento_1, 'sucesso' from t_mov1;

select is(
  (select sucessos_consecutivos from aluno_movimento_status s, t_mov1 where s.aluno_id = '00000000-0000-0000-0000-000000000001' and s.movimento_id = t_mov1.movimento_1),
  4, 'aluno continua acumulando sucessos mesmo com avaliação pendente'
);
select is(
  (select status::text from aluno_movimento_status s, t_mov1 where s.aluno_id = '00000000-0000-0000-0000-000000000001' and s.movimento_id = t_mov1.movimento_1),
  'pendente_avaliacao', 'continua pendente_avaliacao (não voltou a aprovar de novo)'
);

-- ------------------------------------------------------------------------
-- 5) Erro durante avaliação pendente: zera e volta a em_andamento
-- ------------------------------------------------------------------------
insert into tentativas_movimento (aluno_id, movimento_id, resultado)
  select '00000000-0000-0000-0000-000000000001', movimento_1, 'erro' from t_mov1;

select is(
  (select status::text from aluno_movimento_status s, t_mov1 where s.aluno_id = '00000000-0000-0000-0000-000000000001' and s.movimento_id = t_mov1.movimento_1),
  'em_andamento', 'erro durante avaliação pendente volta pra em_andamento'
);
select is(
  (select sucessos_consecutivos from aluno_movimento_status s, t_mov1 where s.aluno_id = '00000000-0000-0000-0000-000000000001' and s.movimento_id = t_mov1.movimento_1),
  0, 'e zera a sequência'
);

-- ------------------------------------------------------------------------
-- 6) Bate a sequência de novo, pra testar avaliar_movimento()
-- ------------------------------------------------------------------------
insert into tentativas_movimento (aluno_id, movimento_id, resultado)
  select '00000000-0000-0000-0000-000000000001', movimento_1, 'sucesso' from t_mov1;
insert into tentativas_movimento (aluno_id, movimento_id, resultado)
  select '00000000-0000-0000-0000-000000000001', movimento_1, 'sucesso' from t_mov1;
insert into tentativas_movimento (aluno_id, movimento_id, resultado)
  select '00000000-0000-0000-0000-000000000001', movimento_1, 'sucesso' from t_mov1;

select is(
  (select status::text from aluno_movimento_status s, t_mov1 where s.aluno_id = '00000000-0000-0000-0000-000000000001' and s.movimento_id = t_mov1.movimento_1),
  'pendente_avaliacao', 'pendente de avaliação de novo, pronto pra testar avaliar_movimento()'
);

-- ------------------------------------------------------------------------
-- 7) Professor NÃO vinculado não pode avaliar
-- ------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000003","role":"authenticated"}';

select throws_ok(
  $$ select avaliar_movimento('00000000-0000-0000-0000-000000000001', (select movimento_1 from t_mov1), true) $$,
  'Apenas o professor vinculado a este aluno pode avaliar este movimento.',
  'professor não vinculado não pode avaliar'
);

reset role;
reset "request.jwt.claims";

-- ------------------------------------------------------------------------
-- 8) Professor vinculado manda treinar de novo -> zera e volta a em_andamento
-- ------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}';

select lives_ok(
  $$ select avaliar_movimento('00000000-0000-0000-0000-000000000001', (select movimento_1 from t_mov1), false) $$,
  'professor vinculado pode avaliar (reprovar)'
);

reset role;
reset "request.jwt.claims";

select is(
  (select status::text from aluno_movimento_status s, t_mov1 where s.aluno_id = '00000000-0000-0000-0000-000000000001' and s.movimento_id = t_mov1.movimento_1),
  'em_andamento', 'reprovado pelo professor: volta a em_andamento'
);
select is(
  (select sucessos_consecutivos from aluno_movimento_status s, t_mov1 where s.aluno_id = '00000000-0000-0000-0000-000000000001' and s.movimento_id = t_mov1.movimento_1),
  0, 'reprovado pelo professor: zera a sequência'
);
select is(
  (select avaliado_por from aluno_movimento_status s, t_mov1 where s.aluno_id = '00000000-0000-0000-0000-000000000001' and s.movimento_id = t_mov1.movimento_1),
  '00000000-0000-0000-0000-000000000002'::uuid, 'registra quem avaliou'
);

-- ------------------------------------------------------------------------
-- 9) Bate a sequência de novo e professor CONFIRMA -> aprovado (definitivo)
-- ------------------------------------------------------------------------
insert into tentativas_movimento (aluno_id, movimento_id, resultado)
  select '00000000-0000-0000-0000-000000000001', movimento_1, 'sucesso' from t_mov1;
insert into tentativas_movimento (aluno_id, movimento_id, resultado)
  select '00000000-0000-0000-0000-000000000001', movimento_1, 'sucesso' from t_mov1;
insert into tentativas_movimento (aluno_id, movimento_id, resultado)
  select '00000000-0000-0000-0000-000000000001', movimento_1, 'sucesso' from t_mov1;

set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}';

select lives_ok(
  $$ select avaliar_movimento('00000000-0000-0000-0000-000000000001', (select movimento_1 from t_mov1), true) $$,
  'professor vinculado pode confirmar aprovação'
);

reset role;
reset "request.jwt.claims";

select is(
  (select status::text from aluno_movimento_status s, t_mov1 where s.aluno_id = '00000000-0000-0000-0000-000000000001' and s.movimento_id = t_mov1.movimento_1),
  'aprovado', 'professor confirmou: status aprovado'
);
select isnt(
  (select aprovado_em from aluno_movimento_status s, t_mov1 where s.aluno_id = '00000000-0000-0000-0000-000000000001' and s.movimento_id = t_mov1.movimento_1),
  null, 'aprovado_em preenchido'
);

-- ------------------------------------------------------------------------
-- 10) Sticky: aprovado nunca reverte, mesmo com erro novo
-- ------------------------------------------------------------------------
insert into tentativas_movimento (aluno_id, movimento_id, resultado)
  select '00000000-0000-0000-0000-000000000001', movimento_1, 'erro' from t_mov1;

select is(
  (select status::text from aluno_movimento_status s, t_mov1 where s.aluno_id = '00000000-0000-0000-0000-000000000001' and s.movimento_id = t_mov1.movimento_1),
  'aprovado', 'aprovado é definitivo: erro posterior não reverte'
);

-- ------------------------------------------------------------------------
-- 11) Não dá pra avaliar de novo algo que já foi decidido (não está pendente)
-- ------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}';

select throws_ok(
  $$ select avaliar_movimento('00000000-0000-0000-0000-000000000001', (select movimento_1 from t_mov1), true) $$,
  'Este movimento não está com avaliação pendente.',
  'não é possível avaliar movimento que não está pendente'
);

reset role;
reset "request.jwt.claims";

-- ------------------------------------------------------------------------
-- 12) Diminuir a quantidade necessária manda pendentes elegíveis pra avaliação
-- ------------------------------------------------------------------------
insert into tentativas_movimento (aluno_id, movimento_id, resultado)
  select '00000000-0000-0000-0000-000000000001', movimento_2, 'sucesso' from t_mov2;
insert into tentativas_movimento (aluno_id, movimento_id, resultado)
  select '00000000-0000-0000-0000-000000000001', movimento_2, 'sucesso' from t_mov2;

select is(
  (select status::text from aluno_movimento_status s, t_mov2 where s.aluno_id = '00000000-0000-0000-0000-000000000001' and s.movimento_id = t_mov2.movimento_2),
  'em_andamento', 'movimento_2 com 2 sucessos (necessário 3): em_andamento'
);

update configuracao_sistema set sucessos_necessarios = 2 where id = 1;

select is(
  (select status::text from aluno_movimento_status s, t_mov2 where s.aluno_id = '00000000-0000-0000-0000-000000000001' and s.movimento_id = t_mov2.movimento_2),
  'pendente_avaliacao', 'baixar o necessário pra 2 manda pra avaliação quem já tinha 2 sucessos'
);

-- ------------------------------------------------------------------------
-- 13) resumo_aluno(): treinos, completos e pendentes
-- ------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is(
  (select exercicios_completos from resumo_aluno()),
  1::bigint, 'resumo_aluno: 1 exercício completo (movimento_1)'
);
select is(
  (select exercicios_pendentes_avaliacao from resumo_aluno()),
  1::bigint, 'resumo_aluno: 1 exercício pendente de avaliação (movimento_2)'
);
select is(
  (select treinos from resumo_aluno()),
  1::bigint, 'resumo_aluno: 1 treino (todas as tentativas no mesmo dia, neste teste)'
);

reset role;
reset "request.jwt.claims";

select * from finish();
rollback;
