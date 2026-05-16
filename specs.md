# Documento de Especificações Técnicas e Arquitetura

Este documento define a pilha tecnológica (Tech Stack), a infraestrutura de hospedagem e o Design System do Sistema de Gestão para Sítio. Ele serve como guia arquitetural para os desenvolvedores e assistentes de Inteligência Artificial (opencode.ai, Claude Code, Cursor).

---

## 1. Stack Tecnológica (Web & Mobile)

A arquitetura será baseada no ecossistema JavaScript/TypeScript, permitindo o reaproveitamento de código e simplificando a manutenção.

* **Linguagem Base:** `TypeScript` (obrigatório para garantir tipagem e evitar erros em tempo de compilação, essencial quando gerado por IA).

### Frontend Web (Painel Administrativo)
* **Framework:** `Next.js` (App Router) - Renderização híbrida (SSR/SSG).
* **Estilização:** `Tailwind CSS`.
* **Biblioteca de Componentes:** `Shadcn/UI` (oferece componentes acessíveis, modernos e que não ficam presos a um pacote npm, permitindo total customização).
* **Ícones:** `Lucide React`.

### Frontend Mobile (Aplicativo de Campo)
* **Framework:** `React Native` via `Expo`.
* **Offline-First:** Uso de `WatermelonDB` ou `SQLite` local para armazenamento no dispositivo quando o produtor estiver sem internet no campo. Sincronização em background quando detectar Wi-Fi/4G.

### Backend (APIs)
* Construído diretamente dentro do `Next.js` utilizando *Route Handlers* (Serverless Functions), eliminando a necessidade de um servidor Node.js/Express separado nesta fase inicial.

---

## 2. Banco de Dados e ORM

Decisão arquitetural focada em segurança, performance e aderência ao ecossistema serverless da Vercel.

* **Banco de Dados Principal:** `Neon` (Serverless Postgres).
    * *Justificativa:* Substituto ideal ao Supabase neste contexto. Oferece conexões ultrarrápidas em ambientes serverless, escalabilidade automática (*scale-to-zero* para economizar custos) e suporte robusto à extensão `PostGIS` (necessária futuramente para o Módulo 1 de mapas).
    * *Feature Chave:* **Database Branching**. Cada Pull Request no GitHub pode ter um banco de dados temporário idêntico ao de produção para testes automatizados.
* **ORM (Object-Relational Mapping):** `Drizzle ORM` (ou Prisma).
    * *Justificativa:* Drizzle é atualmente a ferramenta mais leve e rápida para conexões serverless com o Neon.
* **Autenticação:** `Auth.js` (NextAuth v5) ou `Clerk`.
    * Gerenciamento de sessões seguro, senhas criptografadas e possibilidade de login com Google/Apple sem depender dos serviços de Auth de plataformas de terceiros como o Supabase.

---

## 3. Infraestrutura, Hospedagem e CI/CD

O fluxo de trabalho será altamente automatizado e focado em entregas contínuas (DevOps ágil).

* **Controle de Versão:** `GitHub`.
    * Repositório privado.
    * Padrão de commits semânticos (`feat:`, `fix:`, `chore:`).
* **Hospedagem Web & Backend:** `Vercel`.
    * A Vercel possui integração nativa e instantânea com o repositório do GitHub. Qualquer push na branch `main` gera um deploy automático em produção. Pushes em outras branches geram URLs de Preview exclusivas.
* **Armazenamento de Arquivos (Storage):**
    * Para imagens de produtos, notas fiscais e avatares: `AWS S3` ou `Cloudflare R2` (mais barato e sem taxas de saída de dados).

---

## 4. Design System e Interface do Dashboard (UI/UX)

O painel deve evocar uma sensação de organização, modernidade e produtividade, afastando-se do visual datado de softwares rurais antigos, sem ser excessivamente "infantil".

### 4.1. Paleta de Cores (Agro SaaS Moderno)
* **Cor Primária:** Verde Musgo Escuro (`#166534` ou Tailwind `green-800`). Transmite solidez, natureza e confiança financeira.
* **Cor Secundária (Ações):** Verde Esmeralda (`#10B981` ou Tailwind `emerald-500`). Usado para botões primários e sucesso.
* **Cores de Destaque / Alertas:**
    * Atenção/Secas: Tons terrosos/Laranja (`#F59E0B` / `amber-500`).
    * Perigo/Erro: Vermelho Suave (`#EF4444` / `red-500`).
* **Backgrounds (Fundo):**
    * *Light Mode:* Off-white / Gelo (`#F9FAFB` / `gray-50`) para a tela, e Branco (`#FFFFFF`) para os Cards.
    * *Dark Mode:* Escala de Zinc (`#18181B` / `zinc-900`) para reduzir o cansaço visual em usos noturnos.

### 4.2. Tipografia
* **Fonte Principal:** `Inter` (Google Fonts). Escolhida pela sua altíssima legibilidade em tabelas de dados, números de dashboards e telas pequenas.

### 4.3. Layout e Estrutura do Dashboard
* **Sidebar (Barra Lateral Esquerda):**
    * Fina, com fundo escuro (Verde Musgo) ou cinza muito claro.
    * Agrupamentos em colapso:
        * 🌱 **Operações** (Campo, Avicultura, Criatório)
        * 📦 **Estoque & Vendas** (Inventário, Clientes, Assinaturas)
        * 📊 **Financeiro** (Fluxo de Caixa, DRE, Custos)
        * ⚙️ **Configurações** (Mapas, Fiscal, Usuários)
* **Área Central (Workspace):**
    * **Header (Cabeçalho):** Contém *Breadcrumbs* (Trilha de navegação: Financeiro > Fluxo de Caixa), barra de busca global (`cmd+K` ou `ctrl+K`) e ícone de notificações.
* **Widgets da Tela Inicial (Home):**
    * *Visão Geral (Cards Numéricos):* Saldo atual, Total a Receber, Taxa de Postura das aves do dia, Tarefas atrasadas no campo.
    * *Gráfico Principal:* Gráfico de barras simples cruzando Entradas vs. Saídas da semana.
    * *To-Do List (Alerta Operacional):* Lista rápida com ações do dia puxadas do Caderno de Campo (ex: *"Dia de vacinar lote 3 de aves"*, *"Colher alfaces do canteiro B"*).
* **Comportamento Responsivo:**
    * No celular, a Sidebar vira um "Hamburger Menu".
    * As tabelas extensas devem adotar rolagem horizontal interna ou se transformar em "Cards" empilhados para facilitar o uso no celular do trator ou na estufa.

---

## 5. Fluxo de Desenvolvimento Assistido (opencode.ai / Claude / Cursor)

Para extrair o máximo das IAs de codificação no seu ambiente de desenvolvimento, utilize os comandos estruturados seguindo a ordem abaixo:

1.  **Setup Inicial:**
    > *"Inicie um projeto Next.js com Tailwind, Shadcn/UI, Drizzle ORM conectado ao Neon Database. Crie a estrutura de pastas seguindo o padrão App Router."*
2.  **Schema First:**
    > Semper comece pelo banco. *"Leia o PRD Módulo 1 e as Tech Specs. Crie o schema.ts do Drizzle para a entidade 'Talhões' e 'Canteiros'."*
3.  **UI Second:**
    > *"Crie um componente de tabela do Shadcn/UI para listar os Canteiros criados no passo anterior."*
4.  **Integração:**
    > *"Crie as Server Actions no Next.js para salvar um novo canteiro no banco de dados Neon a partir do formulário."*