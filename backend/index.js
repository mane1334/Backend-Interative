const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const db = require('./db');
const { getChatResponse, transcribeAudio, textToSpeech } = require('ai-module');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const { isLocalPath, deleteIfUnused } = require('./utils/imageCleanup');

// --- Global Error Handlers to prevent crash ---
process.on('uncaughtException', (err) => {
  console.error('CRITICAL ERROR (Uncaught Exception):', err);
  // Keep alive logic or graceful shutdown depending on preference.
  // For this user request "server crashes too much", we try to keep it alive but log heavily.
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL ERROR (Unhandled Rejection) at:', promise, 'reason:', reason);
});

// Configuração do Multer para upload de arquivos
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
// Multer genérico já utilizado para uploads de áudio, etc.
const upload = multer({ dest: uploadDir });
// Multer específico para imagens com limites e filtro de tipo
const imageUpload = multer({
  dest: uploadDir,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file && file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

const app = express();
const server = http.createServer(app);

// CORS: Configuração melhorada para desenvolvimento e produção
const isDevelopment = process.env.NODE_ENV !== 'production';

if (isDevelopment) {
  // Em desenvolvimento: permitir todas as origens para facilitar testes
  console.log(' Modo desenvolvimento: CORS liberado para todas as origens');
  app.use(cors({
    origin: true, // Permite qualquer origem em desenvolvimento
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    credentials: true,
  }));
} else {
  // Em produção: usar whitelist configurável
  console.log(' Modo produção: CORS restritivo ativado');

  // 1) Leia da env CORS_ORIGIN como lista separada por vírgula
  const configuredOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(v => v && v.trim())
    .filter(Boolean);

  // 2) Se não houver, derive automaticamente a partir de PUBLIC_HOST/IP com portas padrão
  const publicHost = process.env.PUBLIC_HOST || process.env.HOST;
  const derivedOrigins = [];
  if (publicHost) {
    // Suporte a http/https e portas dos frontends por padrão
    const candidateBases = [
      `http://${publicHost}:3001`,
      `http://${publicHost}:3002`,
      `http://${publicHost}:5173`, // Vite dev server
      `https://${publicHost}`,
      `http://${publicHost}`,
    ];
    derivedOrigins.push(...candidateBases);
  }

  // 3) Sempre permita localhost em portas comuns como fallback (útil em VPS com tunel ou preview)
  const fallbackOrigins = [
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5173',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:5173',
  ];

  const whitelist = Array.from(new Set([...configuredOrigins, ...derivedOrigins, ...fallbackOrigins]));

  console.log(' Origens CORS permitidas:', whitelist);

  const corsOptions = {
    origin: function (origin, callback) {
      // Permitir requisições sem header Origin (ex.: curl, healthchecks, Postman)
      if (!origin) return callback(null, true);

      // Log para debug
      console.log(` Requisição de origem: ${origin}`);

      if (whitelist.includes(origin)) {
        console.log(`✅ Origem permitida: ${origin}`);
        return callback(null, true);
      }

      console.log(`❌ Origem bloqueada: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    credentials: true,
  };
  app.use(cors(corsOptions));
}

app.use(express.json());

// Adiciona cabeçalhos de segurança recomendados
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const port = process.env.PORT || 3000; // porta via env, fallback 3000

server.on('error', (error) => {
  console.error('Erro no servidor HTTP:', error);
});

const wss = new WebSocket.Server({ noServer: true });

// Função para broadcast de mensagens para todos os clientes
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data, (err) => {
        if (err) {
          console.error('Erro ao enviar mensagem para o cliente:', err);
        }
      });
    }
  });
};

// Anexar o servidor WebSocket ao servidor HTTP
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, ws => {
    wss.emit('connection', ws, request);
  });
});

// Lógica de conexão WebSocket
wss.on('connection', ws => {
  console.log('Cliente WebSocket conectado.');
  // Listen for simple JSON ping messages from clients and reply
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data && data.type === 'PING') {
        try { ws.send(JSON.stringify({ type: 'PONG' })); } catch (_) { }
      }
    } catch (_) {
      // ignore non-json messages
    }
  });
  ws.on('close', () => {
    console.log('Cliente WebSocket desconectado.');
  });
  ws.on('error', error => {
    console.error('Erro no WebSocket do cliente:', error);
  });
});

// Tratamento de erro geral para o servidor WebSocket
wss.on('error', error => {
  console.error('Erro no servidor WebSocket:', error);
});

// --- Lógica para Streaming de Logs ---

const logFiles = {
  stdout: path.join(__dirname, 'server.out.log'),
  stderr: path.join(__dirname, 'server.err.log'),
};

// Função para enviar o conteúdo de um log para um cliente específico
const sendLogFile = (ws, source) => {
  const filePath = logFiles[source];
  if (!fs.existsSync(filePath)) return;

  fs.readFile(filePath, 'utf8', (err, content) => {
    if (err) {
      console.error(`Erro ao ler o arquivo de log ${source}:`, err);
      return;
    }
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'LOG_DATA',
        payload: { source, content }
      }), (err) => {
        if (err) console.error(`Erro ao enviar dados de log (${source}) para o cliente:`, err);
      });
    }
  });
};

// Função para observar um arquivo de log e transmitir alterações
const watchLogFile = (source) => {
  const filePath = logFiles[source];

  // Garante que o arquivo exista antes de observá-lo
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, ``, 'utf8');
    console.log(`Arquivo de log criado: ${filePath}`);
  }

  fs.watch(filePath, (eventType) => {
    if (eventType === 'change') {
      fs.readFile(filePath, 'utf8', (err, content) => {
        if (err) {
          console.error(`Erro ao ler o arquivo de log ${source} após alteração:`, err);
          return;
        }
        // Transmite a atualização para todos os clientes
        wss.broadcast(JSON.stringify({
          type: 'LOG_DATA',
          payload: { source, content }
        }));
      });
    }
  });
};

// Inicia a observação dos arquivos de log
watchLogFile('stdout');
watchLogFile('stderr');

// Modifica a lógica de conexão para enviar os logs iniciais
wss.on('connection', ws => {
  console.log('Cliente WebSocket conectado e recebendo logs.');

  // Envia o conteúdo atual dos logs assim que o cliente se conecta
  sendLogFile(ws, 'stdout');
  sendLogFile(ws, 'stderr');

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data && data.type === 'PING') {
        try { ws.send(JSON.stringify({ type: 'PONG' })); } catch (_) { }
      }
    } catch (_) {
      // ignora mensagens que não são JSON
    }
  });

  ws.on('close', () => {
    console.log('Cliente WebSocket desconectado do stream de logs.');
  });

  ws.on('error', error => {
    console.error('Erro no WebSocket do cliente (logs):', error);
  });
});




// --- Rotas da API ---

// Upload de imagens
app.post('/api/uploads', imageUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo de imagem enviado ou tipo inválido.' });
    }

    const id = crypto.randomUUID();
    const outputFilename = `${id}.webp`;
    const outputPath = path.join(uploadDir, outputFilename);

    await sharp(req.file.path)
      .resize({ width: 1280, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);

    // Remove arquivo temporário
    try { fs.unlinkSync(req.file.path); } catch (_) { }

    return res.json({ path: `/uploads/${outputFilename}` });
  } catch (err) {
    console.error('Erro no upload de imagem:', err);
    return res.status(500).json({ error: 'Erro ao processar a imagem.' });
  }
});

// Cardápio para Clientes
app.get('/api/menu', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT d.*, c.name as category_name 
      FROM dishes d 
      LEFT JOIN categories c ON d.category_id = c.id 
      WHERE d.is_available = TRUE
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar o cardápio.' });
  }
});

// --- Gerenciamento de Pratos (CRUD) ---

// Obter todos os pratos (Read)
app.get('/api/dishes', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT d.*, c.name as category_name 
      FROM dishes d 
      LEFT JOIN categories c ON d.category_id = c.id 
      ORDER BY d.id ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar pratos.' });
  }
});

// Criar um novo prato (Create)
app.post('/api/dishes', async (req, res) => {
  const { name, description, price, category_id, image_url, is_available } = req.body;
  console.log('Attempting to create new dish with data:', req.body);
  try {
    const { rows } = await db.query(
      'INSERT INTO dishes (name, description, price, category_id, image_url, is_available, updated_at) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP) RETURNING *',
      [name, description, price, category_id, image_url, is_available]
    );
    console.log('Dish created successfully:', rows[0]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao criar prato:', err);
    res.status(500).json({ error: 'Erro ao criar prato.' });
  }
});

// Atualizar um prato (Update)
app.put('/api/dishes/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category_id, image_url, is_available } = req.body;
  console.log(`Attempting to update dish ${id} with data:`, req.body);
  try {
    // Fetch current image_url before updating
    const { rows: existingRows } = await db.query('SELECT image_url FROM dishes WHERE id = $1', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Prato não encontrado.' });
    }
    const oldImagePath = existingRows[0].image_url;

    const { rows } = await db.query(
      'UPDATE dishes SET name = $1, description = $2, price = $3, category_id = $4, image_url = $5, is_available = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [name, description, price, category_id, image_url, is_available, id]
    );

    const updated = rows[0];
    console.log('Dish updated successfully:', updated);

    // After successful update, delete old local image if it is no longer used and differs from new value
    const newImagePath = updated ? updated.image_url : null;
    if (oldImagePath && isLocalPath(oldImagePath) && oldImagePath !== newImagePath) {
      deleteIfUnused(oldImagePath).catch(err => {
        console.error('Erro ao limpar imagem antiga (update):_ ', err);
      });
    }

    res.json(updated);
  } catch (err) {
    console.error('Erro ao atualizar prato:', err);
    res.status(500).json({ error: 'Erro ao atualizar prato.' });
  }
});

// Deletar um prato (Delete)
app.delete('/api/dishes/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`Attempting to delete dish with ID: ${id}`);
  try {
    // Fetch current image_url before delete
    const { rows: existingRows } = await db.query('SELECT image_url FROM dishes WHERE id = $1', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Prato não encontrado.' });
    }
    const oldImagePath = existingRows[0].image_url;

    await db.query('DELETE FROM dishes WHERE id = $1', [id]);
    console.log(`Dish with ID ${id} deleted successfully.`);

    // After successful delete, delete old local image if unused
    if (oldImagePath && isLocalPath(oldImagePath)) {
      deleteIfUnused(oldImagePath).catch(err => {
        console.error('Erro ao limpar imagem antiga (delete):_ ', err);
      });
    }

    res.status(204).send(); // Sem conteúdo
  } catch (err) {
    console.error(`Erro ao deletar prato com ID ${id}:`, err);
    res.status(500).json({ error: 'Erro ao deletar prato.' });
  }
});

// --- Ratings ---

// Criar uma nova avaliação
app.post('/api/ratings', async (req, res) => {
  const { dish_id, order_id, rating, comment } = req.body;

  if (!dish_id || !rating) {
    return res.status(400).json({ error: 'dish_id e rating são obrigatórios.' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'A avaliação deve ser entre 1 e 5.' });
  }

  try {
    // Query simplificada que funciona em ambos os bancos após a conversão de placeholders pela função `convertQuery`
    const queryText = 'INSERT INTO ratings (dish_id, order_id, rating, comment) VALUES ($1, $2, $3, $4)';
    await db.query(queryText, [dish_id, order_id, rating, comment]);
    res.status(201).json({ success: true, message: 'Avaliação salva com sucesso.' });
  } catch (err) {
    console.error('Erro ao salvar avaliação:', err);
    res.status(500).json({ error: 'Erro ao salvar avaliação.' });
  }
});

// Obter todas as avaliações (para o admin panel)
app.get('/api/ratings', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT r.id, r.rating, r.comment, r.created_at, d.name as dish_name, r.order_id
      FROM ratings r
      JOIN dishes d ON r.dish_id = d.id
      ORDER BY r.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar avaliações:', err);
    res.status(500).json({ error: 'Erro ao buscar avaliações.' });
  }
});

// Obter dados agregados de avaliações (para o dashboard)
app.get('/api/ratings/summary', async (req, res) => {
  try {
    const avgPerDishQuery = `
      SELECT 
        d.name as dish_name,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as rating_count
      FROM dishes d
      LEFT JOIN ratings r ON d.id = r.dish_id
      GROUP BY d.id, d.name
      ORDER BY average_rating DESC, rating_count DESC
    `;

    const distributionQuery = `
      SELECT 
        rating,
        COUNT(id) as count
      FROM ratings
      GROUP BY rating
      ORDER BY rating DESC
    `;

    const [avgPerDishResult, distributionResult] = await Promise.all([
      db.query(avgPerDishQuery),
      db.query(distributionQuery)
    ]);

    res.json({
      averageRatingsPerDish: avgPerDishResult.rows,
      ratingDistribution: distributionResult.rows
    });

  } catch (err) {
    console.error('Erro ao buscar resumo das avaliações:', err);
    res.status(500).json({ error: 'Erro ao buscar resumo das avaliações.' });
  }
});


// Pedidos
app.post('/api/orders', async (req, res) => {
  const { table_number, items, prep_time_seconds: requestedPrepSeconds } = req.body;

  if (!table_number || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Dados do pedido inválidos.' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Calcula o preço total a partir dos dados do DB para segurança
    const dishIds = items.map(item => item.dish_id);
    const pricesResult = await client.query('SELECT id, price FROM dishes WHERE id = ANY($1::int[])', [dishIds]);

    let totalPrice = 0;
    const priceMap = new Map(pricesResult.rows.map(p => [p.id, parseFloat(p.price)]));

    for (const item of items) {
      if (!priceMap.has(item.dish_id)) {
        throw new Error(`Prato com ID ${item.dish_id} não encontrado.`);
      }
      totalPrice += priceMap.get(item.dish_id) * item.quantity;
    }

    // Define tempo de preparo inicial (default 20 minutos)
    const defaultPrepSeconds = Number.isFinite(requestedPrepSeconds) && requestedPrepSeconds > 0
      ? Math.floor(requestedPrepSeconds)
      : 20 * 60;

    // Insere o pedido na tabela 'orders' com tempo de preparo e janela de cancelamento (5 min)
    const orderResult = await client.query(
      `INSERT INTO orders (table_number, total_price, prep_time_seconds, cancel_until)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '5 minutes') RETURNING id, created_at, prep_time_seconds, cancel_until`,
      [table_number, totalPrice, defaultPrepSeconds]
    );
    const orderId = orderResult.rows[0].id;

    // Insere os itens do pedido na tabela 'order_items'
    const itemQueries = items.map(item => {
      const itemPrice = priceMap.get(item.dish_id);
      return client.query(
        'INSERT INTO order_items (order_id, dish_id, quantity, item_price) VALUES ($1, $2, $3, $4)',
        [orderId, item.dish_id, item.quantity, itemPrice]
      );
    });

    await Promise.all(itemQueries);

    await client.query('COMMIT');

    // Notifica o painel e clientes via WebSocket com dados iniciais
    wss.broadcast(JSON.stringify({
      type: 'NEW_ORDER',
      payload: {
        order_id: orderId,
        table_number,
        prep_time_seconds: orderResult.rows[0].prep_time_seconds,
        cancel_until: orderResult.rows[0].cancel_until
      }
    }));

    res.status(201).json({
      message: 'Pedido criado com sucesso!',
      order_id: orderId,
      prep_time_seconds: orderResult.rows[0].prep_time_seconds,
      cancel_until: orderResult.rows[0].cancel_until
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar o pedido.' });
  } finally {
    client.release();
  }
});

// Atualizar status do pedido (garçom/cozinha)
app.put('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // expected: 'preparing', 'completed', 'delivered'

  if (!['preparing', 'completed', 'delivered'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido.' });
  }

  try {
    const { rows } = await db.query(
      `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    const updated = rows[0];

    // Broadcast update
    wss.broadcast(JSON.stringify({
      type: 'ORDER_STATUS_UPDATE',
      payload: {
        order_id: updated.id,
        status: updated.status,
        table_number: updated.table_number
      }
    }));

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar status.' });
  }
});

// Ajustar tempo de preparo (admin/cozinha)
// ... keeping next endpoint ...
app.put('/api/orders/:id/prep-time', async (req, res) => {
  const { id } = req.params;
  const { add_minutes, set_minutes } = req.body || {};

  try {
    // Decide novo valor
    let query;
    let params;
    if (Number.isFinite(set_minutes)) {
      const seconds = Math.max(0, Math.floor(set_minutes * 60));
      query = `UPDATE orders SET prep_time_seconds = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`;
      params = [seconds, id];
    } else if (Number.isFinite(add_minutes)) {
      const addSeconds = Math.floor(add_minutes * 60);
      query = `UPDATE orders SET prep_time_seconds = GREATEST(0, COALESCE(prep_time_seconds, 0) + $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`;
      params = [addSeconds, id];
    } else {
      return res.status(400).json({ error: 'Informe add_minutes ou set_minutes.' });
    }

    const { rows } = await db.query(query, params);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    const updated = rows[0];

    // Broadcast atualização
    const increased = Number.isFinite(add_minutes) && add_minutes > 0;
    wss.broadcast(JSON.stringify({
      type: 'PREP_TIME_UPDATE',
      payload: { order_id: updated.id, prep_time_seconds: updated.prep_time_seconds }
    }));
    if (increased) {
      wss.broadcast(JSON.stringify({
        type: 'COURTESY_MESSAGE',
        payload: {
          order_id: updated.id,
          message: 'Pedimos desculpa pelo atraso, seu prato ficará pronto em breve.'
        }
      }));
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar tempo de preparo.' });
  }
});

// Cancelamento pelo cliente dentro de 5 minutos
app.post('/api/orders/:id/cancel', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query('SELECT id, status, cancel_until FROM orders WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Pedido não encontrado.' });

    const order = rows[0];
    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Pedido já cancelado.' });
    }

    const now = new Date();
    const cancelUntil = order.cancel_until ? new Date(order.cancel_until) : null;
    if (!cancelUntil || now > cancelUntil) {
      return res.status(403).json({ error: 'Janela de cancelamento expirada.' });
    }

    const { rows: updatedRows } = await db.query(
      `UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );

    const updated = updatedRows[0];
    // Broadcast cancelamento
    wss.broadcast(JSON.stringify({ type: 'ORDER_CANCELLED', payload: updated }));
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cancelar pedido.' });
  }
});

// Chamada de Garçom
app.post('/api/call-waiter', (req, res) => {
  const { table_number } = req.body;
  console.log(`Mesa ${table_number} está chamando o garçom.`);

  // Notifica o painel via WebSocket
  wss.broadcast(JSON.stringify({ type: 'CALL_WAITER', payload: { table_number } }));

  res.status(200).json({ message: `Notificação enviada para a mesa ${table_number}` });
});

// --- Configurações ---
app.get('/api/settings', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT key, value FROM settings');
    const settings = rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
    res.json(settings);
  } catch (err) {
    console.error('Erro ao buscar configurações:', err);
    res.status(500).json({ error: 'Erro ao buscar configurações.' });
  }
});

app.put('/api/settings', async (req, res) => {
  const settings = req.body;
  try {
    const updatePromises = Object.entries(settings).map(([key, value]) => {
      if (db.getDbType() === 'postgresql') {
        return db.query(
          `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
           ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
          [key, value]
        );
      } else {
        // SQLite
        return db.query(
          `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
          [key, value]
        );
      }
    });
    await Promise.all(updatePromises);
    res.status(200).json({ message: 'Configurações atualizadas com sucesso!' });
  } catch (err) {
    console.error('Erro ao atualizar configurações:', err);
    res.status(500).json({ error: 'Erro ao atualizar configurações.' });
  }
});
// --- Categorias ---
app.get('/api/categories', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar categorias:', err);
    res.status(500).json({ error: 'Erro ao buscar categorias.' });
  }
});

// --- Avaliações ---
app.get('/api/ratings', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT r.*, d.name as dish_name 
      FROM ratings r 
      LEFT JOIN dishes d ON r.dish_id = d.id 
      ORDER BY r.created_at DESC LIMIT 50
    `);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar avaliações:', err);
    res.status(500).json({ error: 'Erro ao buscar avaliações.' });
  }
});

