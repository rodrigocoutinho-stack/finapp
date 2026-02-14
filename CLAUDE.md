# CLAUDE.md - Contrato de Trabalho

## Projeto
FinApp - Gestão Financeira Pessoal

## Estado Atual (Atualizado: 14/02/2026)

**MVP completo e funcional + Redesign UX Fase 2 concluído.** Todas as funcionalidades implementadas e testadas (E2E 22/22 passos aprovados, 0 erros console):

- [x] Scaffolding (Next.js 16, Tailwind v4, Supabase)
- [x] Database schema + migrations 001-007 (RLS ativo)
- [x] Autenticação (login, registro com confirmação por email, logout)
- [x] CRUD Contas (banco, cartão, carteira)
- [x] CRUD Categorias (receita/despesa, proteção contra exclusão em uso, tipo de projeção — dentro de Configurações)
- [x] CRUD Transações (filtro mensal, atualização automática de saldo)
- [x] Transações Planejadas (recorrentes, pontuais, com período)
- [x] Importação OFX (extrato bancário e cartão de crédito)
- [x] Investimentos (CRUD + lançamentos + quadro de evolução)
- [x] Dashboard (hero cards, gráfico categorias, previsto vs realizado, investimentos, últimas transações)
- [x] Fluxo unificado (Fluxo Diário + Fluxo Previsto em abas)
- [x] Dia de fechamento (competência personalizada por usuário)
- [x] Configurações (abas Geral + Categorias, closing day 1-28)
- [x] Redesign UX Fase 1 (paleta slate/rose, componentes UI, skeleton, toast, acessibilidade)
- [x] Redesign UX Fase 2 (sidebar, hero cards, ícones categorias, greeting, layout 2 colunas)

**Supabase:** Projeto `knwbotsyztakseriiwtv`
- [x] Migrations 001-007 executadas no SQL Editor

**GitHub:** `https://github.com/rodrigocoutinho-stack/finapp.git`

## Últimas Alterações (14/02/2026)

### Categorias movidas para Configurações
- `src/app/(dashboard)/configuracoes/page.tsx` — Reescrito com tabs "Geral" / "Categorias" (pill toggle, mesmo padrão visual do Fluxo)
- `src/app/(dashboard)/categorias/page.tsx` — Substituído por redirect para `/configuracoes`
- `src/components/layout/sidebar.tsx` — Link Categorias removido (sidebar 8→7 itens)
- `src/components/layout/navbar.tsx` — Link Categorias removido (consistência)

### Redesign UX — Fase 2: 5 Ações Prioritárias + Extras

**Novos componentes:**
- `src/lib/category-icons.tsx` — `<CategoryIcon>` SVG inline (~13 ícones + fallback), normalização de acentos + alias map
- `src/components/layout/sidebar.tsx` — Sidebar fixa desktop (`w-60 bg-slate-900`) + drawer mobile (`w-72`), colapsável (`w-[68px]`)
- `src/components/layout/user-avatar.tsx` — Avatar circular com iniciais (`emerald-100/700`)
- `src/components/layout/greeting-header.tsx` — Saudação por hora + data formatada pt-BR
- `src/contexts/sidebar-context.tsx` — `SidebarProvider` + `useSidebar()`, persistência localStorage

**Arquivos modificados:**
- `src/app/(dashboard)/layout.tsx` — `<Sidebar />` substitui `<Navbar />`, padding dinâmico `lg:pl-60` / `lg:pl-[68px]`
- `src/app/(dashboard)/page.tsx` — GreetingHeader, layout 2 colunas (`lg:grid-cols-5`), DailyFlowTable removido
- `src/app/providers.tsx` — `SidebarProvider` adicionado
- `src/contexts/preferences-context.tsx` — `fullName` adicionado ao context
- `src/components/dashboard/summary-cards.tsx` — Hero cards com ícones circulares coloridos
- `src/components/categorias/category-list.tsx` — CategoryIcon antes do nome
- `src/components/dashboard/budget-comparison.tsx` — CategoryIcon nas linhas
- `src/components/dashboard/category-chart.tsx` — CategoryIcon no eixo Y (foreignObject)
- `src/components/dashboard/daily-flow-table.tsx` — CategoryIcon nas células

### Unificação Fluxo Diário + Fluxo Previsto
- `src/app/(dashboard)/fluxo/page.tsx` — Página NOVA com abas "Fluxo Diário" / "Fluxo Previsto"
- `src/app/(dashboard)/fluxo-previsto/` — Diretório REMOVIDO

### Sidebar Collapsível
- Toggle chevron `<` / `>`, transição `duration-300`
- Expandido: logo "FinApp", links com ícone + texto, avatar + nome
- Recolhido: logo "F", só ícones centralizados, tooltips

### Alterações anteriores (13/02/2026)

- Dia de fechamento — competência personalizada (migration 007, closing-day.ts, PreferencesProvider, página Config.)
- Previsto vs Realizado — BudgetComparison com barras de progresso por categoria
- Redesign UX Fase 1 — paleta slate/rose, componentes UI, skeleton loaders, whitespace
- Acessibilidade — ARIA em modais, focus trap, keyboard support, toast acessível
- Sistema de Toast — feedback visual em todas as operações CRUD

### Alterações anteriores (12/02/2026)

