# AGENTS.md — lufichapole

## Contexto do projeto

Sistema de gestão de fichas de pole dance da Lu Fortuna Polesport. Ver
`vault/_index.md` para personas, regras de negócio, paleta e decisões de
arquitetura completas.

- **Perfil SPDD-lite**: A — Sistema
- **Equipe**: Solo + AI
- **Requisitos**: parcialmente definidos (evoluem por conversa, registrar decisões)
- **Compliance**: LGPD (dados pessoais de alunos) + fidelidade aos dados originais
  das fichas (nenhum dado de nível/movimento pode ser inventado)
- **Stack**: Next.js (React) na Vercel + Supabase (Postgres/Auth/RLS)

## Modo de trabalho (SPDD-lite)

Para qualquer tarefa substantiva (nova feature, mudança de schema, decisão de
arquitetura), antes de executar:
1. **DoD** — o que será produzido e como saberemos que está completo
2. **Restrições e premissas** — o que estamos assumindo como verdadeiro
3. **Decomposição** — sub-tarefas numeradas, se composta
4. **Aguardar confirmação** do usuário antes de executar

Nunca pular esse alinhamento por "ser óbvio" ou "ser rápido".

## Integridade de dados

- Nenhum dado sobre níveis, movimentos ou critérios de evolução pode ser
  inventado — extração de `docs/input/fichas-pdf/` deve ser literal.
- Quando um dado necessário não estiver claro no PDF original, usar
  `[DADO AUSENTE: <descrição>]` em vez de assumir um valor.
- Toda regra de negócio nova acordada em conversa deve ser registrada em
  `vault/_index.md`, não apenas ficar implícita no código.

## LGPD e segurança

- Dados pessoais sensíveis (CPF, endereço, telefone, data de nascimento completa)
  ficam em claro no banco, mas **mascarados na camada de apresentação** para as
  personas Professor e Admin — nunca expor esses campos sem máscara fora da
  própria persona Aluno.
- Segredos (chaves Supabase, senha de banco, tokens) **nunca** em código
  versionado. Vivem em `.env.local` (gitignored) e nas variáveis de ambiente da
  Vercel. Nunca solicitar ou aceitar que o usuário cole segredos diretamente no
  chat — se acontecer, orientar a rotacionar a credencial.
- Login exige 2FA por e-mail, independente do método (email/senha, Google,
  Microsoft).

## Continuidade de Sessão (obrigatório, qualquer ferramenta)

Esta seção é a fonte de verdade da continuidade — vive aqui (e não só em
`.cursor/rules/*.mdc`) porque `AGENTS.md` é lido por qualquer ferramenta
(OpenCode, Claude Code, Cursor, Gemini/Antigravity), enquanto arquivos `.mdc` só
são carregados automaticamente dentro do Cursor IDE.

### Ao iniciar ou retomar qualquer sessão
1. Ler `HANDOFF.md` — estado atual, o que foi feito, próximo passo imediato.
2. Ler `README.md` — propósito e stack do projeto.
3. Ler `vault/_index.md` — base de conhecimento viva do projeto (decisões,
   arquitetura, componentes).
4. Confirmar com o usuário se o contexto está correto antes de prosseguir.

### Ao encerrar sessão substantiva (> 30 min de trabalho ou qualquer entregável novo)
1. Atualizar `HANDOFF.md`: data ISO, o que foi feito, estado dos artefatos,
   próximo passo, decisões relevantes.
2. Atualizar `vault/` com decisões, componentes ou mudanças de arquitetura novas
   — o vault é a base de conhecimento estruturada e duradoura do projeto
   (substitui o grafo de memória MCP, que não é usado por padrão neste projeto).
3. Esta atualização é obrigatória mesmo que a sessão tenha ocorrido em uma
   ferramenta diferente da usada no setup inicial do projeto.

### Sobre o grafo de memória MCP (`memory`)
Este projeto **não** depende do servidor MCP `memory` para continuidade — ele
exige que o agente lembre de chamar ferramentas de escrita em toda sessão, sem
gatilho automático, e na prática nunca é escrito. O `vault/` cumpre esse papel
com arquivos versionados. O `memory` MCP está desabilitado localmente via
`opencode.json` neste projeto.
