# Plano de Melhorias — Codex vs FinApp

Ultima atualizacao: 2026-03-01

Analise cruzada entre o Codex Tecnico (v1-v8, 16 dimensoes) e o estado atual do FinApp.

---

## Concluidos

| # | Item | Dimensao Codex | Data |
|---|------|---------------|------|
| 1 | Metas Financeiras (CRUD + progresso + vinculo conta + widget + insights) | Cap. 3 | 2026-02-28 |
| 2 | Custo essencial configuravel (flag `is_essential` em categories) | Cap. 3 | 2026-02-28 |
| 5 | Reconciliacao de saldo (comparar saldo vs soma transacoes) | Cap. 13 | 2026-02-28 |
| 9 | Gestao de Dividas (CRUD + simulador + widget + insights) | Cap. 6 | 2026-02-28 |
| 10 | Simuladores educacionais (juros compostos, inflacao, custo oportunidade, FI/RE) | Cap. 4, 10 | 2026-02-28 |
| 11 | Testes E2E Playwright (auth, dashboard, transacoes, contas) | Cap. 15 | 2026-02-28 |
| 12 | AuditLog (tabela + helper + 10 componentes) | Cap. 14 | 2026-02-28 |
| 13 | Aposentadoria/IF (simulador 3 cenarios + SWR) | Cap. 10 | 2026-02-28 |
| — | Form styling (Checkbox/Textarea + py-2.5 + optional + disabled) | UX | 2026-03-01 |
| — | Paginacao server-side (transacoes, PAGE_SIZE=50) | Robustez | 2026-03-01 |
| — | Security Hardening (CSP, RPC, RLS, MIME, auth guard) | Cap. 14 | 2026-02-25 |
| — | Fechamento mensal persistente (monthly_closings + historico KPIs) | Cap. 13 | 2026-02-28 |

---

## Prioridade 1 — Quick wins (complexidade baixa, alto valor)

### 3. Tempo ate meta da reserva
- **Status:** PENDENTE
- **Escopo:** KPI sublabel: `(meta_valor - saldo_reserva) / aporte_mensal_medio`
- **Impacto:** Sublabel no KPI de Reserva mostrando "X meses para completar"
- **Estimativa:** ~30 linhas em FinancialKPIs

### 4. Alerta 120% no orcamento
- **Status:** PENDENTE
- **Escopo:** Completar regua de alertas (80% atencao / 100% estourado / 120% critico)
- **Impacto:** Badge "Critico" em vermelho escuro quando categoria ultrapassa 120% do teto
- **Estimativa:** ~20 linhas em BudgetComparison + FinancialInsights

### 6. RESERVE_EXCESS — Alerta de excedente
- **Status:** PENDENTE
- **Escopo:** Quando meses_reserva > meta + margem, sugerir realocar excedente para metas/investimentos
- **Estimativa:** ~15 linhas em FinancialInsights

---

## Prioridade 2 — Insights inteligentes (complexidade media)

### 7. SAVINGS_TOO_LOW — Insight persistente
- **Status:** PENDENTE
- **Escopo:** Detectar taxa de poupanca < X por 3 meses consecutivos via `monthly_closings`
- **Impacto:** Insight critico com recomendacao de ajuste
- **Estimativa:** Query em monthly_closings + regra em FinancialInsights

### 8. PROVISION_MISSING — Provisionamento de anuais
- **Status:** PENDENTE
- **Escopo:** Detectar despesas anuais grandes (IPTU, IPVA, seguro) e sugerir reservar mensalmente
- **Logica:** Transacao com valor alto + mesma descricao ~12 meses atras
- **Estimativa:** Funcao de deteccao + insight no dashboard

---

## Prioridade 3 — Refinamento UX

### Chart upgrade
- **Status:** PENDENTE
- **Escopo:** CategoryChart horizontal → donut/pie com legenda lateral
- **Referencia:** Redesign UX Fase 3

### DataTable reutilizavel
- **Status:** PENDENTE
- **Escopo:** Componente generico para tabelas padronizadas (ja tem paginacao generica)
- **Referencia:** Redesign UX Fase 3

### Validacoes de formulario
- **Status:** PENDENTE
- **Escopo:** Validacao client-side mais rigorosa (formatos, limites, feedback inline)

---

## Prioridade 4 — Robustez e infraestrutura

### Paginacao server-side (demais tabelas)
- **Status:** PENDENTE
- **Escopo:** Aplicar mesmo padrao de transacoes em contas, recorrentes, metas, dividas
- **Nota:** Transacoes ja implementado (PAGE_SIZE=50, Supabase .range())

### Connection pooling
- **Status:** PENDENTE
- **Escopo:** Supabase Pooler para otimizar conexoes em serverless
- **Impacto:** Reduz cold starts e erros de conexao sob carga

### Filtros avancados + exportar dados
- **Status:** PENDENTE
- **Escopo:** Filtro multi-criterio em transacoes + export CSV/PDF

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
| — | Dark mode | UX | Media |
| — | PWA / mobile responsivo | UX | Alta |

---

## Notas
- Itens podem ser reordenados conforme decisao do usuario
- Cada item deve seguir o loop do Codex: dados → KPIs → regras → UX → testes
- Ao concluir um item, mover para a secao "Concluidos" com data
