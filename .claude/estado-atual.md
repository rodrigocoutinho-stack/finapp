# Estado Atual — FinApp

Ultima atualizacao: 2026-04-21

## Status
Build OK. Testes 213/213 verdes. TypeScript strict sem erros. 4o tipo de
transacao `investimento` em producao (merge em main + migrations 026/027
aplicadas no Supabase remoto). Base populada com 229 transacoes reais de
5 contas/cartoes; 1 transacao reclassificada de despesa para investimento
(R$ 24.000 via script `reclassify-investments.mjs`).

## Ultima entrega (sessao 2026-04-21)

### Tipo `investimento` (4o tipo de transacao) — 5 fases concluidas
Motivo: investimento nao e consumo; e alocacao de ganho ja realizado.
Antes, categorias de aporte ficavam dentro de `despesa`, inflando o total
de despesas e deflacionando o savings rate. Corrigido ponta-a-ponta.

**Schema (Fase 0):**
- Migration 026: CHECK ampliada em `transactions.type`,
  `recurring_transactions.type` (`+investimento`) e `categories.type`
  (`+investimento`); nova coluna `monthly_closings.total_investment_cents`.
  Aditiva, rollback trivial documentado no SQL.
- Migration 027: `seed_default_categories` reescrito — `PF | Investimentos`
  e `PF | Reserva` agora nascem com `type='investimento'` para novos
  usuarios.

**Semantica nos KPIs (Fase 2 — resolve o bug):**
- Investimento debita a conta como despesa (saida fisica de caixa).
- Investimento NAO entra em "Despesa do mes" nem em "Receita do mes".
- Fica em KPI proprio `totalInvestimentos` (card violeta no dashboard).
- "Geracao do mes" = `Receitas − Despesas` (NAO subtrai investimento —
  investimento e destino da geracao, nao redutor).
- Savings rate = `(Rec − Desp) / Rec` continua correto, agora com
  despesa deflacionada de aportes — sobe como o usuario esperava.

**UI (Fases 1, 3, 4):**
- Transaction/Recurring forms: opcao "Investimento" no tipo; categoria
  filtrada; delta igual despesa (cai no else-path do adjust_balance).
- TransactionList/RecurringList: cor violeta + sinal "-" para
  investimento; categoria e conta renderizam normalmente.
- SummaryCards: 4o card "Investido" (violeta) + rotulo "Saldo" virou
  "Geracao do mes".
- BudgetComparison: `DiffBadge` trata investimento como receita (aportar
  acima do planejado e bom — verde).
- Daily-flow: nova linha "Investido" (violeta) entre Saida e Saldo Final;
  investimento reduz saldo corrente junto com despesa.
- Forecast-table: nova secao "Investimentos" entre Despesas e Saldo, com
  breakdown Real/Previsto. `ProjectionIcon` aceita cor `violet`.
- Import review: dropdown de tipo permite reclassificar despesa->
  investimento na hora de importar (antes era badge fixo).
- CategoryForm: opcao "Investimento" (sem budget, sem is_essential).
  CategoryList: grid vira 3 colunas (Receitas | Despesas | Investimentos).

**Dados reclassificados:**
- `scripts/reclassify-investments.mjs` — dry-run por default, `--commit`
  aplica. Matcha categorias de despesa com nome contendo "Investimento"
  ou "Reserva" (patterns customizaveis via `--patterns`). Troca `type`
  em categoria + transacoes + recorrencias vinculadas. Saldos NAO mudam.
- Executado: 2 categorias (PF | Investimentos, PF | Reserva) + 1
  transacao (R$ 24.000,00). Audit registrado.

**Testes:**
- 2 casos novos em `net-revenue.test.ts` (213/213 total):
  investimento fora de receitas/despesas e fora de blocos PJ mesmo
  quando categoria e de grupo marcado como net revenue.

**Revisao de codigo:**
- 6 problemas (0 alta, 1 media, 5 baixa). Unico fix aplicado: `DiffBadge`
  semantica de investimento. Outros 5 (false-positive do reclassify,
  audit silencioso no script, recurrence-detection nao pula investimento,
  type literal duplicado em daily-flow, helper de categoria vazia no
  form) ficaram como debitos tecnicos.

**Commits entregues em main:**
`9b39596` (Fase 0) · `24a2351` (Fase 1) · `f66fb11` (Fase 2) · `bab62e7`
(Fase 3) · `db627a6` (Fase 4) · `7f2262c` (Fase 5 — script reclassify) ·
`1aba60b` (fix DiffBadge pos-revisao).

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
- Integracao opcional `destination_investment_id` em transactions:
  transacao tipo investimento poderia criar `investment_entries`
  automaticamente. Fase 5 original do plano `tipo-investimento.md`,
  deferida.

## Debitos Tecnicos / Riscos Conhecidos
- 229 transacoes no banco em sua maioria sem categoria: revisao manual ou
  criar regras. Apos categorizar algumas, o historico passa a alimentar
  cascata em futuras importacoes.
- Parsers regex sao frageis a mudancas de layout do banco. Precisa
  telemetria/testes com fixtures para detectar regressao.
- Saldos de contas nao-reconciliadas (Inter PJ R$ 0, C6 -R$ 1.431,
  cartoes) precisam ajuste via Contas -> Reconciliar.
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
- `recurrence-detection.ts` nao pula `investimento`: aportes podem virar
  sugestao de recorrencia (semanticamente ok, UI nao otimizada).
- `scripts/reclassify-investments.mjs`: match por substring e agressivo.
  False-positive potencial para "Reserva de X" que nao seja aporte.
  Mitigado por dry-run default.
- Script reclassify silencia erro do `audit_logs.insert`.
- Form de transacao/recorrencia sem helper quando nao ha categoria do
  tipo selecionado (usuario ve dropdown vazio e erro "selecione
  categoria" sem saber onde criar).
- Branch remota `feat/investimento-type` ainda existe no GitHub —
  pode ser deletada.

## Proxima Acao Sugerida
Validar manualmente em producao (https://finapp-kohl.vercel.app) apos
deploy do Vercel concluir: confirmar card "Investido" no dashboard, mes
com a transacao de R$ 24.000 com despesa reduzida e investido
correspondente, savings rate subiu. Deletar branch remota
`feat/investimento-type` depois da validacao em produto (comando:
`git push origin --delete feat/investimento-type`).
