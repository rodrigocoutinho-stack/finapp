# FinApp

## Manual do Usuário

**Versao:** 1.1
**Data:** Fevereiro 2026

---

Bem-vindo ao FinApp, a plataforma de gestao financeira pessoal que reune suas contas, transacoes, investimentos e projecoes em um unico lugar. Este manual vai guia-lo por todas as funcionalidades disponiveis.

---

## 1 Primeiros Passos

### 1.1 Criando sua conta

| Passo | Acao |
|:-----:|------|
| 1 | Na tela de login, clique em **Criar conta**. |
| 2 | Preencha **Nome completo**, **Email** e **Senha** (minimo 6 caracteres). |
| 3 | Clique em **Criar conta**. |
| 4 | Acesse seu email e clique no link de confirmacao. Verifique tambem a pasta de spam. |
| 5 | Volte a tela de login e entre com suas credenciais. |

### 1.2 Login

| Passo | Acao |
|:-----:|------|
| 1 | Informe seu **Email** e **Senha**. |
| 2 | Clique em **Entrar**. |
| 3 | Voce sera direcionado ao Dashboard. |

### 1.3 Logout

Clique em **Sair** na parte inferior da barra lateral esquerda.

---

## 2 Navegacao

A barra lateral esquerda (sidebar) e o ponto central de navegacao. Ela contem oito itens:

| # | Menu | Descricao resumida |
|:-:|------|-------------------|
| 1 | **Dashboard** | Visao geral do mes — receitas, despesas, saldo, graficos |
| 2 | **Contas** | Cadastro de contas bancarias, cartoes e carteiras |
| 3 | **Transacoes** | Registro e consulta de movimentacoes financeiras |
| 4 | **Recorrentes** | Transacoes planejadas que se repetem ou tem data futura |
| 5 | **Fluxo** | Fluxo diario (dia a dia) e fluxo previsto (projecao mensal) |
| 6 | **Investimentos** | Carteira de investimentos e quadro de evolucao |
| 7 | **Assistente IA** | Chat inteligente que analisa seus dados financeiros reais |
| 8 | **Configuracoes** | Dia de fechamento e gerenciamento de categorias |

**Comportamento da sidebar**

| Dispositivo | Comportamento |
|-------------|---------------|
| Desktop | Fixa a esquerda. Pode ser recolhida clicando na seta do topo — quando recolhida, exibe apenas icones. Passe o mouse sobre o icone para ver o nome. |
| Celular | Abre como menu lateral ao tocar no icone de menu no topo. Fecha automaticamente ao navegar. |

---

## 3 Dashboard

O Dashboard e a tela inicial. Ele apresenta um panorama completo das suas financas no mes selecionado.

### 3.1 Saudacao e atalhos rapidos

No topo da pagina, uma saudacao personalizada exibe seu nome e a data atual (ex: *"Bom dia, Joao! Segunda, 14 de fevereiro"*).

Logo abaixo, dois botoes de atalho permitem criar transacoes sem sair do Dashboard:

| Botao | Funcao |
|-------|--------|
| **+ Receita** | Abre o formulario para registrar uma nova receita |
| **+ Despesa** | Abre o formulario para registrar uma nova despesa |

### 3.2 Seletor de mes

Use as setas **<** e **>** ao lado do nome do mes para navegar entre periodos. Todos os dados exibidos no Dashboard refletem o mes selecionado.

### 3.3 Cards de resumo

Tres cards destacados no topo mostram os totais do mes:

| Card | Cor | O que mostra |
|------|-----|-------------|
| **Receitas** | Verde | Soma de todas as receitas do mes |
| **Despesas** | Vermelho | Soma de todas as despesas do mes |
| **Saldo** | Azul (positivo) ou Vermelho (negativo) | Diferenca entre receitas e despesas |

### 3.4 Widgets do Dashboard

O conteudo principal esta organizado em duas colunas (no desktop):

**Coluna esquerda (maior)**

| Widget | O que mostra |
|--------|-------------|
| **Previsto vs Realizado** | Barra de progresso por categoria, comparando o valor previsto (baseado em recorrentes ou media historica) com o valor realizado (transacoes efetivas). Util para identificar categorias que estouraram o orcamento. |
| **Investimentos** | Saldo total da carteira e retorno do ultimo mes (em R$ e %). Se nao houver investimentos, exibe orientacao para cadastro. |

**Coluna direita**

