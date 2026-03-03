# FinApp
## Manual do Usuário

**Versão:** 3.0
**Data:** Março 2026

---

Bem-vindo ao FinApp, sua plataforma de gestão financeira pessoal. Aqui você encontra tudo o que precisa para controlar receitas, despesas, investimentos, metas e dívidas — com projeções automáticas, alertas inteligentes e um assistente com inteligência artificial que analisa seus dados reais.

---

## Sumário

1. [Primeiros Passos](#1-primeiros-passos)
2. [Navegação](#2-navegacao)
3. [Dashboard](#3-dashboard)
4. [Contas](#4-contas)
5. [Transações](#5-transacoes)
6. [Recorrentes](#6-recorrentes)
7. [Metas Financeiras](#7-metas-financeiras)
8. [Dívidas](#8-dividas)
9. [Histórico de KPIs](#9-historico-de-kpis)
10. [Fluxo](#10-fluxo)
11. [Investimentos](#11-investimentos)
12. [Assistente IA](#12-assistente-ia)
13. [Simuladores](#13-simuladores)
14. [Configurações](#14-configuracoes)
15. [Fluxo de Configuração Inicial](#15-fluxo-de-configuracao-inicial)
16. [Rotina Diária e Mensal](#16-rotina-diaria-e-mensal)

---

## 1 Primeiros Passos

### 1.1 Criar conta

| Passo | Ação |
|:-----:|------|
| 1 | Na tela de login, clique em **Criar conta**. |
| 2 | Preencha **Nome completo**, **Email** e **Senha**. |
| 3 | A senha deve ter no mínimo 8 caracteres, 1 letra maiúscula e 1 número. |
| 4 | Clique em **Criar conta**. |
| 5 | Verifique seu email e clique no link de confirmação (confira também o spam). |
| 6 | Volte à tela de login e entre com suas credenciais. |

### 1.2 Login e logout

- **Entrar:** informe email e senha e clique em **Entrar**.
- **Sair:** clique em **Sair** na parte inferior da barra lateral.
- **Auto-logout:** por segurança, após 30 minutos de inatividade um aviso é exibido e, se não houver resposta, a sessão é encerrada automaticamente.

---

## 2 Navegação

A barra lateral esquerda é o ponto central de navegação. Os itens são organizados em grupos temáticos — clique no nome do grupo para expandir ou recolher as opções.

### Grupos e páginas disponíveis

| Grupo | Páginas |
|-------|---------|
| — | **Dashboard** (acesso direto, sempre visível) |
| **Movimentações** | Contas · Transações · Recorrentes |
| **Planejamento** | Metas · Dívidas · Investimentos |
| **Análise** | Histórico · Fluxo |
| **Ferramentas** | Assistente IA · Simuladores |
| — | **Configurações** (sempre visível no rodapé) |

### Comportamento da sidebar

| Dispositivo | Comportamento |
|-------------|---------------|
| **Desktop** | Fixada à esquerda. Pode ser recolhida com a seta no topo — quando recolhida, exibe apenas ícones. Passe o mouse para ver o nome. |
| **Celular/Tablet** | Abre como menu lateral ao tocar no ícone de menu no topo da tela. Fecha automaticamente ao navegar. |

> **Dica:** O grupo que contém a página atual abre automaticamente ao navegar.

---

## 3 Dashboard

O Dashboard é a tela inicial e oferece uma visão completa das suas finanças no mês selecionado.

### 3.1 Seletor de mês e atalhos

No topo da página, use as setas **‹** e **›** para navegar entre meses. Todos os dados refletem o período selecionado.

Dois botões de atalho permitem criar transações sem sair do Dashboard:

| Botão | Função |
|-------|--------|
| **+ Receita** | Abre o formulário de nova receita |
| **+ Despesa** | Abre o formulário de nova despesa |

### 3.2 Cards de resumo

| Card | O que mostra |
|------|-------------|
| **Receitas** | Soma de todas as receitas do mês |
| **Despesas** | Soma de todas as despesas do mês |
| **Saldo** | Diferença entre receitas e despesas |

### 3.3 Indicadores financeiros (KPIs)

Cinco mini-cards exibem indicadores-chave com código de cores:

| KPI | O que mede | Verde | Amarelo | Vermelho |
|-----|-----------|-------|---------|---------|
| **Taxa de Poupança** | % da receita que foi poupada | > 20% | 10–20% | < 10% |
| **Runway Financeiro** | Meses que o saldo atual sustenta o padrão de gastos | > 6 meses | 3–6 meses | < 3 meses |
| **Reserva de Emergência** | Meses de despesas cobertos pela reserva, versus a meta configurada | Meta atingida | > 50% da meta | < 50% da meta |
| **Desvio Orçamentário** | Desvio médio entre previsto e realizado por categoria | < 10% | 10–25% | > 25% |
| **% Gasto Fixo** | % das receitas comprometido com despesas recorrentes | < 50% | 50–70% | > 70% |

### 3.4 Insights proativos

O FinApp analisa seus dados e exibe automaticamente alertas e observações relevantes. Cada card tem borda colorida por prioridade (vermelho = urgente, amarelo = atenção, verde = positivo). Você pode dispensar um insight clicando no **X**.

**Exemplos:**
- *"Alimentação ultrapassou o teto de R$ 800 este mês"*
- *"Sua reserva cobre apenas 2 meses — a meta é 6"*
- *"Você poupou 28% da receita este mês. Excelente!"*

### 3.5 Widgets do Dashboard

**Coluna principal (esquerda)**

| Widget | O que mostra |
|--------|-------------|
| **Previsto vs Realizado** | Barra de progresso por categoria. Categorias com teto exibem "Teto: R$ X". Badge **Estourado** (vermelho) quando gasto ≥ 100% do previsto; badge **Atenção** (amarelo) quando ≥ 80%. |
| **Metas** | Cards das metas financeiras cadastradas com progresso visual, valor atual vs meta e prazo. |
| **Dívidas** | Resumo das dívidas ativas: total em aberto, parcela mensal e próximos vencimentos. |
| **Investimentos** | Saldo total da carteira, retorno nominal do último mês e **retorno real** já descontando a inflação (IPCA 12 meses). |
| **Recorrências Sugeridas** | O sistema detecta padrões repetitivos nas últimas transações e sugere criar recorrentes. Clique em **Criar** para pré-preencher o cadastro automaticamente. |

**Coluna lateral (direita)**

| Widget | O que mostra |
|--------|-------------|
| **Despesas por Categoria** | Gráfico de barras com as maiores categorias do mês. |
| **Últimas Transações** | As 5 transações mais recentes com data, descrição, categoria, conta e valor. |

### 3.6 Fechamento mensal

Clique em **Revisar mês** no topo do Dashboard para abrir o resumo do período. O modal exibe:

| Seção | Conteúdo |
|-------|----------|
| **Resumo** | Receitas, despesas, saldo e taxa de poupança do mês |
| **Top 3 Desvios** | As categorias com maior diferença entre previsto e realizado |
| **Sugestões** | Recomendações automáticas baseadas nos desvios identificados |

O fechamento é salvo automaticamente e alimenta a página de Histórico de KPIs.

> **Dica:** Use o fechamento mensal como ritual de fim de mês — 10 minutos para revisar o que aconteceu e ajustar o planejamento do próximo mês.

---

## 4 Contas

As contas representam onde seu dinheiro está: bancos, carteiras, cartões. Todas as transações precisam estar vinculadas a uma conta.

### 4.1 Tipos de conta

| Tipo | Exemplos |
|------|---------|
| **Banco** | Nubank, Itaú, Bradesco (conta corrente ou poupança) |
| **Cartão** | Cartões de crédito |
| **Carteira** | Dinheiro em espécie |

### 4.2 Criar uma conta

| Passo | Ação |
|:-----:|------|
| 1 | Clique em **Nova conta**. |
| 2 | Preencha o **Nome** e selecione o **Tipo**. |
| 3 | Informe o **Saldo inicial** (o valor que você possui nessa conta hoje). |
| 4 | Clique em **Criar conta**. |

> O saldo é atualizado automaticamente a cada transação registrada — não é necessário ajustar manualmente.

### 4.3 Reserva de emergência

Ao criar ou editar uma conta, marque **"Conta de reserva de emergência"** para indicar que esse dinheiro é destinado à reserva. O saldo dessa conta alimenta o KPI de Reserva de Emergência no Dashboard.

> **Dica:** Marque como reserva apenas contas realmente separadas para essa finalidade — por exemplo, uma poupança ou CDB com liquidez diária.

### 4.4 Reconciliação de saldo

Se o saldo exibido no FinApp divergir do saldo real no banco, use a **reconciliação**:

| Passo | Ação |
|:-----:|------|
| 1 | Clique no ícone de **balança** ao lado da conta. |
| 2 | O sistema calcula o saldo esperado com base no saldo inicial mais todas as transações. |
| 3 | Se houver divergência, ajuste adicionando uma transação de correção. |

### 4.5 Editar e excluir

| Ação | Como fazer |
|------|-----------|
| Editar | Clique no ícone de **lápis** na linha da conta. |
| Excluir | Clique no ícone de **lixeira** (requer confirmação). |

> Contas com transações vinculadas não podem ser excluídas. Reclassifique as transações antes.

---

## 5 Transações

A página de Transações é onde você registra e consulta todas as movimentações — receitas e despesas.

### 5.1 Criar uma transação

| Passo | Ação |
|:-----:|------|
| 1 | Clique em **Nova transação**. |
| 2 | Preencha o formulário (campos abaixo). |
| 3 | Clique em **Criar transação**. |

**Campos:**

| Campo | Descrição |
|-------|-----------|
| **Tipo** | Receita ou Despesa |
| **Valor (R$)** | Valor da movimentação |
| **Conta** | Em qual conta ocorreu |
| **Categoria** | Filtrada automaticamente pelo tipo |
| **Descrição** | Texto livre — ex: "Supermercado", "Salário" |
| **Data** | Data da transação (padrão: hoje) |

### 5.2 Filtros e busca

Use as setas **‹** e **›** para navegar entre meses. Para localizar transações específicas, acesse os **Filtros Avançados**:

| Filtro | Opções |
|--------|--------|
| **Tipo** | Receita / Despesa / Todos |
| **Categoria** | Selecione uma ou mais |
| **Conta** | Selecione uma ou mais |
| **Busca por texto** | Busca na descrição |

Os filtros são aplicados diretamente na consulta — a lista atualiza instantaneamente.

### 5.3 Exportar para CSV

Clique em **Exportar CSV** para baixar as transações do mês atual com os filtros aplicados. O arquivo é compatível com Excel (separador `;`, encoding UTF-8 com BOM para acentos corretos).

### 5.4 Editar e excluir

| Ação | Como fazer |
|------|-----------|
| Editar | Clique no ícone de **lápis** na linha da transação. |
| Excluir | Clique no ícone de **lixeira** (requer confirmação). |

### 5.5 Importar transações

Importe movimentações diretamente do extrato do banco — sem digitar manualmente. Clique em **Importar** na página de Transações.

**Formatos aceitos:**

| Formato | Uso típico | Limite |
|---------|-----------|--------|
| **.ofx / .qfx** | Extratos bancários padrão | 5 MB |
| **.csv** | Planilhas exportadas do banco | 5 MB |
| **.pdf** | Faturas de cartão de crédito | 10 MB |

#### Fluxo OFX/QFX

| Etapa | Ação |
|:-----:|------|
| 1 | Selecione a **conta** e o arquivo OFX/QFX. Clique em **Carregar**. |
| 2 | Revise as transações extraídas, ajuste categorias e confira duplicatas sinalizadas. |
| 3 | Clique em **Importar** e veja o resumo final. |

#### Fluxo CSV

| Etapa | Ação |
|:-----:|------|
| 1 | Selecione a **conta** e o arquivo CSV. Clique em **Carregar**. |
| 2 | Mapeie as colunas: qual é a **data**, qual é o **valor**, qual é a **descrição**. O sistema detecta automaticamente quando possível. |
| 3 | Revise as transações, ajuste categorias e confira duplicatas. |
| 4 | Clique em **Importar** e veja o resumo final. |

#### Fluxo PDF

| Etapa | Ação |
|:-----:|------|
| 1 | Selecione a **conta** e o arquivo PDF da fatura. Clique em **Carregar**. |
| 2 | A inteligência artificial (Gemini) extrai as transações automaticamente. Revise os dados e ajuste categorias. |
| 3 | Clique em **Importar** e veja o resumo final. |

> **Atenção:** PDFs protegidos por senha não são suportados. Abra o arquivo, salve uma cópia sem senha e importe a cópia.

#### Categorização automática

Se você tiver **Regras de Importação** configuradas (veja seção 14.3), as categorias são preenchidas automaticamente para transações que correspondam ao padrão. Elas aparecem com um badge **Auto** na tela de revisão.

#### Resumo da importação

| Informação | Significado |
|-----------|------------|
| **Importadas** | Transações adicionadas com sucesso |
| **Ignoradas** | Transações que você optou por não importar |
| **Duplicatas** | Já existiam — foram ignoradas automaticamente |

---

## 6 Recorrentes

Transações planejadas são movimentações que se repetem ou estão programadas para o futuro. Elas alimentam automaticamente o **Fluxo Previsto** e o comparativo **Previsto vs Realizado** no Dashboard.

### 6.1 Tipos de frequência

| Frequência | Quando usar | Exemplo |
|-----------|-------------|---------|
| **Recorrente (sem prazo)** | Repete todo mês indefinidamente | Aluguel, salário, plano de saúde |
| **Pontual (mês único)** | Ocorre em um único mês | IPVA em janeiro, matrícula escolar |
| **Recorrente com período** | Repete dentro de um intervalo | Parcelas de fevereiro a julho |

### 6.2 Criar uma transação planejada

| Passo | Ação |
|:-----:|------|
| 1 | Clique em **Nova transação**. |
| 2 | Preencha o formulário. |
| 3 | Clique em **Criar**. |

**Campos:**

| Campo | Descrição |
|-------|-----------|
| **Tipo** | Receita ou Despesa |
| **Valor (R$)** | Valor esperado |
| **Conta** | Conta associada |
| **Categoria** | Filtrada pelo tipo |
| **Descrição** | Ex: "Aluguel", "Salário", "Parcela TV" |
| **Frequência** | Recorrente, Pontual ou Com período |
| **Mês / Início / Término** | Campos condicionais conforme a frequência |
| **Dia do mês** | Dia em que ocorre (1–28) |
| **Ativo** | Desmarcado = não entra nas projeções |

### 6.3 Gerenciar recorrentes

| Ação | Como fazer |
|------|-----------|
| Editar | Clique no ícone de **lápis**. |
| Desativar | Na edição, desmarque **Ativo** — a transação fica arquivada sem ser excluída. |
| Excluir | Clique no ícone de **lixeira** (requer confirmação). |

> **Dica:** Ao perceber que você tem uma despesa se repetindo há 3 meses no mesmo valor (ex: assinatura de streaming), o Dashboard vai sugerir transformá-la em recorrente automaticamente.

---

## 7 Metas Financeiras

A página de Metas permite definir objetivos financeiros com prazo e acompanhar o progresso ao longo do tempo.

### 7.1 Para que serve

Use metas para objetivos como:
- Juntar R$ 20.000 para uma viagem até dezembro
- Formar uma reserva de emergência de R$ 30.000
- Comprar um carro em 24 meses
- Pagar a entrada de um apartamento

### 7.2 Criar uma meta

| Passo | Ação |
|:-----:|------|
| 1 | Clique em **Nova meta**. |
| 2 | Preencha o formulário. |
| 3 | Clique em **Criar meta**. |

**Campos:**

| Campo | Descrição |
|-------|-----------|
| **Nome** | Ex: "Viagem Europa", "Carro novo" |
| **Valor alvo (R$)** | Quanto você precisa juntar |
| **Prazo** | Mês e ano da meta |
| **Conta vinculada** | Opcional — se informada, o saldo atual da conta é usado como progresso real |
| **Valor atual (R$)** | Se não houver conta vinculada, informe o valor já guardado |
| **Cor** | Cor do card para identificação visual |
| **Observações** | Notas livres |

### 7.3 Acompanhar o progresso

Cada meta exibe:

| Informação | Descrição |
|-----------|-----------|
| **Barra de progresso** | Percentual atingido em relação ao valor alvo |
| **Valor atual vs Alvo** | Ex: "R$ 8.400 / R$ 20.000" |
| **Prazo** | Meses restantes e data prevista |
| **Aporte mensal necessário** | Quanto poupar por mês para atingir a meta no prazo |

O widget de Metas também aparece no Dashboard com uma visão rápida de todas as metas ativas.

### 7.4 Editar e excluir

| Ação | Como fazer |
|------|-----------|
| Editar | Clique no ícone de **lápis** no card da meta. |
| Excluir | Clique no ícone de **lixeira** (requer confirmação). |

---

## 8 Dívidas

A página de Dívidas permite registrar e acompanhar débitos — financiamentos, empréstimos, cartões parcelados — e simular cenários de quitação antecipada.

### 8.1 Para que serve

Centralize suas dívidas para:
- Visualizar o total em aberto e os juros acumulados
- Acompanhar quantas parcelas faltam
- Simular o impacto de pagar um valor extra por mês
- Decidir qual dívida priorizar para quitar primeiro

### 8.2 Criar uma dívida

| Passo | Ação |
|:-----:|------|
| 1 | Clique em **Nova dívida**. |
| 2 | Preencha o formulário. |
| 3 | Clique em **Criar dívida**. |

**Campos:**

| Campo | Descrição |
|-------|-----------|
| **Nome** | Ex: "Financiamento carro", "Empréstimo pessoal" |
| **Valor total (R$)** | Saldo devedor atual |
| **Taxa de juros mensal (%)** | Taxa de juros mensal da dívida |
| **Parcela mensal (R$)** | Valor da parcela que você paga todo mês |
| **Parcelas restantes** | Número de parcelas que faltam |
| **Data do próximo vencimento** | Próxima data de pagamento |
| **Observações** | Notas livres |

### 8.3 Simulador de quitação

No card de cada dívida, clique em **Simulador** para calcular o impacto de pagamentos extras:

| Informação exibida | O que significa |
|-------------------|----------------|
| **Tempo para quitar** | Meses até zerar a dívida no ritmo atual |
| **Total pago em juros** | Quanto você pagará de juros no total |
| **Com pagamento extra de R$ X/mês** | Quanto tempo e dinheiro você economiza pagando um valor adicional |

> **Dica:** Use o simulador para descobrir se vale a pena direcionar parte do que sobra no mês para quitar uma dívida mais cedo.

### 8.4 Editar e excluir

| Ação | Como fazer |
|------|-----------|
| Editar | Clique no ícone de **lápis** no card da dívida. |
| Excluir | Clique no ícone de **lixeira** (requer confirmação). |

---

## 9 Histórico de KPIs

A página de Histórico exibe a **evolução mensal** dos seus principais indicadores financeiros ao longo do tempo, com base nos fechamentos mensais registrados.

### 9.1 O que você encontra aqui

| Seção | Conteúdo |
|-------|----------|
| **Gráfico Receitas vs Despesas vs Saldo** | Evolução mês a mês com barras e linha de saldo |
| **Gráfico de Saúde Financeira** | Evolução da taxa de poupança ao longo dos meses |
| **Tabela de dados** | Todos os meses com receitas, despesas, saldo, taxa de poupança e taxa de crescimento de receita |

### 9.2 Como alimentar o Histórico

O Histórico é preenchido automaticamente sempre que você usa o **Revisar mês** no Dashboard. Cada fechamento salva um snapshot dos KPIs daquele período.

> **Dica:** Quanto mais meses você fechar, mais rico fica o histórico. Tente fechar o mês sempre nos primeiros dias do mês seguinte.

---

## 10 Fluxo

A página de Fluxo possui duas abas: **Fluxo Diário** e **Fluxo Previsto**.

### 10.1 Fluxo Diário

Detalhamento **dia a dia** do mês selecionado — mostra cada movimentação real e planejada com o saldo acumulado ao longo do mês.

| Coluna | O que mostra |
|--------|-------------|
| **Dia** | Data da movimentação |
| **Descrição** | Nome da transação |
| **Categoria** | Categoria com ícone |
| **Valor** | Valor da movimentação |
| **Saldo Acumulado** | Saldo progressivo — permite ver em que dias o caixa fica mais apertado |

Use as setas **‹** e **›** para navegar entre meses.

### 10.2 Fluxo Previsto

Projeção de **vários meses** — o mês atual mais três meses futuros — comparando o valor previsto com o realizado por categoria.

| Coluna | O que mostra |
|--------|-------------|
| **Categoria** | Nome da categoria |
| **Previsto** | Valor esperado (baseado em recorrentes ou média histórica) |
| **Realizado** | Transações efetivas já registradas |
| **Diferença** | Desvio entre previsto e realizado |

> **Como funciona a projeção:** categorias com tipo "Recorrente" usam o valor fixo das transações planejadas. Categorias com tipo "Histórico" usam a média dos meses anteriores. Você configura isso em Configurações > Categorias.

---

## 11 Investimentos

A página de Investimentos possui duas abas: **Carteira** e **Evolução**.

### 11.1 Carteira

Lista todos os investimentos cadastrados, agrupados por tipo de produto.

**Criar um investimento:**

| Passo | Ação |
|:-----:|------|
| 1 | Clique em **Novo investimento**. |
| 2 | Preencha o formulário. |
| 3 | Clique em **Criar investimento**. |

**Campos:**

| Campo | Descrição |
|-------|-----------|
| **Nome** | Ex: "CDB Banco Inter 120% CDI" |
| **Conta / Corretora** | Conta onde o investimento está custodiado |
| **Produto** | CDB, Tesouro, Ações, Cripto, Fundo ou Outro |
| **Indexador** | CDI, IPCA, Prefixado, etc. |
| **Taxa contratada** | Texto livre — ex: "120% CDI", "IPCA+6,5%" |
| **Vencimento** | Data de vencimento (opcional) |
| **Observações** | Notas adicionais (opcional) |

### 11.2 Lançamentos

Cada investimento possui seu histórico de lançamentos. Clique em **Lançamentos** no card do investimento para acessar.

**Tipos de lançamento:**

| Tipo | Quando usar |
|------|------------|
| **Aporte** | Entrada de dinheiro no investimento |
| **Resgate** | Retirada de dinheiro |
| **Saldo** | Atualização de posição (ex: extrato mensal do banco) |

**Registrar um lançamento:**

| Passo | Ação |
|:-----:|------|
| 1 | No card do investimento, clique em **Lançamentos**. |
| 2 | Clique em **Novo lançamento**. |
| 3 | Selecione o **Tipo**, informe a **Data** e o **Valor (R$)**. |
| 4 | Confirme. |

O saldo do investimento é calculado automaticamente a partir dos lançamentos.

### 11.3 Evolução

A aba Evolução exibe um quadro com a **posição mensal** de cada investimento ao longo do tempo, para acompanhar o crescimento da carteira mês a mês.

### 11.4 Retorno real (IPCA)

O widget de Investimentos no Dashboard exibe o **retorno real** do último mês: o retorno nominal descontado pela inflação (IPCA dos últimos 12 meses). Isso permite avaliar se seus investimentos estão, de fato, crescendo acima da inflação.

---

## 12 Assistente IA

O Assistente Financeiro é um chat com inteligência artificial que analisa seus **dados financeiros reais** para oferecer diagnósticos e orientações personalizadas.

### 12.1 Como usar

| Passo | Ação |
|:-----:|------|
| 1 | Acesse **Assistente IA** na sidebar. |
| 2 | Na primeira visita, clique em uma das perguntas sugeridas ou digite sua própria. |
| 3 | Pressione **Enter** para enviar (ou clique no botão de envio). |
| 4 | A resposta é exibida progressivamente conforme é gerada. |

| Atalho | Função |
|--------|--------|
| **Enter** | Envia a mensagem |
| **Shift + Enter** | Pula linha sem enviar |

> **Limite:** 2.000 caracteres por mensagem.

### 12.2 Contexto conversacional

O assistente **mantém o contexto da conversa**. Você pode pedir um diagnóstico e, em seguida, perguntar *"como melhorar esse ponto?"* sem precisar repetir informações.

### 12.3 Copiar respostas

Passe o mouse sobre qualquer resposta para revelar o **botão de copiar** no canto superior direito. O ícone muda para um check verde por 2 segundos confirmando a cópia.

### 12.4 Exemplos de perguntas úteis

| Pergunta | Tipo de análise |
|----------|----------------|
| "Como está minha saúde financeira?" | Diagnóstico geral |
| "Minhas despesas estão controladas?" | Análise de gastos |
| "Minha carteira de investimentos está diversificada?" | Análise de investimentos |
| "Tenho reserva de emergência suficiente?" | Planejamento de reserva |
| "Quais categorias estão acima do previsto?" | Revisão de orçamento |
| "Como posso economizar mais este mês?" | Recomendações práticas |
| "Vale a pena quitar minha dívida do cartão?" | Análise de dívidas |
| "Estou no caminho certo para atingir minha meta de viagem?" | Análise de metas |

> **Nota:** O assistente se baseia nos seus dados reais, mas não substitui orientação de um profissional financeiro certificado.

---

## 13 Simuladores

A página de Simuladores oferece quatro calculadoras interativas para apoiar decisões financeiras. Todos os cálculos são feitos em tempo real — nenhum dado é salvo.

### 13.1 Juros Compostos

Calcule o crescimento de um investimento ao longo do tempo.

**Campos:**
- Valor inicial (R$)
- Aporte mensal (R$)
- Taxa de juros ao mês (%)
- Período (meses)

**Resultado:** gráfico de evolução mês a mês + total acumulado e total de aportes vs rendimento.

> **Exemplo de uso:** "Se eu investir R$ 500/mês durante 10 anos a 0,8% ao mês, quanto terei?"

### 13.2 Inflação

Simule o efeito da inflação no poder de compra ao longo do tempo.

**Campos:**
- Valor atual (R$)
- Taxa de inflação anual (%)
- Período (anos)

**Resultado:** quanto esse valor representa no futuro em poder de compra real.

> **Exemplo de uso:** "R$ 10.000 hoje valerão quanto daqui a 5 anos com inflação de 5% ao ano?"

### 13.3 Custo de Oportunidade

Compare duas alternativas de uso do dinheiro.

**Campos:**
- Valor disponível (R$)
- Taxa de retorno da alternativa A (% ao mês)
- Taxa de retorno da alternativa B (% ao mês)
- Período (meses)

**Resultado:** diferença de resultado entre as duas opções ao final do período.

> **Exemplo de uso:** "Vale mais a pena pagar à vista com desconto ou parcelar e manter o dinheiro investido?"

### 13.4 Independência Financeira (FIRE)

Calcule quanto você precisa acumular para viver de renda — e quanto tempo levará para chegar lá.

**Campos:**
- Gastos mensais desejados na aposentadoria (R$)
- Patrimônio atual (R$)
- Aporte mensal (R$)
- Taxa de retorno anual esperada (%)
- Taxa de retirada segura (% ao ano, padrão: 4%)

**Resultado:** três cenários (conservador, base e otimista) com o patrimônio alvo e o tempo estimado para atingi-lo.

> **Exemplo de uso:** "Se quero viver com R$ 8.000/mês, quanto preciso ter investido e quando chegarei lá?"

---

## 14 Configurações

A página de Configurações possui três abas: **Geral**, **Categorias** e **Regras de Importação**.

### 14.1 Geral

#### Dia de fechamento

Define quando começa e termina seu "mês financeiro". Útil para quem recebe salário em um dia diferente do dia 1.

| Configuração | Exemplo com dia 10 |
|-------------|-------------------|
| Mês de fevereiro | 10/fev → 09/mar |

Essa configuração afeta o Dashboard, o Fluxo e todas as projeções.

**Para alterar:** selecione o dia no dropdown (1 a 28) e clique em **Salvar**.

#### Meta de reserva de emergência

Define quantos meses de despesas você quer manter como reserva. Afeta o KPI de Reserva no Dashboard.

**Para alterar:** selecione a meta (3, 6, 9 ou 12 meses) e clique em **Salvar**.

#### Tema visual

Selecione entre **Claro**, **Escuro** ou **Sistema** (acompanha automaticamente a preferência do seu dispositivo). A escolha é salva e persistida entre sessões.

### 14.2 Categorias

Gerencie as categorias para classificar suas transações.

**Criar uma categoria:**

| Passo | Ação |
|:-----:|------|
| 1 | Clique em **Nova categoria**. |
| 2 | Preencha o formulário. |
| 3 | Clique em **Criar categoria**. |

**Campos:**

| Campo | Descrição |
|-------|-----------|
| **Nome** | Ex: "Alimentação", "Salário", "Lazer" |
| **Tipo** | Receita ou Despesa |
| **Tipo de projeção** | **Histórico** (usa média dos meses anteriores) ou **Recorrente** (usa valor fixo das transações planejadas) |
| **Teto mensal (R$)** | Limite de gastos mensal. Quando definido, ativa alertas no Dashboard quando o gasto se aproxima ou ultrapassa o valor. |
| **Essencial** | Marque se é um gasto essencial (moradia, alimentação, saúde). Usado nos insights do assistente. |

> Categorias com transações vinculadas não podem ser excluídas. Reclassifique as transações antes.

### 14.3 Regras de Importação

Regras de categorização automática aplicadas durante a importação de extratos (OFX, CSV, PDF). Cada regra associa um **padrão de texto** a uma **categoria**.

**Criar uma regra:**

| Passo | Ação |
|:-----:|------|
| 1 | Digite o padrão de texto — ex: "SUPERMERCADO", "UBER", "NETFLIX". |
| 2 | Selecione a categoria que será atribuída automaticamente. |
| 3 | Clique em **Adicionar**. |

**Como funciona:** ao importar um extrato, qualquer transação cuja descrição contenha o padrão recebe aquela categoria automaticamente, sinalizada com um badge **Auto** na tela de revisão.

> **Dica:** Crie regras para os lançamentos mais frequentes do seu banco. Depois de configurar 10–15 regras, a importação mensal fica quase sem necessidade de ajuste manual.

---

## 15 Fluxo de Configuração Inicial

Ao usar o FinApp pela primeira vez, siga esta sequência para aproveitar todos os recursos desde o início:

| Ordem | Ação | Por que fazer isso primeiro |
|:-----:|------|-----------------------------|
| 1 | **Configurações > Geral** — Ajuste o dia de fechamento e a meta de reserva | Define o período que o sistema usará em todos os cálculos |
| 2 | **Contas** — Cadastre suas contas com saldo inicial real | São a base de todas as movimentações |
| 3 | **Configurações > Categorias** — Revise e ajuste as categorias padrão | As categorias padrão são um bom começo; adicione as que faltam e configure os tetos de orçamento |
| 4 | **Recorrentes** — Cadastre receitas fixas (salário) e despesas fixas (aluguel, planos, financiamentos) | Alimenta as projeções do Fluxo Previsto e o comparativo Previsto vs Realizado |
| 5 | **Configurações > Regras de Importação** — Crie as regras de categorização | Automatiza a categorização ao importar extratos |
| 6 | **Transações > Importar** — Importe o extrato do mês atual | Preenche o histórico sem precisar digitar cada lançamento |
| 7 | **Metas** — Cadastre seus objetivos financeiros | O sistema passa a monitorar e projetar o progresso |
| 8 | **Dívidas** — Registre suas dívidas ativas | Consolida o passivo e habilita os simuladores de quitação |
| 9 | **Investimentos** — Cadastre sua carteira | Ativa o cálculo de retorno real e o widget do Dashboard |

---

## 16 Rotina Diária e Mensal

### Rotina diária (5 minutos)

| O que fazer | Onde |
|-------------|------|
| Registrar as transações do dia | Dashboard (atalho + Receita / + Despesa) ou página Transações |
| Conferir o saldo do mês | Dashboard > Cards de resumo |
| Verificar alertas de orçamento | Dashboard > Insights proativos |

### Rotina semanal (10 minutos)

| O que fazer | Onde |
|-------------|------|
| Importar o extrato bancário | Transações > Importar |
| Verificar o Fluxo Diário | Fluxo > Fluxo Diário |

### Rotina mensal (20–30 minutos)

| O que fazer | Onde |
|-------------|------|
| Fechar o mês | Dashboard > **Revisar mês** |
| Analisar os desvios por categoria | Dashboard > Previsto vs Realizado |
| Verificar a evolução dos KPIs | Página Histórico |
| Confirmar ou criar recorrências sugeridas | Dashboard > Widget Recorrências Sugeridas |
| Atualizar saldos dos investimentos | Investimentos > Lançamentos |
| Conferir o progresso das metas | Metas |
| Usar o Assistente IA para diagnóstico mensal | Assistente IA > "Como foi meu mês financeiro?" |
| Planejar os próximos 3 meses | Fluxo > Fluxo Previsto |

---

## Dicas rápidas

| Situação | O que fazer |
|----------|------------|
| Saldo da conta divergiu do banco | Contas > ícone de balança > Reconciliação |
| Não lembro em qual categoria classificar um gasto | Deixe em "Outros" e reclassifique depois pelo lápis na transação |
| Quero testar "e se eu poupar mais?" | Simuladores > Juros Compostos |
| Quero entender meu orçamento | Assistente IA: "Quais categorias estão acima do previsto?" |
| A sidebar está muito cheia | Clique na seta no topo para recolher — ficam apenas ícones |
| Prefiro interface escura | Configurações > Geral > Tema > Escuro |

---

**FinApp** — Gestão Financeira Pessoal
*Versão 3.0 — Março 2026*
