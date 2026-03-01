# Estado Atual — FinApp

Ultima atualizacao: 2026-02-28

## Status
Build OK. Deploy Vercel ativo. Migrations 001-016 executadas no Supabase. Migration 017 (audit_logs) pendente de execucao no SQL Editor. Simuladores Educacionais + AuditLog + Testes E2E implementados. Todas as 3 features Codex P3 concluidas.

## Hipoteses Abertas
- Nenhuma

## Debitos Tecnicos / Riscos Conhecidos
- Rate limiting in-memory nao persiste entre cold starts serverless (Vercel). Impacto baixo para 100-500 usuarios. Solucao futura: Redis/Upstash KV. Adiado por complexidade vs volume atual.
- CSP usa `unsafe-inline` e `unsafe-eval` para compatibilidade com Next.js. Restringir quando possivel em versao futura.
- 17 lint warnings esperados: `supabase` omitido de dependency arrays de hooks (singleton por design, nao e bug).
- `interest_rate_monthly` retorna como `number` do Supabase JS mas e NUMERIC no Postgres. Conversao com `Number()` feita nos calculos.
- Migration 017 (audit_logs) ainda nao executada no Supabase. AuditLog funciona apos execucao — sem impacto se nao executada (fire-and-forget silencia erros).

## Proxima Acao Sugerida
Executar migration 017 no SQL Editor do Supabase, criar usuario de teste E2E, e rodar `npx playwright install chromium && npm run test:e2e` para validar os testes. Criterio de sucesso: audit_logs registra operacoes e testes E2E passam.