| Widget | O que mostra |
|--------|-------------|
| **Despesas por Categoria** | Grafico de barras horizontais com as maiores categorias de despesa do mes. Cada categoria exibe seu icone visual. |
| **Ultimas Transacoes** | Lista das 5 transacoes mais recentes com descricao, data, categoria, conta e valor. Receitas em verde, despesas em vermelho. |

---

## 4 Contas

A pagina de Contas permite gerenciar as contas que representam de onde sai e para onde vai seu dinheiro.

### 4.1 Tipos de conta

| Tipo | Uso tipico | Exemplo |
|------|-----------|---------|
| **Banco** | Contas correntes ou poupanca | Nubank, Itau, Bradesco |
| **Cartao** | Cartoes de credito | Visa, Mastercard |
| **Carteira** | Dinheiro em especie | Carteira fisica |

### 4.2 Criar uma conta

| Passo | Acao |
|:-----:|------|
| 1 | Clique em **Nova conta**. |
| 2 | Preencha o **Nome da conta** e selecione o **Tipo**. |
| 3 | Clique em **Criar conta**. |

A conta e criada com saldo zero. O saldo e atualizado automaticamente conforme voce registra transacoes.

### 4.3 Editar e excluir

| Acao | Como fazer |
|------|-----------|
| Editar | Clique no icone de **lapis** na linha da conta. |
| Excluir | Clique no icone de **lixeira**. Uma confirmacao sera solicitada. |

> **Atencao:** Contas que possuem transacoes vinculadas nao podem ser excluidas. Remova ou reclassifique as transacoes antes.

---

## 5 Transacoes

A pagina de Transacoes e onde voce registra e consulta todas as movimentacoes financeiras — receitas e despesas.

### 5.1 Criar uma transacao

| Passo | Acao |
|:-----:|------|
| 1 | Clique em **Nova transacao**. |
| 2 | Preencha o formulario (veja campos abaixo). |
| 3 | Clique em **Criar transacao**. |

**Campos do formulario:**

| Campo | Descricao |
|-------|-----------|
| Tipo | Receita ou Despesa |
| Valor (R$) | Valor da movimentacao |
| Conta | Em qual conta ocorreu |
| Categoria | Filtrada automaticamente pelo tipo escolhido |
| Descricao | Texto livre — ex: "Supermercado", "Salario" |
| Data | Dia em que a transacao ocorreu (padrao: hoje) |

O saldo da conta selecionada e atualizado automaticamente apos a criacao.

### 5.2 Filtro por mes

Use as setas **<** e **>** para navegar entre os meses. A lista exibe apenas as transacoes do mes selecionado, ordenadas da mais recente para a mais antiga.

### 5.3 Editar e excluir

| Acao | Como fazer |
|------|-----------|
| Editar | Clique no icone de **lapis** na linha da transacao. |
| Excluir | Clique no icone de **lixeira**. Uma confirmacao sera solicitada. |

### 5.4 Importar transacoes

O FinApp permite importar transacoes a partir de tres formatos de arquivo: **OFX/QFX** (extratos bancarios), **CSV** (planilhas) e **PDF** (faturas de cartao). Na pagina de Transacoes, clique em **Importar** para iniciar.

**Formatos aceitos:**

| Formato | Uso tipico | Limite |
|---------|-----------|--------|
| **.ofx / .qfx** | Extratos bancarios padrao | 5MB |
| **.csv** | Planilhas exportadas do banco | 5MB |
| **.pdf** | Faturas de cartao de credito | 10MB |

#### Fluxo OFX/QFX (3 etapas)

| Etapa | Descricao |
|:-----:|-----------|
| 1 | **Upload** — Selecione a conta de destino e o arquivo OFX/QFX. |
| 2 | **Revisao** — Confira as transacoes extraidas, ajuste categorias e revise duplicatas. |
| 3 | **Resumo** — Veja o resultado da importacao. |

#### Fluxo CSV (4 etapas)

| Etapa | Descricao |
|:-----:|-----------|
| 1 | **Upload** — Selecione a conta de destino e o arquivo CSV. |
| 2 | **Mapeamento** — Indique qual coluna corresponde a data, valor e descricao. O sistema detecta automaticamente quando possivel. |
| 3 | **Revisao** — Confira as transacoes, ajuste categorias e revise duplicatas. |
| 4 | **Resumo** — Veja o resultado da importacao. |

> **Dica:** Arquivos CSV de bancos como Santander possuem linhas de metadados antes do cabecalho. O sistema detecta e ignora essas linhas automaticamente.

#### Fluxo PDF (3 etapas)

