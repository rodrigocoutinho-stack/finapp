# Estado Atual — FinApp

Ultima atualizacao: 2026-02-28

## Status
Build OK. Deploy Vercel ativo. Metas Financeiras implementadas (migration 013, CRUD completo, widget dashboard, insights automaticos). Sidebar atualizada (9 itens). Nenhuma dependencia nova.

## Hipoteses Abertas
- Nenhuma

## Debitos Tecnicos / Riscos Conhecidos
- Rate limiting in-memory nao persiste entre cold starts serverless (Vercel). Impacto baixo para 100-500 usuarios. Solucao futura: Redis/Upstash KV. Adiado por complexidade vs volume atual.
- CSP usa `unsafe-inline` e `unsafe-eval` para compatibilidade com Next.js. Restringir quando possivel em versao futura.
- 17 lint warnings esperados: `supabase` omitido de dependency arrays de hooks (singleton por design, nao e bug).
- Migration 013 (goals) precisa ser executada no Supabase SQL Editor antes de usar a feature em producao.

## Proxima Acao Sugerida
Executar migration 013 no Supabase SQL Editor e testar CRUD de metas em producao. Criterio de sucesso: criar meta, editar, excluir, vincular a conta, verificar widget no dashboard e insights.
