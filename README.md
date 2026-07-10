# lufichapole

Sistema de gestão de fichas de pole dance da **Lu Fortuna Polesport**. Substitui o
preenchimento em PDF por uma aplicação web onde alunos registram sua evolução por
nível/movimento, professores acompanham seus alunos vinculados, e a administração
gerencia cadastros e vínculos.

## Propósito

- Alunos preenchem/atualizam suas fichas de evolução (níveis 1, 2 e 3) online, com
  histórico de alterações ao longo do tempo (funciona como histórico de aulas).
- Professores acompanham os alunos vinculados a eles (dados sensíveis mascarados),
  com um dashboard simples (total de alunos, por nível, por tipo de movimento,
  aniversariantes do mês).
- Administração gerencia alunos, professores e os vínculos entre eles, com visão
  completa (mas também mascarada) das fichas.

Ver `vault/_index.md` para o detalhamento de personas, regras de negócio, paleta e
decisões de arquitetura.

## Stack

- **Frontend/hosting**: Next.js (React) na Vercel (plano gratuito)
- **Backend/dados**: Supabase (Postgres + Auth + Row Level Security)
- **Auth**: email/senha, Google OAuth, Microsoft OAuth — todos com 2FA via e-mail
- **Repositório**: [github.com/fgraca2010/lufichapole](https://github.com/fgraca2010/lufichapole)

## Estrutura de arquivos

```
.
├── README.md              # este arquivo
├── HANDOFF.md              # estado da última sessão de trabalho
├── AGENTS.md               # regras de trabalho e continuidade entre sessões
├── docs/
│   ├── adr/                 # Architecture Decision Records
│   ├── input/fichas-pdf/    # PDFs originais das fichas (fonte de dados, não inventar)
│   └── assets/logo.png      # logo oficial (Lu Fortuna Polesport)
├── vault/                  # base de conhecimento viva do projeto (personas, decisões)
├── src/                    # código da aplicação (Next.js) — a criar na Fase 3
└── tests/                  # testes — a criar junto com o código
```

## Estado atual

Setup inicial do workspace concluído (SPDD-lite). Código da aplicação ainda não
iniciado. Ver `HANDOFF.md` para o próximo passo imediato.

## Próximos passos

1. Extrair estrutura de dados das fichas PDF (níveis, movimentos, campos editáveis)
2. Scaffold Next.js + Tailwind com a paleta e logo da marca
3. Modelagem do banco no Supabase (tabelas + Row Level Security por persona)
4. Auth (email/senha, Google, Microsoft) + 2FA por e-mail
5. Telas por persona (Aluno / Professor / Admin)
6. Deploy: conectar GitHub → Vercel, configurar variáveis de ambiente
