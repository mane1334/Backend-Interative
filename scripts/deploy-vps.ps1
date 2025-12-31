# Script de Deploy para VPS
# Este script automatiza o deploy do sistema em um servidor VPS

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP,
    
    [Parameter(Mandatory=$false)]
    [string]$Username = "root",
    
    [Parameter(Mandatory=$false)]
    [string]$SSHKey = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Domain = ""
)

Write-Host "🚀 Iniciando deploy para VPS..." -ForegroundColor Green
Write-Host "📍 Servidor: $ServerIP" -ForegroundColor Yellow
Write-Host "👤 Usuário: $Username" -ForegroundColor Yellow

# Verificar se SSH está disponível
try {
    $sshTest = ssh -o ConnectTimeout=10 -o BatchMode=yes $Username@$ServerIP "echo 'SSH OK'" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro: Não foi possível conectar via SSH ao servidor" -ForegroundColor Red
        Write-Host "💡 Verifique:" -ForegroundColor Yellow
        Write-Host "   - IP do servidor está correto" -ForegroundColor White
        Write-Host "   - SSH está habilitado no servidor" -ForegroundColor White
        Write-Host "   - Chave SSH está configurada (se necessário)" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host "❌ Erro: SSH não está disponível ou configurado" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Conexão SSH estabelecida!" -ForegroundColor Green

# Criar script de deploy remoto
$deployScript = @"
#!/bin/bash
set -e

echo "🔧 Configurando servidor VPS..."

# Atualizar sistema
echo "📦 Atualizando sistema..."
apt update && apt upgrade -y

# Instalar dependências
echo "📦 Instalando dependências..."
apt install -y curl wget git nginx certbot python3-certbot-nginx

# Instalar Node.js 18
echo "📦 Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Instalar PostgreSQL
echo "📦 Instalando PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Configurar PostgreSQL
echo "🔧 Configurando PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE restaurantes;"
sudo -u postgres psql -c "CREATE USER restaurante_user WITH PASSWORD 'restaurante_pass';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE restaurantes TO restaurante_user;"

# Criar diretório da aplicação
echo "📁 Criando diretório da aplicação..."
mkdir -p /var/www/restaurantes
cd /var/www/restaurantes

# Clonar repositório (se necessário)
if [ ! -d ".git" ]; then
    echo "📥 Clonando repositório..."
    # Substitua pela URL do seu repositório
    # git clone https://github.com/seu-usuario/interactive-restaurantes.git .
fi

# Instalar dependências
echo "📦 Instalando dependências do projeto..."
npm install

# Configurar variáveis de ambiente
echo "🔧 Configurando variáveis de ambiente..."
cat > backend/.env << EOF
# Configurações do Backend - Produção
PORT=3000
NODE_ENV=production

# Configurações de CORS para produção
CORS_ORIGIN=http://$Domain,https://$Domain,http://$ServerIP,https://$ServerIP
PUBLIC_HOST=$Domain

# Configurações do Banco de Dados
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurantes
DB_USER=restaurante_user
DB_PASSWORD=restaurante_pass
DB_SSL=false

# Configurações de Segurança
JWT_SECRET=$(openssl rand -base64 32)

# Configurações de Moeda (Metical - MZN)
CURRENCY_SYMBOL=MT
CURRENCY_CODE=MZN
CURRENCY_LOCALE=pt-MZ

# Configurações de Timezone
TIMEZONE=Africa/Maputo
EOF

# Configurar frontends
cat > admin-panel/.env << EOF
VITE_API_URL=http://$Domain/api
VITE_WS_URL=ws://$Domain
NODE_ENV=production
EOF

cat > client-web/.env << EOF
VITE_API_URL=http://$Domain/api
VITE_WS_URL=ws://$Domain
NODE_ENV=production
EOF

# Build dos frontends
echo "🏗️ Fazendo build dos frontends..."
cd admin-panel && npm run build && cd ..
cd client-web && npm run build && cd ..

# Configurar Nginx
echo "🔧 Configurando Nginx..."
cat > /etc/nginx/sites-available/restaurantes << EOF
server {
    listen 80;
    server_name $Domain $ServerIP;

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Admin Panel
    location /admin {
        alias /var/www/restaurantes/admin-panel/dist;
        try_files \$uri \$uri/ /admin/index.html;
    }

    # Client Web
    location / {
        root /var/www/restaurantes/client-web/dist;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# Ativar site
ln -sf /etc/nginx/sites-available/restaurantes /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração do Nginx
nginx -t

# Recarregar Nginx
systemctl reload nginx

# Configurar PM2 para gerenciar o backend
echo "🔧 Configurando PM2..."
npm install -g pm2

# Criar arquivo de configuração do PM2
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'restaurantes-backend',
    script: 'backend/index.js',
    cwd: '/var/www/restaurantes',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# Iniciar aplicação com PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configurar firewall
echo "🔧 Configurando firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

echo "🎉 Deploy concluído com sucesso!"
echo ""
echo "📋 URLs de acesso:"
echo "   Frontend: http://$Domain"
echo "   Admin: http://$Domain/admin"
echo "   API: http://$Domain/api"
echo ""
echo "💡 Próximos passos:"
echo "   1. Configure SSL com: certbot --nginx -d $Domain"
echo "   2. Acesse o admin panel para configurar o banco de dados"
echo "   3. Configure o cardápio e anúncios"
EOF

# Enviar e executar script no servidor
Write-Host "📤 Enviando script de deploy..." -ForegroundColor Blue
$deployScript | ssh $Username@$ServerIP "cat > /tmp/deploy.sh && chmod +x /tmp/deploy.sh"

Write-Host "🚀 Executando deploy no servidor..." -ForegroundColor Blue
ssh $Username@$ServerIP "bash /tmp/deploy.sh"

Write-Host ""
Write-Host "🎉 Deploy concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 URLs de acesso:" -ForegroundColor Cyan
Write-Host "   Frontend: http://$ServerIP" -ForegroundColor White
Write-Host "   Admin: http://$ServerIP/admin" -ForegroundColor White
Write-Host "   API: http://$ServerIP/api" -ForegroundColor White

if ($Domain) {
    Write-Host ""
    Write-Host "🌐 Com domínio:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://$Domain" -ForegroundColor White
    Write-Host "   Admin: http://$Domain/admin" -ForegroundColor White
    Write-Host "   API: http://$Domain/api" -ForegroundColor White
}

Write-Host ""
Write-Host "💡 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Acesse http://$ServerIP/admin" -ForegroundColor White
Write-Host "   2. Vá em 'Banco de Dados' para configurar" -ForegroundColor White
Write-Host "   3. Configure o cardápio e anúncios" -ForegroundColor White
if ($Domain) {
    Write-Host "   4. Configure SSL: ssh $Username@$ServerIP 'certbot --nginx -d $Domain'" -ForegroundColor White
}
