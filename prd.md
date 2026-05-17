# Product Requirements Document (PRD): Especificação Funcional do Sistema Integrado

A consolidação da fundamentação teórica em gestão rural, aliada à análise das melhores práticas de mercado e das exigências fiscais, culmina neste Documento de Requisitos de Produto (PRD). O escopo técnico abrange a concepção de um sistema modular, operando através de uma aplicação web administrativa central e um Progressive Web App (PWA) ou aplicativo nativo (iOS/Android) desenhado exclusivamente para as operações de campo e registros offline do sítio agroecológico.

O software arquitetado visa proporcionar fluidez operacional por meio da integração sistêmica profunda, estruturando-se em módulos funcionais.

---

## Módulo 1: Mapeamento e Topologia das Áreas Produtivas

Este módulo estabelece a base de dados espaciais e relacionais da propriedade. Toda e qualquer ação agronômica e alocação financeira futura será vinculada à taxonomia definida nesta etapa.

* **Ferramenta de Geoprocessamento Integrada:** Utilizando interfaces de mapeamento por satélite (API do Google Maps ou Mapbox), o produtor desenhará digitalmente os polígonos que delimitam os contornos de sua propriedade, garantindo precisão perimétrica.
* **Hierarquização Espacial Estruturada:** O banco de dados suportará uma estrutura de árvore hierárquica. A entidade raiz (**Propriedade**) subdivide-se em **Glebas**, que por sua vez contêm múltiplos **Talhões**, os quais abrigam as unidades mínimas de controle: os **Canteiros**. Cada registro carregará metadados georreferenciados e a quantificação exata de sua área útil em metros quadrados ou hectares.
* **Segregação da Infraestrutura:** O sistema exigirá o registro diferenciado de áreas de infraestrutura não produtiva vegetal. Galpões de maquinário, sedes administrativas, áreas de preservação permanente e infraestruturas zootécnicas devem ser categorizados separadamente dos setores de cultivo.
* **Painel Histórico do Solo:** Um dashboard específico registrará a linha do tempo de ocupação de cada canteiro, auxiliando no planejamento de rotação de culturas.

---

## Módulo 2: Controle Dinâmico de Cultivos e Manejo Zootécnico (Caderno de Campo)

Em atendimento às normas da instrução normativa MAPA 007/1999 e legislações correlatas, este módulo digitaliza o Caderno de Campo.

### Submódulo 2.1: Gestão de Cultivos Vegetais (Horta, Pomar e Lavouras)
O fluxo cobre o processo desde a aquisição da semente até a expedição final do produto *in natura* ou processado.
* **Cronograma de Planejamento de Safra:** Calendário para definição de variedades, datas de semeadura/transplante e escolha de canteiros.
* **Apontamentos Agrícolas Operacionais:** Registro de manejos de solo, controle de pragas/doenças (MIP) com baixa automática de insumos, e operações de colheita com apontamento de refugo.
* **Mecanismo de Rastreabilidade:** Geração de lote único e QR Code para cada ordem de colheita finalizada.

### Submódulo 2.2: Controle Zootécnico Especializado (Avicultura de Postura)
Focado no plantel de aves caipiras voltadas para a produção de ovos (atividade principal em andamento).
* **Cadastramento e Alojamento do Lote:** Registro inicial das aves, raça, nascimento e alojamento.
* **Diário de Ambiência e Sanitário:** Registro de temperatura, estado da cama do galpão, e calendário inteligente de vacinação e profilaxia.
* **Apontamentos de Produção Diária:** Lançamento de mortalidade, consumo de ração/água (com baixa em estoque) e quantificação detalhada da produção de ovos (por tamanho e qualidade).

### Submódulo 2.3: Criatório de Aves (Reprodução e Incubação)
> **Nota:** Módulo de complexidade específica, previsto para as últimas etapas do desenvolvimento.
* **Gestão de Matrizes e Ovos Férteis:** Rastreabilidade das aves reprodutoras e controle diário de coleta de ovos destinados à incubação.
* **Controle de Incubação:** Monitoramento de ciclos (dias de incubação e nascedouro), apontamento de temperatura/umidade das chocadeiras, taxa de fertilidade (ovoscopia) e taxa de eclosão final.
* **Transição de Plantel:** Conversão dos pintainhos nascidos em novos lotes de alojamento para o Submódulo 2.2.

---

## Módulo 3: Gestão Financeira Analítica e Centros de Produção

Este módulo atua como o cérebro contábil da propriedade.

* **Arquitetura Baseada em Centros de Lucro/Produção:** Alocação de receitas/despesas por centros ("Horta", "Avicultura", etc.).
* **Gestor Central de Caixa:** Contas a pagar/receber e conciliação.
* **Motor de Rateio de Custos Indiretos:** Divisão de despesas (como salários e energia) proporcionalmente entre os centros de produção.
* **Análise de Desempenho:** Cálculo de depreciação, Custo Operacional Efetivo (COE) e lucro real da atividade.
* **Controle de Inventário:** Estoque valorizado pelo Custo Médio Ponderado. Integração total entre compra (financeiro) e consumo (caderno de campo).

---

## Módulo 4: Relacionamento, CRM e Modelos Comerciais (CSA)

Gerencia a comunicação, retenção de clientes e escoamento dos produtos.

* **Cadastro Unificado de Entidades (CRM):** Banco de dados de clientes (B2C/B2B) e fornecedores.
* **Orquestração de Assinaturas (CSA):** Gestão de cestas recorrentes, rotas de entrega e controle de saldo antecipado (Modalidade *Buy-Down*).
* **Engajamento:** Disparo de newsletters e comunicados.

