-- lufichapole — cria perfis automaticamente quando um usuário aparece em auth.users.
--
-- Dois fluxos cobertos:
-- 1) Admin convida (supabase.auth.admin.inviteUserByEmail / createUser, service_role,
--    só no servidor) passando metadata: { persona, nome_completo, professor_id }.
--    O perfil já nasce corretamente vinculado.
-- 2) Alguém loga direto (email/senha via signUp, ou Google/Microsoft) sem convite
--    prévio do Admin. Não tem como saber a persona/vínculo de antemão — decisão de
--    modelagem (não veio de requisito explícito, registrar se precisar mudar):
--    esses casos entram como persona 'aluno' sem professor_id, e o Admin ajusta
--    depois pela tela de gestão de alunos (perfis_update_admin já cobre isso).

create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := new.raw_user_meta_data;
  v_persona persona_tipo;
begin
  v_persona := coalesce((meta->>'persona')::persona_tipo, 'aluno');

  insert into perfis (id, persona, nome_completo, professor_id)
  values (
    new.id,
    v_persona,
    coalesce(
      meta->>'nome_completo',
      meta->>'full_name',
      meta->>'name',
      split_part(new.email, '@', 1)
    ),
    case when v_persona = 'aluno' then (meta->>'professor_id')::uuid else null end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger trg_handle_new_user
after insert on auth.users
for each row execute function handle_new_user();
