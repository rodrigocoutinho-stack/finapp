# Plano de Melhorias — Codex vs FinApp

Ultima atualizacao: 2026-02-28

Analise cruzada entre o Codex Tecnico (v1-v8, 16 dimensoes) e o estado atual do FinApp.

---

## Prioridade 1 — Alto valor, complexidade moderada

### 1. Metas Financeiras (Goal) — Dimensao 3
- **Status:** EM ANDAMENTO
- **Escopo:** Tabela `goals` + CRUD + progresso + horizonte (curto/medio/longo) + integracao dashboard
- **Referencia Codex:** Cap. 3 (Planejamento Financeiro e Metas)
- **KPIs:** Progresso da Meta (%), Progresso Esperado (%), Gap de Aporte, Atraso (meses)
- **Regras:** GOAL_UNDERFUNDED, GOAL_DEADLINE_CLOSE, GOAL_TOO_MANY, GOAL_BUCKET_MISMATCH
- **UX:** Cards com progresso + wizard de criacao + bloco no fechamento mensal

### 2. Custo essencial configuravel
- **Status:** PENDENTE
- **Escopo:** Flag `is_essential` em categories para calculos mais precisos de reserva e runway
- **Impacto:** KPI de reserva de emergencia passa a usar custo essencial real em vez de media de despesas

### 3. Tempo ate meta da reserva
- **Status:** PENDENTE
- **Escopo:** KPI simples: `(meta_valor - saldo_reserva) / aporte_mensal_medio`
- **Impacto:** Sublabel no KPI de Reserva mostrando "X meses para completar"

### 4. Alerta 120% no orcamento
- **Status:** PENDENTE
- **Escopo:** Completar regua de alertas (80% atencao / 100% estourado / 120% critico)
- **Impacto:** Badge "Critico" em vermelho escuro quando categoria ultrapassa 120% do teto

---

## Prioridade 2 — Evolucao de funcionalidades existentes

### 5. Reconciliacao de saldo
- **Status:** CONCLUIDO (2026-02-28)
- **Escopo:** Comparar saldo informado na conta vs soma de transacoes; alertar divergencia
- **Referencia Codex:** Cap. 13 (Recon Divergence Rate < 2%)

### 6. RESERVE_EXCESS — Alerta de excedente
- **Status:** PENDENTE
- **Escopo:** Quando meses_reserva > meta + margem, sugerir realocar excedente para metas/investimentos

### 7. SAVINGS_TOO_LOW — Insight persistente
- **Status:** PENDENTE
- **Escopo:** Detectar taxa de poupanca < X por 3 meses consecutivos; insight critico com recomendacao

### 8. Provisionamento de anuais (PROVISION_MISSING)
- **Status:** PENDENTE
- **Escopo:** Detectar despesas anuais grandes (IPTU, IPVA, seguro auto) e sugerir reservar mensalmente
- **Logica:** Transacao com valor alto + frequencia ~anual (mesma descricao 12 meses atras)

---

## Prioridade 3 — Funcionalidades novas de medio porte

### 9. Gestao de Dividas — Dimensao 6
- **Status:** CONCLUIDO (2026-02-28)
- **Escopo:** Tabela `debts` + CRUD + simulador pagamento extra + ranking (avalanche/snowball)
- **KPIs:** Divida/Renda, Custo anual de juros, Tempo ate zero, Juros evitados
- **Regras:** DEBT_INVENTORY_MISSING, DEBT_TO_INCOME_HIGH, DEBT_ROTATING_CREDIT

### 10. Simuladores educacionais — Dimensao 4
- **Status:** PENDENTE
- **Escopo:** Simuladores embutidos (juros compostos, inflacao, custo de oportunidade)
- **UX:** Tooltips contextuais + simuladores com max 3 inputs + 1 resultado visual

### 11. Testes E2E com Playwright
- **Status:** PENDENTE
- **Escopo:** Suites para fluxos criticos (login, CRUD transacoes, importacao, dashboard)
- **Referencia Codex:** Cap. 15 (E2E critico: cadastro, importacao, orcamento, carteira, alertas)

### 12. AuditLog — Trilha de auditoria
- **Status:** PENDENTE
- **Escopo:** Tabela `audit_logs` + registro de acoes sensiveis (delete, update saldo, config)
- **Referencia Codex:** Cap. 14 (quem, o que, onde, quando, antes/depois, por que)

---

## Horizonte Longo (pos-MVP+)

### 13. Aposentadoria / Independencia Financeira — Dimensao 10
- Mapa IF, patrimonio alvo via SWR, simulacao de cenarios (conservador/base/otimista)

### 14. Impostos e otimizacao fiscal — Dimensao 11
- TaxEvent, bruto→liquido→real em comparacoes, resumo mensal de imposto

### 15. Seguros e protecao patrimonial — Dimensao 12
- Policy, Claim, matriz risco x cobertura, alertas de renovacao

### 16. Open Finance — Dimensao 13
- Integracao direta com bancos (consent-first), sync incremental, reconciliacao automatica

### 17. Rebalanceamento de carteira — Dimensao 9
- Targets de alocacao, desvio vs alvo, rebalance por aportes, concentracao

### 18. Financas comportamentais — Dimensao 5
- Deteccao de padroes (pico pos-salario, gasto noturno), friccao 24h, leak de assinaturas

### 19. Plataforma de agentes — Dimensao 16
- Router de intencoes, agentes especialistas, evals, red-teaming, kill switch

---

## Notas
- Itens marcados como PENDENTE podem ser reordenados conforme decisao do usuario
- Cada item deve seguir o loop do Codex: dados → KPIs → regras → UX → testes
- Ao concluir um item, atualizar status para CONCLUIDO com data
