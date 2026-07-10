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

## Pontos esclarecidos pela Lu (2026-07-09)

Os checkboxes dos PDFs originais **não** definem a regra de negócio — foram
substituídos por uma regra configurável explicada pela Lu:

1. **Significado dos checkboxes**: contagem de **sucessos consecutivos** do
   aluno naquele movimento. Ao atingir a quantidade necessária, o movimento
   fica "aprovado" permanentemente para aquele aluno.
2. **Quantidade necessária de sucessos**: é **um único número global do
   sistema** (não varia por nível/bloco/movimento), configurável pelo Admin.
   Os PDFs originais tinham 4 (Níveis 1 e 3) ou 2 (Nível 2) quadradinhos —
   isso era só o layout de cada academia de origem, não uma regra a preservar.
   Ver regra completa de recálculo em `vault/_index.md`.
3. **Letras A-E**: confirmado — são o **grau de dificuldade do movimento
   dentro do bloco** (A = mais fácil, E = mais difícil). Editável pelo Admin
   ao cadastrar/editar um movimento.
4. Admin terá tela de **CRUD de blocos e movimentos** (criar, editar categoria
   A-E, remover) — blocos/movimentos não são fixos, o seed inicial
   (`movimentos.json`) é só o ponto de partida vindo das fichas originais.

## Pendências residuais (ainda `[DADO AUSENTE]`)

1. **Um item específico no Nível 3, Bloco 12** ("Arco e Flecha 1 hand") está
   sem a letra de categoria legível no PDF original (nem o OCR nem a leitura
   visual conseguiram recuperá-la) — marcado como `[DADO AUSENTE]` no JSON.
   Vai precisar que alguém da Lu defina a dificuldade desse movimento
   manualmente na tela de CRUD do Admin.
2. Os PDFs de origem são de **outras academias** (Academia Nissei, ERGOSCAN
   Gaveacor) — usados só como fonte do conteúdo de movimentos, não como
   referência de identidade visual (essa vem da Lu Fortuna Polesport, ver
   `vault/_index.md`).

## Próximo passo

Modelar o schema no Supabase (Fase 4) com as regras confirmadas acima.
