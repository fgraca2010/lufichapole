# lufichapole — Base de Conhecimento

> Este vault é a memória viva do projeto: decisões, arquitetura, personas e regras
> de negócio que são verdade independente da sessão. Diferente do `HANDOFF.md`
> (log de sessão), este arquivo deve ser atualizado sempre que uma decisão nova for
> tomada. Ver seção "Continuidade de Sessão" em `AGENTS.md`.

## Marca

- Nome: **Lu Fortuna Polesport**
- Logo: `docs/assets/logo.png`
- Paleta:
  - Fundo: branco (`#FFFFFF`)
  - Principal: `#00A887` (texto sobre ela em branco)
  - Secundária: `#FF999A` (texto sobre ela em branco)
  - Terciária: `#383838` (texto sobre ela em branco)
  - Fonte default: preta

## Stack e infraestrutura

- **Frontend/hosting**: Next.js (React), deploy na **Vercel** (plano gratuito)
- **Backend/dados**: **Supabase** (Postgres + Auth + Row Level Security)
- **Repositório**: `github.com/fgraca2010/lufichapole`
- **Projeto Supabase**: `lufichapole` — `https://ttzxktdmqqthfpahdfjw.supabase.co`
- **Contas de deploy**: Vercel autenticado como `fgraca-4688`
- Variáveis de ambiente: `.env.local` (local, gitignored) / Vercel Environment
  Variables (produção). Ver `.env.example` para a lista de chaves necessárias.
  Nunca colar valores de secrets em chat/PR/issue — preencher direto no arquivo
  ou no dashboard do provedor.

## Autenticação

- Métodos: e-mail/senha, Google OAuth, Microsoft OAuth.
- **2FA obrigatório via e-mail**, independente do método de login escolhido.
- Todo usuário consegue ver seus próprios dados de cadastro (mínimos possíveis
  por LGPD) e sua senha (para quem não usa login social).

## Personas

### 1. Aluno
- Vê suas fichas online e registra suas evoluções (por nível/movimento).
- Pode baixar a ficha com o estado atual de preenchimento.
- Vê seu próprio histórico de alterações ao longo do tempo (funciona como
  histórico de aulas/atividades).
- É o **único** que pode editar sua própria ficha.

### 2. Professor
- Vê as fichas dos alunos vinculados a ele (somente leitura — não edita).
- Dados protegidos por LGPD aparecem **mascarados** para ele.
- Dashboard simples: total de alunos, total por nível, total por tipo de
  movimento, histórico dos alunos vinculados, aniversariantes do mês.

### 3. Admin
- Vê todas as fichas (somente leitura — não edita, igual ao Professor).
- Adiciona alunos, adiciona professores, vincula quais alunos pertencem a
  qual professor.
- Também vê os dados mascarados (mesmo eles não estando mascarados no banco).

## Regra de negócio: aprovação em movimento (2026-07-09)

- Cada movimento tem uma **categoria A-E** = grau de dificuldade dentro do
  bloco (A mais fácil, E mais difícil). Definida pelo Admin ao cadastrar o
  movimento.
- Aluno registra tentativas de um movimento: **sucesso** (incrementa a
  contagem de sucessos consecutivos) ou **erro** (zera a contagem daquele
  movimento para aquele aluno).
- Existe uma **quantidade necessária de sucessos consecutivos** para um
  movimento ser considerado "aprovado" — **um único número global do
  sistema** (não varia por nível, bloco ou movimento), configurável pelo
  Admin numa tela de configuração. Valor inicial de referência: 4 (mas isso
  é só um ponto de partida, não veio de regra de negócio real dos PDFs
  originais — os PDFs tinham 2 ou 4 quadradinhos dependendo da academia de
  origem, sem relação com essa regra).
- **Aprovação não é automática ao bater a sequência.** Ao atingir a
  quantidade necessária, o movimento fica **"pendente de avaliação"** — some
  da fila de treino do aluno e aparece pro **professor vinculado** como
  pendente. O aluno faz o movimento pro professor **fora do app**; o
  professor então, dentro do app, confirma ("ok", aprova definitivo) ou manda
  treinar de novo (zera a contagem de sucessos, volta pra andamento normal).
  Essa é a **única exceção** à regra "professor não edita ficha do aluno" —
  só vale pra essa avaliação, e só o professor vinculado (não o Admin) pode
  fazer. Confirmado com a Lu em 2026-07-09.
- Mesmo com uma avaliação pendente, **o aluno continua podendo registrar
  tentativas normalmente** naquele movimento; se der erro nesse meio tempo, a
  contagem zera e ele volta a treinar (some da fila de avaliação do
  professor).
- **Uma vez aprovado pelo professor, o movimento fica aprovado
  permanentemente** para aquele aluno, mesmo que a quantidade necessária
  global aumente depois.
- Se a quantidade necessária **diminuir**, todo aluno que já tinha uma
  contagem de sucessos consecutivos >= à nova quantidade volta a ficar
  **pendente de avaliação** (não aprovado direto — ainda passa pelo
  professor).

## Painel gamificado do Aluno (2026-07-09)

Tela do Aluno mostra um resumo numérico: total de **treinos** (dias em que
registrou ao menos 1 tentativa), **exercícios completos** (aprovados),
**exercícios aguardando avaliação do professor**, e **blocos 100% completos**.
- Toda tentativa (sucesso ou erro) é um evento com data — esse log de eventos
  é também o **histórico de aulas/atividades** do aluno (ver persona Aluno).
- Admin tem tela de **CRUD de blocos e movimentos**: criar bloco, criar/editar/
  remover movimento dentro do bloco, definindo nome, nível, bloco e categoria
  A-E. O seed inicial (`docs/analysis/movimentos.json`, extraído das fichas
  PDF originais) é só o ponto de partida — não é uma lista fixa/imutável.

## Regras de negócio e compliance

- **Fidelidade aos dados originais**: nenhum dado de nível/movimento/critério de
  evolução pode ser inventado. Fonte: PDFs em `docs/input/fichas-pdf/` (níveis 1,
  2 e 3). Quando algo não estiver claro no PDF, usar
  `[DADO AUSENTE: <descrição>]`.
- **LGPD**: dados pessoais sensíveis (CPF, endereço, telefone, data de nascimento
  completa) ficam em claro no banco, mas mascarados na camada de apresentação
  para Professor e Admin. Nunca expor sem máscara fora da persona Aluno.
- Aluno edita; Professor e Admin apenas visualizam (nenhum dos dois pode alterar
  ficha de aluno).

## Decisões de arquitetura

| Data | Decisão | Motivo |
|---|---|---|
| 2026-07-09 | Next.js + Vercel + Supabase | Hospedagem gratuita com persistência de dados real |
| 2026-07-09 | Perfil SPDD-lite A — Sistema, com vault para memória entre sessões | Projeto de sistema real (não é entregável pontual de consultoria) |
| 2026-07-09 | PDFs originais movidos para `docs/input/fichas-pdf/` | Fonte de dados para extração literal (Fase 2) |

## Estado do setup (ver `HANDOFF.md` para o mais recente)

- Workspace inicial criado (README/HANDOFF/AGENTS/vault).
- CLIs instaladas: `gh`, `vercel`, `supabase`.
- Vercel autenticado. GitHub e Supabase CLI: autenticação pendente do usuário.
- `.env.local` preenchido pelo usuário diretamente (URL, anon key, service role
  key, senha do banco pós-rotação) — nunca visto em texto pelo assistente.
- Código da aplicação (`src/`) ainda não iniciado.
