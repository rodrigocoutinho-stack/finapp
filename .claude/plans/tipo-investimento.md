# Plano — 4º Tipo de Transação: `investimento`

**Status:** proposto, aguardando aprovação para executar
**Autor:** sessão 2026-04-21
**Motivação:** investimento hoje está modelado como *categoria* dentro de
`despesa`. Isso é conceitualmente errado:
- Investimento NÃO é consumo; é alocação de um ganho já realizado.
- A geração de caixa do mês NÃO deve ser reduzida por aportes.
- O dashboard mede "eficiência" (savings rate) hoje com despesa inflada,
  então o KPI sai baixo/errado.
- O investimento deveria ser o destino natural da geração mensal
  (conectado à tabela `investments` existente).

## Modelagem proposta

### Novo tipo em `transactions.type` e `recurring_transactions.type`
`('receita', 'despesa', 'transferencia', 'investimento')`

### Regras semânticas do tipo `investimento`
| Aspecto | Comportamento |
|---|---|
| Saldo da conta origem | Debita (igual despesa) |
| Entra em "Despesa do mês" (KPI) | **Não** |
| Entra em "Receita do mês" (KPI) | **Não** |
| Entra no savings rate como redução de geração | **Não** (já é destino de ganho) |
| Entra no fluxo de caixa diário como saída | **Sim** (a conta é debitada fisicamente) |
| Entra no forecast como categoria projetável | **Sim** (útil prever aporte mensal) |
| Tem categoria? | **Sim** — novo `categories.type = 'investimento'` |
| Tem `destination_investment_id`? | **Não na V1** (Fase 5 opcional) |

### Nova coluna em `categories.type`
`('receita', 'despesa', 'investimento')` — permite classificar o aporte
(ex.: "Aporte Tesouro", "Aporte Ações", "Reserva de emergência").

### Nova coluna em `monthly_closings`
`total_investment_cents BIGINT NOT NULL DEFAULT 0` — snapshot do total
investido no mês (para histórico correto dos KPIs).

## Impacto inventariado — 27 arquivos + 1 migration

### Migrations (nova 026)
- Amplia CHECK em `transactions.type`, `recurring_transactions.type`,
  `categories.type` para incluir `'investimento'`.
- Amplia CHECK de consistência em `transactions` e `recurring_transactions`
  (investimento, como despesa, NÃO tem `destination_account_id`).
- ADD COLUMN `total_investment_cents` em `monthly_closings`.
- **Rollback:** reverter CHECK (dropa constraint, recria com 3 valores)
  + `ALTER TABLE monthly_closings DROP COLUMN total_investment_cents`.
  Seguro desde que nenhuma transação do tipo novo tenha sido criada.

### Types (1 arquivo)
- `src/types/database.ts` — adicionar `"investimento"` em 4 uniões
  (Row/Insert/Update de `transactions` e `recurring_transactions`;
  Row/Insert/Update de `categories`; opcionalmente novo campo em
  `monthly_closings`).

### Queries server-side (~8 arquivos)
Padrão a aplicar:
- Lugares com `.eq("type", "despesa")` → permanecem iguais
  (investimento não é despesa).
- Lugares com `.neq("type", "transferencia")` → trocar para
  `.in("type", ["receita", "despesa"])` quando o intuito for "só
  movimentos de receita/despesa". Alternativamente manter o `neq` e
  adicionar `.neq("type", "investimento")`.

Arquivos: `use-dashboard-data.ts`, `forecast.ts` (3 ocorrências),
`daily-flow.ts` (2), `group-report-modal.tsx` (2),
`import-review-table.tsx` (1), `recurrence-detection.ts` (1).

### Lógica de saldo (`adjust_account_balance`)
Não precisa mexer no RPC — investimento recebe delta negativo como
despesa. Trabalho é no JS (form + list + reverts).

