# Teste E2E — Playwright MCP

Voce e um testador QA real. Navegue o FinApp pelo browser usando Playwright MCP, crie dados de teste, verifique funcionalidades, avalie visual e limpe tudo no final.

## Regras Gerais

1. **Sempre** `browser_snapshot` antes de qualquer interacao (click, type, fill)
2. **Sempre** `browser_console_messages` (level: "error") apos cada navegacao
3. **Sempre** `browser_wait_for` apos acoes que disparam toast (aguardar texto exato)
4. **Screenshot** a cada etapa: `browser_take_screenshot` com `filename: "e2e-XX-descricao.png"` (XX = numero sequencial)
5. **Falha isolada**: registrar + screenshot + prosseguir (NUNCA abortar o teste inteiro)
6. **Manter registro** de cada passo: status (OK/FALHA), descricao, erro se houver

---

## FASE 0 — Autenticacao

1. `browser_navigate` para `http://localhost:3000`
2. `browser_snapshot` — verificar se aparece "FinApp" + "Dashboard" (logado) ou "Entrar" (login)
3. Se estiver na pagina de login:
   - **PERGUNTAR ao usuario** email e senha com `AskUserQuestion` (NUNCA inventar credenciais)
   - Preencher campo `email` (id) e campo `password` (id)
   - Clicar botao "Entrar"
   - `browser_wait_for` texto "Dashboard"
4. Screenshot: `e2e-00-autenticado.png`
5. Registrar closingDay atual para restaurar no cleanup (anotar valor da pagina Config.)

---

## FASE 1 — Criar Dados de Teste

Sufixo obrigatorio: **"Teste E2E"** em todos os nomes/descricoes (facilita cleanup).

### 1.1 Conta
- Navegar para `/contas`
- Snapshot + screenshot `e2e-01-contas-antes.png`
- Clicar botao "Nova conta" (no PageHeader)
- Aguardar modal "Nova conta"
- Snapshot, preencher form:
  - `name` = "Conta Teste E2E"
  - `type` = "banco"
- Clicar "Criar conta"
- `browser_wait_for` texto "Conta criada com sucesso."
- Screenshot `e2e-02-conta-criada.png`

### 1.2 Categoria Receita
- Navegar para `/categorias`
- Clicar "Nova categoria"
- Aguardar modal "Nova categoria"
- Snapshot, preencher:
  - `name` = "Salario Teste E2E"
  - `type` = "receita"
  - `projectionType` = "recurring"
- Clicar "Criar categoria"
- `browser_wait_for` texto "Categoria criada com sucesso."
- Screenshot `e2e-03-cat-receita.png`

### 1.3 Categoria Despesa
- Clicar "Nova categoria" novamente
- Aguardar modal "Nova categoria"
- Snapshot, preencher:
  - `name` = "Mercado Teste E2E"
  - `type` = "despesa"
  - `projectionType` = "historical"
- Clicar "Criar categoria"
- `browser_wait_for` texto "Categoria criada com sucesso."
- Screenshot `e2e-04-cat-despesa.png`

### 1.4 Transacao Receita
- Navegar para `/transacoes`
- Clicar "Nova transacao"
- Aguardar modal "Nova transacao"
- Snapshot, preencher:
  - `type` = "receita"
  - `amount` = "5000" (R$ 5.000,00)
  - `account` = selecionar "Conta Teste E2E"
  - `category` = selecionar "Salario Teste E2E"
  - `description` = "Salario Janeiro Teste E2E"
  - `date` = data de hoje (formato YYYY-MM-DD)
- Clicar "Criar transacao"
- `browser_wait_for` texto "Transacao criada com sucesso."
- Screenshot `e2e-05-transacao-receita.png`

### 1.5 Transacao Despesa
- Clicar "Nova transacao" novamente
- Aguardar modal "Nova transacao"
- Snapshot, preencher:
  - `type` = "despesa"
  - `amount` = "1200" (R$ 1.200,00)
  - `account` = selecionar "Conta Teste E2E"
  - `category` = selecionar "Mercado Teste E2E"
  - `description` = "Compras Supermercado Teste E2E"
  - `date` = data de hoje