| Etapa | Descricao |
|:-----:|-----------|
| 1 | **Upload** — Selecione a conta de destino e o arquivo PDF. |
| 2 | **Revisao** — A inteligencia artificial (Gemini) extrai as transacoes do PDF automaticamente. Confira os dados, ajuste categorias e revise duplicatas. |
| 3 | **Resumo** — Veja o resultado da importacao. |

> **Importante:** PDFs protegidos por senha nao sao suportados. Se seu banco exporta o PDF com senha (ex: CPF), abra o arquivo, salve uma copia sem senha e importe a copia.

#### Etapa de Revisao (comum a todos os formatos)

O sistema exibe todas as transacoes encontradas no arquivo. Para cada linha, voce pode atribuir ou alterar a categoria. Transacoes duplicadas (mesma conta, data e valor) sao sinalizadas automaticamente. Se voce tiver regras de categorizacao configuradas (em Configuracoes > Regras de Importacao), as categorias serao preenchidas automaticamente com um badge **Auto**. Revise os dados e clique em **Importar**.

#### Resumo final

| Informacao | Significado |
|-----------|------------|
| Importadas | Transacoes adicionadas com sucesso |
| Ignoradas | Transacoes que voce optou por nao importar |
| Duplicatas | Transacoes ja existentes que foram detectadas e ignoradas |

---

## 6 Transacoes Planejadas (Recorrentes)

Transacoes planejadas representam movimentacoes que se repetem ou que estao programadas para o futuro. Elas alimentam automaticamente o **Fluxo Previsto** e o comparativo **Previsto vs Realizado** no Dashboard.

### 6.1 Tipos de frequencia

| Frequencia | Quando usar | Exemplo |
|-----------|-------------|---------|
| **Recorrente (sem prazo)** | Repete todo mes indefinidamente | Aluguel, salario, plano de saude |
| **Pontual (mes unico)** | Ocorre em um unico mes especifico | IPVA em janeiro, matricula escolar |
| **Recorrente com periodo** | Repete mensalmente dentro de um intervalo definido | Parcelas de janeiro a junho |

### 6.2 Criar uma transacao planejada

| Passo | Acao |
|:-----:|------|
| 1 | Clique em **Nova transacao**. |
| 2 | Preencha o formulario (veja campos abaixo). |
| 3 | Clique em **Criar**. |

**Campos do formulario:**

| Campo | Descricao |
|-------|-----------|
| Tipo | Receita ou Despesa |
| Valor (R$) | Valor esperado da movimentacao |
| Conta | Conta associada |
| Categoria | Filtrada pelo tipo escolhido |
| Descricao | Texto livre — ex: "Aluguel", "Salario", "Parcela TV" |
| Frequencia | Recorrente (sem prazo), Pontual ou Recorrente com periodo |
| Mes / Mes de inicio / Mes de termino | Campos condicionais, variam conforme a frequencia |
| Dia do mes | Dia em que a transacao ocorre (1 a 31) |
| Ativo | Se desmarcado, a transacao nao sera considerada nas projecoes |

### 6.3 Editar, desativar e excluir

| Acao | Como fazer |
|------|-----------|
| Editar | Clique no icone de **lapis**. |
| Desativar | Na edicao, desmarque o campo **Ativo**. A transacao permanece no historico, mas sai das projecoes. |
| Excluir | Clique no icone de **lixeira** (com confirmacao). |

---

## 7 Fluxo

A pagina de Fluxo possui duas abas, acessiveis por um seletor no topo da pagina.

### 7.1 Fluxo Diario

Mostra o detalhamento **dia a dia** do mes selecionado. Cada linha representa uma movimentacao (real ou planejada).

| Coluna | O que mostra |
|--------|-------------|
| Dia | Data da movimentacao |
| Descricao | Nome da transacao |
| Categoria | Categoria com icone visual |
| Valor | Valor da movimentacao (positivo ou negativo) |
| Saldo Acumulado | Saldo progressivo — permite identificar em que dias o caixa fica apertado |

Use as setas **<** e **>** para navegar entre os meses.

### 7.2 Fluxo Previsto

Exibe uma **projecao de varios meses** — o mes atual mais tres meses futuros.

| Coluna | O que mostra |
|--------|-------------|
| Categoria | Nome da categoria |
| Previsto | Valor esperado com base em recorrentes ou media historica |
| Realizado | Transacoes efetivas ja registradas |
| Diferenca | Desvio entre o previsto e o realizado |

O saldo projetado e acumulado mes a mes, oferecendo uma visao de medio prazo.

