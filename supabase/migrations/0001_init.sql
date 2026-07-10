-- lufichapole — schema inicial (rascunho, Fase 4)
-- NÃO aplicar antes de revisão do usuário. Ver docs/adr/0001-schema-inicial.md.

-- =========================================================================
-- Tipos enumerados
-- =========================================================================
create type persona_tipo as enum ('aluno', 'professor', 'admin');
create type categoria_dificuldade as enum ('A', 'B', 'C', 'D', 'E');
create type resultado_tentativa as enum ('sucesso', 'erro');
create type status_movimento as enum ('em_andamento', 'pendente_avaliacao', 'aprovado');

-- =========================================================================
-- Perfis (estende auth.users)
-- =========================================================================
create table perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  persona persona_tipo not null,
  nome_completo text not null,
  telefone text,
  cpf text,
  endereco text,
  data_nascimento date,
  -- só tem sentido quando persona = 'aluno'; um professor por aluno (confirmado com a Lu em 2026-07-09)
  professor_id uuid references perfis (id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table perfis is 'Dados de cadastro de todas as personas. Campos sensíveis (telefone, cpf, endereco, data_nascimento) são mascarados na camada de apresentação (app) para Professor e Admin — não no banco, conforme AGENTS.md.';
comment on column perfis.professor_id is 'Professor responsável por este aluno. Só preenchido quando persona = aluno.';

-- Função auxiliar para evitar recursão de RLS ao checar a persona do usuário atual.
create function minha_persona()
returns persona_tipo
language sql
security definer
stable
set search_path = public
as $$
  select persona from perfis where id = auth.uid();
$$;

-- =========================================================================
-- Níveis, blocos e movimentos (conteúdo das fichas — editável pelo Admin)
-- =========================================================================
create table niveis (
  id bigint generated always as identity primary key,
  numero int not null unique,
  nome text not null,
  ordem int not null default 0
);

create table blocos (
  id bigint generated always as identity primary key,
  nivel_id bigint not null references niveis (id) on delete cascade,
  numero int not null,
  nome text,
  ordem int not null default 0,
  unique (nivel_id, numero)
);

create table movimentos (
  id bigint generated always as identity primary key,
  bloco_id bigint not null references blocos (id) on delete cascade,
  nome text not null,
  -- nulo apenas para o item do Nível 3 / Bloco 12 cuja categoria não é legível no PDF original
  -- (ver docs/analysis/fichas-estrutura.md) — Admin deve preencher manualmente.
  categoria categoria_dificuldade,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table movimentos is 'Seed inicial vem de docs/analysis/movimentos.json (extração literal das fichas PDF originais). Admin pode adicionar/editar/remover livremente — não é uma lista fixa.';

-- =========================================================================
-- Configuração do sistema (linha única)
-- =========================================================================
create table configuracao_sistema (
  id smallint primary key default 1,
  sucessos_necessarios int not null default 4 check (sucessos_necessarios > 0),
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid references perfis (id),
  constraint configuracao_unica_linha check (id = 1)
);

insert into configuracao_sistema (id, sucessos_necessarios) values (1, 4);

comment on table configuracao_sistema is 'Linha única. sucessos_necessarios = quantidade de sucessos consecutivos para aprovação em qualquer movimento, configurável pelo Admin. Regra de recálculo ao mudar: ver trigger recalcular_aprovacoes_apos_config().';

-- =========================================================================
-- Histórico de tentativas (imutável — serve também de histórico de aulas)
-- =========================================================================
create table tentativas_movimento (
  id bigint generated always as identity primary key,
  aluno_id uuid not null references perfis (id) on delete cascade,
  movimento_id bigint not null references movimentos (id) on delete cascade,
  resultado resultado_tentativa not null,
  registrado_em timestamptz not null default now()
);

create index on tentativas_movimento (aluno_id, movimento_id);

comment on table tentativas_movimento is 'Log imutável de tentativas (sucesso/erro). Nunca é editado nem apagado — é a fonte do histórico de evolução E do histórico de aulas/atividades do aluno.';

-- =========================================================================
-- Status consolidado por aluno x movimento (mantido via trigger)
-- =========================================================================
create table aluno_movimento_status (
  aluno_id uuid not null references perfis (id) on delete cascade,
  movimento_id bigint not null references movimentos (id) on delete cascade,
  sucessos_consecutivos int not null default 0,
  status status_movimento not null default 'em_andamento',
  pendente_desde timestamptz,
  aprovado_em timestamptz,
  avaliado_por uuid references perfis (id),
  primary key (aluno_id, movimento_id)
);

comment on table aluno_movimento_status is 'Consolidado por trigger a partir de tentativas_movimento + configuracao_sistema, mais a avaliação manual do professor. status=aprovado nunca reverte automaticamente (regra confirmada com a Lu em 2026-07-09). Fluxo: em_andamento -> pendente_avaliacao (ao bater a sequência) -> aprovado (professor confirma) ou de volta a em_andamento com contagem zerada (professor manda treinar de novo).';

-- Trigger: recalcula status a cada nova tentativa
create function registrar_tentativa_movimento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  necessarios int;
  atual aluno_movimento_status;
begin
  select sucessos_necessarios into necessarios from configuracao_sistema where id = 1;

  insert into aluno_movimento_status (aluno_id, movimento_id)
  values (new.aluno_id, new.movimento_id)
  on conflict (aluno_id, movimento_id) do nothing;

  select * into atual from aluno_movimento_status
  where aluno_id = new.aluno_id and movimento_id = new.movimento_id
  for update;

  -- Uma vez aprovado pelo professor, o status é definitivo — novas tentativas não têm efeito.
  if atual.status = 'aprovado' then
    return new;
  end if;

  if new.resultado = 'erro' then
    -- erro sempre zera a sequência e, se estava pendente de avaliação, volta a treinar
    -- (mesmo que o aluno continue registrando tentativas com avaliação pendente — confirmado com a Lu).
    update aluno_movimento_status
    set sucessos_consecutivos = 0,
        status = 'em_andamento',
        pendente_desde = null
    where aluno_id = new.aluno_id and movimento_id = new.movimento_id;
  else
    update aluno_movimento_status
    set sucessos_consecutivos = atual.sucessos_consecutivos + 1,
        status = case
          when (atual.sucessos_consecutivos + 1) >= necessarios then 'pendente_avaliacao'
          else atual.status
        end,
        pendente_desde = case
          when atual.status <> 'pendente_avaliacao' and (atual.sucessos_consecutivos + 1) >= necessarios then now()
          else atual.pendente_desde
        end
    where aluno_id = new.aluno_id and movimento_id = new.movimento_id;
  end if;

  return new;
end;
$$;

create trigger trg_registrar_tentativa
after insert on tentativas_movimento
for each row execute function registrar_tentativa_movimento();

-- Trigger: se a quantidade necessária diminuir, manda para avaliação quem já
-- tinha sucessos_consecutivos suficientes para a nova quantidade (ainda passa pelo professor).
create function recalcular_aprovacoes_apos_config()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.sucessos_necessarios < old.sucessos_necessarios then
    update aluno_movimento_status
    set status = 'pendente_avaliacao',
        pendente_desde = now()
    where status = 'em_andamento'
      and sucessos_consecutivos >= new.sucessos_necessarios;
  end if;
  return new;
end;
$$;

create trigger trg_recalcular_aprovacoes
after update on configuracao_sistema
for each row execute function recalcular_aprovacoes_apos_config();

-- Avaliação do professor: confirma aprovação ou manda treinar de novo (zera a sequência).
-- Só o professor vinculado àquele aluno pode chamar (confirmado com a Lu em 2026-07-09).
-- É a única exceção à regra "professor não edita ficha do aluno" — e só se aplica
-- a movimentos com status = pendente_avaliacao.
create function avaliar_movimento(p_aluno_id uuid, p_movimento_id bigint, p_confirmado boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  vinculado boolean;
  status_atual status_movimento;
begin
  select (professor_id = auth.uid()) into vinculado from perfis where id = p_aluno_id;

  if vinculado is not true then
    raise exception 'Apenas o professor vinculado a este aluno pode avaliar este movimento.';
  end if;

  select status into status_atual from aluno_movimento_status
  where aluno_id = p_aluno_id and movimento_id = p_movimento_id;

  if status_atual is distinct from 'pendente_avaliacao' then
    raise exception 'Este movimento não está com avaliação pendente.';
  end if;

  if p_confirmado then
    update aluno_movimento_status
    set status = 'aprovado', aprovado_em = now(), avaliado_por = auth.uid(), pendente_desde = null
    where aluno_id = p_aluno_id and movimento_id = p_movimento_id;
  else
    update aluno_movimento_status
    set status = 'em_andamento', sucessos_consecutivos = 0, avaliado_por = auth.uid(), pendente_desde = null
    where aluno_id = p_aluno_id and movimento_id = p_movimento_id;
  end if;
end;
$$;

-- Resumo gamificado para a tela do Aluno (e visível ao professor/admin do mesmo aluno).
create function resumo_aluno(p_aluno_id uuid default auth.uid())
returns table (
  treinos bigint,
  exercicios_completos bigint,
  exercicios_pendentes_avaliacao bigint,
  blocos_completos bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (
    p_aluno_id = auth.uid()
    or exists (select 1 from perfis where id = p_aluno_id and professor_id = auth.uid())
    or minha_persona() = 'admin'
  ) then
    raise exception 'Sem permissão para ver o resumo deste aluno.';
  end if;

  return query
  select
    (select count(distinct date_trunc('day', registrado_em))
       from tentativas_movimento where aluno_id = p_aluno_id) as treinos,
    (select count(*) from aluno_movimento_status
       where aluno_id = p_aluno_id and status = 'aprovado') as exercicios_completos,
    (select count(*) from aluno_movimento_status
       where aluno_id = p_aluno_id and status = 'pendente_avaliacao') as exercicios_pendentes_avaliacao,
    (select count(*) from blocos b
       where b.id in (select bloco_id from movimentos where ativo)
         and not exists (
           select 1 from movimentos m
           where m.bloco_id = b.id and m.ativo
             and not exists (
               select 1 from aluno_movimento_status s
               where s.aluno_id = p_aluno_id and s.movimento_id = m.id and s.status = 'aprovado'
             )
         )
    ) as blocos_completos;
end;
$$;

comment on function resumo_aluno is 'Números para o painel gamificado do Aluno: treinos (dias com ao menos 1 tentativa), exercícios completos/pendentes de avaliação, blocos 100% aprovados.';

-- =========================================================================
-- Row Level Security
-- =========================================================================
alter table perfis enable row level security;
alter table niveis enable row level security;
alter table blocos enable row level security;
alter table movimentos enable row level security;
alter table configuracao_sistema enable row level security;
alter table tentativas_movimento enable row level security;
alter table aluno_movimento_status enable row level security;

-- perfis: aluno vê o próprio; professor vê os vinculados; admin vê todos.
-- Update: cada um edita o próprio cadastro; admin edita qualquer um (vínculos, personas).
create policy "perfis_select" on perfis for select
  using (
    id = auth.uid()
    or professor_id = auth.uid()
    or minha_persona() = 'admin'
  );

create policy "perfis_update_proprio" on perfis for update
  using (id = auth.uid());

create policy "perfis_update_admin" on perfis for update
  using (minha_persona() = 'admin');

create policy "perfis_insert_admin" on perfis for insert
  with check (minha_persona() = 'admin');

-- niveis/blocos/movimentos: leitura para todo autenticado, escrita só admin.
create policy "conteudo_select" on niveis for select using (auth.role() = 'authenticated');
create policy "conteudo_admin" on niveis for all using (minha_persona() = 'admin');

create policy "blocos_select" on blocos for select using (auth.role() = 'authenticated');
create policy "blocos_admin" on blocos for all using (minha_persona() = 'admin');

create policy "movimentos_select" on movimentos for select using (auth.role() = 'authenticated');
create policy "movimentos_admin" on movimentos for all using (minha_persona() = 'admin');

-- configuracao_sistema: leitura para todo autenticado, update só admin.
create policy "config_select" on configuracao_sistema for select using (auth.role() = 'authenticated');
create policy "config_update_admin" on configuracao_sistema for update using (minha_persona() = 'admin');

-- tentativas_movimento: log imutável. Aluno insere/lê o próprio; professor/admin só leem.
create policy "tentativas_insert_aluno" on tentativas_movimento for insert
  with check (aluno_id = auth.uid() and minha_persona() = 'aluno');

create policy "tentativas_select" on tentativas_movimento for select
  using (
    aluno_id = auth.uid()
    or aluno_id in (select id from perfis where professor_id = auth.uid())
    or minha_persona() = 'admin'
  );

-- aluno_movimento_status: só leitura direta para usuários; escrita apenas via
-- trigger e via avaliar_movimento() (ambos security definer, bypassam RLS).
create policy "status_select" on aluno_movimento_status for select
  using (
    aluno_id = auth.uid()
    or aluno_id in (select id from perfis where professor_id = auth.uid())
    or minha_persona() = 'admin'
  );
