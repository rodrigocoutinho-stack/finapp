# Decisões de Arquitetura

## Framework: Next.js 16 (App Router)
- Server Components por padrão, Client Components apenas quando necessário
- Route Groups para separar auth e dashboard
- Middleware para refresh de sessão e proteção de rotas

## Estilização: Tailwind CSS v4
- Utility-first, sem CSS custom
- Componentes UI reutilizáveis (Button, Input, Select, Modal)

## Backend: Supabase
- PostgreSQL como banco de dados
- Supabase Auth para autenticação (email/senha)
- Row Level Security (RLS) para isolamento de dados por usuário
- `@supabase/ssr` para integração com Next.js (cookies-based auth)

## Valores Monetários
- Armazenados como `integer` em centavos para evitar problemas de ponto flutuante
- Conversão para exibição via `formatCurrency()` (centavos → R$ X,XX)
- Conversão de input via `toCents()` (R$ X,XX → centavos)

## Gráficos: Recharts
- Biblioteca leve e popular para React
- Usado no dashboard para gráfico de despesas por categoria

## Estrutura de Pastas
- `src/app/` — Rotas (App Router)
- `src/components/` — Componentes React
- `src/lib/` — Utilitários e configuração Supabase
- `src/types/` — Tipos TypeScript
- `supabase/migrations/` — SQL migrations
