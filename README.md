# Private Kanban v1.0

Aplicacao web de gerenciamento de tarefas no modelo Kanban, com login de usuarios, painel administrativo e persistencia compartilhada via API + Supabase.

## Status

Em desenvolvimento (v1 funcional).

## Visao Geral

O projeto comecou como frontend puro (HTML, CSS e JavaScript) e evoluiu para uma estrutura fullstack simples usando rotas serverless.

Hoje o sistema oferece:

- Autenticacao com login e senha.
- Usuario Admin com permissao para cadastrar e remover usuarios.
- Quadro Kanban individual por usuario.
- Persistencia de dados entre navegadores e dispositivos.
- Notificacoes e monitoramento de presenca para o Admin.

## Funcionalidades

### Autenticacao e usuarios

- Login com validacao por API (`/api/login`).
- Usuario Admin padrao.
- Cadastro de usuarios pelo Admin.
- Alteracao de senha para usuarios e Admin.
- Visualizacao de login/senha no painel Admin (regra atual da v1).
- Indicador online/offline por usuario.
- Ultimo acesso salvo no banco.

### Kanban

- Criacao, edicao e exclusao de tarefas.
- Colunas: A Fazer, Em Progresso e Concluido.
- Prioridade da tarefa (alta, media, baixa).
- Data de entrega.
- Ordenacao por data de entrega.
- Destaque visual para tarefas proximas do vencimento e em atraso.
- Badges no card: "Vence amanha" e "Em atraso".

### Detalhes da tarefa

- Modal de detalhes da tarefa.
- Campo de informacoes do projeto.
- Upload de imagens (preview e abertura da imagem).

### Notificacoes

- Menu de notificacoes com contador no sino.
- Tipos visuais por notificacao.
- Botao para limpar notificacoes.
- Regras especificas para notificacoes de prazo e eventos de usuarios.

### Interface

- Tema claro/escuro com alternancia por botao.
- Layout responsivo (mobile, desktop e telas grandes).
- Menu de perfil com acoes de conta.

## Stack

- HTML5
- CSS3
- JavaScript (Vanilla)
- Node.js (Serverless Functions)
- Supabase (Postgres + REST)
- Vercel (deploy)

Dependencia backend:

- `bcryptjs`

## Estrutura do Projeto

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

## Persistencia de Dados

No ambiente publicado (Vercel), os dados ficam no Supabase, permitindo o mesmo estado em qualquer navegador/dispositivo.

Tabelas usadas:

- `users`
- `tasks`
- `user_events`

## Variaveis de Ambiente (Vercel)

Configure no projeto:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (ou `SUPABASE_SECRET_KEY`)

Observacao:

- O frontend chama as rotas `/api/*`.
- As rotas usam a chave de servico para acessar o banco.

## Como Rodar Localmente

1. Instale dependencias:

```bash
npm install
```

2. Configure as variaveis de ambiente (`.env.local` no fluxo Vercel local).

3. Rode com Vercel Dev (para habilitar as rotas `/api`):

```bash
npx vercel dev
```

4. Abra o endereco informado no terminal.

## Deploy

1. Suba o repositorio para o GitHub.
2. Importe o projeto na Vercel.
3. Configure as variaveis de ambiente do Supabase.
4. Faça o deploy.

## Observacoes da v1

- O Admin visualiza a senha em texto no painel, por regra funcional definida para esta versao.
- Para ambiente de producao com requisitos de seguranca mais fortes, o ideal e remover exibicao de senha em texto e adotar politicas adicionais.

## Roadmap (proximas versoes)

- Separar telas (login e hub) em arquivos dedicados.
- Modularizar o JavaScript em multiplos arquivos.
- Melhorar controle de sessoes por token.
- Testes automatizados para regras de negocio.
