# PRD - FinApp (Gestão Financeira Pessoal)

## Visão Geral
Aplicação web para gestão financeira pessoal que permite ao usuário controlar suas contas, categorizar receitas e despesas, e visualizar um resumo mensal.

## Público-alvo
Pessoas que desejam organizar suas finanças pessoais de forma simples.

## Funcionalidades Principais

### Autenticação
- Registro com email e senha
- Login com email e senha
- Logout
- Proteção de rotas (redirect para login se não autenticado)

### Contas
- CRUD de contas (banco, cartão, carteira)
- Saldo atualizado automaticamente com transações

### Categorias
- Categorias padrão criadas automaticamente (receita e despesa)
- CRUD de categorias customizadas
- Proteção contra exclusão de categoria em uso

### Transações
- CRUD de transações (receita/despesa)
- Associação com conta e categoria
- Filtro por mês
- Atualização automática de saldo da conta

### Dashboard
- Resumo mensal (total receitas, total despesas, saldo)
- Navegação entre meses
- Gráfico de despesas por categoria
- Últimas transações do mês

## Requisitos Não-Funcionais
- Interface em português (pt-BR)
- Valores monetários armazenados em centavos
- Row Level Security (RLS) em todas as tabelas
- Responsivo (mobile-friendly)
