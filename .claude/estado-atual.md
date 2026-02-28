# Estado Atual — FinApp

Ultima atualizacao: 2026-02-28

## Status
Build OK. Deploy Vercel ativo. Codex Quick Wins implementados: custo essencial configuravel (is_essential), tempo ate meta da reserva (sublabel KPI), alerta 120% no orcamento (badge Critico). Nenhuma dependencia nova.

## Hipoteses Abertas
- Nenhuma

## Debitos Tecnicos / Riscos Conhecidos
- Rate limiting in-memory nao persiste entre cold starts serverless (Vercel). Impacto baixo para 100-500 usuarios. Solucao futura: Redis/Upstash KV. Adiado por complexidade vs volume atual.
- CSP usa `unsafe-inline` e `unsafe-eval` para compatibilidade com Next.js. Restringir quando possivel em versao futura.
- 17 lint warnings esperados: `supabase` omitido de dependency arrays de hooks (singleton por design, nao e bug).
- Migration 014 (essential categories) precisa ser executada no Supabase SQL Editor.

## Proxima Acao Sugerida
Executar migration 014 no Supabase SQL Editor. Testar: marcar categorias como essenciais em Configuracoes, verificar KPIs de reserva/runway usando custo essencial, verificar badge Critico no orcamento quando categoria > 120%. Criterio de sucesso: KPIs mudam ao marcar categorias, badge Critico aparece.