app.post('/api/ratings', async (req, res) => {
  const { dish_id, order_id, rating, comment } = req.body;
  try {
    if (db.getDbType() === 'postgresql') {
      await db.query(
        'INSERT INTO ratings (dish_id, order_id, rating, comment) VALUES ($1, $2, $3, $4)',
        [dish_id, order_id, rating, comment]
      );
    } else {
      await db.query(
        'INSERT INTO ratings (dish_id, order_id, rating, comment) VALUES (?, ?, ?, ?)',
        [dish_id, order_id, rating, comment]
      );
    }
    res.status(201).json({ message: 'Avaliação enviada com sucesso!' });
  } catch (err) {
    console.error('Erro ao salvar avaliação:', err);
    res.status(500).json({ error: 'Erro ao salvar avaliação.' });
  }
});


// --- Analytics ---
app.get('/api/analytics', async (req, res) => {
  const dbType = db.getDbType();
  try {
    let ordersByDay, topDishes, dailySummary, monthlySummary, avgServiceTime;
    let revenueByCategory, peakHours, topRated;

    if (dbType === 'postgresql') {
      [ordersByDay, topDishes, dailySummary, monthlySummary, avgServiceTime, revenueByCategory, peakHours, topRated] = await Promise.all([
        db.query(`SELECT to_char(created_at, 'YYYY-MM-DD') as day, COUNT(*) as pedidos, SUM(total_price) as faturamento, COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as pedidos_cancelados, SUM(CASE WHEN status = 'cancelled' THEN total_price ELSE 0 END) as faturamento_perdido FROM orders WHERE created_at >= NOW() - INTERVAL '7 days' GROUP BY day ORDER BY day ASC`),
        db.query(`SELECT d.name, SUM(oi.quantity) as total FROM order_items oi JOIN dishes d ON oi.dish_id = d.id GROUP BY d.name ORDER BY total DESC LIMIT 5`),
        db.query(`SELECT COUNT(*) as total_pedidos_dia, SUM(total_price) as faturamento_dia, COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as pedidos_cancelados_dia, SUM(CASE WHEN status = 'cancelled' THEN total_price ELSE 0 END) as faturamento_perdido_dia FROM orders WHERE created_at::date = CURRENT_DATE`),
        db.query(`SELECT COUNT(*) as total_pedidos_mes, SUM(total_price) as faturamento_mes, COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as pedidos_cancelados_mes, SUM(CASE WHEN status = 'cancelled' THEN total_price ELSE 0 END) as faturamento_perdido_mes FROM orders WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)`),
        db.query(`SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_seconds FROM orders WHERE status = 'completed' AND updated_at IS NOT NULL`),
        db.query(`SELECT c.name, SUM(oi.quantity * oi.item_price) as revenue FROM order_items oi JOIN dishes d ON oi.dish_id = d.id JOIN categories c ON d.category_id = c.id GROUP BY c.name`),
        db.query(`SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as count FROM orders GROUP BY hour ORDER BY hour ASC`),
        db.query(`SELECT d.name, AVG(r.rating) as avg_rating, COUNT(r.id) as count FROM ratings r JOIN dishes d ON r.dish_id = d.id GROUP BY d.id, d.name HAVING COUNT(r.id) > 0 ORDER BY avg_rating DESC LIMIT 5`)
      ]);
    } else { // SQLite
      [ordersByDay, topDishes, dailySummary, monthlySummary, avgServiceTime, revenueByCategory, peakHours, topRated] = await Promise.all([
        db.query(`SELECT strftime('%Y-%m-%d', created_at) as day, COUNT(*) as pedidos, SUM(total_price) as faturamento, COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as pedidos_cancelados, SUM(CASE WHEN status = 'cancelled' THEN total_price ELSE 0 END) as faturamento_perdido FROM orders WHERE created_at >= date('now', '-7 days') GROUP BY day ORDER BY day ASC`),
        db.query(`SELECT d.name, SUM(oi.quantity) as total FROM order_items oi JOIN dishes d ON oi.dish_id = d.id GROUP BY d.name ORDER BY total DESC LIMIT 5`),
        db.query(`SELECT COUNT(*) as total_pedidos_dia, SUM(total_price) as faturamento_dia, COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as pedidos_cancelados_dia, SUM(CASE WHEN status = 'cancelled' THEN total_price ELSE 0 END) as faturamento_perdido_dia FROM orders WHERE date(created_at) = date('now')`),
        db.query(`SELECT COUNT(*) as total_pedidos_mes, SUM(total_price) as faturamento_mes, COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as pedidos_cancelados_mes, SUM(CASE WHEN status = 'cancelled' THEN total_price ELSE 0 END) as faturamento_perdido_mes FROM orders WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`),
        db.query(`SELECT AVG(strftime('%s', updated_at) - strftime('%s', created_at)) as avg_seconds FROM orders WHERE status = 'completed' AND updated_at IS NOT NULL`),
        db.query(`SELECT c.name, SUM(oi.quantity * oi.item_price) as revenue FROM order_items oi JOIN dishes d ON oi.dish_id = d.id JOIN categories c ON d.category_id = c.id GROUP BY c.name`),
        db.query(`SELECT strftime('%H', created_at) as hour, COUNT(*) as count FROM orders GROUP BY hour ORDER BY hour ASC`),
        db.query(`SELECT d.name, AVG(r.rating) as avg_rating, COUNT(r.id) as count FROM ratings r JOIN dishes d ON r.dish_id = d.id GROUP BY d.id, d.name ORDER BY avg_rating DESC LIMIT 5`)
      ]);
    }

    res.json({
      ordersByDay: ordersByDay.rows,
      topDishes: topDishes.rows,
      dailySummary: dailySummary.rows[0],
      monthlySummary: monthlySummary.rows[0],
      avgServiceTime: avgServiceTime.rows[0]?.avg_seconds,
      revenueByCategory: revenueByCategory.rows,
      peakHours: peakHours.rows,
      topRated: topRated.rows
    });
  } catch (err) {
    console.error('Erro ao buscar dados analíticos:', err);
    res.status(500).json({ error: 'Erro ao buscar dados analíticos.' });
  }
});

