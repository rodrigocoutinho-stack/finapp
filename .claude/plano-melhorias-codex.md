# Plano de Melhorias — Codex vs FinApp

Ultima atualizacao: 2026-03-01

Analise cruzada entre o Codex Tecnico (v1-v8, 16 dimensoes) e o estado atual do FinApp.

---

## Concluidos

| # | Item | Dimensao Codex | Data |
|---|------|---------------|------|
| 1 | Metas Financeiras (CRUD + progresso + vinculo conta + widget + insights) | Cap. 3 | 2026-02-28 |
| 2 | Custo essencial configuravel (flag `is_essential` em categories) | Cap. 3 | 2026-02-28 |
| 3 | Tempo ate meta da reserva (sublabel KPI) | Cap. 3 | 2026-03-01 |
| 4 | Alerta 120% no orcamento (badge critico) | Cap. 3 | 2026-03-01 |
| 5 | Reconciliacao de saldo (comparar saldo vs soma transacoes) | Cap. 13 | 2026-02-28 |
| 6 | RESERVE_EXCESS — Alerta de excedente | Cap. 3 | 2026-03-01 |
| 7 | SAVINGS_TOO_LOW — Insight persistente | Cap. 3 | 2026-03-01 |
| 8 | PROVISION_MISSING — Provisionamento de anuais | Cap. 3 | 2026-03-01 |
| 9 | Gestao de Dividas (CRUD + simulador + widget + insights) | Cap. 6 | 2026-02-28 |
| 10 | Simuladores educacionais (juros compostos, inflacao, custo oportunidade, FI/RE) | Cap. 4, 10 | 2026-02-28 |
| 11 | Testes E2E Playwright (auth, dashboard, transacoes, contas) | Cap. 15 | 2026-02-28 |
| 12 | AuditLog (tabela + helper + 10 componentes) | Cap. 14 | 2026-02-28 |
| 13 | Aposentadoria/IF (simulador 3 cenarios + SWR) | Cap. 10 | 2026-02-28 |
| — | Form styling (Checkbox/Textarea + py-2.5 + optional + disabled) | UX | 2026-03-01 |
| — | Paginacao server-side (transacoes, PAGE_SIZE=50) | Robustez | 2026-03-01 |
| — | Security Hardening (CSP, RPC, RLS, MIME, auth guard) | Cap. 14 | 2026-02-25 |
| — | Fechamento mensal persistente (monthly_closings + historico KPIs) | Cap. 13 | 2026-02-28 |
| — | Chart upgrade (CategoryChart donut/pie com legenda lateral) | UX | 2026-03-01 |
| — | Filtros avançados + exportação CSV em transações | Cap. 13 | 2026-03-01 |
| — | Migrar tabelas restantes para DataTable (RecurringList, EntryList, CategoryRules) | Consistencia | 2026-03-01 |
| — | Validacoes inline em todos os 8 formularios (erros per-field + clearOnChange) | UX | 2026-03-01 |
| — | Paginacao server-side em Recorrentes (PAGE_SIZE=50) + limite reduzido em Contas | Robustez | 2026-03-01 |
| — | Dark mode (CSS variables semanticas + next-themes + useChartColors) | UX | 2026-03-01 |

---

## Prioridade 1 — Funcionalidades de alto impacto

### 1.1 Filtros avancados + exportar dados
- **Status:** CONCLUIDO (2026-03-01)
- **Impacto:** Alto — usuario precisa analisar subconjuntos de transacoes e gerar relatorios
- **Complexidade:** Media
- **Escopo:**
  - Filtro multi-criterio em transacoes (categoria, conta, tipo, busca texto) — server-side via Supabase
  - Export CSV dos dados filtrados (BOM UTF-8, separador `;`, formato BR)
  - Debounce 400ms na busca textual, reset de pagina ao filtrar
- **Nota:** Implementado em `transaction-filters.tsx` + `csv-export.ts`. Limite de 1000 rows na exportacao.

### 1.2 Migrar tabelas restantes para DataTable
- **Status:** CONCLUIDO (2026-03-01)
- **Impacto:** Medio — consistencia visual e de comportamento em toda a aplicacao
- **Complexidade:** Baixa
- **Escopo:**
  - Componente `data-table.tsx` ja existe e e usado em transacoes e historico KPIs
  - Migradas 3 tabelas viaveis: RecurringList, EntryList, CategoryRules
  - ForecastTable e DailyFlowTable NAO migradas (colunas dinamicas, seções expansiveis, sticky scroll — incompativeis sem expandir a API do DataTable)
- **Nota:** Reduz duplicacao de codigo e garante loading/empty states padronizados.

### 1.3 Validacoes inline nos formularios
- **Status:** CONCLUIDO (2026-03-01)
- **Impacto:** Medio — melhora UX de entrada de dados com feedback imediato
- **Complexidade:** Baixa
- **Escopo:**
  - 8 formularios migrados: TransactionForm, RecurringForm, GoalForm, DebtForm, EntryForm, InvestmentForm, CategoryForm, AccountForm
  - Padrao: `errors` Record + `serverError` string + `clearFieldError()` no onChange
  - Validacao coleta todos os erros de uma vez (nao para no primeiro)
  - Erros de servidor/auth permanecem como banner no topo
- **Nota:** Componentes Input/Select ja suportavam prop `error` — apenas formularios precisaram de migracao.

---

## Prioridade 2 — Infraestrutura e escalabilidade

### 2.1 Paginacao server-side (demais tabelas)
- **Status:** CONCLUIDO (2026-03-01)
- **Impacto:** Baixo agora (poucos registros), importante para escala
- **Complexidade:** Baixa
- **Escopo:**
  - Recorrentes: paginacao server-side (PAGE_SIZE=50, .range(), count: "exact") com DataTable pagination props
  - Contas: limite de transacoes reduzido de 50000 para 10000
  - Metas/Dividas: mantidos com `.limit(100)` — layout de cards, volume naturalmente baixo, sem beneficio real de paginar
- **Nota:** Transacoes ja tinha paginacao. Recorrentes agora segue o mesmo padrao.

### 2.2 Connection pooling
- **Status:** NAO APLICAVEL (2026-03-01)
- **Impacto:** Nenhum na arquitetura atual
- **Motivo:** Clients usam `@supabase/ssr` via REST API (PostgREST), que ja tem pooling interno no API Gateway. Pooler direto (pgBouncer/Supavisor) so se aplica a conexoes `postgres://` diretas (Prisma, Edge Functions com pg package). Reavaliar se migrar para conexao direta no futuro.

---

## Horizonte Longo (pos-MVP+)

| # | Item | Dimensao Codex | Complexidade |
|---|------|---------------|-------------|
| 14 | Impostos e otimizacao fiscal | Cap. 11 | Alta |
| 15 | Seguros e protecao patrimonial | Cap. 12 | Alta |
| 16 | Open Finance (integracao bancaria) | Cap. 13 | Muito alta |
| 17 | Rebalanceamento de carteira | Cap. 9 | Media |
| 18 | Financas comportamentais (padroes, friccao 24h) | Cap. 5 | Media |
| 19 | Plataforma de agentes IA | Cap. 16 | Muito alta |
| — | ~~Dark mode~~ | ~~UX~~ | ~~CONCLUIDO 2026-03-01~~ |
| — | PWA / mobile responsivo | UX | Alta |

---

## Notas
- Itens podem ser reordenados conforme decisao do usuario
- Cada item deve seguir o loop do Codex: dados → KPIs → regras → UX → testes
- Ao concluir um item, mover para a secao "Concluidos" com data
