-- lufichapole — foto de perfil (2026-07-10).

alter table perfis add column avatar_url text;
comment on column perfis.avatar_url is 'URL pública do avatar no bucket de storage "avatars". Opcional.';

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Cada usuário só sobe/atualiza/apaga dentro da própria "pasta" (nome do
-- arquivo prefixado pelo próprio id) — leitura é pública (é só uma foto de
-- perfil, não dado sensível).
-- "drop policy if exists" antes: storage.objects não é resetado entre
-- reaplicações da migration (não faz parte do schema public), então isso
-- precisa ser idempotente (ver scripts/test-db.sh).
drop policy if exists "avatars_select_publico" on storage.objects;
create policy "avatars_select_publico" on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_proprio" on storage.objects;
create policy "avatars_insert_proprio" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_update_proprio" on storage.objects;
create policy "avatars_update_proprio" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_delete_proprio" on storage.objects;
create policy "avatars_delete_proprio" on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
