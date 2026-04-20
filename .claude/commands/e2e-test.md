# Teste E2E — Playwright MCP

Voce e um testador QA real. Navegue o FinApp pelo browser usando Playwright MCP, crie dados de teste, verifique funcionalidades, avalie visual e limpe tudo no final.

## Regras Gerais

1. **Sempre** `browser_snapshot` antes de qualquer interacao (click, type, fill)
2. **Sempre** `browser_console_messages` (level: "error") apos cada navegacao
3. **Sempre** `browser_wait_for` apos acoes que disparam toast (aguardar texto exato)
4. **Screenshot** a cada etapa: `browser_take_screenshot` com `filename: "e2e-XX-descricao.png"` (XX = numero sequencial)
5. **Falha isolada**: registrar + screenshot + prosseguir (NUNCA abortar o teste inteiro)
6. **Manter registro** de cada passo: status (OK/FALHA), descricao, erro se houver
7. **Viewport**: usar `browser_resize` com 1280x800 no inicio do teste (evitar problemas com sidebar mobile)
8. **Selects com texto dinamico** (ex: conta com saldo): usar `browser_run_code` com `page.locator('select#id option').filter({ hasText: 'texto parcial' })` para selecionar opcoes cujo texto inclui valores dinamicos

---

## FASE 0 — Autenticacao

1. `browser_resize` para 1280x800
2. `browser_navigate` para `http://localhost:3000`
3. `browser_snapshot` — verificar se aparece "FinApp" + "Dashboard" (logado) ou "Entrar" (login)
4. Se estiver na pagina de login:
   - **PERGUNTAR ao usuario** email e senha com `AskUserQuestion` (NUNCA inventar credenciais)
   - Preencher campo `email` (id) e campo `password` (id)
   - Clicar botao "Entrar"
   - `browser_wait_for` texto "Dashboard"
5. Screenshot: `e2e-00-autenticado.png`
6. Registrar closingDay atual para restaurar no cleanup (anotar valor da pagina Config.)

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
  - `initialBalance` = "10000" (R$ 10.000,00 — saldo inicial; ID real do campo é `initialBalance`, não `balance`)
- Clicar "Criar conta"
- `browser_wait_for` texto "Conta criada com sucesso."
- Screenshot `e2e-02-conta-criada.png`

### 1.2 Categoria Receita
- Navegar para `/configuracoes`
- Clicar na aba "Categorias"
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
  - `account` = selecionar "Conta Teste E2E" (usar browser_run_code se texto incluir saldo)
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

### 1.10 Divida
- Navegar para `/dividas`
- Snapshot + screenshot `e2e-11-dividas-antes.png`
- Clicar "Nova divida" (botao do PageHeader)
- Aguardar modal "Nova divida"
- Snapshot, preencher:
  - `debt-name` = "Emprestimo Teste E2E"
  - `debt-total` = "50000" (R$ 50.000,00)
  - `debt-remaining` = "45000" (R$ 45.000,00)
  - `debt-rate` = "1.5" (1,5% a.m.)
  - `debt-installments-total` = "48"
  - `debt-installments-paid` = "6"
  - `debt-min-payment` = "1500" (R$ 1.500,00)
- Clicar "Criar divida"
- `browser_wait_for` texto "Divida criada com sucesso."
- Screenshot `e2e-12-divida-criada.png`

### 1.11 Meta Financeira
- Navegar para `/metas`
- Snapshot + screenshot `e2e-13-metas-antes.png`
- Clicar "Nova meta" (botao do PageHeader)
- Aguardar modal "Nova meta"
- Snapshot, preencher:
  - `goal-name` = "Viagem Teste E2E"
  - `goal-target` = "25000" (R$ 25.000,00)
  - `goal-deadline` = data 6 meses no futuro (YYYY-MM-DD)
  - `goal-account` = selecionar "Conta Teste E2E" (vincula saldo da conta ao progresso)
- Clicar "Criar meta"
- `browser_wait_for` texto "Meta criada com sucesso."
- Screenshot `e2e-14-meta-criada.png`

---

## FASE 2 — Verificacoes Funcionais