// --- Histórico de Pedidos ---
app.get('/api/orders', async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  const status = req.query.status; // Optional status filter ('pending', 'preparing', 'completed', 'cancelled', 'all')

  let query = `
    SELECT o.id, o.table_number, o.status, o.total_price, o.created_at, o.updated_at,
      o.prep_time_seconds, o.cancel_until,
      json_agg(json_build_object('name', d.name, 'quantity', oi.quantity, 'price', oi.item_price)) as items
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN dishes d ON oi.dish_id = d.id
  `;
  const queryParams = [limit, offset];
  let whereClause = '';

  if (status && status !== 'all') {
    whereClause = `WHERE o.status = $3`;
    queryParams.push(status);
  }

  query += `
    ${whereClause}
    GROUP BY o.id
    ORDER BY o.created_at DESC
    LIMIT $1 OFFSET $2
  `;

  try {
    const orders = await db.query(query, queryParams);
    res.json({ orders: orders.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar pedidos.' });
  }
});

// Exportar histórico de pedidos para CSV
app.get('/api/orders/export', async (req, res) => {
  const { Parser } = require('json2csv');
  const status = req.query.status;

  let query = `
    SELECT o.id, o.table_number, o.status, o.total_price, o.created_at,
      json_agg(json_build_object('name', d.name, 'quantity', oi.quantity)) as items
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN dishes d ON oi.dish_id = d.id
  `;
  const queryParams = [];

  if (status && status !== 'all') {
    query += ` WHERE o.status = $1`;
    queryParams.push(status);
  }

  query += ` GROUP BY o.id ORDER BY o.created_at DESC`;

  try {
    const { rows: orders } = await db.query(query, queryParams);

    if (orders.length === 0) {
      res.status(404).send('Nenhum pedido encontrado para exportar com os filtros selecionados.');
      return;
    }

    // Formatar os dados para o CSV
    const formattedData = orders.map(order => ({
      'ID do Pedido': order.id,
      'Mesa': order.table_number,
      'Status': order.status,
      'Valor Total': order.total_price,
      'Data': new Date(order.created_at).toLocaleString('pt-MZ'),
      'Itens': order.items.map(item => `${item.name} (x${item.quantity})`).join(', ')
    }));

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(formattedData);

    res.header('Content-Type', 'text/csv');
    res.attachment('historico_pedidos.csv');
    res.status(200).send(csv);

  } catch (err) {
    console.error('Erro ao exportar pedidos:', err);
    res.status(500).json({ error: 'Erro ao gerar o arquivo de exportação.' });
  }
});

// Update order status
app.put('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status é obrigatório.' });
  }

  try {
    const { rows } = await db.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *'
      , [status, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }
    // Notify via WebSocket about status change
    wss.broadcast(JSON.stringify({ type: 'ORDER_STATUS_UPDATE', payload: rows[0] }));
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar status do pedido.' });
  }
});