- Clicar "Criar transacao"
- `browser_wait_for` texto "Transacao criada com sucesso."
- Screenshot `e2e-06-transacao-despesa.png`

### 1.6 Recorrente Receita
- Navegar para `/recorrentes`
- Clicar "Nova transacao" (botao do PageHeader)
- Aguardar modal "Nova transacao planejada"
- Snapshot, preencher:
  - `type` = "receita"
  - `amount` = "5000"
  - `account` = selecionar "Conta Teste E2E"
  - `category` = selecionar "Salario Teste E2E"
  - `description` = "Salario Recorrente Teste E2E"
  - `scheduleType` = "recurring"
  - `dayOfMonth` = "5"
- Clicar "Criar"
- `browser_wait_for` texto "Transacao planejada criada com sucesso."
- Screenshot `e2e-07-recorrente-receita.png`

### 1.7 Recorrente Despesa
- Clicar "Nova transacao" novamente
- Aguardar modal "Nova transacao planejada"
- Snapshot, preencher:
  - `type` = "despesa"
  - `amount` = "1500"
  - `account` = selecionar "Conta Teste E2E"
  - `category` = selecionar "Mercado Teste E2E"
  - `description` = "Aluguel Recorrente Teste E2E"
  - `scheduleType` = "recurring"
  - `dayOfMonth` = "10"
- Clicar "Criar"
- `browser_wait_for` texto "Transacao planejada criada com sucesso."
- Screenshot `e2e-08-recorrente-despesa.png`

### 1.8 Investimento
- Navegar para `/investimentos`
- Clicar "Novo investimento"
- Aguardar modal "Novo investimento"
- Snapshot, preencher:
  - `inv-name` = "CDB Teste E2E"
  - `inv-account` = selecionar "Conta Teste E2E"
  - `inv-product` = "cdb"
  - `inv-indexer` = "cdi"
  - `inv-rate` = "120"
- Clicar "Criar investimento"
- `browser_wait_for` texto "Investimento criado com sucesso."
- Screenshot `e2e-09-investimento.png`

### 1.9 Lancamento de Aporte
- Snapshot e localizar botao "Lancamentos" do card "CDB Teste E2E"
- Clicar "Lancamentos"
- Aguardar modal com titulo contendo "CDB Teste E2E"
- Clicar "Novo lancamento" para expandir o form
- Snapshot, preencher:
  - `entry-type` = "aporte"
  - `entry-amount` = "10000"
  - `entry-date` = data de hoje
- Clicar "Registrar"
- `browser_wait_for` texto "Lancamento registrado."
- Screenshot `e2e-10-aporte.png`
- Fechar modal

---

## FASE 2 — Verificacoes Funcionais

### 2.1 Dashboard
- Navegar para `/` (Dashboard)
- Snapshot + screenshot `e2e-11-dashboard.png`
- **Verificar** (no snapshot):
  - Card de receitas mostra R$ 5.000
  - Card de despesas mostra R$ 1.200
  - Card de saldo mostra R$ 3.800
  - Secao de grafico de categorias presente
  - Tabela de fluxo diario presente
  - Widget de investimentos presente
- Registrar cada verificacao como OK/FALHA

### 2.2 Previsto vs Realizado (se visivel no dashboard do mes corrente)
- No dashboard, verificar se o componente "Comparacao proporcional" esta visivel
- Se visivel:
  - Verificar secoes Receitas/Despesas
  - Verificar barras de progresso
  - Screenshot `e2e-12-previsto-realizado.png`

### 2.3 Fluxo Previsto
- Navegar para `/fluxo-previsto`
- Snapshot + screenshot `e2e-13-fluxo-previsto.png`
- **Verificar**:
  - Mes atual destacado (com indicador "atual")
  - Pelo menos 3 meses futuros visiveis
  - Categorias "Salario Teste E2E" e "Mercado Teste E2E" aparecem na tabela

