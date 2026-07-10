-- lufichapole — correção real do achado do Security Advisor.
--
-- A migration 0009 revogou EXECUTE de PUBLIC, mas isso não bastava: o
-- Supabase configura ALTER DEFAULT PRIVILEGES no schema public que dá GRANT
-- EXECUTE direto pros roles `anon` e `authenticated` em toda função nova —
-- um grant explícito, separado do PUBLIC, que o REVOKE anterior não tocava.
-- Confirmado via pg_proc.proacl que `anon` ainda tinha EXECUTE em tudo.

-- Funções que só existem pra rodar como trigger (nunca chamadas via RPC/API
-- por usuário nenhum) — não precisam de EXECUTE pra ninguém alem do dono.
revoke execute on function handle_new_user() from anon, authenticated;
revoke execute on function recalcular_aprovacoes_apos_config() from anon, authenticated;
revoke execute on function registrar_tentativa_movimento() from anon, authenticated;
revoke execute on function proteger_persona_e_vinculo() from anon, authenticated;

-- Funções auxiliares de RLS — usadas dentro de policies avaliadas como
-- "authenticated" (mantém esse grant), mas não fazem sentido pra anônimo.
revoke execute on function minha_persona() from anon;
revoke execute on function meu_professor_id() from anon;

-- Funções de RPC de negócio — só usuário autenticado deve poder chamar
-- (a checagem interna via auth.uid() já rejeita quem não tem permissão, mas
-- não faz sentido nem deixar um anônimo tentar).
revoke execute on function avaliar_movimento(uuid, bigint, boolean) from anon;
revoke execute on function resumo_aluno(uuid) from anon;
revoke execute on function reiniciar_movimento_aprovado(bigint) from anon;
