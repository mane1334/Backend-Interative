const { Pool } = require('pg');
require('dotenv').config();

// Configuração do banco de dados
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'restaurant_ads',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Testar conexão
pool.on('connect', () => {
  console.log('📊 Conectado ao banco de dados PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro no pool de conexões:', err);
});

// Função para executar queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`🔍 Query executada em ${duration}ms`);
    return res;
  } catch (error) {
    console.error('❌ Erro na query:', error);
    throw error;
  }
};

// Função para fechar o pool
const closePool = async () => {
  await pool.end();
  console.log('🔒 Pool de conexões fechado');
};

module.exports = {
  query,
  closePool
};
