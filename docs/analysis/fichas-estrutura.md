# Estrutura das Fichas — Análise (Fase 2)

Extração literal dos PDFs em `docs/input/fichas-pdf/`. Dados estruturados em
`docs/analysis/movimentos.json` (588 movimentos, 47 blocos, 3 níveis).

## Resumo

| Nível | Blocos | Movimentos | Checkboxes/movimento no PDF original | Fonte PDF |
|---|---|---|---|---|
| 1 | 13 | 146 | 4 | `ficha de pole nivel 1 revisada.pdf` (Academia Nissei) |
| 2 | 16 | 203 | 2 | `ficha de pole nivel 2 revisada aluno.pdf` (Academia Nissei) |
| 3 | 18 | 239 | 4 | `Ficha de pole Nível 3.pdf` (ERGOSCAN Gaveacor) |

Cada movimento tem uma **categoria** de A a E (aparentam ser sub-graus de
dificuldade dentro do bloco, mas isso não é rotulado explicitamente em nenhum
dos 3 PDFs).

## Método de extração

- Níveis 1 e 2: os PDFs têm camada de texto real → extraídos com
  `pdftotext -layout`, texto e ordem conferidos manualmente linha a linha
  (coluna esquerda completa, depois coluna direita, por bloco).
- Nível 3: o PDF é uma imagem (gerado via "Microsoft: Print to PDF" de uma
  planilha), sem camada de texto. Extraído por OCR (`tesseract`) e cruzado com
  leitura visual das páginas renderizadas — os dois métodos concordaram em
  100% dos itens verificados.

## Pontos que **não podem ser assumidos** sem confirmação da Lu

Marcados como `[DADO AUSENTE: ...]` no JSON/aqui, por não estarem
explícitos nos PDFs originais:

1. **O que cada checkbox representa.** Os PDFs têm de 2 a 4 quadradinhos por
   movimento, sem legenda. Pode ser: tentativas/repetições, colunas para datas
   de avaliação, ou níveis de execução (ex. "iniciado/base/perfeito"). Isso
   afeta diretamente o modelo de dados (Fase 4) — precisa ser confirmado antes
   de desenhar a tabela de histórico de evolução.
2. **O significado exato das letras A-E.** Parecem ser sub-graus de
   dificuldade dentro do bloco (A = mais fácil, E = mais difícil), mas isso é
   uma inferência, não um dado confirmado no documento.
3. **Um item específico no Nível 3, Bloco 12** ("Arco e Flecha 1 hand") está
   sem a letra de categoria legível no PDF original (nem o OCR nem a leitura
   visual conseguiram recuperá-la) — marcado como `[DADO AUSENTE]` no JSON.
4. Os PDFs de origem são de **outras academias** (Academia Nissei, ERGOSCAN
   Gaveacor) — usados só como fonte do conteúdo de movimentos, não como
   referência de identidade visual (essa vem da Lu Fortuna Polesport, ver
   `vault/_index.md`).

## Próximo passo

Antes de modelar a tabela de evolução no Supabase (Fase 4), preciso que você
confirme os pontos 1 e 2 acima — isso define se o histórico de evolução do
aluno é "marquei o checkbox X na data Y" (mais simples) ou algo com múltiplos
estados por movimento (mais complexo).
