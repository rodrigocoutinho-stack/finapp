# Estado Atual — FinApp

Ultima atualizacao: 2026-02-28

## Status
Build OK. Lint 0 errors (21 warnings esperados). Deploy Vercel ativo. Migrations 001-017 executadas no Supabase. Todas as funcionalidades implementadas. CLAUDE.md reestruturado conforme regras globais (estado/decisoes movidos para .claude/).

## Hipoteses Abertas
- Nenhuma

## Debitos Tecnicos / Riscos Conhecidos
- Rate limiting in-memory nao persiste entre cold starts serverless (Vercel). Impacto baixo para 100-500 usuarios. Solucao futura: Redis/Upstash KV. Adiado por complexidade vs volume atual.
- CSP usa `unsafe-inline` e `unsafe-eval` para compatibilidade com Next.js. Restringir quando possivel em versao futura.
- 21 lint warnings esperados: `supabase` omitido de dependency arrays (singleton por design), unused vars menores (`now` em goal-utils, `annualRange` em page). Nao sao bugs.
- `interest_rate_monthly` retorna como `number` do Supabase JS mas e NUMERIC no Postgres. Conversao com `Number()` feita nos calculos.
- `next lint` nao funciona no Next.js 16.1.6 (interpreta "lint" como diretorio). Workaround: usar `npx eslint src/` diretamente.

## Proxima Acao Sugerida
Iniciar Redesign UX Fase 3 (chart upgrade, form styling, DataTable reutilizavel). Criterio de sucesso: build OK + lint 0 errors apos cada alteracao.
