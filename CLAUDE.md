# CLAUDE.md - Contrato de Trabalho

## Projeto
FinApp - Gestão Financeira Pessoal

## ESTADO ATUAL — Ver .claude/estado-atual.md

## DECISÕES CONSOLIDADAS — Ver .claude/decisoes-consolidadas.md

## Contexto do Projeto

### Stack
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Supabase (Auth + PostgreSQL + RLS)
- Recharts (gráficos)
- Google Generative AI (`@google/generative-ai`) — Gemini 2.5 Flash

### Infraestrutura
- **Supabase:** Projeto `knwbotsyztakseriiwtv`, Migrations 001-018
- **Vercel:** `finapp-kohl.vercel.app` (deploy automático via GitHub)
- **GitHub:** `https://github.com/rodrigocoutinho-stack/finapp.git`

### Funcionalidades Implementadas
- Autenticação (login, registro, logout, auto-logout por inatividade 30 min)
- CRUD Contas (banco, cartão, carteira, reserva de emergência, saldo inicial, reconciliação)
- CRUD Categorias (receita/despesa, teto de orçamento, flag essencial — dentro de Configurações)
- CRUD Transações (filtro mensal, atualização automática de saldo via RPC atômico)
- Transações Planejadas (recorrentes, pontuais, com período, detecção automática de padrões)
- Importação OFX/CSV/PDF (mapeamento CSV, extração PDF via IA Gemini, auto-categorização por regras)
- Investimentos (CRUD + lançamentos + quadro de evolução + retorno real IPCA)
- Metas Financeiras (CRUD + progresso + vínculo a conta + cards visuais + widget dashboard + insights)
- Gestão de Dívidas (CRUD + simulador pagamento extra + widget dashboard + insights juros/renda)
- Dashboard (hero cards, 5 KPIs, insights proativos, alertas orçamento, previsto vs realizado, investimentos, recorrências sugeridas, metas, dívidas, fechamento mensal persistente com histórico, últimas transações)
- Histórico de KPIs (evolução mensal com gráficos Recharts + tabela de dados, baseado em monthly_closings)
- Fluxo unificado (Fluxo Diário + Fluxo Previsto em abas)
- Assistente Financeiro IA (Gemini 2.5 Flash, streaming, contexto conversacional)
- Simuladores Educacionais (juros compostos, inflação, custo de oportunidade, independência financeira — gráficos interativos)
- Trilha de Auditoria (tabela audit_logs, helper fire-and-forget, integração em 10 componentes)
- Testes E2E com Playwright (auth, dashboard, transações, contas — 4 suites)
- Security Hardening (HTTP headers, RPC hardening, RLS strengthening, error sanitization, MIME validation, auth guard)
- Configurações (abas Geral + Categorias + Regras de Importação, closing day 1-28, meta reserva de emergência)

## Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (dashboard)/
│       ├── page.tsx              # Dashboard principal (2 colunas)
│       ├── layout.tsx            # Sidebar + main com padding dinâmico
│       ├── contas/page.tsx
│       ├── categorias/page.tsx    # Redirect → /configuracoes
│       ├── transacoes/
│       │   ├── page.tsx
│       │   └── importar/page.tsx
│       ├── historico/page.tsx      # Histórico de KPIs (evolução mensal)
│       ├── fluxo/page.tsx        # Fluxo Diário + Previsto (abas)
│       ├── investimentos/page.tsx
│       ├── assistente/page.tsx     # Chat IA (Gemini Flash)
│       ├── metas/page.tsx          # CRUD metas financeiras
│       ├── dividas/page.tsx        # CRUD dívidas + simulador
│       ├── simuladores/page.tsx    # 3 simuladores educacionais (abas)
│       ├── configuracoes/page.tsx  # Abas: Geral + Categorias + Regras
│       └── recorrentes/page.tsx
├── components/
│   ├── ui/                       # Button, Input, Select, Modal, Card, Badge, PageHeader, EmptyState, Skeleton
│   ├── layout/                   # Sidebar, DashboardShell, UserAvatar, GreetingHeader
│   ├── dashboard/                # SummaryCards, FinancialKPIs, FinancialInsights, CategoryChart, MonthPicker, ForecastTable, DailyFlowTable, InvestmentSummary, BudgetComparison, MonthlyClosing, RecurrenceSuggestions, GoalsSummary, DebtSummary
│   ├── metas/                    # GoalForm, GoalList
│   ├── dividas/                  # DebtForm, DebtList, DebtSimulator
│   ├── historico/                 # KpiHistory
│   ├── simuladores/              # CompoundInterestSimulator, InflationSimulator, OpportunityCostSimulator
│   ├── contas/                   # AccountForm, AccountList, AccountReconciliation
│   ├── categorias/               # CategoryForm, CategoryList, CategoryRules
│   ├── assistente/               # ChatMessage, ChatInput
│   ├── transacoes/               # TransactionForm, TransactionList, Import*
│   ├── recorrentes/              # RecurringForm, RecurringList
│   └── investimentos/            # InvestmentForm, InvestmentList, EntryForm, EntryList, InvestmentDashboard
├── contexts/
│   ├── toast-context.tsx         # Context + Provider + useToast()
│   ├── preferences-context.tsx   # closingDay + fullName + PreferencesProvider
│   ├── sidebar-context.tsx       # collapsed + toggleCollapsed + SidebarProvider
│   └── inactivity-context.tsx    # Auto-logout 30 min + modal aviso
├── lib/
│   ├── supabase/                 # client.ts (singleton), server.ts
│   ├── ai/                       # system-prompt.ts, financial-context.ts
│   ├── inflation.ts              # getIPCA12Months (API BCB), calcRealReturn
│   ├── utils.ts                  # formatCurrency, toCents, formatDate, getMonthRange, etc.
│   ├── forecast.ts               # Projeção mensal (recurring + historical + forecast vs real)
│   ├── daily-flow.ts             # Fluxo diário (real + planejado por dia)
│   ├── closing-day.ts            # Matemática de competência/fechamento
│   ├── category-icons.tsx        # CategoryIcon SVG component + alias map
│   ├── investment-utils.ts       # Labels, agrupamento, cálculo de saldo
│   ├── ofx-parser.ts             # Parser OFX/QFX
│   ├── csv-parser.ts             # Parser CSV com detecção de delimitador
│   ├── pdf-import.ts             # Client helper para importação PDF via Gemini
│   ├── rate-limit.ts             # Rate limiter in-memory sliding window
│   ├── recurrence-detection.ts   # detectRecurrences
│   ├── goal-utils.ts             # Cálculos de metas
│   ├── debt-utils.ts             # Cálculos de dívidas
│   ├── simulator-utils.ts        # Cálculos de simuladores
│   └── audit-log.ts              # Helper logAudit fire-and-forget
└── types/
    └── database.ts               # Types do Supabase
