# Plano — Receita Líquida PJ como bloco master-detail

Data: 2026-04-19
Status: aprovado, pendente execução

## Objetivo

Consolidar o lucro da PJ como **uma linha única de receita na visão PF**, com drill-down para
ver receita bruta, impostos e custos associados. O foco é sempre a pessoa física — a PJ é
uma **fornecedora de renda líquida** para ela.

### Visão final do Dashboard

```
RECEITAS PF (consolidado)                     16.200,00
├── Salário CLT                                5.000,00
├── Aluguel imóvel                             2.000,00
├── Contribuição esposa                        1.000,00
└── Lucro PJ  ▼                                8.200,00   ← linha agregada
      ├── (+) Receita bruta serviços         10.000,00
      ├── (−) Impostos                        1.500,00
      ├── (−) Contabilidade                     300,00
      └── (=) Lucro distribuído                8.200,00

DESPESAS PF                                    9.700,00
└── (apenas grupos PF — PJ NÃO entra aqui)
```

## Conceito-chave

Um `category_group` pode ser marcado como **bloco de receita líquida** (`is_net_revenue_block`).
Quando marcado:

- `Σ receitas(grupo) − Σ despesas(grupo)` = receita líquida que **soma** no KPI Receitas PF
- Despesas do grupo **não aparecem** no KPI Despesas PF (senão subtrairia 2×)
- Grupo é exibido como linha expansível na seção de receitas do dashboard
- Gráficos e tabelas de despesas **excluem** os grupos marcados

A PJ fica como o primeiro (e inicialmente único) grupo assim marcado. O conceito é
generalizado — no futuro, pode abranger uma segunda PJ, imóveis alugados operados como
bloco, etc.

## Decisões registradas

1. **Como marcar grupos:** nova tabela `category_groups` (user_id, name, is_net_revenue_block)
   com RLS. O campo `category_group` (TEXT) em `categories` vira a FK lógica (via name).
2. **Seed default:** grupo "Pessoa Jurídica" nasce com `is_net_revenue_block = true`;
   demais 7 grupos com `false`.
3. **Categoria `PF | Lucro PJ` removida do seed** — torna-se redundante (o lucro é calculado,
   não lançado como receita separada).
4. **Dados atuais podem ser eliminados** — são de teste. Script de limpeza será executado antes
   da primeira validação do novo modelo.
5. **Transferência PJ→PF** continua pura, sem categoria, zero efeito em KPI.
6. **Competência PJ segue o `closing_day` do usuário** — a renda é reconhecida quando ocorre
   na PJ, não quando transfere para a conta PF.

## Fases de implementação

### Fase 1 — Schema

**Migrations a criar:**

- **`023_category_groups.sql`** (aditiva)
  - Cria tabela `category_groups` com RLS
  - Campos: `id`, `user_id`, `name`, `is_net_revenue_block`, `created_at`, `updated_at`
  - Constraint: `UNIQUE (user_id, name)`
  - Índice: `(user_id, is_net_revenue_block) WHERE is_net_revenue_block = true`
  - Trigger `seed_default_category_groups()` para novos usuários, criando os 8 grupos com
    `is_net_revenue_block = true` apenas para "Pessoa Jurídica"

- **`024_seed_categories_v3.sql`** (correção de seed)
  - Remove categoria `PF | Lucro PJ` do seed (migration 022)
  - Demais 26 categorias permanecem

**Rollback:** `DROP TABLE category_groups;` + restaurar migration 022.

### Fase 2 — Cálculo de KPIs

**Arquivos afetados:**

- `src/app/(dashboard)/page.tsx` e/ou `src/hooks/useDashboardData.ts` (onde estiver a lógica de KPI)
- `src/lib/forecast.ts`
- `src/components/dashboard/FinancialKPIs.tsx`
- `src/components/dashboard/BudgetComparison.tsx`
- `src/components/dashboard/CategoryChart.tsx`

**Nova função utilitária em `src/lib/net-revenue.ts`:**

```ts
interface KPIBreakdown {
  totalReceitasCents: number;
  totalDespesasCents: number;
  netRevenueBlocks: Array<{
    groupName: string;
    grossReceitasCents: number;
    grossDespesasCents: number;
    netCents: number;
    items: Array<{ categoryName: string; type: 'receita' | 'despesa'; amountCents: number }>;
  }>;
}

function computeKPIsWithNetRevenue(transactions, categories, categoryGroups): KPIBreakdown
```

**Lógica:**

1. Separar transações por `category_group` → dois buckets: grupos `net_revenue` vs demais
2. Grupos `net_revenue`: computar `receitas − despesas` = bloco agregado → entra em Receitas PF
3. Grupos normais: receitas somam em Receitas; despesas somam em Despesas
4. Forecast: mesma lógica aplicada sobre projeções

**Mantém intocado:** `daily-flow.ts` (fluxo de caixa diário mostra movimentação real
dia a dia; o conceito de "líquido" é mensal).

