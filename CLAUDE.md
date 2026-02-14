# CLAUDE.md - Contrato de Trabalho

## Projeto
FinApp - Gestão Financeira Pessoal

## Estado Atual (Atualizado: 09/02/2026)

**MVP completo e funcional.** Todas as 8 fases implementadas:
- [x] Scaffolding (Next.js 16, Tailwind v4, Supabase)
- [x] Database schema + migrations (RLS ativo)
- [x] Autenticação (login, registro com confirmação por email, logout)
- [x] CRUD Contas (banco, cartão, carteira)
- [x] CRUD Categorias (receita/despesa, proteção contra exclusão em uso, tipo de projeção)
- [x] CRUD Transações (filtro mensal, atualização automática de saldo)
- [x] Dashboard (cards resumo, gráfico por categoria, últimas transações)
- [x] Fluxo Previsto (projeção mensal aberta por categoria, recorrentes + histórico)

**Supabase:** Projeto `knwbotsyztakseriiwtv`
- [x] Migrations 001-004 executadas no SQL Editor

**GitHub:** `https://github.com/rodrigocoutinho-stack/finapp.git`

## Últimas Alterações (14/02/2026)

### Dia de Fechamento — Competência Personalizada
- **`supabase/migrations/007_closing_day.sql`** — Migration NOVA
  - ADD COLUMN `closing_day` integer NOT NULL DEFAULT 1 CHECK (1-28) em `profiles`
  - Aditiva, segura — default 1 mantém comportamento inalterado
  - **Executar manualmente no SQL Editor do Supabase**
- **`src/types/database.ts`** — `closing_day: number` adicionado a profiles (Row, Insert, Update)
- **`src/lib/closing-day.ts`** — Módulo utilitário NOVO (funções puras)
  - `getCompetencyRange(year, month, closingDay)` — range start/end ISO
  - `getCurrentCompetencyMonth(closingDay, today?)` — competência de "hoje"
  - `getCompetencyDayCount(year, month, closingDay)` — dias no período
  - `getElapsedDays(year, month, closingDay, today?)` — dias decorridos
  - `getRecurringDateInCompetency(dayOfMonth, year, month, closingDay)` — data real da recorrente
  - `getCompetencyDays(year, month, closingDay)` — array de dias para grid diário
  - `getCompetencyLabel(year, month)` — string "YYYY-MM"
- **`src/contexts/preferences-context.tsx`** — Context NOVO
  - `PreferencesProvider` + `usePreferences()` hook
  - Fetch `profiles.closing_day` no mount, `setClosingDay()` faz update no Supabase
- **`src/app/providers.tsx`** — Envolvido com `PreferencesProvider` (acima de ToastProvider)
- **`src/app/(dashboard)/configuracoes/page.tsx`** — Página NOVA
  - Select dropdown dias 1-28, helper text explicativo, botão Salvar → toast
- **`src/components/layout/navbar.tsx`** — Link "Config." adicionado
- **`src/lib/utils.ts`** — `getMonthRange` aceita `closingDay` opcional, delega para `getCompetencyRange`
- **`src/lib/forecast.ts`** — 4º parâmetro `closingDay` em `calculateForecast`
  - Range, dias decorridos, recorrentes futuras/passadas: tudo via `closing-day.ts`
  - `getHistoricalTransactions` usa competency ranges para lookback 3 meses
- **`src/lib/daily-flow.ts`** — 4º parâmetro `closingDay` em `calculateDailyFlow`
  - Grid itera `getCompetencyDays()` em vez de loop 1..daysInMonth
  - Recurrentes agrupadas por `getRecurringDateInCompetency()` em vez de `day_of_month`
  - Saldo abertura usa competency ranges para meses futuros
- **`src/app/(dashboard)/page.tsx`** — `usePreferences()` + `getCurrentCompetencyMonth(closingDay)` para estado inicial
  - Passa `closingDay` a `getMonthRange`, `calculateDailyFlow`, `calculateForecast`, `MonthPicker`, `BudgetComparison`
- **`src/app/(dashboard)/transacoes/page.tsx`** — Idem: `usePreferences()` + `closingDay` em `getMonthRange`
- **`src/app/(dashboard)/fluxo-previsto/page.tsx`** — `closingDay` passado a `calculateForecast`
- **`src/components/dashboard/budget-comparison.tsx`** — Prop `closingDay`, label "dia X do período" via `getElapsedDays`
- **`src/components/dashboard/month-picker.tsx`** — Prop `closingDay`, subtexto com range real quando closingDay > 1

