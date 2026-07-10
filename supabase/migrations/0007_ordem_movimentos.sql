-- lufichapole — Admin pode reordenar movimentos dentro de um bloco (2026-07-10).

alter table movimentos add column ordem int not null default 0;

-- Backfill: preserva a ordem relativa atual (ordem de inserção / id) dentro
-- de cada bloco, pra não embaralhar nada que já existe.
with numerados as (
  select id, row_number() over (partition by bloco_id order by id) as rn
  from movimentos
)
update movimentos m
set ordem = n.rn
from numerados n
where m.id = n.id;

comment on column movimentos.ordem is 'Ordem de exibição dentro do bloco (crescente). Editável pelo Admin — afeta a ordem na tela de execução do aluno.';
