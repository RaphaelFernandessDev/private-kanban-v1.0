<h1 align="center">🚀 Private Kanban</h1>

<p align="center">
  <strong>Sistema Fullstack de Gestão de Tarefas com Controle Administrativo</strong>
</p>

<p align="center">
  Aplicação web no modelo <strong>Kanban</strong> com autenticação de usuários, painel administrativo e persistência compartilhada via API + Supabase.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Versão-1.0-00C853?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Status-Em%20Evolução-1E88E5?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Stack-Fullstack-5E35B1?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel" />
  <img src="https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
</p>

---

## 🟢 Status do Projeto

> ✅ Versão 1.0 funcional  
> 🔄 Em evolução contínua  
> 🛠️ Arquitetura fullstack consolidada  

---

## 📌 Sobre o Projeto

O **Private Kanban** nasceu como um projeto frontend puro (HTML, CSS e JavaScript) e evoluiu para uma aplicação **fullstack com rotas serverless**, persistência real em banco relacional e deploy em cloud.

O sistema foi estruturado com foco em:

- Separação clara entre frontend e backend
- Persistência real multi-dispositivo
- Controle administrativo de usuários
- Monitoramento de presença e último acesso
- Base arquitetural escalável para novas versões

---

## 🧠 Arquitetura Geral

```text
Frontend (HTML/CSS/JS)
   |
   | fetch /api/*
   v
API Serverless (Vercel)
   |
   | REST
   v
Supabase (Postgres)
```

### Camadas

- **Frontend** (`index.html`, `styles.css`, `script.js`)
- **Backend Serverless** (`api/*.js`)
- **Persistência** (tabelas `users`, `tasks`, `user_events`)

---

## 🧩 Funcionalidades

### 🔐 Autenticação e Usuários

- Login com validação via API (`/api/login`)
- Usuário Admin com permissões avançadas
- Cadastro e remoção de usuários pelo Admin
- Alteração de senha para Admin e usuários comuns
- Painel de consulta de usuários (incluindo credenciais da v1)

### 📊 Kanban de Tarefas

- Criação, edição e exclusão de tarefas
- Colunas: **A Fazer**, **Em Progresso** e **Concluído**
- Priorização por nível: alta, média, baixa
- Data de entrega com ordenação por vencimento
- Badges de prazo: **Vence amanhã** e **Em atraso**
- Destaques visuais para tarefas críticas

### 🔔 Notificações e Presença

- Central de notificações com contador no sino
- Tipos visuais por categoria de notificação
- Limpeza de notificações no menu
- Status online/offline de usuários
- Registro de último acesso persistido no banco

### 🎨 Experiência de Interface

- Tema claro/escuro com alternância dinâmica
- Layout responsivo (mobile, desktop e telas grandes)
- Modal de detalhes de tarefa com informações adicionais
- Upload e visualização de imagens por tarefa

---

## 🛠️ Tecnologias Utilizadas

<p align="center">
  <img src="https://skillicons.dev/icons?i=html,css,js,nodejs,git,github" />
</p>

### Backend e Infra

- **Node.js** (funções serverless)
- **Supabase** (Postgres + REST)
- **Vercel** (hospedagem e execução das APIs)
- **bcryptjs** (hash de senha no backend)

---

## 📂 Estrutura do Projeto

```bash
private-kanban-v1.0/
├── index.html
├── styles.css
├── script.js
├── package.json
├── README.md
└── api/
    ├── _supabase.js
    ├── login.js
    ├── presence.js
    ├── tasks.js
    ├── user-events.js
    ├── user-events/
    │   └── create.js
    └── users/
        ├── create.js
        ├── change-password.js
        └── delete.js
```

---

## 🗄️ Persistência de Dados

No ambiente de produção, os dados ficam centralizados no **Supabase**, garantindo consistência entre navegadores e dispositivos diferentes.

### Tabelas principais

- `users`
- `tasks`
- `user_events`

---

## ⚙️ Variáveis de Ambiente (Vercel)

Configure no projeto:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (ou `SUPABASE_SECRET_KEY`)

---

## ▶️ Como Rodar Localmente

1. Instale dependências:

```bash
npm install
```

2. Configure variáveis de ambiente no `.env.local`.

3. Rode com Vercel Dev para habilitar `/api/*`:

```bash
npx vercel dev
```

4. Acesse a URL exibida no terminal.

---

## ☁️ Deploy

1. Suba o repositório para o GitHub.
2. Importe o projeto na Vercel.
3. Configure as variáveis de ambiente do Supabase.
4. Execute o deploy.

---

## 🔐 Observação de Segurança (v1)

A versão atual mantém visualização de senha em texto no painel Admin por regra funcional definida no projeto. Para produção com requisitos rígidos de segurança, recomenda-se remover essa exibição e adotar políticas adicionais.

---

## 🛣️ Roadmap

- Separar tela de login e hub em arquivos dedicados
- Modularizar o JavaScript por domínio
- Melhorar controle de sessão por token
- Adicionar testes automatizados de regras críticas
