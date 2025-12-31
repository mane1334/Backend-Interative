-- Schema para o Ads Module
-- Banco de dados: restaurant_ads

-- Tabela de restaurantes (para referência)
CREATE TABLE IF NOT EXISTS restaurants (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela principal de anúncios
CREATE TABLE IF NOT EXISTS ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(500),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    restaurant_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    CONSTRAINT valid_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
    CONSTRAINT valid_priority CHECK (priority >= 1 AND priority <= 5)
);

-- Tabela de categorias de anúncios
CREATE TABLE IF NOT EXISTS ad_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de relacionamento entre anúncios e categorias
CREATE TABLE IF NOT EXISTS ad_category_relations (
    ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES ad_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (ad_id, category_id)
);

-- Tabela de estatísticas de visualizações
CREATE TABLE IF NOT EXISTS ad_views (
    id SERIAL PRIMARY KEY,
    ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    viewer_ip INET,
    user_agent TEXT,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50) DEFAULT 'web'
);

-- Tabela de cliques nos anúncios
CREATE TABLE IF NOT EXISTS ad_clicks (
    id SERIAL PRIMARY KEY,
    ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    clicker_ip INET,
    user_agent TEXT,
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    target_url VARCHAR(500),
    source VARCHAR(50) DEFAULT 'web'
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ads_restaurant_id ON ads(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_ads_is_active ON ads(is_active);
CREATE INDEX IF NOT EXISTS idx_ads_priority ON ads(priority);
CREATE INDEX IF NOT EXISTS idx_ads_dates ON ads(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ads_created_at ON ads(created_at);

-- Inserir dados de exemplo
INSERT INTO restaurants (id, name, description) VALUES
    ('rest1', 'Restaurante Exemplo 1', 'Restaurante de teste para desenvolvimento'),
    ('rest2', 'Restaurante Exemplo 2', 'Segundo restaurante de teste'),
    ('rest3', 'Restaurante Exemplo 3', 'Terceiro restaurante de teste')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ad_categories (name, description, color) VALUES
    ('Promoção', 'Ofertas e descontos especiais', '#EF4444'),
    ('Novidade', 'Novos pratos e produtos', '#10B981'),
    ('Evento', 'Eventos especiais e festivais', '#8B5CF6'),
    ('Horário', 'Promoções por horário', '#F59E0B'),
    ('Delivery', 'Ofertas para entrega', '#06B6D4')
ON CONFLICT (name) DO NOTHING;
