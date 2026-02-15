# CLAUDE.md - Contrato de Trabalho

## Projeto
FinApp - Gestão Financeira Pessoal

## Estado Atual (Atualizado: 14/02/2026)

**MVP completo + Redesign UX Fase 2 + Assistente IA + Fase 3A Quick Wins.** Todas as funcionalidades implementadas. Build OK.

- [x] Scaffolding (Next.js 16, Tailwind v4, Supabase)
- [x] Database schema + migrations 001-008 (RLS ativo)
- [x] Autenticação (login, registro com confirmação por email, logout)
- [x] CRUD Contas (banco, cartão, carteira, tag reserva de emergência)
- [x] CRUD Categorias (receita/despesa, proteção contra exclusão em uso, tipo de projeção — dentro de Configurações)
- [x] CRUD Transações (filtro mensal, atualização automática de saldo)
- [x] Transações Planejadas (recorrentes, pontuais, com período)
- [x] Importação OFX (extrato bancário e cartão de crédito, auto-categorização por regras)
- [x] Investimentos (CRUD + lançamentos + quadro de evolução + retorno real IPCA)
- [x] Dashboard (hero cards, KPIs financeiros, insights proativos, alertas orçamento, previsto vs realizado, investimentos, últimas transações)
- [x] Fluxo unificado (Fluxo Diário + Fluxo Previsto em abas)
- [x] Dia de fechamento (competência personalizada por usuário)
- [x] Configurações (abas Geral + Categorias + Regras de Importação, closing day 1-28)
- [x] Redesign UX Fase 1 (paleta slate/rose, componentes UI, skeleton, toast, acessibilidade)
- [x] Redesign UX Fase 2 (sidebar, hero cards, ícones categorias, greeting, layout 2 colunas)
- [x] Assistente Financeiro IA (Gemini 2.5 Flash, streaming, contexto conversacional, botão copiar)
- [x] Fase 3A Quick Wins (KPIs, alertas orçamento, insights, reserva emergência, regras categorização, retorno real)

**Supabase:** Projeto `knwbotsyztakseriiwtv`
- [x] Migrations 001-008 executadas no SQL Editor

**GitHub:** `https://github.com/rodrigocoutinho-stack/finapp.git`

## Últimas Alterações (14/02/2026)

### Fase 3A — Quick Wins (6 funcionalidades)

**Migration 008:** `supabase/migrations/008_quick_wins.sql`
- `accounts.is_emergency_reserve` (boolean) — tag de reserva de emergência
- Tabela `category_rules` (pattern + category_id) — regras de categorização automática, com RLS

**Quick Win 1 — KPIs no Dashboard:**
- `src/components/dashboard/financial-kpis.tsx` — 3 mini-cards: Taxa de Poupança (%), Runway Financeiro (meses), Reserva de Emergência (meses)
- Cores dinâmicas (verde/amarelo/vermelho) baseadas em thresholds
- `src/app/(dashboard)/page.tsx` — Fetch saldo total contas, saldo reserva, média despesas 3 meses

**Quick Win 2 — Alertas de Orçamento:**
- `src/components/dashboard/budget-comparison.tsx` — Badges inline "Estourado" (>= 100%) e "Atenção" (>= 80%) por categoria despesa
- Resumo no topo: "X estouradas, Y em atenção"

**Quick Win 3 — Insights Proativos:**
- `src/components/dashboard/financial-insights.tsx` — Motor de 8 insights priorizados, exibe max 2
- Cards com borda colorida (alerta/warning/positivo), botão dispensar, ícones contextais

**Quick Win 4 — Reserva de Emergência:**
- `src/components/contas/account-form.tsx` — Checkbox "Conta de reserva de emergência"
- `src/components/contas/account-list.tsx` — Badge "Reserva" (emerald) nos cards
- `src/types/database.ts` — `is_emergency_reserve` em Account

**Quick Win 5 — Regras de Categorização Automática:**
- `src/components/categorias/category-rules.tsx` — CRUD de regras (padrão → categoria), form inline
- `src/app/(dashboard)/configuracoes/page.tsx` — Terceira aba "Regras de Importação"
- `src/components/transacoes/import-review-table.tsx` — Auto-categorização por regras no import OFX, badge "Auto"

**Quick Win 6 — Retorno Real de Investimentos:**
- `src/lib/inflation.ts` — `getIPCA12Months()` via API BCB (série 13522), cache em variável
- `src/components/dashboard/investment-summary.tsx` — Retorno real mensal abaixo do nominal
- `src/components/investimentos/investment-dashboard.tsx` — Retorno real na linha Total
- `src/app/(dashboard)/investimentos/page.tsx` — Fetch IPCA e passa para InvestmentDashboard

### Contexto Conversacional + Botão Copiar no Assistente IA

**Arquivos modificados:**
- `src/app/(dashboard)/assistente/page.tsx` — Monta array `history` (últimas 10 mensagens finalizadas) e envia no body do fetch para manter contexto multi-turno
- `src/app/api/ai/analyze/route.ts` — Aceita campo `history`, valida (max 10, roles válidos), monta `contents` multi-turn para Gemini (dados financeiros só na 1ª mensagem)
- `src/components/assistente/chat-message.tsx` — Botão copiar no balão assistant (clipboard → check por 2s), visível no hover (`opacity-0 group-hover:opacity-100`)

