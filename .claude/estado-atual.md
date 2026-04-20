# Estado Atual — FinApp

Ultima atualizacao: 2026-04-19

## Status
Build OK. Testes 211/211 verdes. TypeScript strict sem erros. E2E (Playwright)
APROVADO. Deploy em producao OK (commits 311a5d3 → 29877cd).

## Entregas da sessao

### 1. Receita liquida PJ (master-detail)
Grupo de categoria com flag `is_net_revenue_block` consolida receitas − despesas
em linha unica de receita PF, com drill-down. Migrations 023/024 + lib
`src/lib/net-revenue.ts` + bloco expansivel no dashboard + gestor de grupos em
Configuracoes. Plano completo em `.claude/plans/receita-liquida-pj.md`.

### 2. Competencia contabil por transacao
Campo `transactions.competency_month` (YYYY-MM, nullable) sobrepoe a derivacao
padrao (`date + closing_day`). Lib `src/lib/competency.ts` com helpers +
helper para filtro `.or()` do PostgREST. Campo month picker no form + badge na
lista quando ha override. Migration 025. Reconciliacao e fluxo diario seguem
usando `date`. Validado em caso: conta de abril paga em maio.

### 3. Importacao — retry + banner OFX
- `extractWithRetry` em `api/import/pdf/route.ts`: 2 tentativas (padrao + temp 0).
- Banner verde em `/transacoes/importar` priorizando OFX/QFX sobre PDF.
- Decidido nao migrar para Claude API: plano Max nao cobre uso em apps de
  terceiros; custo seria 20-100x maior que Gemini Flash para mesma tarefa.

### 4. Auto-categorizacao na importacao (3 fontes em cascata)
- Regra explicita (`category_rules`) — padrao hoje.
- Historico do usuario (`src/lib/category-suggestion.ts`): indexa 12 meses de
  transacoes categorizadas por tokens da descricao + tipo; score >=2 em 2-token
  ou >=3 em 1-token. 12 testes unitarios.
- Sugestao da IA no PDF: prompt do Gemini passa a lista de categorias do
  usuario; servidor mapeia nome->id com guard anti-invencao.
- Badges diferenciam fonte (Regra/Historico/IA) em `import-review-table`.

### 5. Revisao de codigo — 3 correcoes aplicadas
- `existingCategoryGroups` memoizado (evita re-render infinito + INSERTs
  duplicados).
- Dedupe em `group-report-modal` por `id` (evita descartar transacoes reais
  com mesmo valor/data).
- `upsert(onConflict:ignoreDuplicates)` + toast em erro para sincronizacao
  de grupos.

### 6. Fix pontual
- Mock de `Transaction` em `recurrence-detection.test.ts` atualizado para
  incluir `competency_month: null` (nao-opcional depois da migration 025).
- Skill `/e2e-test` corrigida: ID do campo saldo inicial e `initialBalance`,
  nao `balance`.

## Validacao E2E (2026-04-19)
Teste Playwright completo aprovado: login → criacao de 8 entidades (conta,
categorias, transacoes, recorrentes, investimento) → validacao de dashboard
consolidado (Receitas R$18.200 com bloco PJ R$8.200 + 5k salario + 5k teste)
→ cleanup total sem residuos. Zero erros de console. Screenshots `e2e-00` a
`e2e-60`.

## Hipoteses Abertas
- Dropdowns de categoria (transaction-form/recurring-form) mostram opcoes flat
  em vez de optgroup quando filtrado por tipo.

## Debitos Tecnicos / Riscos Conhecidos
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
Considerar seed de regras de importacao comuns (~30 patterns tipicos: UBER,
IFOOD, NETFLIX, SPOTIFY, mercados etc.) para novos usuarios — melhora
auto-categorizacao do dia 1. Alternativamente, estender logica de bloco
net_revenue para o Relatorio PDF mensal.
