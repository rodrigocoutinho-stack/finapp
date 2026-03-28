# Estado Atual — FinApp

Ultima atualizacao: 2026-03-28

## Status
Build OK. Codigo estavel. Features "Agrupamento de Contas" e "Relatorio Consolidado por Grupo" implementadas.

Alteracoes da sessao:
- Migration 020: campo `account_group` (TEXT nullable) na tabela accounts + indice
- Helper `groupAccountsByGroup()` e `buildGroupedAccountOptions()` em utils.ts
- AccountForm: campo "Grupo (opcional)" com autocomplete via `<datalist>`
- AccountList: renderizacao agrupada com secoes, subtotais e botao "Relatorio" por grupo
- Select UI: suporte a `groupedOptions` com `<optgroup>` (backward-compatible)
- 5 formularios atualizados com optgroup em dropdowns de conta
- TransactionFilters: dropdown de conta com optgroup
- Modal UI: prop `size` ("md" | "lg" | "xl" | "2xl" | "4xl") + scroll em conteudo longo
- GroupReportModal: relatorio consolidado por grupo com 3 cards resumo + BarChart (Recharts) + DataTable (ultimos 6 meses)

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
- 30 auth users de load test permanecem no Supabase (loadtest-*@finapp-loadtest.com). Dados foram limpos, mas auth users exigem service_role key para exclusao.
- PDFs com user-password: pdfjs-dist extrai texto (perde layout visual), Gemini recebe texto puro. Qualidade pode ser inferior a PDFs sem senha onde Gemini recebe bytes PDF nativos. Aceitavel — alternativa seria nao suportar.

## Proxima Acao Sugerida
Testar o relatorio consolidado com dados reais: criar contas PJ e PF, adicionar transacoes de receita e despesa na PJ, verificar que o modal mostra cards + grafico + tabela corretamente.
