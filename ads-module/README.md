# 📢 Ads Module - Módulo de Anúncios

Módulo completo para gerenciamento de anúncios e promoções de restaurantes.

## 🚀 Funcionalidades

- **CRUD de Anúncios**: Criar, ler, atualizar e deletar anúncios
- **Upload de Imagens**: Suporte para imagens de promoções
- **Gestão por Restaurante**: Anúncios organizados por restaurante
- **Sistema de Prioridades**: Anúncios com diferentes níveis de prioridade
- **Datas de Validade**: Controle de início e fim das promoções
- **Status Ativo/Inativo**: Controle de visibilidade dos anúncios

## 🛠️ Tecnologias

- **Backend**: Node.js + Express
- **Upload**: Multer para gestão de arquivos
- **Identificação**: UUID para IDs únicos
- **CORS**: Suporte para múltiplos frontends

## 📦 Instalação

1. **Instalar dependências**:
```bash
cd ads-module
npm install
```

2. **Configurar variáveis de ambiente**:
```bash
cp env.example .env
# Editar .env com suas configurações
```

3. **Executar o módulo**:
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 🔌 API Endpoints

### Anúncios

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/ads` | Listar todos os anúncios |
| GET | `/api/ads/:id` | Buscar anúncio por ID |
| POST | `/api/ads` | Criar novo anúncio |
| PUT | `/api/ads/:id` | Atualizar anúncio |
| DELETE | `/api/ads/:id` | Deletar anúncio |

### Anúncios por Restaurante

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/ads/restaurant/:restaurantId` | Anúncios de um restaurante específico |

### Utilitários

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Status do serviço |
| GET | `/uploads/:filename` | Acesso às imagens |

## 📊 Estrutura de Dados

### Anúncio (Ad)

```json
{
  "id": "uuid",
  "title": "Título da Promoção",
  "description": "Descrição detalhada",
  "imageUrl": "/uploads/imagem.jpg",
  "startDate": "2024-01-15",
  "endDate": "2024-01-20",
  "isActive": true,
  "priority": 1,
  "restaurantId": "rest1",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

## 🔍 Parâmetros de Query

### Listar Anúncios
- `restaurantId`: Filtrar por restaurante
- `isActive`: Filtrar por status ativo
- `limit`: Limite de resultados (padrão: 10)
- `offset`: Deslocamento para paginação (padrão: 0)

### Anúncios por Restaurante
- `isActive`: Filtrar por status ativo

## 📁 Upload de Imagens

- **Formatos suportados**: JPG, PNG, GIF, WebP
- **Tamanho máximo**: 5MB
- **Localização**: `/uploads/` (criado automaticamente)
- **Nomenclatura**: UUID + timestamp + extensão original

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Porta do serviço
ADS_PORT=3003

# Configurações de upload
MAX_FILE_SIZE=5242880  # 5MB em bytes
UPLOAD_PATH=./uploads

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

## 🧪 Testes

```bash
npm test
```

## 📈 Monitoramento

### Health Check
```bash
curl http://localhost:3003/health
```

Resposta esperada:
```json
{
  "success": true,
  "message": "Ads Module está funcionando",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "version": "1.0.0"
}
```

## 🔗 Integração com Frontend

### Exemplo de uso no React

```javascript
// Buscar anúncios de um restaurante
const fetchAds = async (restaurantId) => {
  try {
    const response = await fetch(`http://localhost:3003/api/ads/restaurant/${restaurantId}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    }
  } catch (error) {
    console.error('Erro ao buscar anúncios:', error);
  }
};

// Criar novo anúncio
const createAd = async (adData) => {
  try {
    const formData = new FormData();
    formData.append('title', adData.title);
    formData.append('description', adData.description);
    formData.append('restaurantId', adData.restaurantId);
    
    if (adData.image) {
      formData.append('image', adData.image);
    }
    
    const response = await fetch('http://localhost:3003/api/ads', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao criar anúncio:', error);
  }
};
```

## 🚨 Tratamento de Erros

O módulo retorna respostas padronizadas:

```json
{
  "success": false,
  "message": "Descrição do erro",
  "error": "Detalhes técnicos (em desenvolvimento)"
}
```

## 🔮 Roadmap

- [ ] Integração com PostgreSQL
- [ ] Sistema de cache Redis
- [ ] Analytics de visualizações
- [ ] Sistema de notificações push
- [ ] API de relatórios
- [ ] Suporte a vídeos
- [ ] Sistema de templates de anúncios

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no repositório do projeto.

---

**Versão**: 1.0.0  
**Última atualização**: Janeiro 2024