---

## Módulo 5: Ecossistema Omnichannel (WhatsApp)

Posicionado para escalar vendas. Implementado em duas fases tecnológicas distintas:

* **Fase 1: Motor de Textos (Manual/Testes):** O sistema consultará o estoque e gerará automaticamente os textos formatados (catálogo, resumo do pedido, cobrança) na tela do sistema. O usuário irá apenas copiar o texto e colar manualmente no WhatsApp do cliente. Esta fase visa validar a regra de negócio sem custos de API.
* **Fase 2: Automação Total (Via API):** Integração com Evolution API / Meta Oficial. O WhatsApp receberá os dados via Webhook (n8n/Typebot), enviará para um LLM (Inteligência Artificial) que consultará o banco de dados via *Function Calling*, processando pedidos e baixando estoque de forma 100% autônoma.

---

## Módulo 6: Conformidade Tributária e Emissão Fiscal (NFP-e)

> **Nota:** Será o último módulo a ser desenvolvido devido à complexidade burocrática, servindo como retaguarda invisível.
* **Custódia Criptográfica:** Armazenamento do e-CPF/e-CNPJ.
* **Emissão Automatizada:** Geração do arquivo XML da NFP-e com um clique a partir das vendas finalizadas.
* **Gestão de Contranotas:** Leitura de XMLs de clientes B2B.

---

## 7. Integrações e Arquitetura de Dados

| Componente Arquitetural | Definição Tecnológica Recomendada e Função no Sistema |
| :--- | :--- |
| **Banco de Dados Principal** | SGBDs relacionais como PostgreSQL. Essencial para integridade nas transações financeiras e de estoque, e suporte a dados espaciais (PostGIS). |
| **Backend & Motor de APIs** | Node.js, Python (Django/FastAPI) ou stack similar. Responsável pelas regras de negócio e matemática de estoque. |
| **Frontend Web** | React.js / Vue.js. Painel administrativo para gestão e visualização de relatórios. |
| **Frontend Mobile** | React Native / Flutter (Offline-First). Focado no apontamento prático do agricultor no meio do campo, sem internet. |

---

## 8. Roadmap de Desenvolvimento (Orientado para IAs de Codificação)

Esta seção serve como diretriz de priorização de contexto (*Context Window*) para assistentes de programação (como opencode.ai ou Claude Code). As IAs devem ser instruídas a construir o banco de dados e as APIs estritamente nesta ordem.

### MVP (Fase 1): Fundação de Dados e Produção Vegetal
* **Objetivo:** Criar a estrutura base do banco de dados e viabilizar o primeiro uso no campo.
* **Módulo 1 (Estrutura Básica):** Desenvolver apenas o CRUD relacional hierárquico (Propriedade > Gleba > Talhão > Canteiro). Ignorar as APIs de mapas nesta fase.
* **Módulo 3 (Estoque Físico Básico):** Criar as tabelas de itens, entrada e saída de estoque (apenas volume, sem a contabilidade atrelada ainda).
* **Submódulo 2.1 (Vegetal):** Criar as telas e APIs de planejamento de safra, apontamento de manejo e registro de colheita (que deve alimentar a entrada de produtos no estoque do Módulo 3).

### Fase 2: Zootecnia Base (Avicultura de Postura) e Primeiras Vendas
* **Objetivo:** Trazer a principal operação atual do sítio para o sistema e iniciar a gestão de vendas simplificada.
* **Submódulo 2.2 (Avicultura de Postura):** Criar o CRUD de lotes de aves, registro de mortalidade, consumo de insumos (conectado ao Módulo 3) e lançamento diário de produção de ovos.
* **Módulo 4 (CRM e Comercial):** CRUD de clientes e funcionalidade de criação de pedidos.
* **Módulo 5 (Fase 1 - Textos WhatsApp):** Criar um gerador visual dentro do sistema Web que leia os pedidos do Módulo 4 e o estoque do Módulo 3, formatando mensagens dinâmicas para "Copiar e Colar" no WhatsApp.

### Fase 3: Gestão Financeira Avançada
* **Objetivo:** Implementar inteligência contábil sobre os dados que já estão circulando.
* **Módulo 3 (Financeiro Completo):** Implementar Contas a Pagar/Receber conectadas às compras de estoque e vendas do Módulo 4.
* **Rateio de Custos:** Criar a lógica de rateio por Centro de Produção ("Horta" vs "Aves") e cálculos de DRE, COE e Margens.

### Fase 4: Automações, Mapas e Escalabilidade
* **Módulo 1 (Geoprocessamento):** Acoplar Google Maps / Mapbox aos polígonos dos talhões.
* **Módulo 5 (Fase 2 - IA Conversacional):** Substituir o *copy/paste* pela API automatizada (webhook/Evolution API/LLM) interagindo diretamente com o estoque e vendas.

### Fase 5: Burocracia, Criatório e Finalização
* **Submódulo 2.3 (Criatório):** Criar lógicas específicas de incubação e ovoscopia.
* **Módulo 6 (NFP-e):** Plugar a lógica de faturamento na SEFAZ e assinatura com certificado digital usando as vendas processadas nas fases anteriores.





### NOTAS E MENOS ###
* Adicionar um modulo de tarefas a realizar, integrado aos modulos existentes. Incluir um card no home com as tarefas.
ex. roçar talhao x, limpar baia x do galinheiro
* Adicionar uma janela de chat ao deskboar com ia integrada. Para executar tarefas como: Esqueci de registrar a alimentacao das galinhas essa semana, verifique os dias que nao registrei nessa semana e faça o registro com valores medios das ultimas alimentacoes;