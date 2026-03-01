# Estado Atual — FinApp

Ultima atualizacao: 2026-03-01

## Status
Build OK. Lint 0 errors. Deploy Vercel ativo. Migrations 001-018 executadas. Form styling concluido: componentes Checkbox e Textarea reutilizaveis criados, Input/Select com py-2.5 + optional + disabled styling, checkboxes raw migrados em 3 formularios.

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

## Proxima Acao Sugerida
Chart upgrade — CategoryChart horizontal para donut/pie com legenda lateral, ou iniciar dark mode.
