# HANDOFF

## 2026-07-09 — Setup inicial concluído

### O que foi feito
- Calibração SPDD-lite: projeto **lufichapole**, perfil **A — Sistema**
  (Solo + AI, requisitos parcialmente definidos, compliance = LGPD + fidelidade aos
  dados das fichas, precisa de memória entre sessões → `vault/`).
- Criados `README.md`, `HANDOFF.md`, `AGENTS.md`, `.gitignore`, `docs/adr/`.
- PDFs originais das fichas (níveis 1, 2 e 3) movidos para `docs/input/fichas-pdf/`.
- Logo oficial (`~/Downloads/lu.png`) copiada para `docs/assets/logo.png`.
- Criado `vault/_index.md` com personas, regras de negócio, paleta e stack
  levantadas em conversa com o cliente (Felipe/dona do projeto).
- CLIs instaladas: `gh`, `vercel`, `supabase` (via Homebrew/npm).
- `vercel whoami` → autenticado como `fgraca-4688` (sessão de navegador já ativa).
- `gh auth status` → **ainda não autenticado** (pendente: usuário deve rodar
  `gh auth login --hostname github.com --git-protocol https --web` no terminal dele).
- `supabase login` → **pendente**, mesmo motivo (fluxo interativo, requer terminal do
  usuário).
- Senha do banco Supabase foi compartilhada em texto plano no chat pelo usuário;
  ele optou por não rotacionar por ora e seguir com ela. Não será usada em nenhum
  arquivo versionado — apenas em variáveis de ambiente locais/Vercel quando
  necessário (idealmente substituída pelas chaves de API `anon`/`service_role`,
  não a senha de conexão direta ao Postgres).

### Estado atual dos artefatos
- Nenhum código de aplicação criado ainda (`src/` não existe).
- Repositório Git local: **a inicializar** (próximo passo).
- Remoto GitHub já existe e está vazio: `github.com/fgraca2010/lufichapole`.
- Projeto Supabase já existe: `lufichapole` (`https://ttzxktdmqqthfpahdfjw.supabase.co`).

### Próximo passo imediato
1. Confirmar que usuário concluiu `gh auth login` e `supabase login`.
2. `git init`, `git remote add origin`, primeiro commit com o workspace atual.
3. Iniciar Fase 2: extrair estrutura de dados das fichas PDF (níveis, movimentos,
   campos editáveis) para `docs/analysis/`.

### Decisões relevantes
- Stack: Next.js (React) + Vercel (free tier) + Supabase (Postgres/Auth/RLS).
- Login: email/senha, Google, Microsoft — todos com 2FA via e-mail.
- 3 personas: Aluno (edita própria ficha), Professor (somente leitura de alunos
  vinculados, dados LGPD mascarados, dashboard + aniversariantes do mês), Admin
  (gerencia cadastros/vínculos, somente leitura de fichas, também vê dados
  mascarados apesar de não estarem mascarados no banco).
- Paleta: fundo branco, principal `#00A887` (texto branco), secundária `#FF999A`
  (texto branco), terciária `#383838` (texto branco), fonte default preta.
- Vault (`vault/`) é a memória viva do projeto — MCP `memory` desabilitado
  localmente via `opencode.json`.