### Previsto vs Realizado (Orçamento)
- **`src/lib/forecast.ts`** — Tipos e lógica expandidos
  - `CategoryForecast`: 3 campos novos — `forecastAmount` (orçamento mês inteiro), `forecastToDateAmount` (proporcional até hoje), `realAmount` (transações reais até hoje)
  - `MonthForecast`: 9 campos novos — `forecast*`, `forecastToDate*`, `real*` para Receitas/Despesas/Saldo
  - Mês corrente: recurring `forecastToDate` = soma recorrentes com `day_of_month <= hoje`; historical `forecastToDate` = média × (diasPassados / diasNoMês)
  - Meses futuros: `forecastAmount = projectedAmount`, `forecastToDate = 0`, `realAmount = 0`
  - Condição de push ampliada para incluir categorias com forecast ou real > 0
  - Campos existentes (`projectedAmount`, `totalReceitas`, etc.) inalterados — compatibilidade total
- **`src/components/dashboard/budget-comparison.tsx`** — Componente NOVO
  - Tabela Previsto vs Realizado por categoria até o dia atual
  - Seções Receitas/Despesas colapsáveis com totais e linha de Saldo
  - Barra de progresso inline (h-1.5) por categoria: emerald ≤ 100%, rose > 100%
  - Cores na diferença: receitas emerald se atingiu meta, rose se abaixo; despesas inverso
  - Título dinâmico: "Comparação proporcional até o dia {X}"
- **`src/components/dashboard/forecast-table.tsx`** — Sub-texto no mês corrente
  - Células de categoria, totais e saldo mostram "Real X · Prev Y" em text-[10px] slate-400
  - Apenas na coluna do mês corrente; meses futuros inalterados
- **`src/app/(dashboard)/page.tsx`** — Widget BudgetComparison integrado
  - Import de `calculateForecast` e `BudgetComparison`
  - Novo state `currentMonthForecast`
  - Fetch paralelo de forecast quando mês selecionado = mês corrente
  - Widget renderizado condicionalmente entre SummaryCards e DailyFlowTable

### Alterações anteriores (13/02/2026)

### Redesign UX — Fase 1: Foundation
- **Paleta neutra**: Migração completa `gray-*` → `slate-*` em 38 arquivos (240 ocorrências)
- **Paleta despesas**: Migração `red-*` → `rose-*` para cores de despesas/receitas negativas
  - Mantém `red-*` para erros, validação e botões de exclusão
  - Hex hardcoded em charts atualizados (Recharts)
- **Novos componentes UI** (5 arquivos):
  - `src/components/ui/card.tsx` — Wrapper com border/shadow/padding
  - `src/components/ui/badge.tsx` — Labels coloridos (7 variantes)
  - `src/components/ui/page-header.tsx` — Título + descrição + action button
  - `src/components/ui/empty-state.tsx` — Ícone + mensagem + CTA opcional
  - `src/components/ui/skeleton.tsx` — Skeleton, TableSkeleton, CardSkeleton, CardsSkeleton
- **PageHeader**: Aplicado em 7 páginas (contas, categorias, transações, recorrentes, investimentos, fluxo-previsto, importar)
- **EmptyState**: Aplicado em 3 listas (account-list, recurring-list, investment-list)
- **Skeleton loaders**: Substituiu spinners em 12 arquivos (dashboard usa CardsSkeleton + TableSkeleton)
- **tabular-nums**: CSS global `font-variant-numeric: tabular-nums` em `td` e `.tabular-nums`
  - Aplicado em summary-cards, investment-summary e dashboard
- **Whitespace**: `max-w-7xl` → `max-w-6xl`, `py-8` → `py-10`, `p-5` → `p-6`, `gap-4` → `gap-5`, `space-y-8` → `space-y-10`

### Design QA — Acessibilidade e UX
- **`src/components/ui/modal.tsx`** — ARIA completo: `role="dialog"`, `aria-modal`, `aria-labelledby`
  - Focus trap (Tab/Shift+Tab cycling), auto-focus, focus restore on close
