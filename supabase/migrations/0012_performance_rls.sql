-- lufichapole — Performance Advisor: RLS re-avaliando auth.*()/funções por
-- linha em vez de uma vez por query, e policies permissivas redundantes.
--
-- Duas técnicas, sem mudar NENHUM comportamento de acesso (só eficiência):
-- 1) `to authenticated` explícito em toda policy — antes elas valiam pra
--    qualquer role (anon, authenticator, dashboard_user...) mesmo que a
--    condição sempre desse falso pra eles; agora nem são avaliadas.
-- 2) `(select auth.uid())` / `(select minha_persona())` em vez de chamar
--    direto — permite o Postgres tratar como initplan (avalia 1x por query,
--    não 1x por linha). Ver https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ===========================================================================
-- perfis: junta as 2 policies de SELECT em 1, e as 2 de UPDATE em 1
-- (eram permissivas e redundantes pra quem já caía nas duas).
-- ===========================================================================
drop policy if exists "perfis_select" on perfis;
drop policy if exists "perfis_select_professor_do_aluno" on perfis;
create policy "perfis_select" on perfis for select to authenticated
  using (
    id = (select auth.uid())
    or professor_id = (select auth.uid())
    or id = meu_professor_id()
    or (select minha_persona()) = 'admin'
  );

drop policy if exists "perfis_update_proprio" on perfis;
drop policy if exists "perfis_update_admin" on perfis;
create policy "perfis_update" on perfis for update to authenticated
  using (id = (select auth.uid()) or (select minha_persona()) = 'admin');

drop policy if exists "perfis_insert_admin" on perfis;
create policy "perfis_insert_admin" on perfis for insert to authenticated
  with check ((select minha_persona()) = 'admin');

-- ===========================================================================
-- niveis/blocos/movimentos: leitura de "authenticated" não precisa nem
-- chamar auth.role() — o próprio "to authenticated" já garante isso, sem
-- nenhuma condição por linha. E separa a escrita do admin do "for all" (que
-- incluía select e duplicava com a policy de leitura).
-- ===========================================================================
drop policy if exists "conteudo_select" on niveis;
create policy "niveis_select" on niveis for select to authenticated using (true);
drop policy if exists "conteudo_admin" on niveis;
create policy "niveis_admin_insert" on niveis for insert to authenticated with check ((select minha_persona()) = 'admin');
create policy "niveis_admin_update" on niveis for update to authenticated using ((select minha_persona()) = 'admin');
create policy "niveis_admin_delete" on niveis for delete to authenticated using ((select minha_persona()) = 'admin');

drop policy if exists "blocos_select" on blocos;
create policy "blocos_select" on blocos for select to authenticated using (true);
drop policy if exists "blocos_admin" on blocos;
create policy "blocos_admin_insert" on blocos for insert to authenticated with check ((select minha_persona()) = 'admin');
create policy "blocos_admin_update" on blocos for update to authenticated using ((select minha_persona()) = 'admin');
create policy "blocos_admin_delete" on blocos for delete to authenticated using ((select minha_persona()) = 'admin');

drop policy if exists "movimentos_select" on movimentos;
create policy "movimentos_select" on movimentos for select to authenticated using (true);
drop policy if exists "movimentos_admin" on movimentos;
create policy "movimentos_admin_insert" on movimentos for insert to authenticated with check ((select minha_persona()) = 'admin');
create policy "movimentos_admin_update" on movimentos for update to authenticated using ((select minha_persona()) = 'admin');
create policy "movimentos_admin_delete" on movimentos for delete to authenticated using ((select minha_persona()) = 'admin');

-- ===========================================================================
-- configuracao_sistema
-- ===========================================================================
drop policy if exists "config_select" on configuracao_sistema;
create policy "config_select" on configuracao_sistema for select to authenticated using (true);
drop policy if exists "config_update_admin" on configuracao_sistema;
create policy "config_update_admin" on configuracao_sistema for update to authenticated
  using ((select minha_persona()) = 'admin');

-- ===========================================================================
-- tentativas_movimento
-- ===========================================================================
drop policy if exists "tentativas_insert_aluno" on tentativas_movimento;
create policy "tentativas_insert_aluno" on tentativas_movimento for insert to authenticated
  with check (aluno_id = (select auth.uid()) and (select minha_persona()) = 'aluno');

drop policy if exists "tentativas_select" on tentativas_movimento;
create policy "tentativas_select" on tentativas_movimento for select to authenticated
  using (
    aluno_id = (select auth.uid())
    or aluno_id in (select id from perfis where professor_id = (select auth.uid()))
    or (select minha_persona()) = 'admin'
  );

-- ===========================================================================
-- aluno_movimento_status
-- ===========================================================================
drop policy if exists "status_select" on aluno_movimento_status;
create policy "status_select" on aluno_movimento_status for select to authenticated
  using (
    aluno_id = (select auth.uid())
    or aluno_id in (select id from perfis where professor_id = (select auth.uid()))
    or (select minha_persona()) = 'admin'
  );

-- ===========================================================================
-- storage.avatars: reduz exposição (Advisor "Public Bucket Allows Listing").
-- A leitura da foto em si (via getPublicUrl) passa pelo endpoint público do
-- Storage e não depende desta policy — isso só afeta quem pode LISTAR todos
-- os arquivos do bucket via API. Tira o anon (não autenticado) da equação;
-- listar continua possível só pra quem já está logado.
-- ===========================================================================
drop policy if exists "avatars_select_publico" on storage.objects;
drop policy if exists "avatars_select_autenticado" on storage.objects;
create policy "avatars_select_autenticado" on storage.objects for select to authenticated
  using (bucket_id = 'avatars');

-- As de escrita (insert/update/delete) da migration 0005 nunca tinham "to
-- authenticated" — valiam pra qualquer role. Restringe também.
drop policy if exists "avatars_insert_proprio" on storage.objects;
create policy "avatars_insert_proprio" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "avatars_update_proprio" on storage.objects;
create policy "avatars_update_proprio" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "avatars_delete_proprio" on storage.objects;
create policy "avatars_delete_proprio" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
