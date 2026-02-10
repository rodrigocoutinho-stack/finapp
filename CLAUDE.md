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

## Últimas Alterações (10/02/2026)

### Importação de OFX — Extrato bancário e cartão de crédito
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
│       └── recorrentes/page.tsx
├── components/
│   ├── ui/                       # Button, Input, Select, Modal
│   ├── layout/                   # Navbar
│   ├── dashboard/                # SummaryCards, CategoryChart, MonthPicker, ForecastTable
│   ├── contas/
│   ├── categorias/
│   ├── transacoes/               # TransactionForm, TransactionList, Import*
│   └── recorrentes/
├── lib/
│   ├── supabase/                 # client.ts, server.ts
│   ├── utils.ts                  # formatCurrency, toCents, formatDate, etc.
│   ├── forecast.ts               # Lógica de projeção
│   └── ofx-parser.ts            # NOVO - Parser OFX/QFX
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