- **`src/components/layout/navbar.tsx`** — Breakpoints `sm` → `md`, active link pill, `aria-expanded`
- **`src/components/dashboard/month-picker.tsx`** — `aria-label` nos botões de navegação
- **`src/components/dashboard/forecast-table.tsx`** — Keyboard support em linhas colapsáveis
- **`src/components/dashboard/daily-flow-table.tsx`** — Keyboard support em linhas colapsáveis
- **`src/components/recorrentes/recurring-list.tsx`** — Toggle: `role="switch"`, `aria-checked`
- **`src/components/transacoes/import-review-table.tsx`** — Select styling unificado
- **`src/contexts/toast-context.tsx`** — Error toast 8s, exit animation 500ms antes
- **`src/components/ui/toast.tsx`** — Botão dismiss com `aria-label`

### Sistema de Toast — Feedback visual para operações CRUD
- **`src/contexts/toast-context.tsx`** — Context + Provider + hook `useToast()` (NOVO)
  - `addToast(message, variant?)` com variantes: success, error, info
  - Auto-dismiss em 4s com animação de saída 500ms antes da remoção
  - Counter module-level para IDs únicos
- **`src/components/ui/toast.tsx`** — Componente visual do toast (NOVO)
  - `ToastContainer` fixo bottom-4 right-4 z-[100] (acima de modais)
  - Variantes: success (emerald-600), error (red-600), info (blue-600)
  - Ícones SVG por variante, animação slide-in/out da direita
  - ARIA: `role="status"` (success/info), `role="alert"` (error)
- **`src/app/providers.tsx`** — Wrapper client com ToastProvider + ToastOutlet (NOVO)
- **`src/app/layout.tsx`** — Envolve children com `<Providers>`
- **5 páginas** — Toast no create:
  - `contas/page.tsx`: "Conta criada com sucesso."
  - `categorias/page.tsx`: "Categoria criada com sucesso."
  - `transacoes/page.tsx`: "Transação criada com sucesso."
  - `recorrentes/page.tsx`: "Transação planejada criada com sucesso."
  - `investimentos/page.tsx`: "Investimento criado com sucesso."
- **6 componentes de lista** — Toast no edit/delete:
  - `account-list.tsx`: "Conta atualizada." / "Conta excluída."
  - `category-list.tsx`: "Categoria atualizada." / "Categoria excluída."
  - `transaction-list.tsx`: "Transação atualizada." / "Transação excluída."
  - `recurring-list.tsx`: "Transação planejada atualizada." / "Transação planejada excluída." + toggle "Transação ativada/desativada."
  - `investment-list.tsx`: "Investimento atualizado." / "Investimento excluído." + "Lançamento registrado."
  - `entry-list.tsx`: "Lançamento excluído."
- **`import-review-table.tsx`** — `alert()` substituído por `addToast("Erro ao importar transações.", "error")`

### Alterações anteriores (12/02/2026)

### Reestruturação Dashboard + Fluxo Previsto
- **`src/lib/forecast.ts`** — Novo parâmetro `includeCurrentMonth`
  - Quando `true`, inicia projeção no mês atual com mix real+planejado
  - Categorias `recurring`: real até hoje + recorrentes com day_of_month > hoje
  - Categorias `historical`: real até hoje + (média / dias_no_mês × dias_restantes)
  - Novo campo `isCurrentMonth: boolean` em `MonthForecast`
- **`src/components/dashboard/investment-summary.tsx`** — Widget NOVO
  - Mostra total investido, retorno projetado no mês e variação %
  - Link "Ver detalhes" para /investimentos
  - Estado vazio com link para cadastrar
- **`src/components/dashboard/forecast-table.tsx`** — Destaque mês atual
  - Coluna do mês atual com fundo sutil verde e indicador "(atual)"
- **`src/app/(dashboard)/fluxo-previsto/page.tsx`** — Página NOVA
  - Chama `calculateForecast(supabase, 3, true)` incluindo mês atual
  - Renderiza ForecastTable com mês atual + 3 futuros
- **`src/app/(dashboard)/page.tsx`** — Dashboard reestruturado
  - Removido ForecastTable, adicionado DailyFlowTable
  - Widget InvestmentSummary + CategoryChart lado a lado
  - Layout: MonthPicker → SummaryCards → DailyFlowTable → [Investimentos | Gráfico] → Últimas Transações
  - Fetch de investimentos em useEffect separado (1x, sem depender de mês)
