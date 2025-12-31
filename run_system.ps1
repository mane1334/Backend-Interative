# run_system.ps1

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   Iniciando Sistema Interactive Restaurant" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Verificar se Node.js e npm estão instalados
Write-Host "`n[1/4] Verificando ambiente..." -ForegroundColor Yellow
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js não encontrado. Por favor, instale o Node.js."
    exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm não encontrado. Por favor, instale o npm."
    exit 1
}
Write-Host "Node.js e npm detectados." -ForegroundColor Green

# Função auxiliar para instalar dependências
function Install-Deps {
    param (
        [string]$Path,
        [string]$Name
    )
    if (Test-Path "$Path\package.json") {
        Write-Host "Verificando dependências para $Name..." -ForegroundColor Check
        if (-not (Test-Path "$Path\node_modules")) {
            Write-Host "Instalando dependências em $Name..." -ForegroundColor Magenta
            Push-Location $Path
            try {
                npm install
                if ($LASTEXITCODE -ne 0) { throw "Falha no npm install" }
                Write-Host "Dependências instaladas com sucesso." -ForegroundColor Green
            }
            catch {
                Write-Error "Erro ao instalar dependências em $Name"
                Pop-Location
                exit 1
            }
            Pop-Location
        }
        else {
            Write-Host "Dependências já instaladas para $Name." -ForegroundColor Green
        }
    }
    else {
        Write-Warning "package.json não encontrado em $Path"
    }
}

# 2. Instalar dependências
Write-Host "`n[2/4] Verificando dependências dos módulos..." -ForegroundColor Yellow

$ScriptDir = $PSScriptRoot

# AI Module
Install-Deps -Path "$ScriptDir\ai-module" -Name "AI Module"

# Backend
Install-Deps -Path "$ScriptDir\backend" -Name "Backend"

# Client App
Install-Deps -Path "$ScriptDir\client-app\ClientApp" -Name "Client App"

# --- NOVO: Detectar IP e configurar .env do Client App ---
Write-Host "`n[2.5/4] Configurando IP de Rede..." -ForegroundColor Yellow

$AllIps = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254*" }
$LanIp = ($AllIps | Select-Object -First 1).IPAddress

if ($AllIps) {
    Write-Host "Endereços IP de Rede Encontrados:" -ForegroundColor Cyan
    foreach ($ip in $AllIps) {
        Write-Host "   - $($ip.IPAddress) ($($ip.InterfaceAlias))" -ForegroundColor White
    }

    if ($LanIp) {
        Write-Host "`nSelecionado automaticamente para o ClientApp: $LanIp" -ForegroundColor Green
        
        $ClientEnvPath = "$ScriptDir\client-app\ClientApp\.env"
        $EnvContent = "HOST=$LanIp"
        
        try {
            $EnvContent | Out-File -FilePath $ClientEnvPath -Encoding UTF8 -Force
            Write-Host "Arquivo .env atualizado em: $ClientEnvPath" -ForegroundColor Green
        }
        catch {
            Write-Error "Falha ao escrever no arquivo .env do ClientApp."
        }
    }
}
else {
    Write-Warning "Não foi possível detectar um IP de rede local. O aplicativo usará 'localhost' ou '10.0.2.2'."
}
# -----------------------------------------------------

# 3. Iniciar Backend
Write-Host "`n[3/4] Iniciando Backend..." -ForegroundColor Yellow
$BackendPath = "$ScriptDir\backend"
# Passando o host 0.0.0.0 via env var pode ajudar, mas o index.js precisa suportar. 
# De qualquer forma, o express geralmente ouve em 0.0.0.0 se porta for apenas numero.
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {cd '$BackendPath'; npm run dev}" -WindowStyle Normal
Write-Host "Backend iniciado em nova janela." -ForegroundColor Green

# 4. Iniciar Client App (Metro Bundler)
Write-Host "`n[4/4] Iniciando Client App Server (Metro)..." -ForegroundColor Yellow
$ClientAppPath = "$ScriptDir\client-app\ClientApp"
# Limpar cache do metro as vezes é bom quando muda .env, mas vamos rodar normal primeiro.
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {cd '$ClientAppPath'; npm start}" -WindowStyle Normal
Write-Host "Client App Server iniciado em nova janela." -ForegroundColor Green

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "   Sistema iniciado com sucesso!" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Pressione qualquer tecla para sair deste script launcher..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