### Assistente Financeiro IA (Gemini 2.5 Flash)

**Novos arquivos:**
- `src/lib/ai/system-prompt.ts` — Persona "FinAssist", regras de resposta em pt-BR, áreas de atuação (diagnóstico, orçamento, fluxo, investimentos, reserva)
- `src/lib/ai/financial-context.ts` — `buildFinancialContext()` serializa dados financeiros do usuário em texto estruturado (~2000 tokens)
- `src/app/api/ai/analyze/route.ts` — POST handler: autentica, busca dados via RLS, chama Gemini com streaming, retorna ReadableStream
- `src/app/(dashboard)/assistente/page.tsx` — Chat full-height com welcome state, 4 sugestões clicáveis, streaming progressivo
- `src/components/assistente/chat-message.tsx` — Balões user (emerald) / assistant (branco), markdown inline, loading dots
- `src/components/assistente/chat-input.tsx` — Textarea auto-resize, Enter envia, Shift+Enter nova linha, botão enviar

**Arquivos modificados:**
- `src/components/layout/sidebar.tsx` — Link "Assistente IA" adicionado (ícone sparkles), sidebar 7→8 itens

**Dependências:**
- `@google/generative-ai` adicionado ao package.json

**Configuração necessária:**
- `.env.local` → `GEMINI_API_KEY=<chave>` (server-only, sem NEXT_PUBLIC_)

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
│       ├── assistente/page.tsx     # Chat IA (Gemini Flash)
│       ├── configuracoes/page.tsx  # Abas: Geral + Categorias
│       └── recorrentes/page.tsx
├── components/
│   ├── ui/                       # Button, Input, Select, Modal, Card, Badge, PageHeader, EmptyState, Skeleton
│   ├── layout/                   # Sidebar, UserAvatar, GreetingHeader, Navbar (legado)
│   ├── dashboard/                # SummaryCards, FinancialKPIs, FinancialInsights, CategoryChart, MonthPicker, ForecastTable, DailyFlowTable, InvestmentSummary, BudgetComparison
│   ├── contas/
│   ├── categorias/
│   ├── assistente/               # ChatMessage, ChatInput
│   ├── transacoes/               # TransactionForm, TransactionList, Import*
│   ├── recorrentes/
│   └── investimentos/            # InvestmentForm, InvestmentList, EntryForm, EntryList, InvestmentDashboard
├── contexts/
│   ├── toast-context.tsx         # Context + Provider + useToast()
│   ├── preferences-context.tsx   # closingDay + fullName + PreferencesProvider
│   └── sidebar-context.tsx       # collapsed + toggleCollapsed + SidebarProvider
├── lib/
│   ├── supabase/                 # client.ts, server.ts
│   ├── ai/                       # system-prompt.ts, financial-context.ts
│   ├── inflation.ts              # getIPCA12Months (API BCB), calcRealReturn
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
| `category_rules` | Regras de categorização automática (pattern → category) |

### Migrations
1. `001_initial_schema.sql` - Estrutura base (profiles, accounts, categories, transactions)
2. `002_seed_categories.sql` - Categorias padrão
3. `003_add_projection_type.sql` - Campo projection_type em categories
4. `004_recurring_transactions.sql` - Tabela recurring_transactions
5. `005_recurring_period.sql` - Campos start_month/end_month em recurring_transactions
6. `006_investments.sql` - Tabelas investments e investment_entries
7. `007_closing_day.sql` - Campo closing_day em profiles
8. `008_quick_wins.sql` - is_emergency_reserve em accounts + tabela category_rules

## Navegação (Sidebar)

| # | Label | Rota | Página |
|---|-------|------|--------|
| 1 | Dashboard | `/` | Hero cards, KPIs (poupança/runway/reserva), Insights, Previsto vs Realizado (com alertas), Categorias, Investimentos (com retorno real), Últimas Transações |
| 2 | Contas | `/contas` | CRUD contas bancárias (tag reserva de emergência) |
| 3 | Transações | `/transacoes` | CRUD transações + importação OFX (auto-categorização por regras) |
| 4 | Recorrentes | `/recorrentes` | Transações planejadas (recorrentes/pontuais) |
| 5 | Fluxo | `/fluxo` | Abas: Fluxo Diário (grid dia a dia) + Fluxo Previsto (projeção mensal) |
| 6 | Investimentos | `/investimentos` | Abas: Carteira (CRUD) + Evolução (quadro mensal + retorno real IPCA) |
| 7 | Assistente IA | `/assistente` | Chat com Gemini 2.5 Flash, contexto conversacional, botão copiar, streaming |
| 8 | Configurações | `/configuracoes` | Abas: Geral (dia de fechamento) + Categorias (CRUD receita/despesa) + Regras de Importação |

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
- Google Generative AI (`@google/generative-ai`) — Gemini 2.5 Flash

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
