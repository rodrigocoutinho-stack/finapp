# Estado Atual — FinApp

Ultima atualizacao: 2026-03-28

## Status
Build OK. Testes OK (173/173). Feature de relatorio PDF mensal implementada.

Alteracoes da sessao (cumulativo):
1. **Refatoracao Dashboard** — page.tsx de 754→170 linhas, hooks extraidos, error boundaries
2. **Suite de testes unitarios** — Vitest, 173 testes, 8 arquivos, 7 modulos cobertos
3. **Responsividade mobile** — 10 componentes ajustados
4. **E2E expandido** — 6 novos specs (total 10)
5. **Relatorio PDF mensal** — nova feature:
   - `jspdf` + `jspdf-autotable` instalados como dependencias
   - `src/lib/pdf-report.ts` — gerador de PDF com: cabecalho azul, cards resumo (Receitas/Despesas/Saldo), tabela de KPIs, tabela de categorias (com %), tabela de transacoes (com cores receita/despesa), rodape com paginacao
   - Botao "PDF" no dashboard header (icon-only no mobile, lazy-loaded via dynamic import)
   - Nome do usuario incluido no cabecalho do PDF (via PreferencesContext)
   - Toast de sucesso/erro na geracao

## Hipoteses Abertas
- Nenhuma

## Debitos Tecnicos / Riscos Conhecidos
- Rate limiting in-memory nao persiste entre cold starts serverless.
- CSP mantem `unsafe-inline` para scripts e styles.
- 21 lint warnings esperados: `supabase` omitido de dependency arrays.
- `toCents()` nao trata strings com separador de milhar.
- Dashboard ainda faz 14 queries paralelas.
- `forecast.ts`, `daily-flow.ts` sem testes unitarios (exigem mock Supabase).
- `csv-export.ts` sem testes (depende de DOM).
- PDF nao inclui graficos (apenas tabelas) — adicionar chart canvas seria melhoria futura.
- PDF usa fonts padroes jsPDF (Helvetica) — nao suporta caracteres especiais fora do Latin-1.

## Proxima Acao Sugerida
Commit das alteracoes da sessao e push para producao.
