# lufichapole

Sistema de gestão de fichas de pole dance da **Lu Fortuna Polesport**. Substitui o
preenchimento em PDF por uma aplicação web onde alunos registram sua evolução por
nível/movimento, professores acompanham seus alunos vinculados, e a administração
gerencia cadastros e vínculos.

Em produção: **https://lufichapole.vercel.app**

## Propósito

- Alunos preenchem/atualizam suas fichas de evolução (níveis 1, 2 e 3) online, com
  histórico de alterações ao longo do tempo (funciona como histórico de aulas),
  resumo gamificado, e download da ficha em PDF (por nível, com grid de caixas
  pra treinar sem celular).
- Professores acompanham os alunos vinculados a eles, avaliam movimentos que
  bateram a sequência de sucessos (fila de avaliação), com dashboard (total de
  alunos, por nível, por categoria de dificuldade, aniversariantes do mês).
- Administração gerencia alunos, professores, vínculos, conteúdo (blocos e
  movimentos, com reordenação) e a configuração de aprovação do sistema.

Ver `vault/_index.md` para o detalhamento de personas, regras de negócio, paleta e
decisões de arquitetura. Ver `HANDOFF.md` para o estado da última sessão.

## Stack

- **Frontend/hosting**: Next.js (App Router) na Vercel, deploy automático a
  partir do `main`
- **Backend/dados**: Supabase (Postgres + Auth + Row Level Security + Storage)
- **Auth**: email/senha ou Google OAuth, com 2FA por e-mail obrigatório (portão
  customizado — ver `vault/_index.md`)
- **E-mail transacional**: Resend (SMTP customizado no Supabase Auth)
- **Testes**: Vitest (app) + pgTAP (banco, projeto Supabase de teste dedicado
  `lufichapoledev`) — rodam em todo commit (Husky) e no CI (GitHub Actions)
- **Repositório**: [github.com/fgraca2010/lufichapole](https://github.com/fgraca2010/lufichapole)

## Estrutura de arquivos

```
.
├── README.md                # este arquivo
├── HANDOFF.md                # estado da última sessão de trabalho
├── AGENTS.md                 # regras de trabalho e continuidade entre sessões
├── docs/
│   ├── adr/                   # Architecture Decision Records
│   ├── analysis/               # extração das fichas PDF -> movimentos.json
│   ├── input/fichas-pdf/       # PDFs originais das fichas (fonte, não inventar)
│   └── assets/logo.png        # logo oficial (Lu Fortuna Polesport)
├── vault/                    # base de conhecimento viva do projeto
├── src/app/                  # rotas Next.js (login, mfa, aluno, professor, admin, perfil)
├── src/lib/supabase/          # clientes Supabase (browser/server/admin)
├── supabase/
│   ├── migrations/             # schema versionado
│   ├── seed.sql                 # seed dos 588 movimentos extraídos das fichas
│   └── tests/database/          # suíte pgTAP
├── scripts/                  # test-db.sh, bootstrap-admin.mjs, etc.
└── tests/unit/                # Vitest
```

## Estado atual

Fases 1 a 7 entregues: extração das fichas, schema + RLS + triggers, scaffold
Next.js com a marca, auth + 2FA + telas por persona, deploy Vercel↔GitHub
automático. Ver `HANDOFF.md` para o que ficou pendente e o próximo passo.

## Rodando local (scripts úteis)

```bash
npm run dev            # servidor local
npm run build           # build de produção
npm run test             # Vitest
npm run test:db           # pgTAP contra o projeto de teste (lufichapoledev)
npm run test:all           # lint + test + test:db
```
