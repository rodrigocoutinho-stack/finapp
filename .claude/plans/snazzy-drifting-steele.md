# Plano: Reconciliação de Saldo + Gestão de Dívidas

## Contexto

Itens 5 e 9 do plano de melhorias Codex. A reconciliação detecta divergências entre saldo da conta e soma de transações. A gestão de dívidas é uma feature CRUD completa com simulador de pagamento extra e integração no dashboard.

---

## Feature 1: Reconciliação de Saldo

### Arquivos a criar

| # | Arquivo | Descrição |
|---|---------|-----------|
| 1 | `supabase/migrations/015_initial_balance.sql` | `initial_balance_cents` em accounts + backfill |
| 2 | `src/components/contas/account-reconciliation.tsx` | Modal com tabela de divergências + botão ajustar |

### Arquivos a modificar

| # | Arquivo | Mudança |
|---|---------|---------|
| 3 | `src/types/database.ts` | `initial_balance_cents` no tipo Account |
| 4 | `src/components/contas/account-form.tsx` | Campo "Saldo inicial" na criação |
| 5 | `src/app/(dashboard)/contas/page.tsx` | Botão "Reconciliar" + query transações + modal |
| 6 | `src/components/dashboard/financial-insights.tsx` | Insight BALANCE_DIVERGENCE |
| 7 | `src/app/(dashboard)/page.tsx` | Calcular divergências e passar como prop |

### Detalhamento

**Migration 015**: Adiciona `initial_balance_cents INTEGER NOT NULL DEFAULT 0` em accounts. Backfill: `initial_balance_cents = balance_cents - SUM(transações)` para garantir que contas existentes reconciliem sem divergência.

**account-form.tsx**: Na criação, campo "Saldo inicial (R$)" com `toCents()`. O insert envia `balance_cents: initialCents` e `initial_balance_cents: initialCents`. Na edição, campo oculto (não faz sentido alterar retroativamente).

**account-reconciliation.tsx**: Recebe `accounts` e `transactionsByAccount` (Map). Para cada conta calcula:
- `calculatedBalance = initial_balance_cents + SUM(receitas) - SUM(despesas)`
- `divergence = balance_cents - calculatedBalance`
- Exibe tabela: Conta | Saldo Registrado | Saldo Calculado | Divergência
- Badge "OK" (verde) ou "Divergência" (amarelo/vermelho)
- Botão "Ajustar" que faz `update balance_cents = calculatedBalance`

**contas/page.tsx**: Novo state `showReconciliation`. Query paralela de transações `select("account_id, type, amount_cents")` sem filtro de data. Botão "Reconciliar" no header abre modal.

**Insight**: Se alguma conta tem divergência > 0, mostrar warning sugerindo reconciliar.

---

## Feature 2: Gestão de Dívidas

### Arquivos a criar

| # | Arquivo | Descrição |
|---|---------|-----------|
| 8 | `supabase/migrations/016_debts.sql` | Tabela `debts` com RLS + índice |
| 9 | `src/lib/debt-utils.ts` | Funções puras: progresso, juros, payoff, simulador |
| 10 | `src/components/dividas/debt-form.tsx` | Formulário criação/edição |
| 11 | `src/components/dividas/debt-list.tsx` | Cards com progresso + ações |
| 12 | `src/components/dividas/debt-simulator.tsx` | Modal "e se eu pagar X a mais?" |
| 13 | `src/app/(dashboard)/dividas/page.tsx` | Página CRUD completa |
| 14 | `src/components/dashboard/debt-summary.tsx` | Widget compacto no dashboard |

### Arquivos a modificar

| # | Arquivo | Mudança |
|---|---------|---------|
| 15 | `src/types/database.ts` | Tipo Debt (Row/Insert/Update/Relationships) |
| 16 | `src/components/layout/sidebar.tsx` | Link "Dívidas" entre Metas e Fluxo (9→10 itens) |
| 17 | `src/app/(dashboard)/page.tsx` | Query debts + renderizar DebtSummary |
| 18 | `src/components/dashboard/financial-insights.tsx` | Insights DEBT_TO_INCOME_HIGH e DEBT_HIGH_INTEREST |

### Detalhamento

