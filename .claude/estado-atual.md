# Estado Atual — FinApp

Ultima atualizacao: 2026-02-28

## Status
Build OK. Lint 0 errors. Deploy Vercel ativo. Migrations 001-018 executadas. Redesign UX Fase 3 concluida. Simulador FI/RE implementado. Fechamento mensal persistente ativo. Historico de KPIs implementado (pagina /historico com graficos de evolucao e tabela detalhada).

## Hipoteses Abertas
- Nenhuma

## Debitos Tecnicos / Riscos Conhecidos
- Rate limiting in-memory nao persiste entre cold starts serverless (Vercel). Impacto baixo para 100-500 usuarios. Solucao futura: Redis/Upstash KV. Adiado por complexidade vs volume atual.
- CSP usa `unsafe-inline` e `unsafe-eval` para compatibilidade com Next.js. Restringir quando possivel em versao futura.
- 21 lint warnings esperados: `supabase` omitido de dependency arrays (singleton por design), unused vars menores. Nao sao bugs.
- `interest_rate_monthly` retorna como `number` do Supabase JS mas e NUMERIC no Postgres. Conversao com `Number()` feita nos calculos.
- `next lint` nao funciona no Next.js 16.1.6 (interpreta "lint" como diretorio). Workaround: usar `npx eslint src/` diretamente.
- Insights do dashboard sao efemeros (ad-hoc em React) — nao ha motor de regras formal nem persistencia de recomendacoes.

## Proxima Acao Sugerida
Prosseguir para melhorias de robustez: validacoes de formulario mais rigorosas, paginacao server-side para tabelas com muitos registros, ou dark mode.