### 2.1 Dashboard
- Navegar para `/` (Dashboard)
- Snapshot + screenshot `e2e-15-dashboard.png`
- **Verificar** (no snapshot):
  - Card de receitas mostra R$ 5.000
  - Card de despesas mostra R$ 1.200
  - Card de saldo mostra R$ 3.800
  - Secao de grafico de categorias presente
  - Tabela de fluxo diario presente
  - Widget de investimentos presente
  - Widget de metas presente (deve mostrar "Viagem Teste E2E")
  - Widget de dividas presente (deve mostrar "Emprestimo Teste E2E")
- Registrar cada verificacao como OK/FALHA

### 2.2 Previsto vs Realizado (se visivel no dashboard do mes corrente)
- No dashboard, verificar se o componente "Comparacao proporcional" esta visivel
- Se visivel:
  - Verificar secoes Receitas/Despesas
  - Verificar barras de progresso
  - Screenshot `e2e-16-previsto-realizado.png`

### 2.3 Fluxo (Diario + Previsto)
- Navegar para `/fluxo`
- Snapshot + screenshot `e2e-17-fluxo.png`
- **Verificar**:
  - Abas "Fluxo Diario" e "Fluxo Previsto" presentes
  - Fluxo Diario mostra dados do mes atual
- Clicar na aba "Fluxo Previsto"
- Snapshot + screenshot `e2e-18-fluxo-previsto.png`
- **Verificar**:
  - Mes atual destacado (com indicador "atual")
  - Pelo menos 3 meses futuros visiveis
  - Categorias "Salario Teste E2E" e "Mercado Teste E2E" aparecem na tabela

### 2.4 Transacoes — Filtro mensal
- Navegar para `/transacoes`
- Snapshot — verificar que transacoes "Teste E2E" aparecem no mes atual
- Screenshot `e2e-19-transacoes-mes-atual.png`
- Clicar botao "Mes anterior" (aria-label ou icone chevron)
- Snapshot — verificar que transacoes "Teste E2E" NAO aparecem
- Screenshot `e2e-20-transacoes-mes-anterior.png`
- Clicar "Proximo mes" para voltar ao mes atual

### 2.5 Configuracoes — Closing Day
- Navegar para `/configuracoes`
- Snapshot — anotar valor atual do `closing-day`
- Alterar `closing-day` para "15"
- Clicar "Salvar"
- `browser_wait_for` texto "Configuracao salva."
- Screenshot `e2e-21-config-dia15.png`
- Navegar para `/` (Dashboard)
- Snapshot — verificar que MonthPicker mostra subtexto com range adaptado (dia 15)
- Screenshot `e2e-22-dashboard-dia15.png`
- Navegar para `/configuracoes`
- Restaurar `closing-day` para o valor original anotado
- Clicar "Salvar"
- `browser_wait_for` texto "Configuracao salva."
- Screenshot `e2e-23-config-restaurado.png`

### 2.6 Dividas — CRUD e Simulador
- Navegar para `/dividas`
- Snapshot — verificar card "Emprestimo Teste E2E" com dados corretos:
  - Saldo devedor R$ 45.000
  - Taxa 1,5% a.m.
  - Parcelas 6/48
- Screenshot `e2e-24-divida-card.png`
- **Simulador de pagamento extra**:
  - Clicar botao "Simular" do card "Emprestimo Teste E2E"
  - Aguardar modal do simulador
  - Snapshot — verificar que modal abriu com dados da divida
  - Preencher campo de pagamento extra com "500" (R$ 500,00)
  - Aguardar calculo (recalculo automatico ou botao "Calcular")
  - Snapshot — verificar resultado:
    - Economia de meses exibida
    - Economia de juros exibida
  - Screenshot `e2e-25-simulador-divida.png`
  - Fechar modal
- **Edicao**:
  - Clicar "Editar" do card "Emprestimo Teste E2E"
  - Aguardar modal de edicao
  - Alterar `debt-installments-paid` para "8"
  - Clicar "Salvar"
  - `browser_wait_for` texto com confirmacao de alteracao
  - Screenshot `e2e-26-divida-editada.png`

### 2.7 Metas — Progresso e Edicao
- Navegar para `/metas`
- Snapshot — verificar card "Viagem Teste E2E":
  - Meta R$ 25.000
  - Progresso calculado automaticamente pelo saldo da "Conta Teste E2E"
  - Barra de progresso visivel
