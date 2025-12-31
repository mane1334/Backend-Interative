# 🚀 Guia de Deploy para VPS

## 🎯 Solução Completa para VPS

Criei uma solução **muito mais robusta** para deploy em VPS com:

### ✅ **Recursos Implementados:**

1. **🔧 Interface de Configuração de Banco no Admin Panel**
   - Configuração visual e intuitiva
   - Teste de conexão em tempo real
   - Suporte a PostgreSQL, MySQL e SQLite
   - Configuração rápida com um clique

2. **🔄 Sistema de Fallback Automático**
   - Se PostgreSQL falhar, usa SQLite automaticamente
   - Sem interrupção do serviço
   - Migração transparente entre bancos

3. **🌐 CORS Otimizado para VPS**
   - Detecção automática de IP/domínio
   - Configuração dinâmica de origens permitidas
   - Suporte a HTTPS e domínios personalizados

4. **🚀 Script de Deploy Automatizado**
   - Instalação completa em um comando
   - Configuração de Nginx, SSL, PM2
   - Setup de banco de dados automático

## 🚀 **Deploy Rápido (1 Comando)**

```powershell
.\scripts\deploy-vps.ps1 -ServerIP "SEU_IP_VPS" -Domain "seu-dominio.com"
```

### **Exemplo:**
```powershell
.\scripts\deploy-vps.ps1 -ServerIP "192.168.1.100" -Domain "restaurante.exemplo.com"
```

## 📋 **Deploy Manual (Passo a Passo)**

### **1. Preparar VPS**
```bash
# Conectar ao VPS
ssh root@SEU_IP_VPS

# Atualizar sistema
apt update && apt upgrade -y

# Instalar dependências
apt install -y curl wget git nginx certbot python3-certbot-nginx
```

### **2. Instalar Node.js e PostgreSQL**
```bash
# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# PostgreSQL
apt install -y postgresql postgresql-contrib

# Configurar PostgreSQL
sudo -u postgres psql -c "CREATE DATABASE restaurantes;"
sudo -u postgres psql -c "CREATE USER restaurante_user WITH PASSWORD 'restaurante_pass';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE restaurantes TO restaurante_user;"
```

### **3. Deploy da Aplicação**
```bash
# Criar diretório
mkdir -p /var/www/restaurantes
cd /var/www/restaurantes

# Clonar projeto (ou upload)
git clone https://github.com/seu-usuario/interactive-restaurantes.git .

# Instalar dependências
npm install

# Build dos frontends
cd admin-panel && npm run build && cd ..
cd client-web && npm run build && cd ..
```

### **4. Configurar Variáveis de Ambiente**

**Backend** (`backend/.env`):
```env
NODE_ENV=production
PORT=3000
CORS_ORIGIN=http://SEU_DOMINIO,https://SEU_DOMINIO,http://SEU_IP,https://SEU_IP
PUBLIC_HOST=SEU_DOMINIO
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurantes
DB_USER=restaurante_user
DB_PASSWORD=restaurante_pass
```

**Admin Panel** (`admin-panel/.env`):
```env
VITE_API_URL=http://SEU_DOMINIO/api
VITE_WS_URL=ws://SEU_DOMINIO
NODE_ENV=production
```

**Client Web** (`client-web/.env`):
```env
VITE_API_URL=http://SEU_DOMINIO/api
VITE_WS_URL=ws://SEU_DOMINIO
NODE_ENV=production
```

### **5. Configurar Nginx**
```bash
# Criar configuração
cat > /etc/nginx/sites-available/restaurantes << 'EOF'
server {
    listen 80;
    server_name SEU_DOMINIO SEU_IP;

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin Panel
    location /admin {
        alias /var/www/restaurantes/admin-panel/dist;
        try_files $uri $uri/ /admin/index.html;
    }

    # Client Web
    location / {
        root /var/www/restaurantes/client-web/dist;
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Ativar site
ln -sf /etc/nginx/sites-available/restaurantes /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

### **6. Configurar PM2**
```bash
# Instalar PM2
npm install -g pm2

# Criar configuração
cat > ecosystem.config.js << 'EOF'
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

# Iniciar aplicação
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### **7. Configurar SSL (Opcional)**
```bash
# Certificado SSL gratuito
certbot --nginx -d SEU_DOMINIO
```

## 🔧 **Configuração do Banco via Admin Panel**

### **Acesso:**
1. Acesse: `http://SEU_IP/admin` ou `http://SEU_DOMINIO/admin`
2. Vá em **"Banco de Dados"** no menu lateral
3. Configure o banco de dados visualmente

### **Opções Disponíveis:**

#### **🚀 Configuração Rápida**
- Clique em "Configuração Rápida"
- Usa PostgreSQL local com configurações padrão
- Ideal para desenvolvimento/teste

#### **⚙️ Configuração Manual**
- **PostgreSQL**: Para produção
- **SQLite**: Para desenvolvimento simples
- **MySQL**: Alternativa ao PostgreSQL

#### **🔄 Fallback Automático**
- Se PostgreSQL falhar, usa SQLite automaticamente
- Sem interrupção do serviço
- Migração transparente

## 📊 **Monitoramento e Logs**

### **PM2 Commands:**
```bash
# Ver status
pm2 status

# Ver logs
pm2 logs restaurantes-backend

# Reiniciar
pm2 restart restaurantes-backend

# Parar
pm2 stop restaurantes-backend
```

### **Nginx Logs:**
```bash
# Logs de acesso
tail -f /var/log/nginx/access.log

# Logs de erro
tail -f /var/log/nginx/error.log
```

## 🔒 **Segurança**

### **Firewall:**
```bash
# Configurar UFW
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

### **SSL/TLS:**
```bash
# Renovar certificado automaticamente
crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🚨 **Troubleshooting**

### **Problema: CORS Error**
- Verifique se `CORS_ORIGIN` inclui seu domínio/IP
- Confirme que `PUBLIC_HOST` está correto

### **Problema: Banco não conecta**
- Use a interface de configuração no admin panel
- Teste a conexão antes de salvar
- Use SQLite como fallback se necessário

### **Problema: Frontend não carrega**
- Verifique se o build foi feito corretamente
- Confirme as configurações do Nginx
- Verifique os logs do Nginx

### **Problema: WebSocket não funciona**
- Confirme que a rota `/ws` está configurada no Nginx
- Verifique se o backend está rodando na porta 3000

## 📱 **URLs de Acesso**

Após o deploy:
- **Frontend**: `http://SEU_IP` ou `http://SEU_DOMINIO`
- **Admin Panel**: `http://SEU_IP/admin` ou `http://SEU_DOMINIO/admin`
- **API**: `http://SEU_IP/api` ou `http://SEU_DOMINIO/api`

## 🎉 **Vantagens da Nova Solução**

1. **✅ Zero Configuração Manual**: Interface visual para tudo
2. **✅ Fallback Automático**: SQLite se PostgreSQL falhar
3. **✅ Deploy em 1 Comando**: Script automatizado completo
4. **✅ CORS Inteligente**: Detecção automática de IP/domínio
5. **✅ Produção Ready**: Nginx, SSL, PM2, Firewall
6. **✅ Monitoramento**: Logs e status em tempo real

Agora o sistema está **muito mais robusto** e **fácil de usar** em VPS! 🚀
