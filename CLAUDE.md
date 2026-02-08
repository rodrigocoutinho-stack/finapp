# CLAUDE.md - Contrato de Trabalho

## Projeto
FinApp - Gestão Financeira Pessoal

## Estado Atual
**MVP completo e funcional.** Todas as 7 fases implementadas:
- [x] Scaffolding (Next.js 16, Tailwind v4, Supabase)
- [x] Database schema + migrations (RLS ativo)
- [x] Autenticação (login, registro com confirmação por email, logout)
- [x] CRUD Contas (banco, cartão, carteira)
- [x] CRUD Categorias (receita/despesa, proteção contra exclusão em uso)
- [x] CRUD Transações (filtro mensal, atualização automática de saldo)
- [x] Dashboard (cards resumo, gráfico por categoria, últimas transações)

**Supabase configurado:** Projeto `knwbotsyztakseriiwtv` — migrations precisam ser executadas manualmente no SQL Editor.

## Próximos Passos Sugeridos
- [ ] Executar migrations no Supabase (001_initial_schema.sql, 002_seed_categories.sql)
- [ ] Testar fluxo completo (registro → confirmação email → login → CRUD)
- [ ] Deploy na Vercel
- [ ] Melhorias futuras: filtros avançados, exportar dados, metas de orçamento

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