> **Como funciona a projecao:** Categorias configuradas como "Recorrente" usam o valor fixo das transacoes planejadas. Categorias configuradas como "Historico" usam a media dos meses anteriores.

---

## 8 Investimentos

A pagina de Investimentos possui duas abas: **Carteira** e **Evolucao**.

### 8.1 Carteira

Exibe todos os investimentos cadastrados, agrupados por tipo de produto (CDB, Tesouro, Acoes, etc.). Cada card mostra o nome, tipo, indexador, saldo atual, conta associada, taxa e vencimento.

**Criar um investimento:**

| Passo | Acao |
|:-----:|------|
| 1 | Clique em **Novo investimento**. |
| 2 | Preencha o formulario (veja campos abaixo). |
| 3 | Clique em **Criar investimento**. |

> **Pre-requisito:** Voce precisa ter pelo menos uma conta cadastrada.

**Campos do formulario:**

| Campo | Descricao |
|-------|-----------|
| Nome | Nome descritivo — ex: "CDB Banco Inter 120% CDI" |
| Conta / Corretora | Conta existente onde o investimento esta custodiado |
| Produto | CDB, Tesouro, Acoes, Cripto, Fundo ou Outro |
| Indexador | CDI, IPCA, Prefixado, entre outros |
| Taxa contratada | Texto livre — ex: "120% CDI", "IPCA+6,5%" |
| Vencimento | Data de vencimento (opcional) |
| Observacoes | Notas adicionais (opcional) |

### 8.2 Lancamentos

Cada investimento possui seu proprio historico de lancamentos. Para acessa-lo, clique em **Lancamentos** no card do investimento.

**Tipos de lancamento:**

| Tipo | Significado |
|------|------------|
| **Aporte** | Entrada de dinheiro no investimento |
| **Resgate** | Retirada de dinheiro do investimento |
| **Saldo** | Atualizacao de posicao (ex: extrato mensal) |

**Registrar um lancamento:**

| Passo | Acao |
|:-----:|------|
| 1 | No card do investimento, clique em **Lancamentos**. |
| 2 | Clique em **Novo lancamento**. |
| 3 | Selecione o **Tipo**, informe a **Data** e o **Valor (R$)**. |
| 4 | Confirme o lancamento. |

O saldo do investimento e calculado automaticamente a partir dos lancamentos registrados.

### 8.3 Evolucao

A aba Evolucao mostra um quadro com a **posicao mensal** de cada investimento ao longo do tempo, permitindo acompanhar o crescimento da carteira mes a mes.

---

## 9 Assistente IA

O Assistente Financeiro e um chat com inteligencia artificial que analisa seus **dados financeiros reais** — contas, transacoes, recorrentes, investimentos e projecoes — para oferecer diagnosticos e orientacoes personalizadas.

### 9.1 Como usar

| Passo | Acao |
|:-----:|------|
| 1 | Acesse **Assistente IA** na sidebar. |
| 2 | Na primeira visita, clique em uma das 4 perguntas sugeridas ou digite sua propria pergunta. |
| 3 | Pressione **Enter** para enviar (ou clique no botao de envio). |
| 4 | A resposta e exibida progressivamente enquanto e gerada. |

| Atalho | Funcao |
|--------|--------|
| **Enter** | Envia a mensagem |
| **Shift + Enter** | Pula linha sem enviar |

> **Limite:** 2.000 caracteres por mensagem.

### 9.2 Contexto conversacional

O assistente **mantem o contexto da conversa**. Cada nova pergunta considera as mensagens anteriores. Voce pode pedir um diagnostico e, na sequencia, perguntar *"como melhorar isso?"* sem precisar repetir o contexto.

### 9.3 Copiar respostas

Passe o mouse sobre qualquer resposta do assistente para revelar o **botao de copiar** no canto superior direito. Ao clicar, o texto e copiado e o icone muda para um check verde por 2 segundos, confirmando a copia.

### 9.4 Exemplos de perguntas

| Pergunta | Tipo de analise |
|----------|----------------|
| "Como esta minha saude financeira?" | Diagnostico geral |
| "Minhas despesas estao controladas?" | Analise de gastos |
| "Minha carteira esta diversificada?" | Analise de investimentos |
| "Tenho reserva de emergencia?" | Planejamento de reserva |
| "Quais categorias estao acima do previsto?" | Orcamento |
| "Como posso economizar mais?" | Recomendacoes |

> **Nota:** O assistente e baseado nos seus dados reais, mas nao substitui aconselhamento financeiro profissional.