### Fase 3 — UI

- **Dashboard Receitas:** novo componente `NetRevenueBlock` — linha expansível que mostra
  Bruto/Custos/Líquido e, ao abrir, lista as transações componentes
- **CategoryChart (donut/bar):** excluir grupos `net_revenue` da pizza de despesas; adicionar
  toggle "ver detalhes PJ" que mostra decomposição separada
- **BudgetComparison:** excluir categorias de grupos `net_revenue`
- **Configurações → Categorias:** permitir marcar/desmarcar flag `is_net_revenue_block` ao
  editar um grupo (modal novo ou linha expandida)
- **Group Report Modal** (`src/components/contas/group-report-modal.tsx`): mantém como está,
  já trabalha em nível de grupo e separa receitas/despesas com líquido. Reutilizável.
- **Forecast / Fluxo Previsto:** exibir bloco PJ colapsado por padrão, expansível

### Fase 4 — Limpeza de dados

Script SQL (executado uma única vez via Supabase SQL Editor, após confirmação final):

```sql
-- Para o usuário de teste especifico
DELETE FROM transactions         WHERE user_id = :uid;
DELETE FROM recurring_transactions WHERE user_id = :uid;
DELETE FROM investment_entries   WHERE investment_id IN (SELECT id FROM investments WHERE user_id = :uid);
DELETE FROM investments          WHERE user_id = :uid;
DELETE FROM goals                WHERE user_id = :uid;
DELETE FROM debts                WHERE user_id = :uid;
DELETE FROM monthly_closings     WHERE user_id = :uid;
DELETE FROM audit_logs           WHERE user_id = :uid;
UPDATE accounts SET balance_cents = initial_balance_cents WHERE user_id = :uid;
```

**Nota:** contas e categorias são preservadas — apenas movimentação é apagada.

### Fase 5 — Testes

- **Unit tests** em `src/lib/__tests__/net-revenue.test.ts`:
  - Caso 1: só receitas PF → KPI normal, bloco PJ vazio
  - Caso 2: PJ com receita > despesa → KPI receita inclui líquido positivo
  - Caso 3: PJ com receita < despesa → KPI receita absorve líquido negativo (dedução)
  - Caso 4: múltiplos grupos `net_revenue` → agregação correta
- **E2E (Playwright):** novo spec `net-revenue-pj.spec.ts` que:
  1. Cria conta PJ
  2. Cria transações PJ (receita bruta + impostos + contabilidade)
  3. Abre dashboard e valida KPI Receitas = valor líquido esperado
  4. Expande bloco PJ e valida componentes

## Critérios de sucesso

- [ ] Ao criar receita PJ de R$ 10.000 e despesas PJ de R$ 1.800, o KPI "Total Receitas"
      mostra R$ 8.200 (+ demais receitas PF)
- [ ] "Total Despesas" do dashboard não inclui despesas PJ
- [ ] Bloco PJ é expansível no dashboard e mostra Bruto/Custos/Líquido
- [ ] Gráfico de categorias de despesas PF não mostra categorias PJ
- [ ] Configurações permite marcar/desmarcar flag `is_net_revenue_block` em grupos
- [ ] `npm run build` sem erros
- [ ] `npm run lint` sem erros
- [ ] Todos os testes unitários passam (existentes + novos)
- [ ] E2E `net-revenue-pj.spec.ts` passa

## Impacto e riscos

| Aspecto | Avaliação |
|---------|-----------|
| Migrations | 2 aditivas, 0 destrutivas |
| Arquivos alterados | ~15 (hook dashboard + componentes de visualização + util novo) |
| Risco | **Baixo** — flag opcional; grupos não marcados mantém comportamento atual |
| Rollback | Simples — DROP TABLE + restaurar seed anterior |
| Dados em produção | **Nenhum usuário real ainda**; dados de teste serão recriados |

## Pontos em aberto (precisam decisão antes de codificar)

1. **Tabela `category_groups` vs flag inline em `categories`?**
   Proposta: tabela separada. Motivo: grupo é entidade conceitual; múltiplas categorias
   compartilham o mesmo grupo e suas propriedades.

2. **Generalizar nome do campo?** `is_net_revenue_block` (proposto) vs `treats_as_deduction`.
   Proposta: manter `is_net_revenue_block` — mais legível em código/UI.

3. **Drill-down sempre visível ou colapsado por padrão?**
   Proposta: colapsado — o foco é PF; detalhe PJ é para quem quer.

4. **Forecast mostra projeção do bloco PJ separadamente?**
   Proposta: sim — projeção de receita bruta PJ, impostos e contabilidade usam
   `projection_type` individual (recurring/historical) e o bloco agregado consolida.

## Próxima ação

Validar os **4 pontos em aberto** acima com o usuário; após alinhamento, iniciar Fase 1
(migration 023 e 024).
