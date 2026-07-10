-- lufichapole — ajustes de regra de negócio (2026-07-10):
-- 1) Se o professor for excluído, os alunos vinculados ficam sem professor
--    (não pode dar erro de FK ao excluir conta de professor).
-- 2) Aluno sem professor pode registrar tentativas normalmente — já era
--    permitido pela policy existente (não exige professor_id), só reforça
--    aqui com o comentário pra não haver dúvida futura.

alter table perfis drop constraint perfis_professor_id_fkey;
alter table perfis
  add constraint perfis_professor_id_fkey
  foreign key (professor_id) references perfis (id) on delete set null;

comment on column perfis.professor_id is 'Professor responsável por este aluno. Só preenchido quando persona = aluno. Fica NULL automaticamente se o professor for excluído (aluno continua podendo treinar, só não tem quem avalie).';