// --- Gerenciamento de Anúncios (CRUD) ---

// Obter todos os anúncios (Read)
app.get('/api/ads', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM advertisements ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar anúncios.' });
  }
});

// Criar um novo anúncio (Create)
app.post('/api/ads', async (req, res) => {
  const { title, content, image_url, start_date, end_date, is_active } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO advertisements (title, content, image_url, start_date, end_date, is_active, updated_at) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP) RETURNING *',
      [title, content, image_url, start_date, end_date, is_active]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar anúncio.' });
  }
});

// Atualizar um anúncio (Update)
app.put('/api/ads/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, image_url, start_date, end_date, is_active } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE advertisements SET title = $1, content = $2, image_url = $3, start_date = $4, end_date = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [title, content, image_url, start_date, end_date, is_active, id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar anúncio.' });
  }
});

// Deletar um anúncio (Delete)
app.delete('/api/ads/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM advertisements WHERE id = $1', [id]);
    res.status(204).send(); // Sem conteúdo
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar anúncio.' });
  }
});

// Middleware de autenticação para rotas da IA
const authenticateAI = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === process.env.AI_MODULE_API_KEY) {
    next();
  } else {
    res.status(401).json({ error: 'Não autorizado.' });
  }
};

// Rota de Chat com IA (Voz)
app.post('/api/chat/voice', authenticateAI, upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo de áudio enviado.' });
  }

  try {
    const audioFilePath = req.file.path;
    const transcribedText = await transcribeAudio(audioFilePath);

    if (!transcribedText) {
      throw new Error('A transcrição falhou.');
    }

    const { rows: menu } = await db.query('SELECT name, description, price FROM dishes WHERE is_available = TRUE');
    const chatResponse = await getChatResponse(transcribedText, menu);

    // Converte a resposta do chat em áudio
    const audioResponsePath = await textToSpeech(chatResponse);

    res.json({ reply: chatResponse, transcription: transcribedText, audio_url: `/audio/${path.basename(audioResponsePath)}` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao processar o áudio.' });
  } finally {
    // Limpa o arquivo de áudio após o processamento
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
  }
});

