# Estado Atual — FinApp

Ultima atualizacao: 2026-03-02

## Status
Build OK. Codigo estavel — sem debitos novos. Sessao atual focou em documentacao comercial e de usuario.

Ultima sessao de codigo (2026-03-02): Sidebar refatorada com 4 grupos colapsaveis + scroll corrigido. Revisao de codigo: 11 problemas corrigidos. Teste E2E: 46/46 passos OK.

Documentacao atualizada (2026-03-02):
- Manual do Usuario v3.0: cobre todas as 12 funcionalidades, fluxo de configuracao inicial, rotina diaria/semanal/mensal, dicas rapidas. Fonte unica: `docs/manual-usuario.md` → gerado via `docs/gerar-manual.py`.
- Pitch Deck v3.0: 14 slides com narrativa de venda (problema → barreiras → concorrentes → comparativo → solucao → modulos → IA → evidencias → CTA). Fonte: `docs/gerar-pitch.py`.

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
- Paginas de Metas e Dividas mantem `.limit(100)` sem paginacao server-side (layout de cards, volume naturalmente baixo). Reavaliar se algum usuario ultrapassar 100 itens.
- Pagina `/transacoes/importar` exibe titulo com Unicode escapado ("Transa\u00e7\u00f5es" em vez de "Transacoes"). Bug cosmético de baixa prioridade.

## Proxima Acao Sugerida
Consultar backlog de melhorias (plano-melhorias-codex.md) e escolher proximo item a implementar do Horizonte Longo.