### 2.4 Transacoes — Filtro mensal
- Navegar para `/transacoes`
- Snapshot — verificar que transacoes "Teste E2E" aparecem no mes atual
- Screenshot `e2e-14-transacoes-mes-atual.png`
- Clicar botao "Mes anterior" (aria-label)
- Snapshot — verificar que transacoes "Teste E2E" NAO aparecem
- Screenshot `e2e-15-transacoes-mes-anterior.png`
- Clicar "Proximo mes" para voltar ao mes atual

### 2.5 Configuracoes — Closing Day
- Navegar para `/configuracoes`
- Snapshot — anotar valor atual do `closing-day`
- Alterar `closing-day` para "15"
- Clicar "Salvar"
- `browser_wait_for` texto "Configuracao salva."
- Screenshot `e2e-16-config-dia15.png`
- Navegar para `/` (Dashboard)
- Snapshot — verificar que MonthPicker mostra subtexto com range adaptado (dia 15)
- Screenshot `e2e-17-dashboard-dia15.png`
- Navegar para `/configuracoes`
- Restaurar `closing-day` para o valor original anotado
- Clicar "Salvar"
- `browser_wait_for` texto "Configuracao salva."
- Screenshot `e2e-18-config-restaurado.png`

---

## FASE 3 — QA Visual

Tirar screenshots fullPage de 7 paginas e avaliar visualmente:

| # | Pagina | URL | Arquivo |
|---|--------|-----|---------|
| 1 | Dashboard | `/` | `e2e-19-visual-dashboard.png` |
| 2 | Contas | `/contas` | `e2e-20-visual-contas.png` |
| 3 | Categorias | `/categorias` | `e2e-21-visual-categorias.png` |
| 4 | Transacoes | `/transacoes` | `e2e-22-visual-transacoes.png` |
| 5 | Recorrentes | `/recorrentes` | `e2e-23-visual-recorrentes.png` |
| 6 | Investimentos | `/investimentos` | `e2e-24-visual-investimentos.png` |
| 7 | Fluxo Previsto | `/fluxo-previsto` | `e2e-25-visual-fluxo.png` |

Para cada screenshot, usar `browser_take_screenshot` com `fullPage: true` e avaliar:
- Alinhamento geral (nada deslocado ou sobreposto)
- Cores emerald/rose aplicadas corretamente
- Numeros com alinhamento tabular (tabular-nums)
- Espacamento consistente (sem gaps estranhos)
- Sem overflow horizontal ou texto cortado

---

## FASE 4 — Navegacao

Testar todos os 8 links da navbar sequencialmente:

| # | Label | URL esperada |
|---|-------|-------------|
| 1 | Dashboard | `/` |
| 2 | Contas | `/contas` |
| 3 | Categorias | `/categorias` |
| 4 | Transacoes | `/transacoes` |
| 5 | Recorrentes | `/recorrentes` |
| 6 | Fluxo Previsto | `/fluxo-previsto` |
| 7 | Investimentos | `/investimentos` |
| 8 | Config. | `/configuracoes` |

Para cada link:
1. `browser_snapshot` — localizar link na navbar
2. Clicar no link
3. `browser_wait_for` — aguardar carregamento (titulo da pagina ou PageHeader)
4. `browser_console_messages` level "error" — registrar se houver erros
5. Verificar que o link ativo tem destaque (classes emerald)

Screenshot final: `e2e-26-navegacao-ok.png`

---

## FASE 5 — Cleanup

**ORDEM OBRIGATORIA** (respeitar FK constraints — inverso da criacao):

### 5.1 Excluir Investimento (inclui lancamentos em cascata)
- Navegar para `/investimentos`
- Snapshot — localizar "CDB Teste E2E"
- Clicar "Excluir" do card "CDB Teste E2E"
- Aguardar modal "Excluir investimento"
- Clicar botao "Excluir" (danger) no modal
- `browser_wait_for` texto "Investimento excluido."
- Screenshot `e2e-27-cleanup-investimento.png`

