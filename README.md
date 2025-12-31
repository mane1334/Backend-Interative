# 🍽️ Interactive Restaurantes

Sistema completo de restaurantes interativos com módulos de anúncios, IA e gestão administrativa.

## 🚀 Módulos do Sistema

### 📊 Admin Panel
- Dashboard com estatísticas em tempo real
- Gestão de pratos e menus
- Gestão de pedidos com WebSocket
- Sistema de notificações

### 📢 Ads Module (Novo!)
- **Gestão completa de anúncios e promoções**
- Upload e gestão de imagens
- Sistema de prioridades e datas de validade
- API RESTful para integração com frontends
- Suporte a múltiplos restaurantes

### 🤖 AI Module
- Processamento de linguagem natural
- Análise de pedidos e feedback
- Recomendações inteligentes

### 🔧 Backend
- API REST principal
- Integração com banco de dados PostgreSQL
- WebSocket para atualizações em tempo real

### 📱 Client Apps
- Aplicação web para clientes
- Aplicação mobile React Native

## 🛠️ Tecnologias

- **Backend**: Node.js, Express, PostgreSQL
- **Frontend**: React, Tailwind CSS
- **Mobile**: React Native
- **Real-time**: WebSocket
- **Upload**: Multer
- **IA**: OpenAI API

## 📦 Instalação Rápida

### 1. Instalar todas as dependências
```bash
npm run install:all
```

### 2. Configurar variáveis de ambiente
```bash
# Backend
cp backend/env.example backend/.env

# Ads Module
cp ads-module/env.example ads-module/.env

# AI Module
cp ai-module/env.example ai-module/.env
```

### 3. Iniciar todos os serviços
```bash
# Desenvolvimento (recomendado)
npm run dev

# Produção
npm start
```

## 🔌 Portas dos Serviços

| Serviço | Porta | URL |
|---------|-------|-----|
| Backend | 3000 | http://localhost:3000 |
| Admin Panel | 3001 | http://localhost:3001 |
| Ads Module | 3003 | http://localhost:3003 |
| Client Web | 3000 | http://localhost:3000 |

## 📢 Ads Module - Funcionalidades

### ✨ Características Principais
- **CRUD completo** de anúncios
- **Upload de imagens** com validação
- **Sistema de prioridades** (1-5)
- **Datas de validade** para promoções
- **Status ativo/inativo** para controle
- **Organização por restaurante**

### 🔌 API Endpoints
```
GET    /api/ads                    # Listar anúncios
GET    /api/ads/:id               # Buscar por ID
POST   /api/ads                   # Criar anúncio
PUT    /api/ads/:id               # Atualizar anúncio
DELETE /api/ads/:id               # Deletar anúncio
GET    /api/ads/restaurant/:id    # Anúncios por restaurante
GET    /health                    # Status do serviço
```

### 📊 Estrutura de Dados
```json
{
  "id": "uuid",
  "title": "Promoção Especial",
  "description": "20% de desconto",
  "imageUrl": "/uploads/imagem.jpg",
  "startDate": "2024-01-15",
  "endDate": "2024-01-20",
  "isActive": true,
  "priority": 3,
  "restaurantId": "rest1"
}
```

## 🧪 Testes

### Testar Ads Module
```bash
cd ads-module
npm test
```

### Testar todos os módulos
```bash
npm test
```

## 📁 Estrutura do Projeto

```
interactive-restaurantes/
├── admin-panel/          # Painel administrativo React
├── ads-module/           # 🆕 Módulo de anúncios
├── ai-module/            # Módulo de inteligência artificial
├── backend/              # API principal
├── client-app/           # App mobile React Native
├── client-web/           # App web para clientes
├── database/             # Schema do banco de dados
└── docs/                 # Documentação
```

## 🔧 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia todos os serviços em modo desenvolvimento |
| `npm start` | Inicia todos os serviços em modo produção |
| `npm run install:all` | Instala dependências de todos os módulos |
| `npm test` | Executa testes de todos os módulos |
| `npm run build` | Constrói o admin panel para produção |

## 🌟 Funcionalidades em Destaque

### 📢 Sistema de Anúncios
- **Gestão visual** de promoções
- **Upload de imagens** otimizado
- **Sistema de prioridades** inteligente
- **Datas de validade** automáticas
- **API RESTful** para integração

### 📊 Dashboard em Tempo Real
- **Estatísticas** atualizadas instantaneamente
- **WebSocket** para notificações
- **Métricas** de vendas e pedidos

### 🤖 IA Integrada
- **Processamento** de linguagem natural
- **Recomendações** inteligentes
- **Análise** de feedback dos clientes

## 🚨 Solução de Problemas

### Ads Module não inicia
```bash
cd ads-module
npm install
npm start
```

### Porta já em uso
```bash
# Verificar processos na porta
netstat -ano | findstr :3003

# Matar processo (Windows)
taskkill /PID <PID> /F
```

### Dependências não encontradas
```bash
npm run install:all
```

## 🔮 Roadmap

- [x] **Ads Module** - Sistema completo de anúncios
- [x] **Admin Panel** - Gestão administrativa
- [x] **AI Module** - Inteligência artificial
- [ ] **Analytics** - Relatórios avançados
- [ ] **Mobile App** - Aplicação nativa
- [ ] **Multi-tenant** - Suporte a múltiplos restaurantes
- [ ] **Payment Gateway** - Integração de pagamentos

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação específica de cada módulo
2. Execute os testes para identificar problemas
3. Abra uma issue no repositório

---

**Versão**: 2.0.0  
**Última atualização**: Janeiro 2025  
**Status**: Ads Module implementado e funcional! 🎉

