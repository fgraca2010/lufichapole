# HANDOFF

## 2026-07-10 — Revisão completa: features pendentes + mobile

### O que foi feito nesta sessão
- Revisão sistemática (via agente) de tudo que tinha sido pedido nas sessões
  anteriores, comparando com o que estava realmente implementado.
- **Implementado o que faltava**:
  - Histórico detalhado de tentativas do aluno (`/aluno/historico`) — log
    linha a linha (data, nível, bloco, categoria, movimento, sucesso/erro),
    paginado. Não existia — só havia os números agregados do `resumo_aluno`.
  - Utilitário de máscara LGPD reutilizável (`src/lib/mascarar.ts` —
    `mascararCpf`, `mascararTelefone`, `mascararEndereco`,
    `mascararDataNascimento`). Nenhuma tela ainda expõe CPF/telefone/endereço
    de outra pessoa (a "proteção" até então era por omissão — os campos nunca
    eram buscados nessas telas), mas o utilitário fica pronto pra quando/se
    isso for necessário.
- **Mobile**: o app vai ser usado no celular — revisão dedicada encontrou e
  corrigiu:
  - Menu do header sem colapsar virava 6+ itens quebrando linha feio →
    `NavPrincipal.tsx` novo, com hambúrguer no mobile (`sm:hidden`) e nav
    horizontal normal em telas maiores.
  - Nome do usuário no header sem `truncate`/`max-width` podia estourar o
    layout ao lado do avatar — corrigido.
  - `MovimentoRow` (ficha do aluno): botões de sucesso/erro pequenos (abaixo
    do tamanho de toque recomendado) e texto de status longo competindo com
    os botões na mesma linha sem quebra — corrigido (botões 36x36px mínimo,
    `flex-wrap`).
  - `AvaliacaoItem` (fila de avaliação do professor): bloco de texto longo
    (aluno + nível + bloco + categoria + movimento) sem `flex-wrap` ao lado
    dos botões — pior caso de overflow encontrado, corrigido.
  - `admin/alunos`: linha de aluno com nome+foto+select de professor+botão
    excluir sem `flex-wrap` — corrigido.
  - `admin/conteudo`: formulários "Novo movimento"/"Adicionar bloco" sem
    `flex-wrap`, risco real de overflow horizontal — corrigido.
  - `ConvidarForm` (Admin): campos nome/e-mail/professor ficavam lado a lado
    espremidos no celular — agora ocupam largura total em telas pequenas.
  - Bug real encontrado e corrigido: erro de hidratação React #418 nos
    botões de Passkey (`PasskeyLoginButton`, `PasskeyManager`) — a detecção
    de suporte a WebAuthn (`typeof window`) dava resultado diferente no
    servidor (sempre indisponível) vs. no cliente na primeira renderização.
    Corrigido detectando só depois de montado (`useEffect`), começando
    `false` nos dois lados.
  - Tudo testado de verdade em viewport de 390px contra produção via
    Playwright (login, admin dashboard + menu + alunos + conteúdo, ficha do
    aluno com professor+foto, fila de avaliação do professor).
- Todas as mudanças: build + lint + Vitest + pgTAP (50+ assertions) passando,
  commitadas, no CI (GitHub Actions verde) e deployadas em produção.

### Observação de infraestrutura
- A conexão com o banco de teste (`lufichapoledev`) ficou visivelmente mais
  lenta nesta sessão (cada migration/seed via `psql` demorou bem mais que o
  normal — commits com o hook do Husky levaram 2-3 min em vez de segundos).
  Não é um bug do projeto, parece latência de rede/pooler. Se persistir,
  vale investigar a região do pooler ou considerar reduzir o número de
  conexões separadas que `scripts/test-db.sh` abre (uma por arquivo de
  migration) agrupando em menos chamadas de `psql`.

## 2026-07-09/10 — Fases 1 a 4 concluídas (workspace, extração, scaffold, banco)

### O que foi feito nesta sessão (continuação)
- **Fase 3 (scaffold)**: Next.js (App Router, TS, Tailwind v4) criado em `src/`,
  paleta da marca em `globals.css` (`--color-primaria` etc.), logo em
  `public/logo-lu-fortuna.png`, página inicial provisória. `npm run build`/`dev`
  testados e funcionando.
- **Fase 4 (banco)**: schema completo em `supabase/migrations/0001_init.sql`
  (`perfis`, `niveis`, `blocos`, `movimentos`, `configuracao_sistema`,
  `tentativas_movimento`, `aluno_movimento_status`, RLS + grants, triggers,
  funções `avaliar_movimento()` e `resumo_aluno()`). Regras de negócio novas
  captadas em conversa: fluxo de avaliação do professor (pendente_avaliacao →
  aprovado/em_andamento) e painel gamificado do aluno — ver `vault/_index.md`.
  **Aplicado com sucesso em produção** (`lufichapole`) e no banco de teste
  (`lufichapoledev`, projeto Supabase separado criado especificamente para os
  testes automatizados).
- **Testes automatizados**: Vitest (app, `tests/unit/`) + pgTAP (banco,
  `supabase/tests/database/`, 50 assertions cobrindo trigger de tentativas,
  avaliação do professor, RLS por persona, `resumo_aluno()`). Rodam via
  `npm test` / `npm run test:db` / `npm run test:all`.
- **Automação em todo commit**: Husky `pre-commit` (lint + vitest + pgTAP
  contra `lufichapoledev`) + GitHub Actions (`.github/workflows/ci.yml`, usa
  secrets do repo `SUPABASE_TEST_*`). Ambos verdes.
- `gh auth login` e `supabase login` (via Personal Access Token) concluídos
  pelo usuário. Push feito e CI passou.

### Incidentes de segurança desta sessão (resolvidos, mas registrar)
- A senha do banco de produção foi exposta em texto plano no chat **duas
  vezes**: uma pelo usuário (mensagem inicial) e uma pelo assistente (bug ao
  usar a ferramenta de edição de texto em arquivo `.env` já preenchido — a
  edição por substring corrompeu a linha da senha, concatenando o valor na
  linha vizinha, que depois foi impressa sem redigir). **Ambas as senhas
  (produção e teste) foram rotacionadas pelo usuário após os incidentes.**
- Lição aplicada: nunca mais usar a ferramenta de edição de texto (`Edit`) em
  arquivos `.env*` que já tenham valores preenchidos — só leitura de
  presença/tamanho sem imprimir valor, ou pedir pro usuário editar direto.
- Um arquivo `.env.test.example` (não gitignored) chegou a ficar com valores
  reais colados nele por engano — corrigido antes de qualquer commit (nunca
  chegou a ir pro git).

### Próximo passo imediato
1. Fase 5 — Auth: email/senha + Google + Microsoft OAuth + 2FA por e-mail
   (Supabase Auth não tem 2FA universal nativo pra todos os métodos — vai
   precisar de um passo custom, ver `docs/adr/0001-schema-inicial.md`).
2. Trigger de criação automática de `perfis` no signup (`auth.users`).
3. Fase 6 — telas por persona (Aluno/Professor/Admin).

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