- **`src/components/layout/navbar.tsx`** — Link "Fluxo Diário" substituído por "Fluxo Previsto"
- **`src/app/(dashboard)/fluxo-diario/`** — Diretório removido (conteúdo migrou para dashboard)

### Alterações anteriores (11/02/2026)

### Seção de Investimentos
- **`supabase/migrations/006_investments.sql`** — Migration (NOVO)
  - Tabela `investments` com product, indexer, rate, maturity_date, is_active, notes
  - Tabela `investment_entries` com type (aporte/resgate/saldo), amount_cents, date
  - RLS ativo em ambas as tabelas, FK para accounts e profiles
  - Índices em user_id, investment_id, date
- **`src/types/database.ts`** — Tipos Investment e InvestmentEntry adicionados
- **`src/lib/investment-utils.ts`** — Funções auxiliares (NOVO)
  - Labels pt-BR para produtos, indexadores e grupos
  - `getInvestmentGroup(product, indexer)` — agrupamento derivado (Pós-fixado, Pré-fixado, Inflação, RV, Fundos, Outros)
  - `calculateInvestmentBalance(entries, upToDate)` — calcula saldo por último snapshot ou soma aportes - resgates
  - `getMonthEndBalance(entries, yearMonth)` — saldo no último dia do mês
- **`src/components/investimentos/investment-form.tsx`** — Formulário de investimento (NOVO)
  - Campos: nome, conta vinculada, produto, indexador, taxa, vencimento, observações
  - Suporta criação e edição
- **`src/components/investimentos/investment-list.tsx`** — Lista de investimentos (NOVO)
  - Cards agrupados por tipo (Pós-fixado, Pré-fixado, Inflação, RV, Fundos, Outros)
  - Mostra último saldo, conta, taxa, vencimento
  - Botões: Lançamentos, Editar, Excluir (com confirmação)
  - Modal de lançamentos integrado (form + lista)
- **`src/components/investimentos/entry-form.tsx`** — Formulário de lançamento (NOVO)
  - Tipo (aporte/resgate/saldo), valor em R$, data, observações
- **`src/components/investimentos/entry-list.tsx`** — Lista de lançamentos (NOVO)
  - Tabela ordenada por data desc, badges coloridos por tipo
  - Exclusão com confirmação via modal
- **`src/components/investimentos/investment-dashboard.tsx`** — Quadro de evolução (NOVO)
  - Tabela dos últimos 6 meses com linhas por grupo e sub-linhas colapsáveis
  - Total geral por mês, formato similar ao ForecastTable
- **`src/app/(dashboard)/investimentos/page.tsx`** — Página principal (NOVO)
  - Duas abas: Carteira (CRUD) e Evolução (quadro mensal)
- **`src/components/layout/navbar.tsx`** — Link "Investimentos" adicionado à navbar

### Testes pendentes (Investimentos)
- [ ] **Executar migration 006 no Supabase SQL Editor**
- [ ] Navegar para /investimentos via navbar
- [ ] Criar investimento com todos os campos
- [ ] Editar investimento existente
- [ ] Registrar aporte, resgate e saldo mensal
- [ ] Verificar agrupamento por tipo na lista (Pós-fixado, Pré-fixado, etc.)
- [ ] Verificar quadro de evolução com valores corretos nos últimos 6 meses
- [ ] Excluir lançamento com confirmação
- [ ] Excluir investimento (cascata para lançamentos)
- [ ] Verificar que investimentos aparecem vinculados à conta correta

### Página Fluxo Diário
- **`src/lib/daily-flow.ts`** — Lógica de cálculo do fluxo diário (NOVO)
  - Busca transações reais (dias passados) e recorrentes (dias futuros)
  - Calcula saldo inicial do mês revertendo transações do saldo atual
  - Agrupa valores por categoria e dia, com saldo cascateado dia a dia
  - Suporta mês atual, meses passados e meses futuros
- **`src/components/dashboard/daily-flow-table.tsx`** — Tabela visual do fluxo diário (NOVO)
  - Coluna de categorias sticky à esquerda com scroll horizontal
  - Destaque amarelo para coluna de hoje, cinza para fins de semana
  - Valores planejados em azul/itálico, reais em preto
  - Seções Entrada/Saída colapsáveis, saldo negativo em laranja
  - Legenda: Real, Planejado, Hoje, Fim de semana
