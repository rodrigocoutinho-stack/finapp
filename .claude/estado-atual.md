# Estado Atual — FinApp

Ultima atualizacao: 2026-04-19

## Status
Build OK. Testes OK (189/189). Deploy em producao pendente.

## Concluido nesta sessao — Receita Liquida PJ (master-detail)

Implementado o conceito de "bloco de receita liquida": grupos marcados como
`is_net_revenue_block` (ex.: Pessoa Juridica) tem suas receitas menos despesas
consolidadas como uma unica linha de receita na visao PF, com drill-down opcional
para ver bruto/impostos/custos.

Arquivos entregues:
- `supabase/migrations/023_category_groups.sql` — nova tabela `category_groups`
  com flag `is_net_revenue_block`, RLS, trigger de seed default (apenas "Pessoa
  Juridica" como net revenue) e backfill dos grupos existentes.
- `supabase/migrations/024_remove_lucro_pj_seed.sql` — remove categoria
  `PF | Lucro PJ` do seed (redundante com o novo modelo).
- `supabase/scripts/limpar-dados-teste.sql` — script manual para limpar dados
  de movimentacao de um usuario, preservando contas/categorias.
- `src/lib/net-revenue.ts` — `computeConsolidatedKPIs`,
  `computeConsolidatedForecastKPIs`, `filterOutNetRevenueBlocks`.
- `src/lib/net-revenue.test.ts` — 9 casos cobrindo PF, PJ positivo, PJ negativo,
  multiplos blocos, transferencias e agregacao por categoria.
- `src/components/dashboard/net-revenue-blocks.tsx` — linha expansivel no
  dashboard; colapsado por padrao, mostra bruto → custos → liquido quando aberto.
- `src/components/categorias/category-group-manager.tsx` — UI em Configuracoes >
  Categorias para marcar/desmarcar grupos como receita liquida (cria grupos em
  falta automaticamente).
- Ajustes em:
  - `src/hooks/use-dashboard-data.ts` (KPIs consolidados + exclusao de blocos
    em avgMonthlyExpense, totalRecurringDespesas, forecastDespesas, pastSavingsRates)
  - `src/app/(dashboard)/page.tsx` (integra `NetRevenueBlocks` apos SummaryCards)
  - `src/components/dashboard/budget-comparison.tsx` (aceita
    `netRevenueGroupNames` e oculta categorias do bloco)
  - `src/app/(dashboard)/configuracoes/page.tsx` (inclui `CategoryGroupManager`
    na aba Categorias)
  - `src/types/database.ts` (tipo `CategoryGroup`)

## Validacao E2E concluida em 2026-04-19

Migrations 023 e 024 aplicadas no Supabase. Cleanup executado. Teste E2E no dev
local cobriu: criacao de 2 contas (PF e PJ), 4 transacoes (receita PJ R$10k,
impostos PJ R$1,5k, contabilidade PJ R$300, salario PF R$5k). Resultados
conferidos visualmente e via DOM:

- Receitas consolidadas = R$ 13.200 = R$ 5.000 (salario PF) + R$ 8.200 (lucro
  liquido PJ = 10.000 − 1.500 − 300) ✓
- Despesas = R$ 0,00 (grupo PJ excluido corretamente) ✓
- Bloco "Lucro — Pessoa Juridica" expansivel mostra breakdown bruto/custos/
  liquido ✓
- Previsto vs Realizado mostra apenas categorias PF ✓
- Despesas por Categoria nao lista categorias PJ ✓
- "Grupos de categorias" em Configuracoes > Categorias lista os 8 grupos com
  "Pessoa Juridica" marcado como bloco de receita liquida ✓

Screenshot em `e2e-46-receita-liquida-pj-dashboard.png`.

## Hipoteses Abertas
- Dropdowns de categoria nos formularios (transaction-form, recurring-form)
  mostram opcoes flat em vez de optgroup. Funciona corretamente mas nao exibe
  agrupamento visual. Pode ser limitacao do componente Select com groupedOptions
  quando filtrado por tipo.

## Debitos Tecnicos / Riscos Conhecidos
- Rate limiting in-memory nao persiste entre cold starts serverless.
- CSP mantem `unsafe-inline` para scripts e styles.
- `toCents()` nao trata strings com separador de milhar.
- Dashboard faz 15 queries paralelas — futuro: database views/RPCs.
- `forecast.ts`, `daily-flow.ts` sem testes unitarios (exigem mock Supabase).
- `csv-export.ts` sem testes (depende de DOM).
- PDF report tem campo `categoryGroup` na interface mas nao agrupa visualmente
  na tabela (preparacao futura).
- Budget-comparison e forecast/daily-flow tables ainda nao exibem hierarquia
  3 niveis (Tipo > Grupo > Categoria) — interfaces prontas, UI pendente.
- Relatorio PDF mensal ainda nao aplica a logica de bloco net_revenue
  (proximo passo se o conceito for validado).
- `daily-flow.ts` nao aplica a logica de bloco net_revenue — fluxo diario
  continua mostrando movimentacao real por dia.
- 2 warnings Recharts "width(-1) height(-1)" no dashboard (inofensivos).
- Script `npm run lint` falha no Next 16 (comportamento conhecido; usar
  verificacao no IDE ou rodar eslint direto).

## Adicional — Competencia por transacao (desacoplada da data)

Migration 025 adiciona `transactions.competency_month` (YYYY-MM, nullable).
Quando preenchido, sobrepoe a competencia derivada de `date` + `closing_day`.

Arquivos entregues:
- `supabase/migrations/025_competency_override.sql` — coluna + CHECK + indice.
- `src/lib/competency.ts` — deriveCompetencyMonth, getEffectiveCompetency,
  toCompetencyLabel, buildCompetencyOrFilter.
- `src/lib/competency.test.ts` — 10 casos unitarios.
- Form de transacao ganhou campo "Competencia" (tipo month) com valor default
  derivado; se o valor bater com a derivacao, salva NULL (evita redundancia).
- Lista de transacoes mostra badge "Competencia YYYY-MM" quando ha override.
- Queries de dashboard/forecast/transacoes/group-report passam a respeitar
  override via `.or()` PostgREST. Reconciliacao e fluxo diario continuam
  usando `date`.

Pendente: aplicar migration 025 no Supabase antes de testar em producao.

## Proxima Acao Sugerida
Deploy para producao (Vercel/GitHub) via commit e push. Aplicar migration 025
no Supabase. Opcionalmente, estender a logica de bloco net_revenue para o
Relatorio PDF mensal e para `daily-flow.ts`.