---

## 10 Configuracoes

A pagina de Configuracoes possui tres abas: **Geral**, **Categorias** e **Regras de Importacao**.

### 10.1 Geral — Dia de fechamento

O dia de fechamento define quando comeca e termina seu "mes financeiro".

| Configuracao | Exemplo |
|-------------|---------|
| Dia 1 (padrao) | Fevereiro = 01/fev a 28/fev |
| Dia 10 | Fevereiro = 10/fev a 09/mar |
| Dia 25 | Fevereiro = 25/fev a 24/mar |

Essa configuracao e util para quem recebe salario em um dia diferente do dia 1. Ela afeta o Dashboard, o Fluxo e todas as projecoes.

**Para alterar:**

| Passo | Acao |
|:-----:|------|
| 1 | Selecione o dia desejado no dropdown (1 a 28). |
| 2 | Clique em **Salvar**. |

### 10.2 Categorias

Gerencie as categorias usadas para classificar suas transacoes.

**Criar uma categoria:**

| Passo | Acao |
|:-----:|------|
| 1 | Clique em **Nova categoria**. |
| 2 | Preencha o formulario (veja campos abaixo). |
| 3 | Clique em **Criar categoria**. |

**Campos do formulario:**

| Campo | Descricao |
|-------|-----------|
| Nome | Nome da categoria — ex: "Alimentacao", "Salario", "Lazer" |
| Tipo | Receita ou Despesa |
| Tipo de projecao | **Historico** (media dos meses anteriores) ou **Recorrente** (valor fixo das transacoes planejadas) |

Cada categoria exibe automaticamente um icone visual baseado no nome (ex: alimentacao exibe um icone de comida, transporte exibe um carro).

> **Atencao:** Categorias com transacoes vinculadas nao podem ser excluidas. Reclassifique as transacoes antes de remover a categoria.

### 10.3 Regras de Importacao

Regras de categorizacao automatica que sao aplicadas durante a importacao de extratos (OFX, CSV e PDF). Cada regra associa um **padrao de texto** a uma **categoria**.

**Criar uma regra:**

| Passo | Acao |
|:-----:|------|
| 1 | Na aba **Regras de Importacao**, preencha o padrao (ex: "SUPERMERCADO", "UBER", "PIX"). |
| 2 | Selecione a categoria que sera atribuida automaticamente. |
| 3 | Clique em **Adicionar**. |

Quando uma transacao importada contem o padrao no campo de descricao, a categoria e atribuida automaticamente e sinalizada com um badge **Auto** na tela de revisao.

---

## 11 Guia de Configuracao Inicial

Para aproveitar todos os recursos do FinApp, siga esta sequencia ao configurar a plataforma pela primeira vez:

| Ordem | Acao | Por que |
|:-----:|------|---------|
| 1 | Cadastre suas **contas** | Sao a base para todas as movimentacoes |
| 2 | Revise as **categorias** | As categorias padrao sao um bom comeco — ajuste conforme sua realidade |
| 3 | Configure o **dia de fechamento** | Se seu ciclo financeiro nao comeca no dia 1, ajuste em Configuracoes |
| 4 | Cadastre as **recorrentes** | Registre receitas fixas (salario) e despesas fixas (aluguel, planos). Isso alimenta as projecoes |
| 5 | Registre suas **transacoes** | A cada gasto ou recebimento, registre. Use a importacao (OFX, CSV ou PDF) para agilizar |
| 6 | Cadastre seus **investimentos** | Registre os investimentos e atualize os saldos mensalmente |

---

## 12 Uso no Dia a Dia

| Rotina | Frequencia sugerida | O que fazer |
|--------|---------------------|-------------|
| Consultar o Dashboard | Diariamente | Visao rapida de receitas, despesas e saldo do mes |
| Registrar transacoes | A cada movimentacao | Manter os dados sempre atualizados |
| Importar extrato | Semanalmente | Importar transacoes do banco (OFX, CSV ou PDF) sem digitacao manual |
| Consultar o Fluxo Diario | Quando necessario | Ver o saldo projetado para dias especificos |
| Consultar o Fluxo Previsto | Mensalmente | Planejar os proximos 3 meses |
| Atualizar investimentos | Mensalmente | Registrar aportes, resgates ou atualizar saldo |
| Perguntar ao Assistente IA | Quando quiser | Obter diagnosticos e orientacoes personalizadas |

---

**FinApp** — Gestao Financeira Pessoal
*Versao 1.1 — Fevereiro 2026*
