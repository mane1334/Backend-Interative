# Plano de Implementação: Sistema de Login e Cadastro

## Objetivo
Proteger o Admin Panel para que apenas usuários registrados (da tabela `users`) possam acessá-lo, com um sistema seguro para criar e gerenciar contas.

---

## Etapa 1: Backend

### 1.1. Dependências de Segurança
- Adicionar a biblioteca `bcrypt` para hashing de senhas.
- Adicionar a biblioteca `jsonwebtoken` para gerar tokens de acesso.

### 1.2. Rota de Login (`POST /api/login`)
- Receber `username` e `password` no corpo da requisição.
- Buscar o usuário no banco de dados pelo `username`.
- Se o usuário existir, usar `bcrypt.compare()` para comparar a senha enviada com a `password_hash` armazenada.
- Se a senha for válida, gerar um JSON Web Token (JWT) contendo o ID e a função (`role`) do usuário.
- Enviar o token JWT de volta para o frontend.

### 1.3. Rota de Criação de Usuário (`POST /api/users`)
- **Rota protegida:** Apenas administradores (`role: 'admin'`) podem acessá-la.
- Receber `username`, `password` e `role`.
- Usar `bcrypt.hash()` para criar um hash seguro da senha.
- Salvar o novo usuário no banco de dados com o `password_hash`.

### 1.4. Outras Rotas de Usuários (CRUD)
- `GET /api/users`: Rota protegida para listar todos os usuários.
- `DELETE /api/users/:id`: Rota protegida para excluir um usuário.

### 1.5. Middleware de Autenticação
- Criar um middleware que verifica a validade do token JWT enviado no cabeçalho `Authorization` de cada requisição.
- Aplicar este middleware a todas as rotas sensíveis da API para protegê-las contra acesso não autorizado.

---

## Etapa 2: Frontend (Admin Panel)

### 2.1. Página de Login
- Criar uma nova página/rota (`/login`).
- Conter um formulário para `username` e `password`.
- Ao submeter, chamar a rota `POST /api/login`.
- Em caso de sucesso, salvar o token JWT recebido no `localStorage`.
- Redirecionar o usuário para o Dashboard (`/dashboard`).

### 2.2. Proteção de Rotas no Frontend
- Modificar o roteador principal (`App.jsx`).
- Criar um componente "Rota Protegida" que verifica se existe um token no `localStorage`.
- Se não houver token, redirecionar o usuário para a página `/login`, não importa qual página ele tente acessar.

### 2.3. Gerenciamento de Token com Axios
- Configurar o `axios` (em `services/api.js`) para ler o token do `localStorage` e enviá-lo automaticamente no cabeçalho `Authorization: Bearer <token>` em todas as requisições.
- Adicionar lógica para lidar com erros de "Token Expirado" (401 Unauthorized), que deve limpar o `localStorage` e redirecionar para a página de login.

### 2.4. Página de Gerenciamento de Usuários
- Criar uma nova página/rota (`/users`).
- Acessível apenas para usuários com `role: 'admin'`.
- A página deve permitir ver, criar e excluir usuários, consumindo as novas rotas da API.

### 2.5. Funcionalidade de Logout
- Adicionar um botão "Sair" no layout.
- Ao clicar, o token é removido do `localStorage` e o usuário é redirecionado para a página de login.

---

## Etapa 3: Setup Inicial

### 3.1. Script para Criar o Primeiro Admin
- Criar um script de linha de comando (`scripts/create-admin.js`).
- Este script será executado uma única vez no servidor para criar o primeiro usuário administrador no banco de dados.
- Exemplo de uso: `node scripts/create-admin.js --username admin --password senhasecreta`