// Rota de Chat com IA (Texto)
app.post('/api/chat', authenticateAI, async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'A mensagem do usuário é obrigatória.' });
  }

  try {
    const { rows: menu } = await db.query('SELECT name, description, price FROM dishes WHERE is_available = TRUE');
    const response = await getChatResponse(message, menu);

    // Converte a resposta do chat em áudio
    const audioResponsePath = await textToSpeech(response);

    res.json({ reply: response, audio_url: `/audio/${path.basename(audioResponsePath)}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao processar a mensagem.' });
  }
});

// Healthcheck abrangente para diagnosticar conectividade e serviços
app.get('/api/health', async (req, res) => {
  const http = require('http');

  // Função para verificar um serviço externo via HTTP
  const checkExternalService = (url, serviceName) => {
    return new Promise((resolve) => {
      if (!url) {
        resolve({ name: serviceName, status: 'disabled', details: 'URL não configurada.' });
        return;
      }

      const request = http.get(url, { timeout: 1500 }, (resp) => {
        let data = '';
        resp.on('data', (chunk) => { data += chunk; });
        resp.on('end', () => {
          if (resp.statusCode >= 200 && resp.statusCode < 300) {
            resolve({ name: serviceName, status: 'ok' });
          } else {
            resolve({ name: serviceName, status: 'error', details: `Status code: ${resp.statusCode}` });
          }
        });
      });

      request.on('error', (err) => {
        resolve({ name: serviceName, status: 'error', details: err.message });
      });

      request.on('timeout', () => {
        request.destroy();
        resolve({ name: serviceName, status: 'error', details: 'Timeout de 3 segundos excedido.' });
      });
    });
  };

  // Lista de verificações a serem executadas
  const checks = [
    // 1. API Principal (este serviço)
    Promise.resolve({ name: 'API Principal', status: 'ok' }),

    // 2. Módulo de IA (integrado, não um serviço externo)
    Promise.resolve({ name: 'Módulo de IA', status: 'ok', details: 'Integrado' }),

    // 3. Banco de Dados
    db.query('SELECT 1')
      .then(() => ({ name: 'Banco de Dados', status: 'ok' }))
      .catch(err => ({ name: 'Banco de Dados', status: 'error', details: err.message })),

    // 4. Módulo de Anúncios (serviço externo)
    checkExternalService(process.env.ADS_MODULE_URL, 'Módulo de Anúncios'),

    // 5. Frontend do Painel Admin
    checkExternalService(process.env.ADMIN_PANEL_URL, 'Painel do Administrador'),

    // 6. Frontend do Cliente Web
    checkExternalService(process.env.CLIENT_WEB_URL, 'App do Cliente')
  ];

  // Executa todas as verificações em paralelo
  const results = await Promise.allSettled(checks);

  const serviceStatuses = results.map(result => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    // Isso não deve acontecer com a configuração atual, mas é um fallback
    return { name: 'Unknown', status: 'error', details: 'Falha na verificação interna.' };
  });

  // Determina o status geral
  const hasError = serviceStatuses.some(s => s.status === 'error');
  const overallStatus = hasError ? 'degraded' : 'healthy';

  res.status(hasError ? 503 : 200).json({
    status: overallStatus,
    services: serviceStatuses,
    timestamp: new Date().toISOString()
  });
});

// --- Gerenciamento de Banco de Dados ---

// Função auxiliar para formatar bytes
const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

// Status do banco de dados
app.get('/api/database/status', async (req, res) => {
  try {
    // Testar conexão
    await db.query('SELECT 1');
    const dbType = db.getDbType();

    // Verificar tabelas existentes
    let tables = [];
    try {
      if (dbType === 'postgresql') {
        const tablesResult = await db.query(`
          SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
        `);
        tables = tablesResult.rows.map(row => row.table_name);
      } else if (dbType === 'sqlite') {
        const tablesResult = await db.query(`
          SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
        `);
        tables = tablesResult.rows.map(row => row.name);
      }
    } catch (tableError) {
      console.log('Erro ao buscar tabelas:', tableError.message);
    }

    // Calcular tamanho do banco de dados
    let dbSize = 0;
    if (dbType === 'postgresql') {
      const sizeResult = await db.query('SELECT pg_database_size(current_database()) as size');
      dbSize = sizeResult.rows[0] ? parseInt(sizeResult.rows[0].size, 10) : 0;
    } else if (dbType === 'sqlite') {
      try {
        const dbPath = path.join(__dirname, 'database.sqlite');
        if (fs.existsSync(dbPath)) {
          dbSize = fs.statSync(dbPath).size;
        }
      } catch (sizeError) {
        console.error('Erro ao calcular tamanho do arquivo SQLite:', sizeError);
      }
    }

    res.json({
      connected: true,
      type: dbType,
      tables: tables,
      size: dbSize,
      size_pretty: formatBytes(dbSize),
      config: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'restaurantes',
        username: process.env.DB_USER || 'postgres'
      }
    });
  } catch (error) {
    console.error('Erro no status do banco:', error.message);
    res.json({
      connected: false,
      type: 'unknown',
      error: error.message,
      tables: [],
      size: 0,
      size_pretty: '0 Bytes'
    });
  }
});

// Testar conexão com banco
app.post('/api/database/test', async (req, res) => {
  const { type, host, port, database, username, password, ssl } = req.body;

  try {
    let testDb;

    if (type === 'postgresql') {
      const { Pool } = require('pg');
      testDb = new Pool({
        user: username,
        host: host,
        database: database,
        password: password,
        port: parseInt(port),
        ssl: ssl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 5000
      });
    } else if (type === 'sqlite') {
      const sqlite3 = require('sqlite3').verbose();
      const path = require('path');
      const dbPath = path.join(__dirname, 'database.sqlite');
      testDb = new sqlite3.Database(dbPath);
    }

    // Testar conexão
    if (type === 'postgresql') {
      const client = await testDb.connect();
      await client.query('SELECT 1');
      client.release();
      await testDb.end();
    } else if (type === 'sqlite') {
      await new Promise((resolve, reject) => {
        testDb.get('SELECT 1', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      testDb.close();
    }

    res.json({ success: true, message: 'Conexão bem-sucedida' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Exportar banco de dados
app.get('/api/database/export', async (req, res) => {
  const dbType = db.getDbType();
  const today = new Date().toISOString().slice(0, 10);
  const filename = `backup-${dbType}-${today}.sql`;

  res.setHeader('Content-Type', 'application/sql');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  if (dbType === 'sqlite') {
    const { exec } = require('child_process');
    const dbPath = path.join(__dirname, 'database.sqlite');

    const command = `sqlite3 "${dbPath}" .dump`;

    const child = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erro ao exportar SQLite: ${error.message}`);
        res.status(500).end('Erro ao gerar o backup do SQLite.');
        return;
      }
      if (stderr) {
        console.warn(`Stderr do dump SQLite: ${stderr}`);
      }
    });

    child.stdout.pipe(res);

  } else if (dbType === 'postgresql') {
    // A implementação com pg_dump é mais complexa e depende do ambiente.
    // Retornando um erro claro por enquanto.
    res.status(501).send('-- Exportação para PostgreSQL não implementada nesta versão.\n');

  } else {
    res.status(400).send('-- Tipo de banco de dados desconhecido.\n');
  }
});


