const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

let dbType = process.env.DB_TYPE || 'sqlite';
let pool = null;
let sqliteDb = null;

// Função para inicializar PostgreSQL
const initPostgreSQL = () => {
  try {
    pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'restaurantes',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
    console.log('✅ PostgreSQL inicializado');
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar PostgreSQL:', error.message);
    return false;
  }
};

// Função para inicializar SQLite
const initSQLite = () => {
  try {
    const dbPath = path.join(__dirname, 'database.sqlite');
    sqliteDb = new sqlite3.Database(dbPath);
    console.log('✅ SQLite inicializado');
    
    // Criar tabelas se não existirem
    createSQLiteTables();
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar SQLite:', error.message);
    return false;
  }
};

// Função para criar tabelas SQLite
const createSQLiteTables = () => {
  const tables = [
    `CREATE TABLE IF NOT EXISTS categories (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      name TEXT NOT NULL UNIQUE,\n      description TEXT,\n      created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n    )`,
    
    `CREATE TABLE IF NOT EXISTS dishes (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      name TEXT NOT NULL,\n      description TEXT,\n      price REAL NOT NULL,\n      category_id INTEGER,\n      image_url TEXT,\n      is_available INTEGER DEFAULT 1,\n      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP\n    )`,
    
    `CREATE TABLE IF NOT EXISTS orders (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      table_number INTEGER NOT NULL,\n      status TEXT NOT NULL DEFAULT 'pending',\n      total_price REAL,\n      prep_time_seconds INTEGER,\n      cancel_until DATETIME,\n      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP\n    )`,
    
    `CREATE TABLE IF NOT EXISTS order_items (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      order_id INTEGER,\n      dish_id INTEGER,\n      quantity INTEGER NOT NULL DEFAULT 1,\n      item_price REAL NOT NULL\n    )`,
    
    `CREATE TABLE IF NOT EXISTS users (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      username TEXT NOT NULL UNIQUE,\n      password_hash TEXT NOT NULL,\n      role TEXT NOT NULL DEFAULT 'waiter',\n      created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n    )`,
    
    `CREATE TABLE IF NOT EXISTS advertisements (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      title TEXT NOT NULL,\n      content TEXT,\n      image_url TEXT,\n      start_date DATE NOT NULL,\n      end_date DATE NOT NULL,\n      is_active INTEGER DEFAULT 1,\n      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP\n    )`,
    
    `CREATE TABLE IF NOT EXISTS ratings (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      dish_id INTEGER,\n      order_id INTEGER,\n      rating INTEGER NOT NULL,\n      comment TEXT,\n      created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n    )`,
    
    `CREATE TABLE IF NOT EXISTS settings (\n      key TEXT PRIMARY KEY,\n      value TEXT,\n      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP\n    )`
  ];
  
  tables.forEach(tableSQL => {
    sqliteDb.run(tableSQL, (err) => {
      if (err) {
        console.error('❌ Erro ao criar tabela:', err.message);
      }
    });
  });
  
  // Inserir dados básicos
  const insertDefaults = () => {
    // Inserir categorias básicas
    const categories = [
      ['Entradas', 'Pratos leves para começar'],
      ['Pratos Principais', 'Seleção de pratos principais'],
      ['Sobremesas', 'Doces para finalizar'],
      ['Bebidas', 'Bebidas variadas']
    ];
    
    categories.forEach(([name, description]) => {
      sqliteDb.run(
        'INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)',
        [name, description]
      );
    });
    
    // Inserir configuração padrão
    sqliteDb.run(
      "INSERT OR IGNORE INTO settings (key, value) VALUES ('restaurant_name', 'Restaurante Gêmeos')"
    );
  };
  
  insertDefaults();
  console.log('✅ Tabelas SQLite criadas/verificadas');
};