- **`src/app/(dashboard)/fluxo-diario/page.tsx`** — Página com MonthPicker (NOVO)
- **`src/components/layout/navbar.tsx`** — Link "Fluxo Diário" adicionado à navbar

### Transações Futuras Pontuais + Recorrentes com Período
- **`supabase/migrations/005_recurring_period.sql`** — Adiciona `start_month` e `end_month` (text YYYY-MM) à tabela `recurring_transactions`
- **`src/types/database.ts`** — Campos `start_month` e `end_month` adicionados ao tipo `RecurringTransaction`
- **`src/lib/forecast.ts`** — Filtra recorrentes por período no cálculo de projeção; adiciona flag `hasPontual` ao `CategoryForecast`
- **`src/lib/utils.ts`** — Nova função `formatMonthLabel()` para formatar "YYYY-MM" → "abr/2026"
- **`src/components/recorrentes/recurring-form.tsx`** — Seletor de frequência (Recorrente / Pontual / Com período), pickers de mês
- **`src/components/recorrentes/recurring-list.tsx`** — Coluna "Período" com badges coloridos (Recorrente, Pontual, período)
- **`src/app/(dashboard)/recorrentes/page.tsx`** — Título renomeado para "Transações Planejadas"
- **`src/components/dashboard/forecast-table.tsx`** — Indicador losango (◆) para categorias com transações pontuais; legenda atualizada

### Regras de interpretação (start_month / end_month)
- Ambos NULL → recorrente indefinida (comportamento anterior)
- start_month = end_month → transação pontual (1 mês)
- Ambos preenchidos, diferentes → recorrente com período definido
- start_month preenchido, end_month NULL → recorrente a partir de tal mês, sem fim

### Alterações anteriores (10/02/2026)

#### Importação de OFX — Extrato bancário e cartão de crédito
- **`src/lib/ofx-parser.ts`** — Parser OFX/QFX custom (sem dependências externas)
  - Suporta BANKMSGSRSV1 (conta) e CREDITCARDMSGSRSV1 (cartão)
  - Extrai DTPOSTED, TRNAMT, MEMO/NAME de cada STMTTRN
  - Converte valores para centavos, detecta receita/despesa pelo sinal
  - Limite de 5MB por arquivo
- **`src/app/(dashboard)/transacoes/importar/page.tsx`** — Página wizard de 3 passos
  - Step 1 (Upload): seleção de conta + upload de arquivo .ofx/.qfx
  - Step 2 (Revisão): tabela com checkbox, categoria por linha, detecção de duplicatas
  - Step 3 (Resumo): contadores de importadas/ignoradas/duplicatas
- **`src/components/transacoes/import-upload.tsx`** — Componente de upload
- **`src/components/transacoes/import-review-table.tsx`** — Tabela de revisão
  - Duplicatas detectadas por data + valor + descrição (badge amarelo)
  - Dropdown de categoria filtrado por tipo (receita/despesa)
  - Botões: selecionar todas, desmarcar todas, ignorar duplicatas
  - Validação: não permite importar sem categoria definida
  - Atualiza saldo da conta em uma única operação após import
- **`src/components/transacoes/import-summary.tsx`** — Resumo final
- **`src/app/(dashboard)/transacoes/page.tsx`** — Adicionado botão "Importar OFX"

### Testes pendentes
- [ ] Testar CRUD de transações recorrentes
- [ ] Testar tipo de projeção nas categorias
- [ ] Verificar cálculos do Fluxo Previsto (projeção mensal por categoria)
- [ ] Testar importação OFX com arquivos de Itaú, Bradesco, Nubank
- [ ] Verificar detecção de duplicatas na importação
- [ ] Verificar atualização de saldo da conta após importação
- [ ] **Executar migration 005 no Supabase SQL Editor**
- [ ] Criar transação pontual para mês futuro → verificar que aparece só naquele mês
- [ ] Criar recorrente com período (3 meses) → verificar projeção nos meses corretos
- [ ] Criar recorrente sem período → verificar comportamento inalterado
- [ ] Verificar badges de período na lista de recorrentes
- [ ] Navegar para /fluxo-diario via navbar
- [ ] Verificar que linhas são categorias agrupadas por tipo (receita/despesa)
- [ ] Dias passados mostram transações reais (preto) agrupadas por categoria
- [ ] Dias futuros mostram recorrentes no dia correto (azul/itálico)
- [ ] Saldo cascateia corretamente dia a dia
- [ ] Destaque de hoje (amarelo) e fins de semana (cinza)
- [ ] Navegar mês anterior/próximo com MonthPicker
- [ ] Scroll horizontal em tela pequena

## Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (dashboard)/
│       ├── page.tsx              # Dashboard principal
│       ├── contas/page.tsx
│       ├── categorias/page.tsx
│       ├── transacoes/
│       │   ├── page.tsx
│       │   └── importar/page.tsx # NOVO
│       ├── fluxo-previsto/page.tsx  # NOVO (substituiu fluxo-diario)
│       ├── investimentos/page.tsx # NOVO
│       ├── configuracoes/page.tsx # NOVO
│       └── recorrentes/page.tsx
├── components/
│   ├── ui/                       # Button, Input, Select, Modal, Card, Badge, PageHeader, EmptyState, Skeleton
│   ├── layout/                   # Navbar
│   ├── dashboard/                # SummaryCards, CategoryChart, MonthPicker, ForecastTable, DailyFlowTable, InvestmentSummary
│   ├── contas/
│   ├── categorias/
│   ├── transacoes/               # TransactionForm, TransactionList, Import*
│   ├── recorrentes/
│   └── investimentos/            # NOVO - InvestmentForm, InvestmentList, EntryForm, EntryList, InvestmentDashboard
├── contexts/
│   ├── toast-context.tsx         # NOVO - Context + Provider + useToast()
│   └── preferences-context.tsx   # NOVO - closingDay + PreferencesProvider
├── lib/
│   ├── supabase/                 # client.ts, server.ts
│   ├── utils.ts                  # formatCurrency, toCents, formatDate, etc.
│   ├── forecast.ts               # Lógica de projeção mensal
│   ├── daily-flow.ts             # Lógica de fluxo diário
│   ├── closing-day.ts            # NOVO - Matemática de competência/fechamento
│   ├── investment-utils.ts       # NOVO - Labels, agrupamento, cálculo de saldo
│   └── ofx-parser.ts            # Parser OFX/QFX
└── types/
    └── database.ts               # Types do Supabase
```

## Banco de Dados

### Tabelas
| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfis de usuário (extends auth.users) |
| `accounts` | Contas (banco, cartão, carteira) |
| `categories` | Categorias com `projection_type` |
| `transactions` | Transações (receita/despesa) |
| `recurring_transactions` | Transações recorrentes mensais |
| `investments` | Investimentos (CDB, Tesouro, Ações, etc.) |
| `investment_entries` | Lançamentos de investimentos (aportes, resgates, saldos) |

### Migrations
1. `001_initial_schema.sql` - Estrutura base
2. `002_seed_categories.sql` - Categorias padrão
3. `003_add_projection_type.sql` - Campo projection_type
4. `004_recurring_transactions.sql` - Tabela recorrentes
5. `005_recurring_period.sql` - Campos start_month/end_month
6. `006_investments.sql` - Tabelas investments e investment_entries
7. `007_closing_day.sql` - Campo closing_day em profiles

## Próximos Passos

### Redesign UX — Fase 2A: Melhorias Visuais (sem risco estrutural)
- [ ] Dashboard hero cards — redesenhar SummaryCards com ícones, variação % e visual premium
- [ ] Chart upgrade — CategoryChart horizontal → donut/pie com legenda lateral
- [ ] Form styling — inputs com melhor hierarquia visual
- [ ] DataTable — extrair componente reutilizável para tabelas padronizadas

### Redesign UX — Fase 2B: Sidebar Navigation (mudança estrutural)
- [ ] Trocar top navbar por sidebar fixa (desktop) + drawer (mobile)
- [ ] Adaptar layout.tsx e todas as páginas para o novo paradigma
- [ ] Testar responsividade com sidebar (~250px de largura perdida)

### Robustez e Qualidade
- [ ] Tratamento de erros mais completo (edge cases, falhas de rede)
- [ ] Validações de formulário mais rigorosas
- [ ] Otimização de queries (evitar re-fetches desnecessários)
- [ ] Testes (unitários e/ou e2e)

### Futuro
- [ ] Deploy na Vercel
- [ ] Filtros avançados, exportar dados, metas de orçamento

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
