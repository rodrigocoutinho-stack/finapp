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

## Últimas Alterações (11/02/2026)

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
│       ├── fluxo-diario/page.tsx
│       ├── investimentos/page.tsx # NOVO
│       └── recorrentes/page.tsx
├── components/
│   ├── ui/                       # Button, Input, Select, Modal
│   ├── layout/                   # Navbar
│   ├── dashboard/                # SummaryCards, CategoryChart, MonthPicker, ForecastTable, DailyFlowTable
│   ├── contas/
│   ├── categorias/
│   ├── transacoes/               # TransactionForm, TransactionList, Import*
│   ├── recorrentes/
│   └── investimentos/            # NOVO - InvestmentForm, InvestmentList, EntryForm, EntryList, InvestmentDashboard
├── lib/
│   ├── supabase/                 # client.ts, server.ts
│   ├── utils.ts                  # formatCurrency, toCents, formatDate, etc.
│   ├── forecast.ts               # Lógica de projeção mensal
│   ├── daily-flow.ts             # Lógica de fluxo diário
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

## Próximos Passos

### Fase 2: Robustez e Qualidade
- [ ] Tratamento de erros mais completo (edge cases, falhas de rede)
- [ ] Validações de formulário mais rigorosas
- [ ] Otimização de queries (evitar re-fetches desnecessários)
- [ ] Feedback visual melhorado (toasts, confirmações)
- [ ] Testes (unitários e/ou e2e)
- [ ] Acessibilidade (a11y)

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
