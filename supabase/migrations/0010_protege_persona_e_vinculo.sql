-- lufichapole — falha de segurança encontrada nesta revisão: a policy
-- "perfis_update_proprio" (using id = auth.uid()) permite update de QUALQUER
-- coluna da própria linha, incluindo `persona` e `professor_id` — um aluno
-- mal-intencionado poderia se autopromover a admin via update direto na
-- tabela. RLS "USING"/"WITH CHECK" não dá acesso a OLD.* pra comparar, então
-- a proteção certa é um trigger BEFORE UPDATE.

create function proteger_persona_e_vinculo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if minha_persona() = 'admin' then
    return new; -- admin pode alterar tudo (tela de gestão)
  end if;

  if new.persona is distinct from old.persona then
    raise exception 'Você não pode alterar sua própria persona.';
  end if;

  if new.professor_id is distinct from old.professor_id then
    raise exception 'Só o Admin pode alterar o vínculo de professor.';
  end if;

  return new;
end;
$$;

create trigger trg_proteger_persona_e_vinculo
before update on perfis
for each row execute function proteger_persona_e_vinculo();

revoke execute on function proteger_persona_e_vinculo() from public;