// Função para converter query PostgreSQL para SQLite
const convertQuery = (text, params) => {
  if (dbType === 'sqlite') {
    let convertedText = text;

    // Converter placeholders $1, $2, etc. para ?
    let paramIndex = 1;
    while (convertedText.includes(`$${paramIndex}`)) {
      convertedText = convertedText.replace(new RegExp(`\$${paramIndex}`, 'g'), '?');
      paramIndex++;
    }

    // Funções de Data e Hora
    convertedText = convertedText.replace(/to_char\(([^,]+),\s*'YYYY-MM-DD'\)/g, "strftime('%Y-%m-%d', $1)");
    convertedText = convertedText.replace(/NOW\(\) - INTERVAL '(\d+) days'/g, "datetime('now', '-$1 days')");
    convertedText = convertedText.replace(/CURRENT_TIMESTAMP/g, "datetime('now')");
    convertedText = convertedText.replace(/CURRENT_DATE/g, "date('now')");
    convertedText = convertedText.replace(/date_trunc\('month', ([^\)]+)\)/g, "date($1, 'start of month')");
    convertedText = convertedText.replace(/EXTRACT\(EPOCH FROM \(([^\s]+) - ([^\)]+)\)\)/g, "(strftime('%s', $1) - strftime('%s', $2))");
    convertedText = convertedText.replace(/EXTRACT\(EPOCH FROM ([^\)]+)\)/g, "strftime('%s', $1)");

    // Funções JSON
    convertedText = convertedText.replace(/json_build_object/g, 'json_object');
    convertedText = convertedText.replace(/json_agg/g, 'json_group_array');

    // Tipos de Dados e Casts
    convertedText = convertedText.replace(/::date/g, '');
    convertedText = convertedText.replace(/SERIAL\s+PRIMARY\s+KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT');
    convertedText = convertedText.replace(/TIMESTAMP WITH TIME ZONE/g, 'DATETIME');
    convertedText = convertedText.replace(/NUMERIC\(\d+,\s*\d+\)/g, 'REAL');
    convertedText = convertedText.replace(/VARCHAR\(\d+\)/g, 'TEXT');
    convertedText = convertedText.replace(/BOOLEAN/g, 'INTEGER');
    convertedText = convertedText.replace(/\bTRUE\b/g, '1');
    convertedText = convertedText.replace(/\bFALSE\b/g, '0');

    return { text: convertedText, params };
  }
  return { text, params };
};

// Função de query unificada
const query = async (text, params = []) => {
  const { text: convertedText, params: convertedParams } = convertQuery(text, params);
  
  if (dbType === 'postgresql' && pool) {
    try {
      const result = await pool.query(convertedText, convertedParams);
      return result;
    } catch (error) {
      console.error('❌ Erro PostgreSQL:', error.message);
      // Fallback para SQLite se PostgreSQL falhar
      if (dbType === 'postgresql') {
        console.log('🔄 Tentando fallback para SQLite...');
        dbType = 'sqlite';
        if (initSQLite()) {
          return await query(text, params);
        }
      }
      throw error;
    }
  } else if (dbType === 'sqlite' && sqliteDb) {
    return new Promise((resolve, reject) => {
      if (convertedText.trim().toUpperCase().startsWith('SELECT')) {
        sqliteDb.all(convertedText, convertedParams, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve({ rows });
          }
        });
      } else {
        sqliteDb.run(convertedText, convertedParams, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ 
              rows: [{ id: this.lastID }], 
              rowCount: this.changes 
            });
          }
        });
      }
    });
  } else {
    throw new Error('Banco de dados não inicializado');
  }
};

// Inicializar banco de dados
const initDatabase = () => {
  if (dbType === 'postgresql') {
    if (!initPostgreSQL()) {
      console.log('🔄 PostgreSQL falhou, usando SQLite como fallback...');
      dbType = 'sqlite';
      initSQLite();
    }
  } else if (dbType === 'sqlite') {
    initSQLite();
  } else {
    // Se não especificado, usar SQLite por padrão
    console.log('🔄 Usando SQLite como padrão...');
    dbType = 'sqlite';
    initSQLite();
  }
};

// Inicializar na importação
initDatabase();

module.exports = {
  pool,
  sqliteDb,
  query,
  getDbType: () => dbType,
  setDbType: (type) => {
    dbType = type;
    if (type === 'postgresql') {
      initPostgreSQL();
    } else if (type === 'sqlite') {
      initSQLite();
    }
  }
};