- Screenshot `e2e-27-meta-card.png`
- **Edicao**:
  - Clicar "Editar" do card "Viagem Teste E2E"
  - Aguardar modal de edicao
  - Alterar `goal-target` para "30000" (R$ 30.000,00)
  - Clicar "Salvar"
  - `browser_wait_for` texto com confirmacao de alteracao
  - Screenshot `e2e-28-meta-editada.png`

### 2.8 Historico de KPIs
- Navegar para `/historico`
- Snapshot + screenshot `e2e-29-historico.png`
- **Verificar**:
  - Pagina carrega sem erro
  - Se houver dados de monthly_closings: graficos Recharts e tabela de dados presentes
  - Se nao houver dados: empty state com mensagem orientativa
- Registrar como OK/FALHA

### 2.9 Simuladores Educacionais (4 abas)
- Navegar para `/simuladores`
- Snapshot + screenshot `e2e-30-simuladores.png`

#### 2.9.1 Juros Compostos
- Verificar que aba "Juros Compostos" esta ativa por padrao
- Snapshot, preencher:
  - Capital inicial = "10000"
  - Aporte mensal = "500"
  - Taxa mensal = "1"
  - Periodo (meses) = "120"
- Aguardar grafico renderizar (Recharts)
- Snapshot — verificar que grafico e resultado numerico aparecem
- Screenshot `e2e-31-sim-juros.png`

#### 2.9.2 Inflacao
- Clicar na aba "Inflacao"
- Snapshot, preencher:
  - Valor atual = "1000"
  - Taxa inflacao anual = "5"
  - Periodo (anos) = "10"
- Aguardar grafico
- Screenshot `e2e-32-sim-inflacao.png`

#### 2.9.3 Custo de Oportunidade
- Clicar na aba "Custo de Oportunidade"
- Snapshot, preencher:
  - Gasto mensal = "200"
  - Taxa mensal = "1"
  - Periodo (meses) = "60"
- Aguardar grafico
- Screenshot `e2e-33-sim-custo.png`

#### 2.9.4 Independencia Financeira (FI/RE)
- Clicar na aba "FI/RE" ou "Independencia Financeira"
- Snapshot, preencher:
  - Patrimonio atual = "100000"
  - Aporte mensal = "3000"
  - Gasto mensal estimado = "5000"
  - Rentabilidade anual = "8"
- Aguardar calculo com 3 cenarios (conservador/base/otimista)
- Snapshot — verificar que resultados e grafico aparecem
- Screenshot `e2e-34-sim-fire.png`

### 2.10 Assistente IA
- Navegar para `/assistente`
- Snapshot + screenshot `e2e-35-assistente.png`
- **Verificar**:
  - Campo de input de mensagem presente
  - Botao de envio presente
- Digitar mensagem: "Qual minha situacao financeira atual?"
- Clicar enviar (botao ou Enter)
- `browser_wait_for` aguardar 8-10 segundos para resposta streaming do Gemini
- Snapshot — verificar que resposta do assistente apareceu
- Screenshot `e2e-36-assistente-resposta.png`
- Registrar se resposta foi recebida e contem informacoes financeiras

### 2.11 Importacao
- Navegar para `/transacoes/importar`
- Snapshot + screenshot `e2e-37-importacao.png`
- **Verificar**:
  - Pagina carrega com titulo "Importar Transacoes"
  - Stepper (passos 1-2-3 ou similar) visivel
  - Select de conta presente
  - Botoes/area de upload presentes (OFX, CSV, PDF)
- Registrar como OK/FALHA (verificacao de carregamento, sem upload real)

---

## FASE 3 — QA Visual

Tirar screenshots fullPage de 14 paginas e avaliar visualmente:

