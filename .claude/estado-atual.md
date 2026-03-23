# Estado Atual — FinApp

Ultima atualizacao: 2026-03-22

## Status
Build OK. Codigo estavel. Feature "Transferencia entre contas" implementada com sucesso.

Alteracoes da sessao:
- Migration 019: tipo `transferencia` em transactions e recurring_transactions, campo `destination_account_id`, category_id nullable, constraints de consistencia
- Types database.ts atualizados (Transaction e RecurringTransaction com novos campos/tipos)
- TransactionForm: tipo transferencia com conta destino, sem categoria, ajuste de saldo em 2 contas
- TransactionList: cor azul para transferencias, coluna "Origem → Destino"
- TransactionFilters: opcao transferencia adicionada
- Transacoes page: query com hint `accounts!account_id` + `accounts!destination_account_id`, CSV com coluna Conta Destino
- RecurringForm/RecurringList: mesma logica de transferencia
- Dashboard: botao rapido "Transferencia", transacoes recentes com cor azul, reconciliacao corrigida para transferencias
- Contas/Reconciliacao: tratamento de transferencias (debito na origem, credito no destino)
- Forecast/DailyFlow: filtro `.neq("type", "transferencia")` para nao inflar receita/despesa
- RecurrenceDetection: skip de transferencias
- Financial context IA: menciona transferencias no contexto

## Hipoteses Abertas
- Nenhuma

## Debitos Tecnicos / Riscos Conhecidos
- Rate limiting in-memory nao persiste entre cold starts serverless (Vercel). Impacto baixo para 100-500 usuarios. Solucao futura: Redis/Upstash KV. Adiado por complexidade vs volume atual.
- CSP mantem `unsafe-inline` para scripts e styles (necessario para Next.js/Tailwind). `unsafe-eval` foi removido.
- 21 lint warnings esperados: `supabase` omitido de dependency arrays em 10 hooks (singleton por design). Nao sao bugs.
- `interest_rate_monthly` retorna como `number` do Supabase JS mas e NUMERIC no Postgres. Conversao com `Number()` feita nos calculos.
- `next lint` nao funciona no Next.js 16.1.6 (interpreta "lint" como diretorio). Workaround: usar `npx eslint src/` diretamente.
- Insights do dashboard sao efemeros (ad-hoc em React, agora memoizados com useMemo) — nao ha motor de regras formal nem persistencia de recomendacoes.
- Reconciliacao agora usa janela de 6 meses (antes era all-time). Usuarios com divergencias anteriores a 6 meses nao serao detectados. Tradeoff aceito: performance vs cobertura total.
- 2 tabelas (ForecastTable, DailyFlowTable) usam HTML manual em vez do DataTable reutilizavel (colunas dinamicas/sticky incompativeis sem expandir API).
- Exportacao CSV limitada a 1000 rows por query Supabase. Suficiente para v1, mas usuarios com muitas transacoes podem precisar de paginacao na exportacao.
- Paginas de Metas e Dividas mantem `.limit(100)` sem paginacao server-side (layout de cards, volume naturalmente baixo). Reavaliar se algum usuario ultrapassar 100 itens.
- Pagina `/transacoes/importar` exibe titulo com Unicode escapado ("Transa\u00e7\u00f5es" em vez de "Transacoes"). Bug cosmético de baixa prioridade.
- 30 auth users de load test permanecem no Supabase (loadtest-*@finapp-loadtest.com). Dados foram limpos, mas auth users exigem service_role key para exclusao.
- Migration 019 precisa ser aplicada no Supabase (nao foi executada automaticamente — requer `supabase db push` ou execucao manual no SQL Editor).

## Proxima Acao Sugerida
Aplicar migration 019 no Supabase (produção) via SQL Editor ou `supabase db push`, e testar criacao/edicao/exclusao de transferencias no ambiente de producao.
