-- Schema SQLite compatível para Interactive Restaurantes
-- Criado para substituir PostgreSQL

-- Tabela de pratos
CREATE TABLE IF NOT EXISTS dishes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id INTEGER,
    image_url VARCHAR(500),
    is_available BOOLEAN DEFAULT 1,
    preparation_time INTEGER,
    calories INTEGER,
    is_spicy BOOLEAN DEFAULT 0,
    is_vegetarian BOOLEAN DEFAULT 0,
    is_gluten_free BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_number INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    total_price DECIMAL(10,2) NOT NULL,
    prep_time_seconds INTEGER DEFAULT 1200,
    cancel_until DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de itens do pedido
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    dish_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    item_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES dishes(id)
);

-- Tabela de configurações
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de anúncios
CREATE TABLE IF NOT EXISTS advertisements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    image_url VARCHAR(500),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inserir configurações padrão
INSERT OR IGNORE INTO settings (key, value) VALUES 
('restaurant_name', 'Restaurante Interativo'),
('menu_theme', 'default'),
('tables_count', '20'),
('open_time', '09:00'),
('close_time', '22:00'),
('screen_lock_enabled', 'false'),
('screen_lock_pin', '');

-- Inserir alguns pratos de exemplo
INSERT OR IGNORE INTO dishes (name, description, price, category_id, is_available) VALUES 
('Pizza Margherita', 'Pizza com molho de tomate, mussarela e manjericão', 25.00, 1, 1),
('Hambúrguer Clássico', 'Hambúrguer com carne, alface, tomate e queijo', 18.50, 2, 1),
('Salada Caesar', 'Salada com alface, croutons, parmesão e molho caesar', 15.00, 3, 1),
('Coca-Cola', 'Refrigerante 350ml', 5.00, 4, 1),
('Água Mineral', 'Água mineral 500ml', 3.00, 4, 1),
('Suco de Laranja', 'Suco natural de laranja', 6.00, 4, 1);

-- Tabela de chamadas de garçom
CREATE TABLE IF NOT EXISTS waiter_calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_number INTEGER NOT NULL,
    reason VARCHAR(100) NOT NULL DEFAULT 'Chamado Geral',
    status VARCHAR(50) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de usuários (Admin)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inserir categorias padr�o
INSERT OR IGNORE INTO categories (name) VALUES 
('Pizzas'),
('Hamb�rgueres'),
('Saladas'),
('Bebidas'),
('Sobremesas');

