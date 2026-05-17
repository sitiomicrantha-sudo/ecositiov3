# PRD: Módulo de Avicultura Caipira (Sítio Micrantha)

## 1. Visão Geral e Objetivo
Criar um ecossistema de gestão zootécnica focado em aves de capoeira (corte e postura), aderente às normas da Embrapa e com foco na transição para a certificação orgânica via Organismo Participativo de Avaliação da Conformidade (OPAC). O módulo abandonará a lógica industrial *"all-in, all-out"* (tudo dentro, tudo fora), suportando a realidade de **Lotes Mistos** (aves de idades e origens diferentes convivendo e rotacionando nos mesmos piquetes).

---

## 2. Arquitetura de Dados (O Core Relacional)
Em vez de vincular dados diretamente a um "Lote" estático, o sistema adotará a triangulação relacional para garantir máxima flexibilidade e rastreabilidade:

* **Locais Físicos (`poultry_locations`):** Galpões, pinteiros, piquetes rotativos e módulos móveis. Cada um possuirá o registro de área útil (em metros quadrados) e sua respectiva capacidade nominal.
* **Sublotes (`sub_batches`):** A entidade biológica imutável. Representa, por exemplo, a compra de 50 pintainhos da linhagem *Embrapa 051* na data *X*. Possui o custo de aquisição indexado e o contador dinâmico de "aves ativas".
* **Alojamentos Ativos (`active_placements`):** A tabela de junção (n mapping). Registra que o *Sublote A* está atualmente dentro do *Piquete 2*. Essa modelagem permite agrupar ou separar aves sem perder o histórico individual de rastreabilidade.

---

## 3. O Caderno de Campo Zootécnico (UX Pedagógica)
O operador registrará eventos rápidos diretamente no dispositivo móvel, categorizados em 5 rotinas essenciais:

### 3.1. Mortalidade & Ocorrências
* **Mecanismo de Baixa:** Permite a **Baixa Direta** (se for possível identificar a origem exata da ave) ou **Baixa Proporcional** (o sistema distribui matematicamente o óbito entre os sublotes que cohabitam o mesmo local físico).
* **Gatilho de Segurança:** Dispara um alerta vermelho (crítico) no painel caso a mortalidade ultrapasse o limiar de **0,5% em 48 horas**.

### 3.2. Produção de Ovos
* **Registros Contabilizados:** Ovos comerciais, trincados e sujos.
* **Inteligência de Produção:** Alerta preditivo de queda de postura quando a redução for superior a **15%**, disparando automaticamente cards com dicas zootécnicas de manejo.

### 3.3. Nutrição
* **Regra dos 20/80:** Monitoramento para garantir o equilíbrio nutricional (máximo de 20% de pasto e mínimo de 80% de ração balanceada).
* **Custo por Peso Metabólico:** Futuramente, os custos com ração serão rateados proporcionalmente com base no peso metabólico de cada sublote, utilizando a fórmula:
    $$\text{PM}_i = N_i \times (\text{PV}_i)^{0.75}$$
    *Onde $N_i$ é o número de aves ativas e $\text{PV}_i$ é o Peso Vivo médio do sublote $i$.*

### 3.4. Rotação de Piquete
* **Acesso Externo:** Garante o registro mínimo obrigatório de **6 horas diárias** de acesso à área externa.
* **Vazio Sanitário:** Controla e bloqueia o acesso a piquetes em período de descanso obrigatório (**15 a 21 dias**).

### 3.5. Pesagem (Amostragem)
* **Métrica de Uniformidade:** Alerta visual se o Coeficiente de Variação (CV) da pesagem amostral ultrapassar **12%**, sinalizando um lote desuniforme que demanda manejo segregado.

---

## 4. Dossiê de Saúde e Transição Orgânica (O Prontuário)
Para suportar o rigor de auditoria da OPAC e o realismo do manejo de campo, a tabela de eventos sanitários (`poultry_health_events`) exigirá obrigatoriamente a classificação por **Categoria de Intervenção**:

* 🟢 **Fitoterápico / Biológico:** Uso de óleos essenciais, probióticos, extratos naturais (alho/neem), homeopatia e florais. *Sem impacto restritivo na transição.*
* 🟡 **Profilático (Vacinas):** Registros obrigatórios dos planos de vacinação contra *Marek*, *Bouba Aviária* e *Newcastle*. Campos obrigatórios: número do lote da vacina e laboratório fabricante.
* 🔴 **Alopático (Controle Comercial):** Uso de antibióticos ou vermífugos sintéticos (permitidos em emergências ou antes da certificação plena). Este evento altera o status do histórico temporariamente para "Em Quarentena", acionando um cronômetro automático do **período de carência** regulamentar, período no qual a comercialização da ave ou de seus ovos fica bloqueada no sistema.