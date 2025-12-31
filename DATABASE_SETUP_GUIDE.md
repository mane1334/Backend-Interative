# 🗄️ Guia de Configuração do Banco de Dados

## Problema Atual
```
error: password authentication failed for user "postgres"
```

Este erro indica que o banco de dados PostgreSQL não está configurado corretamente.

## ✅ Soluções

### Opção 1: Script Automático (Recomendado)
```powershell
# Execute na raiz do projeto
.\scripts\setup-database.ps1
```

### Opção 2: Configuração Manual

#### 1. Verificar se PostgreSQL está instalado
```powershell
psql --version
```

Se não estiver instalado, baixe em: https://www.postgresql.org/download/windows/

#### 2. Criar arquivo .env no backend
Crie o arquivo `backend/.env` com o seguinte conteúdo:

```env
# Configurações do Backend - Desenvolvimento
PORT=3000
NODE_ENV=development

# Configurações de CORS para desenvolvimento
CORS_ORIGIN=
PUBLIC_HOST=

# Configurações do Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurantes
DB_USER=postgres
DB_PASSWORD=SUA_SENHA_AQUI

# Configurações da OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Configurações de Segurança
JWT_SECRET=your_jwt_secret_here

# Configurações de Moeda (Metical - MZN)
CURRENCY_SYMBOL=MT
CURRENCY_CODE=MZN
CURRENCY_LOCALE=pt-MZ

# Configurações de Timezone
TIMEZONE=Africa/Maputo
```

#### 3. Configurar o banco de dados
```powershell
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco de dados
CREATE DATABASE restaurantes;

# Sair
\q
```

#### 4. Executar schema (se existir)
```powershell
psql -U postgres -d restaurantes -f database/schema.sql
```

## 🔧 Configurações Comuns do PostgreSQL

### Senha Padrão Comum
- **postgres** (mais comum)
- **admin**
- **password**
- **123456**

### Verificar Serviço PostgreSQL
```powershell
# Verificar se o serviço está rodando
Get-Service postgresql*

# Iniciar serviço se necessário
Start-Service postgresql-x64-14
```

### Resetar Senha do PostgreSQL
Se você esqueceu a senha:

1. **Parar o serviço PostgreSQL**
2. **Editar arquivo pg_hba.conf** (geralmente em `C:\Program Files\PostgreSQL\14\data\`)
3. **Alterar linha**:
   ```
   # TYPE  DATABASE        USER            ADDRESS                 METHOD
   local   all             postgres                                trust
   ```
4. **Reiniciar serviço PostgreSQL**
5. **Conectar sem senha**:
   ```powershell
   psql -U postgres
   ```
6. **Alterar senha**:
   ```sql
   ALTER USER postgres PASSWORD 'nova_senha';
   ```
7. **Restaurar pg_hba.conf** para `md5` ou `scram-sha-256`

## 🧪 Teste de Conexão

### Teste Manual
```powershell
# Testar conexão
psql -h localhost -U postgres -d restaurantes -c "SELECT version();"
```

### Teste via API
Após configurar, teste:
```
http://localhost:3000/api/health
```

## 🚨 Troubleshooting

### Erro: "psql não é reconhecido"
- Adicione PostgreSQL ao PATH do sistema
- Ou use o caminho completo: `"C:\Program Files\PostgreSQL\14\bin\psql.exe"`

### Erro: "Connection refused"
- Verifique se o serviço PostgreSQL está rodando
- Verifique se a porta 5432 está livre

### Erro: "Database does not exist"
- Crie o banco: `CREATE DATABASE restaurantes;`

### Erro: "Permission denied"
- Verifique se o usuário tem permissões
- Ou use um usuário com privilégios de superusuário

## 📋 Checklist Final

- [ ] PostgreSQL instalado e rodando
- [ ] Arquivo `backend/.env` criado com credenciais corretas
- [ ] Banco de dados `restaurantes` criado
- [ ] Schema executado (se existir)
- [ ] Backend reiniciado
- [ ] Teste de conexão bem-sucedido

## 🎯 Próximos Passos

1. Configure o banco de dados
2. Reinicie o backend: `cd backend && npm start`
3. Teste a API: `http://localhost:3000/api/health`
4. Acesse de outro dispositivo: `http://SEU_IP:3001` ou `http://SEU_IP:3002`
