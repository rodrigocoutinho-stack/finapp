# CLAUDE.md - Contrato de Trabalho

## Projeto
FinApp - Gestão Financeira Pessoal

## Estado Atual (Atualizado: 08/02/2026)

**MVP completo e funcional.** Todas as 8 fases implementadas:
- [x] Scaffolding (Next.js 16, Tailwind v4, Supabase)
- [x] Database schema + migrations (RLS ativo)
- [x] Autenticação (login, registro com confirmação por email, logout)
- [x] CRUD Contas (banco, cartão, carteira)
- [x] CRUD Categorias (receita/despesa, proteção contra exclusão em uso, tipo de projeção)
- [x] CRUD Transações (filtro mensal, atualização automática de saldo)
- [x] Dashboard (cards resumo, gráfico por categoria, últimas transações)
- [x] Fluxo Previsto (projeção 3 meses, recorrentes + histórico)

**Supabase:** Projeto `knwbotsyztakseriiwtv`
- [x] Migrations 001-004 executadas no SQL Editor

**GitHub:** `https://github.com/rodrigocoutinho-stack/finapp.git`

## Pendências Imediatas

### Git - Mudanças não commitadas
Há mudanças locais que precisam ser enviadas ao GitHub:

```bash
git add .
git commit -m "feat: adiciona fluxo previsto (forecast) ao dashboard"
git push
```

**Arquivos modificados:**
- `CLAUDE.md` - documentação
- `src/types/database.ts` - tipos atualizados
- `src/components/layout/navbar.tsx` - link Recorrentes
- `src/components/categorias/category-form.tsx` - campo projection_type
- `src/app/(dashboard)/page.tsx` - seção Fluxo Previsto

**Arquivos novos:**
- `supabase/migrations/003_add_projection_type.sql`
- `supabase/migrations/004_recurring_transactions.sql`
- `src/app/(dashboard)/recorrentes/page.tsx`
- `src/components/recorrentes/recurring-form.tsx`
- `src/components/recorrentes/recurring-list.tsx`
- `src/lib/forecast.ts`
- `src/components/dashboard/forecast-chart.tsx`
- `src/components/dashboard/forecast-table.tsx`

### Testes pendentes
- [ ] Testar CRUD de transações recorrentes
- [ ] Testar tipo de projeção nas categorias
- [ ] Verificar cálculos do Fluxo Previsto no Dashboard

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
│       ├── transacoes/page.tsx
│       └── recorrentes/page.tsx  # NOVO
├── components/
│   ├── ui/                       # Button, Input, Select, Modal
│   ├── layout/                   # Navbar
│   ├── dashboard/                # SummaryCards, CategoryChart, MonthPicker, ForecastChart, ForecastTable
│   ├── contas/
│   ├── categorias/
│   ├── transacoes/
│   └── recorrentes/              # NOVO
├── lib/
│   ├── supabase/                 # client.ts, server.ts
│   ├── utils.ts                  # formatCurrency, toCents, formatDate, etc.
│   └── forecast.ts               # NOVO - lógica de projeção
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

### Migrations
1. `001_initial_schema.sql` - Estrutura base
2. `002_seed_categories.sql` - Categorias padrão
3. `003_add_projection_type.sql` - Campo projection_type
4. `004_recurring_transactions.sql` - Tabela recorrentes

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
