# Estado Atual — FinApp

Ultima atualizacao: 2026-03-01

## Status
Build OK. Dark mode implementado com next-themes + CSS variables semanticas + Tailwind v4 @theme tokens. Toggle Claro/Escuro/Sistema em Configuracoes > Geral. Persistencia via localStorage (next-themes). Sem flash de tema (suppressHydrationWarning + attribute="class"). ~50 arquivos atualizados. Graficos Recharts com hook useChartColors() responsivo ao tema.

## Hipoteses Abertas
- Nenhuma

## Debitos Tecnicos / Riscos Conhecidos
- Rate limiting in-memory nao persiste entre cold starts serverless (Vercel). Impacto baixo para 100-500 usuarios. Solucao futura: Redis/Upstash KV. Adiado por complexidade vs volume atual.
- CSP mantem `unsafe-inline` para scripts e styles (necessario para Next.js/Tailwind). `unsafe-eval` foi removido.
- 21 lint warnings esperados: `supabase` omitido de dependency arrays em 10 hooks (singleton por design). Nao sao bugs.
- `interest_rate_monthly` retorna como `number` do Supabase JS mas e NUMERIC no Postgres. Conversao com `Number()` feita nos calculos.
- `next lint` nao funciona no Next.js 16.1.6 (interpreta "lint" como diretorio). Workaround: usar `npx eslint src/` diretamente.
- Insights do dashboard sao efemeros (ad-hoc em React, agora memoizados com useMemo) — nao ha motor de regras formal nem persistencia de recomendacoes.
- Query de reconciliacao limitada a 10000 transacoes. Usuarios com mais de 10k transacoes podem ver falsos positivos de divergencia. Solucao futura: RPC server-side para agregacao.
- 2 tabelas (ForecastTable, DailyFlowTable) usam HTML manual em vez do DataTable reutilizavel (colunas dinamicas/sticky incompativeis sem expandir API).
- Exportacao CSV limitada a 1000 rows por query Supabase. Suficiente para v1, mas usuarios com muitas transacoes podem precisar de paginacao na exportacao.
- Paginas de Metas e Dividas mantêm `.limit(100)` sem paginacao server-side (layout de cards, volume naturalmente baixo). Reavaliar se algum usuario ultrapassar 100 itens.

## Proxima Acao Sugerida
Verificacao visual do dark mode em todas as paginas (dashboard, transacoes, modais, formularios, graficos, sidebar, login). Criterio de sucesso: sem elementos invisiveis ou ilegíveis no tema escuro.