### UI (transactions)
- `transaction-form.tsx` — adicionar opção no seletor de tipo, label
  de categoria condicionada (receita/despesa/**investimento**), lógica
  de delta de saldo igual à despesa.
- `transaction-list.tsx` — nova cor/sinal (proposta: **violeta** com
  sinal "↓"). Filtro "Categoria" em transferência já renderiza
  "Transferência" literal; investimento renderiza `t.categories?.name`
  normal.
- `transacoes/page.tsx` — filtro de tipo ganha opção "Investimento",
  export CSV ganha label "Investimento".

### UI (recorrentes)
- `recurring-form.tsx` e `recurring-list.tsx` — idem ao acima.

### UI (categorias)
- `category-form.tsx` — seletor de tipo ganha "Investimento";
  `is_essential` continua só para despesa; budget só para despesa.
- `category-list.tsx` — agrupamento ganha seção "Investimentos".
- `category-rules.tsx` — listagem mostra tipo correto.

### Dashboard (crítico — onde o bug do usuário aparece)
- `use-dashboard-data.ts`:
  - `consolidatedKPIs`: adicionar `totalInvestimentosCents`.
    `totalDespesasCents` deixa de incluir investimento automaticamente
    (já separa por `type`).
  - Savings rate: fórmula continua `(rec − desp) / rec`. Como despesa
    cai (investimentos saíram), o rate sobe — esse é o ajuste que
    o usuário quer. **Nenhuma mudança de fórmula**, só de dado de entrada.
  - `chartData` (gráfico de despesa por categoria): investimento fica
    naturalmente fora por já filtrar `type === "despesa"`.
- `net-revenue.ts`:
  - `TransactionLike.type` ganha `"investimento"`.
  - `computeConsolidatedKPIs` ganha `totalInvestimentosCents` no
    retorno e trata `type === "investimento"` como `continue` no loop
    de blocos (não entra em receita nem despesa).
- Novo componente ou card no dashboard: **"Investido no mês"**
  (opcional na V1 — pode ser `financial-insights.tsx` + novo KPI).
- `monthly-closing.tsx` (fechamento mensal persistente):
  - Preenche `total_investment_cents` ao fechar.
  - Mostra o valor no card de histórico.

### Forecast / daily-flow
- `forecast.ts`: adicionar `investimento` nas agregações por categoria
  (linhas 274-302). Nova coluna na tabela de projeção.
- `daily-flow.ts`: investimento entra como SAÍDA no fluxo de caixa
  diário (igual despesa, debita o banco) — checar linhas 117-207.
- `forecast-table.tsx`: nova seção "Investimentos" ou incluir junto
  com despesas com destaque visual.

### AI context
- `financial-context.ts` — adicionar `totalInvestimentosCents` ao
  contexto enviado ao Gemini. Atualizar system-prompt se necessário
  (o assistente precisa saber que investimento não é despesa).

### Imports
- `api/import/pdf/route.ts` — IA continua retornando só `receita` ou
  `despesa`. Investimento é manual/reclassificado (via regras de
  categoria) para não inflar falsos positivos.
- `import-review-table.tsx` — dropdown de tipo ganha "Investimento".

### Exports/relatórios
- `pdf-report.ts` — label/cor de investimento.
- Export CSV — label "Investimento".

### Testes
- Adicionar cobertura em `net-revenue.test.ts`:
  - Investimento não entra em `totalReceitas` nem `totalDespesas`.
  - `totalInvestimentosCents` soma correto.
  - Savings rate permanece correto.
- E2E Playwright: criar transação tipo investimento, verificar que
  saldo da conta desce, e KPIs do dashboard não contam como despesa.

### Audit trail
- `logAudit` — não precisa mudar; chamadas existentes cobrem.

## Fases de rollout

Cada fase termina com `npm run build` verde + regressão das telas
afetadas. Se qualquer fase falhar, reverter antes de seguir.

### Fase 0 — Schema + types (reversível em 1 min)
1. Migration 026 (amplia CHECKs, adiciona `total_investment_cents`).
2. Update `src/types/database.ts`.
3. Build TS (pega qualquer uso que não compile).
4. **Gate:** build verde, sem mudança de comportamento.

### Fase 1 — Core transação (form + list + filtros)
1. `transaction-form.tsx` — tipo novo, delta igual despesa, categoria
   de tipo `'investimento'`.
2. `transaction-list.tsx` — render cor/sinal.
3. `transacoes/page.tsx` — filtro + CSV.
4. Categoria: `category-form.tsx` + `category-list.tsx`.
5. Seed opcional: migration adicional com categorias padrão de
   investimento (ex.: "Aporte Ações", "Aporte Tesouro", "Reserva").
6. **Gate:** criar transação investimento manual, ver saldo descer,
   aparecer na lista com cor/sinal próprios.

### Fase 2 — KPIs dashboard (onde o bug do usuário se resolve)
1. `net-revenue.ts` — `totalInvestimentosCents` no retorno.
2. `use-dashboard-data.ts` — expor `totalInvestimentos`.
3. Novo card "Investido no mês" no dashboard.
4. `monthly-closing.tsx` — snapshot inclui investimento.
5. **Gate:** criar transação investimento e ver que:
   - Despesa do mês NÃO soma o aporte.
   - Receita do mês NÃO soma o aporte.
   - Savings rate sobe.
   - Card novo mostra total investido.

### Fase 3 — Forecast & daily-flow
1. `forecast.ts` — projeção por categoria investimento.
2. `daily-flow.ts` — investimento é saída de caixa.
3. `forecast-table.tsx` — renderização.
4. **Gate:** fluxo diário mostra saída no dia do aporte; forecast
   prevê aporte mensal.

### Fase 4 — Recorrentes + import
1. `recurring-form.tsx`, `recurring-list.tsx`.
2. `recurrence-detection.ts`.
3. `import-review-table.tsx` — opção manual de reclassificar.
4. **Gate:** criar recorrente investimento mensal (ex.: aporte
   mensal), confirmar que gera no dashboard como investimento.

### Fase 5 — (opcional, futuro) integração com `investments`
1. Novo campo `destination_investment_id` em `transactions`.
2. Trigger/RPC cria `investment_entries` automaticamente quando
   transação do tipo `investimento` aponta para um `investment`.
3. UI: form ganha seleção de investimento alvo.
4. **Não é pré-requisito** para as fases anteriores.

## Salvaguardas contra regressão

1. **Branch separado** desde a Fase 0 (`feat/investimento-type`).
2. `npm run build` após cada fase — TS strict pega uniões incompletas.
3. **Grep de verificação** após cada fase:
   - `"receita" | "despesa" | "transferencia"` (TS unions não
     atualizadas).
   - `.eq("type"` e `.neq("type"` (garantir decisão consciente em
     cada um).
   - `type === "despesa"` (confirmar que lugares que somam despesa
     não deveriam incluir investimento).
4. E2E Playwright rodando após Fase 2 e Fase 4.
5. Rodar `/testar` antes de abrir PR.

## Riscos conhecidos

| Risco | Mitigação |
|---|---|
| Alguma query filtrando `type IN ('receita','despesa','transferencia')` hardcoded omite investimento | Grep exaustivo listado acima + TS strict |
| Saldos de conta ficarem inconsistentes se usuário reclassificar despesa→investimento | Delta de saldo é igual (ambos debitam), então reclassificar NÃO exige `adjust_account_balance`. Testar explicitamente. |
| Transação existente categorizada como "Investimentos" (categoria dentro de despesa hoje) continua sendo despesa até o usuário reclassificar manualmente | Script opcional de migração: identificar categorias "Investimentos" e reclassificar em lote **com confirmação**. |
| Imports automáticos classificarem aporte como despesa (comportamento atual) | Aceitar — usuário reclassifica. Regras de importação podem ajudar. |

## Decisões em aberto (precisam aprovação)

1. **Fase 5 (destination_investment_id)**: fazer agora ou deixar como
   evolução futura? **Recomendação:** deixar para depois — V1 sem.
2. **Seed de categorias de investimento**: criar migração com
   categorias padrão ("Aporte Ações", "Aporte Tesouro", "Reserva")
   ou deixar usuário criar? **Recomendação:** seed — evita fricção.
3. **Reclassificação em lote**: script que pega categorias chamadas
   "Investimentos" e as transações sob elas, e reclassifica para o
   novo tipo? **Recomendação:** sim, mas com dry-run + confirmação.
4. **Cor/ícone de investimento na UI**: violeta com "↓"? Dourado?
   **Recomendação:** violeta (distinto de transferência azul,
   receita verde, despesa vermelho).

## Próxima ação imediata (após aprovação)

Executar Fase 0 isoladamente e pedir validação antes de seguir para
Fase 1.