```

## Banco de Dados

### Tabelas
| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfis de usuário (extends auth.users), inclui `closing_day`, `reserve_target_months` |
| `accounts` | Contas (banco, cartão, carteira), `is_emergency_reserve`, `initial_balance_cents` |
| `categories` | Categorias com `projection_type`, `budget_cents`, `is_essential` |
| `transactions` | Transações (receita/despesa) |
| `recurring_transactions` | Transações planejadas (recorrentes, pontuais, com período) |
| `investments` | Investimentos (CDB, Tesouro, Ações, etc.) |
| `investment_entries` | Lançamentos de investimentos (aportes, resgates, saldos) |
| `category_rules` | Regras de categorização automática (pattern → category) |
| `goals` | Metas financeiras (prazo, progresso, vínculo a conta opcional) |
| `debts` | Dívidas (juros, parcelas, simulação de pagamento extra) |
| `audit_logs` | Trilha de auditoria imutável (ação, entidade, detalhes JSONB) |
| `monthly_closings` | Fechamento mensal persistente com snapshot de KPIs |

### Migrations (001-018)
1. `001_initial_schema.sql` — Estrutura base (profiles, accounts, categories, transactions)
2. `002_seed_categories.sql` — Categorias padrão
3. `003_add_projection_type.sql` — Campo projection_type em categories
4. `004_recurring_transactions.sql` — Tabela recurring_transactions
5. `005_recurring_period.sql` — Campos start_month/end_month
6. `006_investments.sql` — Tabelas investments e investment_entries
7. `007_closing_day.sql` — Campo closing_day em profiles
8. `008_quick_wins.sql` — is_emergency_reserve + tabela category_rules
9. `009_adjust_balance_rpc.sql` — Função RPC atômica adjust_account_balance
10. `010_composite_indexes.sql` — Índices compostos para performance
11. `011_budgets_and_reserve_target.sql` — budget_cents + reserve_target_months
12. `012_security_hardening.sql` — RPC hardening + RLS strengthening + CHECK constraints
13. `013_goals.sql` — Tabela goals com RLS, índices, constraints
14. `014_essential_categories.sql` — Flag is_essential em categories
15. `015_initial_balance.sql` — initial_balance_cents em accounts + backfill
16. `016_debts.sql` — Tabela debts com RLS, índice, constraints
17. `017_audit_logs.sql` — Tabela audit_logs (INSERT + SELECT imutável)
18. `018_monthly_closings.sql` — Tabela monthly_closings (fechamento mensal + KPIs snapshot)

## Navegação (Sidebar)

| # | Label | Rota |
|---|-------|------|
| 1 | Dashboard | `/` |
| 2 | Contas | `/contas` |
| 3 | Transações | `/transacoes` |
| 4 | Recorrentes | `/recorrentes` |
| 5 | Metas | `/metas` |
| 6 | Dívidas | `/dividas` |
| 7 | Histórico | `/historico` |
| 8 | Fluxo | `/fluxo` |
| 9 | Investimentos | `/investimentos` |
| 10 | Assistente IA | `/assistente` |
| 11 | Simuladores | `/simuladores` |
| 12 | Configurações | `/configuracoes` |

## Próximos Passos

### Redesign UX — Fase 3: Refinamento
- [ ] Chart upgrade — CategoryChart horizontal → donut/pie com legenda lateral
- [ ] Form styling — inputs com melhor hierarquia visual
- [ ] DataTable — componente reutilizável para tabelas padronizadas

### Robustez e Qualidade
- [ ] Validações de formulário mais rigorosas
- [ ] Paginação server-side para tabelas com muitos registros
- [ ] Connection pooling (Supabase Pooler)

### Futuro
- [ ] Filtros avançados, exportar dados, metas de orçamento
- [ ] Dark mode
- [ ] PWA / mobile responsivo avançado

## Regras

### Linguagem
- UI sempre em pt-BR
- Código (variáveis, funções, comentários) em inglês
- Nomes de tabelas e colunas do banco em inglês

### Valores Monetários
- Armazenar sempre em centavos (integer)
- Converter para R$ apenas na exibição
- Usar `formatCurrency()` e `toCents()` de `@/lib/utils`

### Supabase
- Usar `@supabase/ssr` para criar clients
- Client browser: `@/lib/supabase/client.ts` (singleton — NÃO incluir `supabase` em dependency arrays de hooks)
- Client server: `@/lib/supabase/server.ts`
- RLS ativo em todas as tabelas — filtrar por `auth.uid() = user_id`

### Componentes
- Componentes UI reutilizáveis em `src/components/ui/`
- Componentes de domínio em `src/components/<domínio>/`
- Usar `"use client"` apenas quando necessário

### Padrões
- Não usar `any` — tipar tudo
- Tratar erros com mensagens claras em pt-BR
- Estados de loading em toda operação assíncrona
- Confirmação antes de excluir registros

### Documentação
- Ao final de toda sessão com alteração de código, atualizar `.claude/estado-atual.md`
- Registrar decisões técnicas em `.claude/decisoes-consolidadas.md`

## Segurança e Operação

### Dados Financeiros
- Este projeto lida com dados financeiros sensíveis — assumir postura conservadora por padrão
- Nunca executar comandos destrutivos sem confirmação explícita do usuário:
  - `rm -rf`, `del /s`, `truncate`, `drop`, `reset --hard`, `prune`
  - Migrations que removam colunas, alterem tipos ou afetem dados existentes
  - Qualquer comando que afete produção, credenciais ou dados persistentes

### Schema e Migrations
- Nunca alterar schema, constraints, RLS ou criar migrations destrutivas sem:
  - Explicar o impacto da mudança
  - Descrever como reverter (rollback)
  - Pedir confirmação explícita do usuário
- Migrations aditivas simples (ADD COLUMN, CREATE TABLE) podem ser propostas diretamente

### Autonomia do Agente
- **Pode executar sozinho:** leitura/escrita de arquivos, ajustes de código, `npm test`, `npm run build`, `npm run lint`
- **Precisa de confirmação:** migrations destrutivas, comandos que afetem dados persistentes, ações irreversíveis, push para produção

### Validação Pós-Tarefa
- Antes de concluir tarefas que envolvam mais de 3 arquivos ou alterações estruturais, verificar:
  - O código compila? (`npm run build`)
  - Houve impacto em dados ou schema? Se sim, explicitar
  - Existe risco de segurança introduzido? Se sim, explicitar
  - Existe rollback claro? Se não, alertar o usuário

## Comandos Úteis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build
npm run test:e2e     # Testes E2E (requer env vars E2E_USER_EMAIL/E2E_USER_PASSWORD)
git status && git add . && git commit -m "mensagem" && git push
```
