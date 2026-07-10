# ADR 0001 — Schema inicial do banco (Fase 4)

**Status**: rascunho, aguardando aprovação antes de aplicar no Supabase real.

## Contexto

Regras de negócio confirmadas com a Lu em 2026-07-09 (ver `vault/_index.md`):
aprovação em movimento por sucessos consecutivos, quantidade necessária
configurável globalmente pelo Admin, aprovação permanente (nunca reverte),
recálculo automático quando a quantidade diminui, e histórico imutável de
tentativas que também serve de histórico de aulas.

## Atualização (2026-07-09, mesma sessão) — avaliação do professor + gamificação

Duas regras novas mudaram o desenho original:

1. **Aprovação não é automática.** Ao bater a sequência de sucessos, o
   movimento vira `pendente_avaliacao` (aparece pro professor como fila de
   avaliação). O aluno faz o movimento pro professor fora do app; o professor
   confirma (`aprovado`, definitivo) ou manda treinar de novo (zera a
   sequência, volta a `em_andamento`) — via função `avaliar_movimento()`.
   **Isso é uma exceção pontual** à regra "professor não edita ficha do
   aluno" (só vale para essa avaliação, só pelo professor vinculado —
   confirmado com a Lu, admin não avalia).
2. O aluno **continua registrando tentativas normalmente** mesmo com uma
   avaliação pendente (confirmado com a Lu) — um erro nesse meio tempo zera a
   sequência e volta pra `em_andamento` automaticamente.
3. Painel gamificado do Aluno: função `resumo_aluno()` retorna treinos (dias
   com atividade), exercícios completos, exercícios pendentes de avaliação e
   blocos 100% completos.

`aluno_movimento_status.aprovado boolean` foi substituído por
`status status_movimento` (`em_andamento` / `pendente_avaliacao` / `aprovado`).

## Decisão

Schema em `supabase/migrations/0001_init.sql`:

- `perfis` — estende `auth.users`, guarda persona e dados de cadastro. Campos
  LGPD-sensíveis ficam em claro no banco; máscara é responsabilidade da
  camada de apresentação (app), não do banco — conforme já definido em
  `AGENTS.md`.
- `niveis`, `blocos`, `movimentos` — conteúdo das fichas, seedado a partir de
  `docs/analysis/movimentos.json`, mas totalmente editável pelo Admin (CRUD).
- `configuracao_sistema` — linha única com `sucessos_necessarios` (padrão 4).
- `tentativas_movimento` — log imutável (sem update/delete via RLS) de
  sucesso/erro por aluno x movimento. É a fonte do histórico de evolução E do
  histórico de aulas do aluno.
- `aluno_movimento_status` — consolidado por trigger (`sucessos_consecutivos`,
  `aprovado`, `aprovado_em`), evita recalcular a sequência inteira a cada
  leitura. Só é escrito por trigger `security definer`, nunca diretamente pelo
  usuário.

## Premissas assumidas (não vieram de um requisito explícito — flagando)

1. **Um professor por aluno** — confirmado explicitamente com a Lu
   (2026-07-09), modelado como `perfis.professor_id` auto-referenciando
   `perfis.id`.
2. **Admin só lê tentativas/status, não edita** — decorre da regra já dada de
   "aluno é o único que edita a própria ficha"; mantive também para Admin (só
   Admin gerencia cadastro/vínculos e conteúdo de movimentos, nunca o
   progresso do aluno).
3. Tabelas `niveis`/`blocos` foram criadas separadas (não só um número inteiro
   solto em `movimentos`) para dar ao Admin uma tela de gestão mais limpa —
   não foi um requisito explícito, é uma decisão de modelagem. Fácil de
   simplificar depois se não fizer sentido.

## Pendente para fases seguintes

- **Criação automática de `perfis` no signup** (trigger em `auth.users`) —
  depende de como o metadata chega de cada provedor (email/senha, Google,
  Microsoft), a ser resolvido na Fase 5 (Auth).
- **2FA por e-mail** não é nativo do Supabase Auth para todos os métodos de
  login (só tem MFA nativo via TOTP). Vai precisar de um passo extra
  custom (ex: Edge Function + `signInWithOtp`) depois do login primário,
  antes de liberar sessão completa — detalhar na Fase 5.
- Mascaramento LGPD de campos de `perfis` para Professor/Admin — implementar
  na camada de app (Fase 6), não no banco.

## Como aplicar (só depois do "ok")

```bash
supabase link --project-ref ttzxktdmqqthfpahdfjw
supabase db push
```