- Reestruturação Dashboard + Fluxo Previsto (includeCurrentMonth, InvestmentSummary widget)
- Investimentos (migration 006, CRUD + lançamentos + quadro evolução)
- Fluxo Diário (daily-flow.ts, DailyFlowTable)
- Transações Planejadas com período (migration 005, start_month/end_month)
- Importação OFX (parser custom, wizard 3 passos, detecção duplicatas)

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
│       ├── fluxo/page.tsx        # Fluxo Diário + Previsto (abas)
│       ├── investimentos/page.tsx
│       ├── configuracoes/page.tsx  # Abas: Geral + Categorias
│       └── recorrentes/page.tsx
├── components/
│   ├── ui/                       # Button, Input, Select, Modal, Card, Badge, PageHeader, EmptyState, Skeleton
│   ├── layout/                   # Sidebar, UserAvatar, GreetingHeader, Navbar (legado)
│   ├── dashboard/                # SummaryCards, CategoryChart, MonthPicker, ForecastTable, DailyFlowTable, InvestmentSummary, BudgetComparison
│   ├── contas/
│   ├── categorias/
│   ├── transacoes/               # TransactionForm, TransactionList, Import*
│   ├── recorrentes/
│   └── investimentos/            # InvestmentForm, InvestmentList, EntryForm, EntryList, InvestmentDashboard
├── contexts/
│   ├── toast-context.tsx         # Context + Provider + useToast()
│   ├── preferences-context.tsx   # closingDay + fullName + PreferencesProvider
│   └── sidebar-context.tsx       # collapsed + toggleCollapsed + SidebarProvider
├── lib/
│   ├── supabase/                 # client.ts, server.ts
│   ├── utils.ts                  # formatCurrency, toCents, formatDate, getMonthRange, etc.
│   ├── forecast.ts               # Lógica de projeção mensal (recurring + historical + forecast vs real)
│   ├── daily-flow.ts             # Lógica de fluxo diário (real + planejado por dia)
│   ├── closing-day.ts            # Matemática de competência/fechamento
│   ├── category-icons.tsx        # CategoryIcon SVG component + alias map
│   ├── investment-utils.ts       # Labels, agrupamento, cálculo de saldo
│   └── ofx-parser.ts             # Parser OFX/QFX
└── types/
    └── database.ts               # Types do Supabase
```

## Banco de Dados

### Tabelas
| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfis de usuário (extends auth.users), inclui `closing_day` |
| `accounts` | Contas (banco, cartão, carteira) |
| `categories` | Categorias com `projection_type` (recurring/historical) |
| `transactions` | Transações (receita/despesa) |
| `recurring_transactions` | Transações planejadas (recorrentes, pontuais, com período) |
| `investments` | Investimentos (CDB, Tesouro, Ações, etc.) |
| `investment_entries` | Lançamentos de investimentos (aportes, resgates, saldos) |

### Migrations
1. `001_initial_schema.sql` - Estrutura base (profiles, accounts, categories, transactions)
2. `002_seed_categories.sql` - Categorias padrão
3. `003_add_projection_type.sql` - Campo projection_type em categories
4. `004_recurring_transactions.sql` - Tabela recurring_transactions
5. `005_recurring_period.sql` - Campos start_month/end_month em recurring_transactions
6. `006_investments.sql` - Tabelas investments e investment_entries
7. `007_closing_day.sql` - Campo closing_day em profiles

## Navegação (Sidebar)

| # | Label | Rota | Página |
|---|-------|------|--------|
| 1 | Dashboard | `/` | Hero cards, Previsto vs Realizado, Categorias, Investimentos, Últimas Transações |
| 2 | Contas | `/contas` | CRUD contas bancárias |
| 3 | Transações | `/transacoes` | CRUD transações + importação OFX |
| 4 | Recorrentes | `/recorrentes` | Transações planejadas (recorrentes/pontuais) |
| 5 | Fluxo | `/fluxo` | Abas: Fluxo Diário (grid dia a dia) + Fluxo Previsto (projeção mensal) |
| 6 | Investimentos | `/investimentos` | Abas: Carteira (CRUD) + Evolução (quadro mensal) |
| 7 | Configurações | `/configuracoes` | Abas: Geral (dia de fechamento) + Categorias (CRUD receita/despesa) |

## Próximos Passos

### Redesign UX — Fase 3: Refinamento
- [ ] Chart upgrade — CategoryChart horizontal → donut/pie com legenda lateral
- [ ] Form styling — inputs com melhor hierarquia visual
- [ ] DataTable — extrair componente reutilizável para tabelas padronizadas
- [ ] Remover navbar.tsx (legado, substituído por sidebar)

### Robustez e Qualidade
- [ ] Tratamento de erros mais completo (edge cases, falhas de rede)
- [ ] Validações de formulário mais rigorosas
- [ ] Otimização de queries (evitar re-fetches desnecessários)
- [ ] Testes automatizados (unitários e/ou e2e com Playwright)

### Futuro
- [ ] Deploy na Vercel
- [ ] Filtros avançados, exportar dados, metas de orçamento
- [ ] Dark mode
- [ ] PWA / mobile responsivo avançado

## Stack
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Supabase (Auth + PostgreSQL + RLS)
- Recharts (gráficos)

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
- Client browser: `@/lib/supabase/client.ts`
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
- Ao final de toda sessão com alteração de código, atualizar a seção "Últimas Alterações" do CLAUDE.md do projeto antes de encerrar
- Incluir: o que mudou, quais arquivos foram afetados e a data

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Git
git status
git add .
git commit -m "mensagem"
git push
```
