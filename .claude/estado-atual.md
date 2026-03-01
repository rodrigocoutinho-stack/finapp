# Estado Atual — FinApp

Ultima atualizacao: 2026-02-28

## Status
Build OK. Deploy Vercel ativo. Migrations 001-016 todas executadas no Supabase. Reconciliacao de Saldo + Gestao de Dividas implementados e em producao.

## Hipoteses Abertas
- Nenhuma

## Debitos Tecnicos / Riscos Conhecidos
- Rate limiting in-memory nao persiste entre cold starts serverless (Vercel). Impacto baixo para 100-500 usuarios. Solucao futura: Redis/Upstash KV. Adiado por complexidade vs volume atual.
- CSP usa `unsafe-inline` e `unsafe-eval` para compatibilidade com Next.js. Restringir quando possivel em versao futura.
- 17 lint warnings esperados: `supabase` omitido de dependency arrays de hooks (singleton por design, nao e bug).
- `interest_rate_monthly` retorna como `number` do Supabase JS mas e NUMERIC no Postgres. Conversao com `Number()` feita nos calculos.

## Proxima Acao Sugerida
Testar CRUD de dividas + reconciliacao de saldo em producao. Depois, continuar itens Codex restantes (simuladores, testes E2E, audit log). Criterio de sucesso: criar/editar/excluir divida, simulador funciona, reconciliacao detecta divergencias.
