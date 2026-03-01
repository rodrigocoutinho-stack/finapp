# Estado Atual — FinApp

Ultima atualizacao: 2026-02-28

## Status
Build OK. Lint 0 errors. Deploy Vercel ativo. Migrations 001-018 (018 pendente execucao no Supabase). Redesign UX Fase 3 concluida. Simulador FI/RE implementado (4o simulador educacional). Fechamento mensal persistente implementado (componente + types + migration).

## Hipoteses Abertas
- Nenhuma

## Debitos Tecnicos / Riscos Conhecidos
- Rate limiting in-memory nao persiste entre cold starts serverless (Vercel). Impacto baixo para 100-500 usuarios. Solucao futura: Redis/Upstash KV. Adiado por complexidade vs volume atual.
- CSP usa `unsafe-inline` e `unsafe-eval` para compatibilidade com Next.js. Restringir quando possivel em versao futura.
- 21 lint warnings esperados: `supabase` omitido de dependency arrays (singleton por design), unused vars menores. Nao sao bugs.
- `interest_rate_monthly` retorna como `number` do Supabase JS mas e NUMERIC no Postgres. Conversao com `Number()` feita nos calculos.
- `next lint` nao funciona no Next.js 16.1.6 (interpreta "lint" como diretorio). Workaround: usar `npx eslint src/` diretamente.
- Insights do dashboard sao efemeros (ad-hoc em React) — nao ha motor de regras formal nem persistencia de recomendacoes.
- Migration 018 (monthly_closings) criada mas pendente execucao no Supabase remoto.

## Proxima Acao Sugerida
Executar migration 018 no Supabase remoto e testar fechamento mensal end-to-end. Depois: prosseguir para proxima fase do roadmap (historico de KPIs com grafico de evolucao mes a mes).
