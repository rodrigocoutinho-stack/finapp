# FinApp - Gestão Financeira Pessoal

Aplicação web para gestão financeira pessoal, construída com Next.js, Supabase e Tailwind CSS.

## Funcionalidades

- Autenticação (registro, login, logout)
- Gerenciamento de contas bancárias, cartões e carteiras
- Categorias personalizáveis (receita/despesa)
- Registro de transações com filtro mensal
- Dashboard com resumo mensal e gráficos

## Tecnologias

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **Backend/DB:** Supabase (PostgreSQL + Auth + RLS)
- **Gráficos:** Recharts

## Setup

### Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)

### 1. Clone o repositório

```bash
git clone <url-do-repo>
cd finapp
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o Supabase

1. Crie um novo projeto no [Supabase Dashboard](https://app.supabase.com)
2. Copie a **URL** e a **Anon Key** do projeto (Settings > API)
3. Crie o arquivo `.env.local`:

```bash
cp .env.example .env.local
```

4. Preencha as variáveis com os valores do Supabase
5. Execute as migrations SQL no SQL Editor do Supabase:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_seed_categories.sql`

### 4. Rode o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Deploy na Vercel

1. Importe o repositório na [Vercel](https://vercel.com)
2. Adicione as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy automático

## Estrutura do Projeto

```
src/
  app/
    (auth)/           - Páginas de autenticação
    (dashboard)/      - Páginas protegidas (dashboard, contas, categorias, transações)
    api/              - API routes
  components/
    ui/               - Componentes reutilizáveis (Button, Input, Modal, Select)
    layout/           - Navbar
    contas/           - Componentes de contas
    categorias/       - Componentes de categorias
    transacoes/       - Componentes de transações
    dashboard/        - Componentes do dashboard
  lib/
    supabase/         - Clients Supabase (browser, server, middleware)
    utils.ts          - Utilitários (formatação de moeda, datas)
  types/
    database.ts       - Tipos TypeScript das tabelas
```