// Configurar banco de dados
app.post('/api/database/setup', async (req, res) => {
  const { type, host, port, database, username, password, ssl } = req.body;

  try {
    let newDb;

    if (type === 'postgresql') {
      const { Pool } = require('pg');
      newDb = new Pool({
        user: username,
        host: host,
        database: database,
        password: password,
        port: parseInt(port),
        ssl: ssl ? { rejectUnauthorized: false } : false
      });
    } else if (type === 'sqlite') {
      const sqlite3 = require('sqlite3').verbose();
      const path = require('path');
      const dbPath = path.join(__dirname, 'database.sqlite');
      newDb = new sqlite3.Database(dbPath);
    }

    // Executar schema se for PostgreSQL
    if (type === 'postgresql') {
      const client = await newDb.connect();

      // Ler e executar schema
      const fs = require('fs');
      const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');

      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schema);
      } else {
        // Schema básico se não existir arquivo
        const basicSchema = `
          CREATE TABLE IF NOT EXISTS dishes (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            category_id INTEGER,
            image_url VARCHAR(500),
            is_available BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            table_number INTEGER NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            total_price DECIMAL(10,2) NOT NULL,
            prep_time_seconds INTEGER DEFAULT 1200,
            cancel_until TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE TABLE IF NOT EXISTS order_items (
            id SERIAL PRIMARY KEY,
            order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
            dish_id INTEGER REFERENCES dishes(id),
            quantity INTEGER NOT NULL,
            item_price DECIMAL(10,2) NOT NULL
          );
          
          CREATE TABLE IF NOT EXISTS settings (
            key VARCHAR(255) PRIMARY KEY,
            value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE TABLE IF NOT EXISTS advertisements (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT,
            image_url VARCHAR(500),
            start_date DATE,
            end_date DATE,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `;
        await client.query(basicSchema);
      }

      client.release();
      await newDb.end();
    }

    // Salvar configuração nas variáveis de ambiente (temporário)
    // Em produção, isso deveria ser salvo em um arquivo de configuração seguro
    process.env.DB_TYPE = type;
    process.env.DB_HOST = host;
    process.env.DB_PORT = port;
    process.env.DB_NAME = database;
    process.env.DB_USER = username;
    process.env.DB_PASSWORD = password;
    process.env.DB_SSL = ssl ? 'true' : 'false';

    res.json({ success: true, message: 'Banco de dados configurado com sucesso' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Rota para servir arquivos de áudio
app.use('/audio', express.static(path.join(__dirname, '..', 'ai-module')));

// Rota raiz para verificação rápida
app.get('/', (req, res) => {
  res.json({
    message: 'Interactive Restaurant Backend is Online 🚀',
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

// Iniciar o servidor
try {
  if (process.env.NODE_ENV !== 'test') {
    server.listen(port, () => {
      console.log(`\n🚀 Servidor backend rodando!`);
      console.log(`   - Local:    http://localhost:${port}`);

      const { networkInterfaces } = require('os');
      const nets = networkInterfaces();
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
          if (net.family === 'IPv4' && !net.internal) {
            console.log(`   - Network:  http://${net.address}:${port}`);
          }
        }
      }
      console.log(`\n`);
    });
  }
} catch (error) {
  console.error('Erro ao iniciar o servidor HTTP:', error);
}

server.on('error', (error) => {
  console.error('Erro no servidor HTTP:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Erro não capturado (uncaughtException): ', error);
  process.exit(1); // Exit the process after logging
});

module.exports = { app, server };