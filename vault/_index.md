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
