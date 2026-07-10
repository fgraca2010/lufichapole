-- Testes de estrutura (smoke tests): tabelas, RLS habilitado, seed carregado.
begin;
select plan(17);

select has_table('public', 'perfis', 'tabela perfis existe');
select has_table('public', 'niveis', 'tabela niveis existe');
select has_table('public', 'blocos', 'tabela blocos existe');
select has_table('public', 'movimentos', 'tabela movimentos existe');
select has_table('public', 'configuracao_sistema', 'tabela configuracao_sistema existe');
select has_table('public', 'tentativas_movimento', 'tabela tentativas_movimento existe');
select has_table('public', 'aluno_movimento_status', 'tabela aluno_movimento_status existe');

select ok((select relrowsecurity from pg_class where relname = 'perfis'), 'RLS ativo em perfis');
select ok((select relrowsecurity from pg_class where relname = 'niveis'), 'RLS ativo em niveis');
select ok((select relrowsecurity from pg_class where relname = 'blocos'), 'RLS ativo em blocos');
select ok((select relrowsecurity from pg_class where relname = 'movimentos'), 'RLS ativo em movimentos');
select ok((select relrowsecurity from pg_class where relname = 'configuracao_sistema'), 'RLS ativo em configuracao_sistema');
select ok((select relrowsecurity from pg_class where relname = 'tentativas_movimento'), 'RLS ativo em tentativas_movimento');
select ok((select relrowsecurity from pg_class where relname = 'aluno_movimento_status'), 'RLS ativo em aluno_movimento_status');

-- Seed (Fase 2 -> movimentos.json) carregado corretamente.
select is((select count(*)::int from niveis), 3, 'seed: 3 níveis');
select is((select count(*)::int from blocos), 47, 'seed: 47 blocos');
select is((select count(*)::int from movimentos), 588, 'seed: 588 movimentos');

select * from finish();
rollback;
