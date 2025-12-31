# Script para configurar o banco de dados PostgreSQL
# Este script ajuda a configurar o banco de dados e criar o arquivo .env

Write-Host "🗄️ Configurando banco de dados PostgreSQL..." -ForegroundColor Green

# Verificar se o PostgreSQL está instalado
try {
    $pgVersion = psql --version 2>$null
    if ($pgVersion) {
        Write-Host "✅ PostgreSQL encontrado: $pgVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ PostgreSQL não encontrado. Instale o PostgreSQL primeiro." -ForegroundColor Red
        Write-Host "📥 Download: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ PostgreSQL não encontrado. Instale o PostgreSQL primeiro." -ForegroundColor Red
    Write-Host "📥 Download: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

# Solicitar informações do banco
Write-Host ""
Write-Host "📝 Configuração do banco de dados:" -ForegroundColor Cyan

$dbHost = Read-Host "Host do banco (padrão: localhost)"
if ([string]::IsNullOrEmpty($dbHost)) { $dbHost = "localhost" }

$dbPort = Read-Host "Porta do banco (padrão: 5432)"
if ([string]::IsNullOrEmpty($dbPort)) { $dbPort = "5432" }

$dbName = Read-Host "Nome do banco (padrão: restaurantes)"
if ([string]::IsNullOrEmpty($dbName)) { $dbName = "restaurantes" }

$dbUser = Read-Host "Usuário do banco (padrão: postgres)"
if ([string]::IsNullOrEmpty($dbUser)) { $dbUser = "postgres" }

$dbPassword = Read-Host "Senha do banco" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

Write-Host ""
Write-Host "🔧 Testando conexão com o banco..." -ForegroundColor Yellow

# Testar conexão
$env:PGPASSWORD = $dbPasswordPlain
try {
    $testResult = psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c "SELECT version();" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Conexão com o banco bem-sucedida!" -ForegroundColor Green
    } else {
        Write-Host "❌ Falha na conexão com o banco. Verifique as credenciais." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erro ao testar conexão: $_" -ForegroundColor Red
    exit 1
}

# Criar banco de dados se não existir
Write-Host "📦 Verificando se o banco '$dbName' existe..." -ForegroundColor Yellow
$dbExists = psql -h $dbHost -p $dbPort -U $dbUser -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname = '$dbName';" 2>$null
if ($dbExists -match "1") {
    Write-Host "✅ Banco '$dbName' já existe!" -ForegroundColor Green
} else {
    Write-Host "📦 Criando banco '$dbName'..." -ForegroundColor Yellow
    $createResult = psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c "CREATE DATABASE $dbName;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Banco '$dbName' criado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao criar banco: $createResult" -ForegroundColor Red
        exit 1
    }
}

# Criar arquivo .env para o backend
$backendEnvPath = "backend\.env"
Write-Host "📝 Criando arquivo .env para o backend..." -ForegroundColor Blue

$backendEnvContent = @"
# Configurações do Backend - Desenvolvimento
PORT=3000
NODE_ENV=development

# Configurações de CORS para desenvolvimento
CORS_ORIGIN=
PUBLIC_HOST=

# Configurações do Banco de Dados
DB_HOST=$dbHost
DB_PORT=$dbPort
DB_NAME=$dbName
DB_USER=$dbUser
DB_PASSWORD=$dbPasswordPlain

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
"@

$backendEnvContent | Out-File -FilePath $backendEnvPath -Encoding UTF8
Write-Host "✅ Arquivo .env do backend criado!" -ForegroundColor Green

# Executar schema SQL se existir
$schemaPath = "database\schema.sql"
if (Test-Path $schemaPath) {
    Write-Host "📋 Executando schema do banco de dados..." -ForegroundColor Yellow
    $schemaResult = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $schemaPath 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Schema executado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Aviso: Erro ao executar schema: $schemaResult" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Arquivo schema.sql não encontrado em database/" -ForegroundColor Yellow
}

# Limpar variável de ambiente
Remove-Item Env:PGPASSWORD

Write-Host ""
Write-Host "🎉 Configuração do banco de dados concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Reinicie o backend: cd backend && npm start" -ForegroundColor White
Write-Host "   2. Teste a conexão acessando: http://localhost:3000/api/health" -ForegroundColor White
Write-Host ""
Write-Host "💡 Dica: Se ainda houver problemas, verifique se o serviço PostgreSQL está rodando!" -ForegroundColor Yellow
