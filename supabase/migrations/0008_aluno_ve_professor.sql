-- lufichapole — aluno precisa conseguir ler o nome do próprio professor
-- vinculado (pra mostrar na ficha e no PDF). A policy anterior só cobria o
-- sentido contrário (professor lendo os alunos vinculados a ele).
--
-- Usa uma função security definer (mesmo padrão de minha_persona()) em vez de
-- uma subquery direta em perfis dentro da própria policy de perfis — isso
-- causaria "infinite recursion detected in policy for relation perfis".
create function meu_professor_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select professor_id from perfis where id = auth.uid();
$$;

create policy "perfis_select_professor_do_aluno" on perfis for select
  using (id = meu_professor_id());