| # | Pagina | URL | Arquivo |
|---|--------|-----|---------|
| 1 | Dashboard | `/` | `e2e-38-visual-dashboard.png` |
| 2 | Contas | `/contas` | `e2e-39-visual-contas.png` |
| 3 | Transacoes | `/transacoes` | `e2e-40-visual-transacoes.png` |
| 4 | Recorrentes | `/recorrentes` | `e2e-41-visual-recorrentes.png` |
| 5 | Metas | `/metas` | `e2e-42-visual-metas.png` |
| 6 | Dividas | `/dividas` | `e2e-43-visual-dividas.png` |
| 7 | Historico | `/historico` | `e2e-44-visual-historico.png` |
| 8 | Fluxo | `/fluxo` | `e2e-45-visual-fluxo.png` |
| 9 | Investimentos | `/investimentos` | `e2e-46-visual-investimentos.png` |
| 10 | Assistente IA | `/assistente` | `e2e-47-visual-assistente.png` |
| 11 | Simuladores | `/simuladores` | `e2e-48-visual-simuladores.png` |
| 12 | Configuracoes | `/configuracoes` | `e2e-49-visual-configuracoes.png` |
| 13 | Importacao | `/transacoes/importar` | `e2e-50-visual-importacao.png` |
| 14 | Login | (abrir em nova aba ou anotar para depois) | `e2e-51-visual-login.png` |

Para cada screenshot, usar `browser_take_screenshot` com `fullPage: true` e avaliar:
- Alinhamento geral (nada deslocado ou sobreposto)
- Cores emerald/rose aplicadas corretamente
- Numeros com alinhamento tabular (tabular-nums)
- Espacamento consistente (sem gaps estranhos)
- Sem overflow horizontal ou texto cortado
- Dark mode tokens aplicados (se dark mode ativo)

---

## FASE 4 — Navegacao

Testar todos os 12 links da sidebar sequencialmente:

| # | Label | URL esperada |
|---|-------|-------------|
| 1 | Dashboard | `/` |
| 2 | Contas | `/contas` |
| 3 | Transacoes | `/transacoes` |
| 4 | Recorrentes | `/recorrentes` |
| 5 | Metas | `/metas` |
| 6 | Dividas | `/dividas` |
| 7 | Historico | `/historico` |
| 8 | Fluxo | `/fluxo` |
| 9 | Investimentos | `/investimentos` |
| 10 | Assistente IA | `/assistente` |
| 11 | Simuladores | `/simuladores` |
| 12 | Configuracoes | `/configuracoes` |

Para cada link:
1. `browser_snapshot` — localizar link na sidebar
2. Clicar no link
3. `browser_wait_for` — aguardar carregamento (titulo da pagina ou PageHeader)
4. `browser_console_messages` level "error" — registrar se houver erros
5. Verificar que o link ativo tem destaque visual (classes emerald ou indicador)

Screenshot final: `e2e-52-navegacao-ok.png`

---

## FASE 5 — Cleanup

**ORDEM OBRIGATORIA** (respeitar FK constraints — inverso da criacao):

### 5.1 Excluir Divida
- Navegar para `/dividas`
- Snapshot — localizar "Emprestimo Teste E2E"
- Clicar "Excluir" do card "Emprestimo Teste E2E"
- Aguardar modal de confirmacao
- Clicar botao "Excluir" (danger) no modal
- `browser_wait_for` texto com confirmacao de exclusao
- Screenshot `e2e-53-cleanup-divida.png`

### 5.2 Excluir Meta
- Navegar para `/metas`
- Snapshot — localizar "Viagem Teste E2E"
- Clicar "Excluir" do card "Viagem Teste E2E"
- Aguardar modal de confirmacao
- Clicar botao "Excluir" (danger) no modal
- `browser_wait_for` texto com confirmacao de exclusao
- Screenshot `e2e-54-cleanup-meta.png`

### 5.3 Excluir Investimento (inclui lancamentos em cascata)
- Navegar para `/investimentos`
- Snapshot — localizar "CDB Teste E2E"
- Clicar "Excluir" do card "CDB Teste E2E"
- Aguardar modal "Excluir investimento"
- Clicar botao "Excluir" (danger) no modal
- `browser_wait_for` texto "Investimento excluido."
- Screenshot `e2e-55-cleanup-investimento.png`

### 5.4 Excluir Transacoes
- Navegar para `/transacoes`
- Snapshot — localizar "Salario Janeiro Teste E2E"
- Clicar "Excluir" da transacao "Salario Janeiro Teste E2E"
- Aguardar modal "Excluir transacao"
- Clicar "Excluir" no modal
- `browser_wait_for` texto "Transacao excluida."
- Repetir para "Compras Supermercado Teste E2E"
- Screenshot `e2e-56-cleanup-transacoes.png`

