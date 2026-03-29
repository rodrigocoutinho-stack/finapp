# Estado Atual — FinApp

Ultima atualizacao: 2026-03-29

## Status
Build OK. Testes OK (180/180). Lint 0 erros. Deploy em producao OK. Teste E2E manual APROVADO.

Sessao completa de melhorias:
1. **Refatoracao Dashboard** — page.tsx de 754→170 linhas, hooks extraidos, error boundaries em 8 secoes
2. **Suite de testes unitarios** — Vitest, 180 testes, 8 arquivos, 7 modulos cobertos + testes de category_group
3. **Responsividade mobile** — 10 componentes ajustados para < 640px
4. **E2E expandido** — 6 novos specs (total 10)
5. **Relatorio PDF mensal** — jsPDF com cabecalho, resumo, KPIs, categorias, transacoes
6. **Agrupamento de categorias** — campo category_group em 4 fases (schema, CRUD, dropdowns, visualizacoes)
7. **Gráfico com toggle** — "Por categoria" / "Por grupo" no donut chart
8. **Seed padrao atualizado** — 27 categorias em 8 grupos para novos usuarios (migration 022)
9. **Sidebar refatorada** — componentes internos extraidos, 5 erros lint eliminados
10. **Limpeza de dados** — usuario limpo para teste real, closing_day=10

## Hipoteses Abertas
- Dropdowns de categoria nos formularios (transaction-form, recurring-form) mostram opcoes flat em vez de optgroup. Funciona corretamente mas nao exibe agrupamento visual. Pode ser limitacao do componente Select com groupedOptions quando filtrado por tipo.

## Debitos Tecnicos / Riscos Conhecidos
- Rate limiting in-memory nao persiste entre cold starts serverless.
- CSP mantem `unsafe-inline` para scripts e styles.
- `toCents()` nao trata strings com separador de milhar.
- Dashboard faz 14 queries paralelas — futuro: database views/RPCs.
- `forecast.ts`, `daily-flow.ts` sem testes unitarios (exigem mock Supabase).
- `csv-export.ts` sem testes (depende de DOM).
- PDF report tem campo `categoryGroup` na interface mas nao agrupa visualmente na tabela (preparacao futura).
- Budget-comparison e forecast/daily-flow tables ainda nao exibem hierarquia 3 niveis (Tipo > Grupo > Categoria) — interfaces prontas, UI pendente.
- 2 warnings Recharts "width(-1) height(-1)" no dashboard (inofensivos).

## Proxima Acao Sugerida
Iniciar uso real do sistema com dados financeiros. Ou implementar hierarquia 3 niveis nas tabelas de budget-comparison, forecast e daily-flow.
