# Script para configurar ambiente de desenvolvimento
# Este script ajuda a configurar as variáveis de ambiente para desenvolvimento

Write-Host "🔧 Configurando ambiente de desenvolvimento..." -ForegroundColor Green

# Obter o IP da máquina
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" } | Select-Object -First 1).IPAddress

if (-not $ipAddress) {
    $ipAddress = "localhost"
}

Write-Host "📍 IP detectado: $ipAddress" -ForegroundColor Yellow

# Criar arquivo .env para o backend se não existir
$backendEnvPath = "backend\.env"
if (-not (Test-Path $backendEnvPath)) {
    Write-Host "📝 Criando arquivo .env para o backend..." -ForegroundColor Blue
    
    $backendEnvContent = @"
# Configurações do Backend - Desenvolvimento
PORT=3000
NODE_ENV=development

# Configurações de CORS para desenvolvimento
CORS_ORIGIN=
PUBLIC_HOST=$ipAddress

# Configurações do Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_db
DB_USER=postgres
DB_PASSWORD=your_password_here

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
} else {
    Write-Host "⚠️  Arquivo .env do backend já existe" -ForegroundColor Yellow
}

# Criar arquivo .env para o admin-panel se não existir
$adminEnvPath = "admin-panel\.env"
if (-not (Test-Path $adminEnvPath)) {
    Write-Host "📝 Criando arquivo .env para o admin-panel..." -ForegroundColor Blue
    
    $adminEnvContent = @"
# Configurações do Admin Panel - Desenvolvimento
VITE_API_URL=http://$ipAddress`:3000/api
VITE_WS_URL=ws://$ipAddress`:3000

# Ambiente
NODE_ENV=development

# Configurações de moeda (Metical - MZN)
REACT_APP_CURRENCY_SYMBOL=MT
REACT_APP_CURRENCY_CODE=MZN
REACT_APP_CURRENCY_LOCALE=pt-MZ

# Configurações de timezone
REACT_APP_TIMEZONE=Africa/Maputo

# Configurações de atualização automática (em segundos)
REACT_APP_AUTO_REFRESH_INTERVAL=30

# Configurações de notificações
REACT_APP_ENABLE_NOTIFICATIONS=true
REACT_APP_NOTIFICATION_SOUND=true

# Configurações de debug
REACT_APP_DEBUG_MODE=true
REACT_APP_LOG_LEVEL=info
"@
    
    $adminEnvContent | Out-File -FilePath $adminEnvPath -Encoding UTF8
    Write-Host "✅ Arquivo .env do admin-panel criado!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Arquivo .env do admin-panel já existe" -ForegroundColor Yellow
}

# Criar arquivo .env para o client-web se não existir
$clientEnvPath = "client-web\.env"
if (-not (Test-Path $clientEnvPath)) {
    Write-Host "📝 Criando arquivo .env para o client-web..." -ForegroundColor Blue
    
    $clientEnvContent = @"
# Configurações do Client Web - Desenvolvimento
VITE_API_URL=http://$ipAddress`:3000/api
VITE_WS_URL=ws://$ipAddress`:3000

# Ambiente
NODE_ENV=development

# Configurações de moeda (Metical - MZN)
REACT_APP_CURRENCY_SYMBOL=MT
REACT_APP_CURRENCY_CODE=MZN
REACT_APP_CURRENCY_LOCALE=pt-MZ

# Configurações de timezone
REACT_APP_TIMEZONE=Africa/Maputo

# Configurações de debug
REACT_APP_DEBUG_MODE=true
REACT_APP_LOG_LEVEL=info
"@
    
    $clientEnvContent | Out-File -FilePath $clientEnvPath -Encoding UTF8
    Write-Host "✅ Arquivo .env do client-web criado!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Arquivo .env do client-web já existe" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Configuração concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 URLs para acesso de outros dispositivos:" -ForegroundColor Cyan
Write-Host "   Backend API: http://$ipAddress`:3000" -ForegroundColor White
Write-Host "   Admin Panel: http://$ipAddress`:3001" -ForegroundColor White
Write-Host "   Client Web:  http://$ipAddress`:3002" -ForegroundColor White
Write-Host ""
Write-Host "💡 Dica: Certifique-se de que o firewall permite conexões nessas portas!" -ForegroundColor Yellow