### 5.5 Excluir Recorrentes
- Navegar para `/recorrentes`
- Snapshot — localizar "Salario Recorrente Teste E2E"
- Clicar "Excluir" da recorrente "Salario Recorrente Teste E2E"
- Aguardar modal de confirmacao
- Clicar "Excluir" no modal
- `browser_wait_for` texto "Transacao planejada excluida."
- Repetir para "Aluguel Recorrente Teste E2E"
- Screenshot `e2e-57-cleanup-recorrentes.png`

### 5.6 Excluir Categorias
- Navegar para `/configuracoes`
- Clicar na aba "Categorias"
- Snapshot — localizar "Salario Teste E2E"
- Clicar "Excluir" da categoria "Salario Teste E2E"
- Aguardar modal "Excluir categoria"
- Clicar "Excluir" no modal
- `browser_wait_for` texto "Categoria excluida."
- Repetir para "Mercado Teste E2E"
- Screenshot `e2e-58-cleanup-categorias.png`

### 5.7 Excluir Conta
- Navegar para `/contas`
- Snapshot — localizar "Conta Teste E2E"
- Clicar "Excluir" do card "Conta Teste E2E"
- Aguardar modal "Excluir conta"
- Clicar "Excluir" no modal
- `browser_wait_for` texto "Conta excluida."
- Screenshot `e2e-59-cleanup-conta.png`

### 5.8 Verificacao final
- Navegar para `/` (Dashboard)
- Snapshot — confirmar que nenhum dado "Teste E2E" permanece visivel
- Screenshot `e2e-60-cleanup-final.png`

---

## FASE 6 — Relatorio Final

Compilar e apresentar ao usuario:

### Tabela de Resultados

```
| Fase  | Descricao                      | Status  | Detalhes        |
|-------|--------------------------------|---------|-----------------|
| 0     | Autenticacao                   | OK/FAIL | ...             |
| 1.1   | Criar conta                    | OK/FAIL | ...             |
| 1.2   | Criar cat. receita             | OK/FAIL | ...             |
| 1.3   | Criar cat. despesa             | OK/FAIL | ...             |
| 1.4   | Transacao receita              | OK/FAIL | ...             |
| 1.5   | Transacao despesa              | OK/FAIL | ...             |
| 1.6   | Recorrente receita             | OK/FAIL | ...             |
| 1.7   | Recorrente despesa             | OK/FAIL | ...             |
| 1.8   | Investimento                   | OK/FAIL | ...             |
| 1.9   | Aporte                         | OK/FAIL | ...             |
| 1.10  | Divida                         | OK/FAIL | ...             |
| 1.11  | Meta financeira                | OK/FAIL | ...             |
| 2.1   | Dashboard cards + widgets      | OK/FAIL | ...             |
| 2.2   | Previsto vs Realizado          | OK/FAIL | ...             |
| 2.3   | Fluxo (Diario + Previsto)      | OK/FAIL | ...             |
| 2.4   | Filtro mensal transacoes       | OK/FAIL | ...             |
| 2.5   | Closing Day                    | OK/FAIL | ...             |
| 2.6   | Dividas CRUD + Simulador       | OK/FAIL | ...             |
| 2.7   | Metas progresso + edicao       | OK/FAIL | ...             |
| 2.8   | Historico de KPIs              | OK/FAIL | ...             |
| 2.9.1 | Simulador Juros Compostos      | OK/FAIL | ...             |
| 2.9.2 | Simulador Inflacao             | OK/FAIL | ...             |
| 2.9.3 | Simulador Custo Oportunidade   | OK/FAIL | ...             |
| 2.9.4 | Simulador FI/RE                | OK/FAIL | ...             |
| 2.10  | Assistente IA                  | OK/FAIL | ...             |
| 2.11  | Importacao (carregamento)      | OK/FAIL | ...             |
| 3     | QA Visual (14 paginas)         | OK/FAIL | ...             |
| 4     | Navegacao (12 links sidebar)   | OK/FAIL | ...             |
| 5     | Cleanup                        | OK/FAIL | ...             |
```

### Resumo
- **Total**: X/Y passos OK
- **Erros de console**: listar todos os erros capturados
- **Problemas visuais**: listar observacoes dos screenshots
- **Screenshots gerados**: listar todos os arquivos e2e-*.png

### Resultado Final
- **APROVADO**: Todos os passos OK, sem erros criticos
- **REPROVADO**: Listar falhas criticas que impedem uso normal