**Migration 016 — `debts`**:
```
Campos:
- id UUID PK
- user_id UUID FK profiles, NOT NULL, ON DELETE CASCADE
- name TEXT NOT NULL
- type TEXT NOT NULL CHECK IN ('emprestimo','financiamento','cartao','cheque_especial','outro')
- original_amount_cents INTEGER NOT NULL CHECK > 0 AND <= 100B
- remaining_amount_cents INTEGER NOT NULL CHECK >= 0
- monthly_payment_cents INTEGER NOT NULL DEFAULT 0 CHECK >= 0
- interest_rate_monthly NUMERIC(8,4) NOT NULL DEFAULT 0 CHECK >= 0
- start_date DATE NOT NULL
- due_date DATE (opcional)
- total_installments INTEGER (opcional, CHECK > 0)
- paid_installments INTEGER NOT NULL DEFAULT 0 CHECK >= 0
- is_active BOOLEAN NOT NULL DEFAULT TRUE
- created_at TIMESTAMPTZ DEFAULT now()

RLS: FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)
Índice: idx_debts_user_active (user_id, is_active)
```

**Nota**: `interest_rate_monthly` é NUMERIC no Postgres mas retorna como `number` no JS via Supabase. Se vier como string, converter com `Number()`.

**debt-utils.ts** — Funções puras:
- `DEBT_TYPE_LABELS` — labels pt-BR para cada tipo
- `getDebtProgress(debt)` — % pago = (original - remaining) / original * 100
- `getMonthlyInterestCost(debt)` — remaining * rate/100
- `getTimeToPayoff(debt)` — simulação iterativa (max 600 iterações)
- `getTotalInterestCost(debt)` — soma de juros até quitação
- `getExtraPaymentSavings(debt, extraCents)` — { interestSaved, monthsSaved }
- `getDebtStatus(debt)` — { label, color } (Em dia/Vencida/Quitada)

**debt-form.tsx** — Campos: nome, tipo (select), valor original (R$), saldo remanescente (R$, default = original na criação), parcela mensal (R$), taxa de juros (% a.m.), data início, data vencimento (opcional), total parcelas (opcional), parcelas pagas.

**debt-list.tsx** — Grid `md:grid-cols-2 xl:grid-cols-3`. Cards com: nome + tipo badge, barra de progresso, saldo devedor, parcela/mês, juros/mês estimados, status badge, ações (Editar, Excluir, Simular).

**debt-simulator.tsx** — Modal com input "Valor extra/mês". Calcula em tempo real: meses economizados, juros economizados, nova data de quitação. Alerta se parcela não cobre juros.

**dividas/page.tsx** — Padrão idêntico a metas/page.tsx. PageHeader + botão "Nova dívida" + Modal form + DebtList.

**debt-summary.tsx** — Card no dashboard: total devedor, custo mensal (parcelas), nº de dívidas ativas. Link "Ver todas → /dividas".

**sidebar.tsx** — Link "Dívidas" com ícone de cartão de crédito, posição entre Metas e Fluxo.

**Insights**:
- DEBT_TO_INCOME_HIGH: total parcelas > 30% da receita → alert
- DEBT_HIGH_INTEREST: qualquer dívida com taxa > 3%/mês → warning

---

## Sequência de implementação

**Bloco A — Reconciliação:**
1. Migration 015 + tipo Account atualizado
2. account-form.tsx (campo saldo inicial)
3. account-reconciliation.tsx
4. contas/page.tsx (botão + modal + query)
5. financial-insights.tsx + dashboard page (insight divergência)

**Bloco B — Dívidas:**
1. Migration 016 + tipo Debt
2. debt-utils.ts
3. debt-form.tsx + debt-list.tsx + debt-simulator.tsx
4. dividas/page.tsx
5. sidebar.tsx
6. debt-summary.tsx + dashboard integration + insights

## Verificação

1. `npm run build` — sem erros
2. Executar migrations 015 e 016 no Supabase SQL Editor
3. Reconciliação: criar conta com saldo, adicionar transações, verificar "OK"; alterar saldo manual e verificar divergência
4. Dívidas: CRUD completo, simulador, widget no dashboard, insights
5. Sidebar: 10 links, "Dívidas" ativo na página correta
