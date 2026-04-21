# Estado Atual — FinApp

Ultima atualizacao: 2026-04-21

## Status
Build OK. Testes 211/211 verdes. TypeScript strict sem erros. E2E (Playwright)
APROVADO. Deploy em producao OK. Base populada com 229 transacoes reais de
5 contas/cartoes (Inter PJ, Santander, Santander Cartao, C6, C6 Cartao) via
bulk-import + merge-transfers.

## Ultima entrega (nova sessao 2026-04-21)

### Ordenacao de colunas na aba Transacoes
- `src/components/ui/data-table.tsx`: extensao opt-in — `Column.sortable`,
  `Column.sortKey`, props `sortState` / `onSortChange`, icone de seta no
  header clicavel, `aria-sort` aplicado. Zero impacto em tabelas que nao
  usarem as novas props.
- `src/components/transacoes/transaction-list.tsx`: 5 colunas ordenaveis
  (date, description, category, account, amount), repasse das props.
- `src/app/(dashboard)/transacoes/page.tsx`: novo state `sortState`,
  handler com toggle asc -> desc -> null (volta ao default `date desc`),
  reset de `currentPage` em cada troca, mapa coluna -> `.order()`:
  - `category` usa `.order("categories(name)", { nullsFirst: false })`.
  - `account` usa `.order("accounts(name)", { nullsFirst: false })`.
  - Tie-breaker por `id` para paginacao estavel.
  - Export CSV herda a ordenacao por usar o mesmo `buildFilteredQuery`.
- Bug descoberto em teste Playwright e corrigido: a opcao
  `referencedTable` do Supabase JS gera `<table>.order=<col>` — isso
  ordena DENTRO do embed, nao o parent. Para ordenar transactions
  pelo campo do embed, a sintaxe correta e passar
  `"<table>(<col>)"` como primeiro argumento de `.order()`. PostgREST
  entao gera `order=accounts(name).asc.nullslast` no order principal.
- Validado E2E via Playwright + network requests: todas as 5 colunas
  (date, description, category, account, amount) ordenam server-side
  com toggle asc/desc/null. `npm run build` OK.

## Entregas da sessao

### 1. Bulk import de extratos/faturas reais
- `scripts/bulk-import.mjs` + `scripts/parsers/{santander,c6}.mjs` +
  `scripts/extract-pdf-text.mjs` + `scripts/parse-local.mjs` +
  `scripts/merge-transfers.mjs`.
- Pipeline: OFX/CSV direto -> pdfjs-dist (texto local) -> parser regex do
  banco -> fallback Gemini apenas se local nao reconhece formato.
- Flags: `--dry-run` (default), `--commit`, `--only=X`, `--skip=Y`.
- Dedupe por (account, date, amount_cents, description, type). Inclusao de
  `type` na chave corrigiu colisao de estorno+cobranca do mesmo dia/valor
  (caso C6: APPLE.COM/BILL 17/01 R$ 139,90 credito vs debito).
- Service role bypass RLS; UPDATE direto em `accounts.balance_cents`.

### 2. Parsers deterministicos
- **Santander** (3 formatos auto-detectados): `consolidado_mensal` (mensal
  DD/MM com sinal pos-valor `X,XX-`), `corrente_online` (DD/MM/YYYY
  explicito), `fatura_cartao` (2 colunas, regex global + dedup).
- **C6**: parser de CSV de fatura (separador `;`, traz categoria nativa como
  `suggested_category`).
- Normalizacao de texto pdfjs: remove `=== PAGE N ===`, colapsa
  "Ag e ncia" -> "Agencia", remove disclaimers de rodape.

### 3. Base populada (2026-04-21)

| Conta | Grupo | Txns | Saldo |
|---|---|---|---|
| Inter PJ | PJ | 24 | R$ 0,00 |
| Santander | PF | 79 | R$ 1.635,61 |
| Santander Cartao | PF | 77 | R$ 1.926,69 |
| C6 | PF | 26 | -R$ 1.431,78 |
| C6 Cartao | PF | 23 | R$ 4.716,06 |

- Contas PF tratadas com `account_group = "PF"` (convencao curta do projeto,
  ver `src/lib/utils.test.ts:220`).
- Conta "Conta PJ" de teste (com 3 transacoes) excluida.
- Saldos batem com extratos quando informado (Santander 17/04 = R$ 1.635,61);
  demais precisam de reconciliacao via UI (Contas -> Reconciliar).

