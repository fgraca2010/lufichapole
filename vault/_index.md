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

### Keep-alive do Supabase (2026-08-03)

- **Problema**: o projeto Supabase de produção (`lufichapole`) está no plano
  free, que **pausa automaticamente projetos sem nenhuma requisição de API por
  7 dias**. Como o app tem tráfego baixo, isso já causou queda real em
  produção (erro 504, DNS do projeto Supabase não resolvia — `getaddrinfo
  ENOTFOUND`) — diagnosticado em 2026-08-03, resolvido restaurando o projeto
  via Management API (`POST /v1/projects/{ref}/restore`, já que a CLI do
  Supabase não tem subcomando de restore).
- **Solução**: workflow agendado `.github/workflows/keepalive.yml`, roda a
  cada 3 dias (margem de segurança) + `workflow_dispatch` manual. Faz um `GET
  /auth/v1/health` (health-check padrão do GoTrue, sem custo de linha de
  banco) usando a anon key de produção, guardada no secret do repo
  `SUPABASE_PROD_ANON_KEY` (a anon key já é pública por design — fica embutida
  no HTML/JS do site — então não é um segredo novo sendo introduzido).
  Se a chamada falhar, o workflow falha e o GitHub manda e-mail de alerta
  automaticamente, servindo também de alarme antecipado de queda.
- Alternativa descartada por ora: upgrade pro plano Pro do Supabase ($25/mês)
  — remove o auto-pause, mas o usuário optou por continuar no free tier.

## Autenticação

- Métodos: e-mail/senha, Google OAuth (Microsoft removido em 2026-07-10).
- **2FA obrigatório via e-mail**, independente do método de login primário —
  decisão final confirmada em 2026-07-10 (chegou a ser trocada por TOTP e
  depois revertida de volta pra e-mail na mesma sessão).
- Implementação: não é um "fator MFA" nativo do Supabase (`auth.mfa` só cobre
  TOTP e telefone) — é um portão customizado. Fluxo: login primário →
  `signInWithOtp({email})` manda um código de 6 dígitos → `verifyOtp()` →
  server action seta um cookie `httpOnly` (`lu_mfa_verificado`) → middleware
  exige esse cookie pra liberar `/aluno`, `/professor`, `/admin`. Cookie é
  limpo no logout, então o código é pedido de novo em cada novo login.
- **Requer SMTP configurado em produção** — o serviço de e-mail embutido do
  Supabase é limitado e não é recomendado pra produção (ver
  `docs/adr/0001-schema-inicial.md`). Usar Resend ou Brevo (free tier).
- Todo usuário consegue ver seus próprios dados de cadastro (mínimos possíveis
  por LGPD) e sua senha (para quem não usa login social).

## Personas

### 1. Aluno
- **Somente leitura desde 2026-08-04** (ver mudança de regra abaixo) — vê sua
  ficha, seu histórico de tentativas e baixa a ficha em PDF, mas não marca
  mais nada. Quem registra as tentativas agora é o professor vinculado.
- Vê seu próprio histórico ao longo do tempo (funciona como histórico de
  aulas/atividades) — inclusive quem marcou cada tentativa (ele mesmo, em
  registros antigos anteriores a 2026-08-04, ou o professor, dali em diante).

### 2. Professor
- Vê as fichas dos alunos vinculados a ele. **Desde 2026-08-04, não é mais
  somente leitura**: registra as tentativas (sucesso/erro) do aluno durante a
  aula e aprova/reprova quando bate a sequência necessária — tudo na própria
  tela da ficha do aluno.
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

### Mudança de regra: professor passa a registrar as tentativas (2026-08-04)

A pedido do owner da aplicação, quem marca "sucesso"/"erro" de um movimento
deixou de ser o aluno e passou a ser o **professor vinculado**, direto na
tela da ficha do aluno (antes somente leitura). O resto da regra acima **não
muda** — só quem aciona:

- **Aluno vira 100% somente leitura**: só acompanha (ficha, histórico, PDF).
  Não registra mais tentativas nem reinicia movimentos aprovados.
- Continua existindo **sucesso/erro** (não virou um "marcar como feito"
  simples) — erro ainda zera a sequência, inclusive durante uma avaliação
  pendente.
- **Continua em 2 passos**: bater a quantidade necessária só põe
  `pendente_avaliacao` (mostrado em **amarelo**, cor nova adicionada à
  paleta — `--color-atencao` em `globals.css`, já que a paleta de marca não
  tinha amarelo); a aprovação em si continua sendo uma ação separada do
  professor (evita que a própria marcação final já aprove sem intenção
  explícita). Quando aprovado, o indicador vira **verde** (`--color-primaria`).
- "Recomeçar movimento aprovado" (ação voluntária, reset pra treinar de novo)
  também passou a ser do professor — `reiniciar_movimento_professor(aluno_id,
  movimento_id)`, com checagem de vínculo igual a `avaliar_movimento()`. A
  função antiga (`reiniciar_movimento_aprovado`, que operava sobre o próprio
  `auth.uid()`) fica deprecated no histórico de migrations (`0013_...sql`),
  execute revogado.
- Nova coluna `tentativas_movimento.registrado_por` (auditoria: quem clicou)
  — tentativas antigas foram *backfilled* com `registrado_por = aluno_id`
  (era mesmo o aluno quem registrava antes dessa data); o histórico do aluno
  mostra "marcado por você" ou pelo nome do professor.
- A fila de avaliação cross-alunos (`/professor/avaliacoes`) foi **mantida**
  como atalho de pendências — não conflita com a marcação feita direto na
  ficha individual do aluno, ambas chamam `avaliar_movimento()`.

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
- CLIs instaladas e autenticadas: `gh`, `vercel`, `supabase`.
- Next.js scaffold criado e funcionando (`npm run dev`/`build`).
- Schema do banco (Fase 4) aplicado em produção (`lufichapole`) e no projeto de
  teste (`lufichapoledev`).
- Testes automatizados (Vitest + pgTAP) rodando em todo commit (Husky) e no
  CI (GitHub Actions).
- `.env.local` (produção) e `.env.test.local` (teste) preenchidos pelo usuário
  diretamente — valores nunca lidos/impressos pelo assistente (ver incidentes
  de segurança em `HANDOFF.md` — ambas as senhas foram rotacionadas depois).

## Infraestrutura de testes (2026-07-10)

- Projeto Supabase separado **`lufichapoledev`** existe só pra testes
  automatizados — nunca usar produção (`lufichapole`) pra isso.
- Conexão via **Connection Pooler (Session mode)**, não a conexão direta
  (`db.<ref>.supabase.co`) — a rede local não tem rota IPv6, e a conexão
  direta do Supabase só expõe endereço IPv6 por padrão. Host do pooler:
  `aws-<n>-<região>.pooler.supabase.com` (o `<n>` varia por projeto — testar
  se não conectar de primeira).
- `scripts/test-db.sh`: reseta o schema `public` do banco de TESTE do zero,
  aplica migrations + seed, roda a suíte pgTAP. Nunca roda contra produção.
- GitHub Actions usa secrets do repo (`SUPABASE_TEST_URL`,
  `SUPABASE_TEST_DB_PASSWORD`, `SUPABASE_TEST_DB_POOLER_HOST`,
  `SUPABASE_TEST_DB_POOLER_PORT`) — configurados via `gh secret set` direto do
  `.env.test.local`, nunca visíveis em texto.
