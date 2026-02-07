const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.ADS_PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'), false);
    }
  }
});

// Simulação de banco de dados (em produção, usar PostgreSQL)
let ads = [
  {
    id: '1',
    title: 'Promoção de Segunda-feira',
    description: '20% de desconto em todos os pratos principais',
    imageUrl: '/uploads/promo-segunda.jpg',
    startDate: '2024-01-15',
    endDate: '2024-01-20',
    isActive: true,
    priority: 1,
    restaurantId: 'rest1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];


// Middleware para servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Ads Module está funcionando',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Ads Module rodando na porta ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API: http://localhost:${PORT}/api/ads`);
});

module.exports = app;