### 5.2 Excluir Transacoes
- Navegar para `/transacoes`
- Snapshot — localizar "Salario Janeiro Teste E2E"
- Clicar "Excluir" da transacao "Salario Janeiro Teste E2E"
- Aguardar modal "Excluir transacao"
- Clicar "Excluir" no modal
- `browser_wait_for` texto "Transacao excluida."
- Repetir para "Compras Supermercado Teste E2E"
- Screenshot `e2e-28-cleanup-transacoes.png`

### 5.3 Excluir Recorrentes
- Navegar para `/recorrentes`
- Snapshot — localizar "Salario Recorrente Teste E2E"
- Clicar "Excluir" da recorrente "Salario Recorrente Teste E2E"
- Aguardar modal "Excluir transacao recorrente"
- Clicar "Excluir" no modal
- `browser_wait_for` texto "Transacao planejada excluida."
- Repetir para "Aluguel Recorrente Teste E2E"
- Screenshot `e2e-29-cleanup-recorrentes.png`

### 5.4 Excluir Categorias
- Navegar para `/categorias`
- Snapshot — localizar "Salario Teste E2E"
- Clicar "Excluir" da categoria "Salario Teste E2E"
- Aguardar modal "Excluir categoria"
- Clicar "Excluir" no modal
- `browser_wait_for` texto "Categoria excluida."
- Repetir para "Mercado Teste E2E"
- Screenshot `e2e-30-cleanup-categorias.png`

### 5.5 Excluir Conta
- Navegar para `/contas`
- Snapshot — localizar "Conta Teste E2E"
- Clicar "Excluir" do card "Conta Teste E2E"
- Aguardar modal "Excluir conta"
- Clicar "Excluir" no modal
- `browser_wait_for` texto "Conta excluida."
- Screenshot `e2e-31-cleanup-conta.png`

### 5.6 Verificacao final
- Navegar para `/` (Dashboard)
- Snapshot — confirmar que nenhum dado "Teste E2E" permanece visivel
- Screenshot `e2e-32-cleanup-final.png`

---

## FASE 6 — Relatorio Final

Compilar e apresentar ao usuario:

### Tabela de Resultados

```
| Fase | Descricao                  | Status  | Detalhes        |
|------|----------------------------|---------|-----------------|
| 0    | Autenticacao               | OK/FAIL | ...             |
| 1.1  | Criar conta                | OK/FAIL | ...             |
| 1.2  | Criar cat. receita         | OK/FAIL | ...             |
| 1.3  | Criar cat. despesa         | OK/FAIL | ...             |
| 1.4  | Transacao receita          | OK/FAIL | ...             |
| 1.5  | Transacao despesa          | OK/FAIL | ...             |
| 1.6  | Recorrente receita         | OK/FAIL | ...             |
| 1.7  | Recorrente despesa         | OK/FAIL | ...             |
| 1.8  | Investimento               | OK/FAIL | ...             |
| 1.9  | Aporte                     | OK/FAIL | ...             |
| 2.1  | Dashboard cards            | OK/FAIL | ...             |
| 2.2  | Previsto vs Realizado      | OK/FAIL | ...             |
| 2.3  | Fluxo Previsto             | OK/FAIL | ...             |
| 2.4  | Filtro mensal              | OK/FAIL | ...             |
| 2.5  | Closing Day                | OK/FAIL | ...             |
| 3    | QA Visual (7 paginas)      | OK/FAIL | ...             |
| 4    | Navegacao (8 links)        | OK/FAIL | ...             |
| 5    | Cleanup                    | OK/FAIL | ...             |
```

### Resumo
- **Total**: X/Y passos OK
- **Erros de console**: listar todos os erros capturados
- **Problemas visuais**: listar observacoes dos screenshots
- **Screenshots gerados**: listar todos os arquivos e2e-*.png

### Resultado Final
- **APROVADO**: Todos os passos OK, sem erros criticos
- **REPROVADO**: Listar falhas criticas que impedem uso normal
