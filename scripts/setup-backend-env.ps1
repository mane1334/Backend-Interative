# Script para configurar o ambiente do backend
Write-Host "Configurando ambiente do backend..." -ForegroundColor Green

$backendEnvPath = "backend\.env"

# Verificar se já existe
if (Test-Path $backendEnvPath) {
    Write-Host "Arquivo .env já existe. Fazendo backup..." -ForegroundColor Yellow
    Copy-Item $backendEnvPath "$backendEnvPath.backup"
}

# Criar arquivo .env
$envContent = @"
# Configurações do Backend - Desenvolvimento
PORT=3000
NODE_ENV=development

# Configurações de CORS para desenvolvimento
CORS_ORIGIN=
PUBLIC_HOST=

# Configurações do Banco de Dados
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=interactive_restaurant
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false

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

$envContent | Out-File -FilePath $backendEnvPath -Encoding UTF8
Write-Host "Arquivo .env criado com sucesso!" -ForegroundColor Green

Write-Host ""
Write-Host "Configurações aplicadas:" -ForegroundColor Cyan
Write-Host "   Banco: interactive_restaurant" -ForegroundColor White
Write-Host "   Usuario: postgres" -ForegroundColor White
Write-Host "   Senha: postgres" -ForegroundColor White
Write-Host "   Porta: 5432" -ForegroundColor White

Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "   1. Reinicie o backend: cd backend && npm start" -ForegroundColor White
Write-Host "   2. Acesse o admin panel: http://localhost:3001/admin" -ForegroundColor White
Write-Host "   3. Va em 'Banco de Dados' para testar a conexao" -ForegroundColor White