### 4. Conversao de transferencias (merge-transfers)
- 22 pares (despesa em A <-> receita de mesmo valor em B em +-1 dia)
  convertidos em `type=transferencia` com `destination_account_id`.
- Volume consolidado: R$ 79.997,55 deixou de ser dupla-contado em KPIs.
- Pares principais: Inter PJ -> Santander (distribuicoes PJ->PF 5 pares,
  R$ 55k), Santander <-> C6 (PIX proprios, 8 pares), pagamentos de fatura
  de cartao (C6/Santander Cartao recebendo, 6 pares).
- Saldos preservados (movimento fisico ja estava em balance_cents).
- Filtro anti-falso-positivo: SALARIO, DIVIDENDO, RENDIMENTO,
  JUROS DE APLIC nao viram transferencia.

### 5. Documentacao de uso
- `scripts/README.md` — guia completo: convencao de pastas, FOLDER_MAP,
  flags, parsers, como adicionar banco novo, limitacoes, output files.

## Proxima entrega planejada (aguardando aprovacao)

### Tipo `investimento` (4º tipo de transacao)
- Investimento hoje e uma categoria dentro de despesa, o que e
  conceitualmente errado: infla despesa, deflaciona savings rate,
  nao conecta ao fluxo natural "gerou caixa -> alocou em investimento".
- Proposta: criar `type = 'investimento'` como 4º tipo em
  `transactions`, `recurring_transactions` e `categories`. Debita a
  conta origem como despesa, mas NAO entra em "Despesa do mes" nem
  em "Receita do mes". Entra como saida no fluxo de caixa diario.
- Impacto mapeado: 27 arquivos + 1 migration (CHECK constraints
  aditivas) + 1 coluna nova em `monthly_closings`.
- Rollout em 5 fases (schema -> core -> dashboard KPIs ->
  forecast/daily-flow -> recorrentes/import). Fase 5 (integracao
  com tabela `investments` via `destination_investment_id`) fica
  para depois.
- Plano detalhado: `.claude/plans/tipo-investimento.md`.

## Hipoteses Abertas
- Dropdowns de categoria (transaction-form/recurring-form) mostram opcoes
  flat em vez de optgroup quando filtrado por tipo.
- Seed de ~30 regras de importacao tipicas (UBER, IFOOD, NETFLIX, mercados
  etc.) resolveria o "sem categoria" inicial em novos usuarios — util
  tambem para proximas cargas antes que o historico cresca.
- Portar parsers `scripts/parsers/*.mjs` para `src/lib/import-parsers/` e
  integrar em `/api/import/pdf` e novo `/api/import/csv`, com testes
  unitarios (fixtures congeladas em `.claude/pdf-raw/`). Escopo minimo:
  Santander PF conta, Santander cartao, C6 CSV.

## Debitos Tecnicos / Riscos Conhecidos
- 229 transacoes no banco em sua maioria sem categoria: revisao manual ou
  criar regras. Apos categorizar algumas, o histórico passa a alimentar
  cascata em futuras importacoes.
- Parsers regex sao frageis a mudancas de layout do banco. Precisa
  telemetria/testes com fixtures para detectar regressao.
- Saldos de contas nao-reconciliadas (Inter PJ R$ 0, C6 -R$ 1.431, cartoes)
  precisam ajuste via Contas -> Reconciliar.
- Rate limiting in-memory nao persiste entre cold starts.
- CSP mantem `unsafe-inline` para scripts e styles.
- `toCents()` nao trata strings com separador de milhar.
- Dashboard faz 15 queries paralelas.
- `forecast.ts` e `daily-flow.ts` sem testes unitarios.
- PDF report nao aplica bloco net_revenue ainda.
- `daily-flow.ts` nao aplica bloco net_revenue (fluxo diario usa date mesmo).
- `usedRetry` do `extractWithRetry` esta morto (nao logado) — telemetria
  pendente.
- Logica de consolidacao PJ duplicada entre `net-revenue.ts` e
  `useDashboardData` (secao de `pastSavingsRates`).
- 2 warnings Recharts "width(-1) height(-1)" no dashboard (inofensivos).
- Script `npm run lint` quebrado no Next 16 (bug conhecido do CLI).

## Proxima Acao Sugerida
Revisar e aprovar o plano `.claude/plans/tipo-investimento.md`. Apos
aprovacao, executar apenas a **Fase 0** (migration 026 + update de
`src/types/database.ts`) e rodar `npm run build` como gate antes de
seguir para a Fase 1. Cada fase subsequente tem seu proprio gate
descrito no plano.
