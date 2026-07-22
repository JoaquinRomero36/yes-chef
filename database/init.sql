CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(500) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    role_id UUID NOT NULL REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id),
    image_url VARCHAR(500),
    is_available BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number INT NOT NULL UNIQUE,
    capacity INT NOT NULL DEFAULT 4,
    qr_code VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID REFERENCES tables(id),
    user_id UUID REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    total DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_products_category_id ON products(category_id);

-- Seed: Roles
INSERT INTO roles (name, description) VALUES
  ('admin', 'Administrador del restaurante'),
  ('waiter', 'Mozo / Camarero'),
  ('kitchen', 'Cocina'),
  ('client', 'Cliente')
ON CONFLICT (name) DO NOTHING;

-- Seed: Categories
WITH cat AS (
  INSERT INTO categories (name, description, display_order) VALUES
    ('Entradas', 'Para empezar con buen gusto', 1),
    ('Ensaladas', 'Frescas y gourmet', 2),
    ('Pastas', 'Hechas a mano', 3),
    ('Carnes', 'Cortes seleccionados', 4),
    ('Pescados y Mariscos', 'Del Río a la mesa', 5),
    ('Platos Especiales', 'Creación del chef', 6),
    ('Postres', 'Dulce final', 7),
    ('Bebidas', 'Para acompañar', 8)
  RETURNING id, name
)
-- Seed: Products (Entradas)
INSERT INTO products (name, description, price, category_id) VALUES
  ('Carpaccio de res', 'Finas láminas de res con parmesano, rúcula, alcaparras y dressing de limón', 8500, (SELECT id FROM cat WHERE name = 'Entradas')),
  ('Bruschetta de tomate confit', 'Pan artesanal con tomates confit, albahaca fresca, burrata y reducción balsámica', 6200, (SELECT id FROM cat WHERE name = 'Entradas')),
  ('Langostinos al ajillo', 'Langostinos salteados con ajo, perejil, vino blanco y un toque de ají molido', 9800, (SELECT id FROM cat WHERE name = 'Entradas')),
  ('Sopa de cebolla gratinada', 'Sopa de cebolla caramelizada con crutones y queso gruyère gratinado', 5600, (SELECT id FROM cat WHERE name = 'Entradas')),
  ('Tartar de salmón', 'Salmón fresco cortado a cuchillo con palta, mango, cebolla morada y salsa de soja', 10500, (SELECT id FROM cat WHERE name = 'Entradas')),
  ('Provoleta', 'Provoleta a la parrilla con orégano, tomates secos y aceitunas negras', 7200, (SELECT id FROM cat WHERE name = 'Entradas')),
  -- Ensaladas
  ('Ensalada César', 'Pollo braseado, lechuga romana, crutones, parmesano y aderezo césar casero', 6800, (SELECT id FROM cat WHERE name = 'Ensaladas')),
  ('Ensalada de rúcula y peras', 'Rúcula fresca, peras caramelizadas, parmesano en lascas, nueces y vinagreta de miel', 6200, (SELECT id FROM cat WHERE name = 'Ensaladas')),
  ('Ensalada Waldorf', 'Manzana verde, apio, nueces, uvas, pollo y mayonesa de mostaza', 6500, (SELECT id FROM cat WHERE name = 'Ensaladas')),
  ('Ensalada de quinoa', 'Quinoa con vegetales asados, palta, garbanzos, pepino y dressing de limón', 5900, (SELECT id FROM cat WHERE name = 'Ensaladas')),
  -- Pastas
  ('Espaguetis con salsa de champiñones', '⭐ ESPECIALIDAD DE LA CASA — Espaguetis artesanales con salsa cremosa de champiñones portobello, hongos de temporada, ajo, perejil y un toque de trufa', 11200, (SELECT id FROM cat WHERE name = 'Pastas')),
  ('Ravioles de ricotta y espinaca', 'Ravioles caseros rellenos de ricotta y espinaca con salsa de nueces y manteca de salvia', 9800, (SELECT id FROM cat WHERE name = 'Pastas')),
  ('Fettuccine Alfredo', 'Fettuccine con salsa Alfredo de hongos porcini, parmesano y perejil fresco', 10200, (SELECT id FROM cat WHERE name = 'Pastas')),
  ('Ñoquis de papa', 'Ñoquis de papa caseros con salsa de tomates cherry, albahaca y queso de cabra', 8500, (SELECT id FROM cat WHERE name = 'Pastas')),
  ('Lasagna bolognesa', 'Capas de pasta artesanal con ragú bolognesa, bechamel y parmesano gratinado', 9500, (SELECT id FROM cat WHERE name = 'Pastas')),
  ('Risotto de hongos', 'Risotto cremoso de hongos de temporada con parmesano, manteca y un toque de trufa', 10800, (SELECT id FROM cat WHERE name = 'Pastas')),
  -- Carnes
  ('Bife de chorizo', 'Bife de chorizo 300g con chimichurri casero, papas fritas y pimientos asados', 14500, (SELECT id FROM cat WHERE name = 'Carnes')),
  ('Ojo de bife', 'Ojo de bife 350g con puré de batatas, cebolla caramelizada y demi-glace', 16800, (SELECT id FROM cat WHERE name = 'Carnes')),
  ('Lomo saltado', 'Tiras de lomo salteadas con cebolla, tomate, ají y papas fritas', 12500, (SELECT id FROM cat WHERE name = 'Carnes')),
  ('Cordero braseado', 'Cordero braseado por horas con reducción de vino tinto, papas al romero y verduras de estación', 15800, (SELECT id FROM cat WHERE name = 'Carnes')),
  ('Pollo relleno', 'Pechuga de pollo rellena de espinaca, queso brie y tomates secos, con salsa de mostaza y miel', 11200, (SELECT id FROM cat WHERE name = 'Carnes')),
  ('Costillas BBQ', 'Costillas de cerdo glaseadas con BBQ casera, coleslaw y papas rústicas', 13800, (SELECT id FROM cat WHERE name = 'Carnes')),
  -- Pescados y Mariscos
  ('Salmón glaseado', 'Salmón glaseado con miel y mostaza, acompañado de espárragos y puré de coliflor', 14200, (SELECT id FROM cat WHERE name = 'Pescados y Mariscos')),
  ('Paella de mariscos', 'Paella valenciana con camarones, mejillones, calamares, y arroz bomba', 15800, (SELECT id FROM cat WHERE name = 'Pescados y Mariscos')),
  ('Ceviche de corvina', 'Corvina fresca marinada en limón, cebolla morada, ají limo y camote', 9800, (SELECT id FROM cat WHERE name = 'Pescados y Mariscos')),
  ('Merluza negra', 'Merluza negra con risotto de limón, alcaparras y manteca de eneldo', 16500, (SELECT id FROM cat WHERE name = 'Pescados y Mariscos')),
  -- Platos Especiales
  ('Wok de vegetales', 'Wok de vegetales salteados con tofu, jengibre, salsa de soja y semillas de sésamo', 8200, (SELECT id FROM cat WHERE name = 'Platos Especiales')),
  ('Ossobuco', 'Ossobuco braseado con polenta cremosa, gremolata y reducción de vino tinto', 15500, (SELECT id FROM cat WHERE name = 'Platos Especiales')),
  ('Curry tailandés', 'Curry de coco con pollo, vegetales, arroz jazmín y hierba limón', 10800, (SELECT id FROM cat WHERE name = 'Platos Especiales')),
  -- Postres
  ('Tiramisú', 'Tiramisú clásico con mascarpone, café y cacao', 5200, (SELECT id FROM cat WHERE name = 'Postres')),
  ('Cheesecake de maracuyá', 'Cheesecake cremoso con coulis de maracuyá y base de galletitas', 5600, (SELECT id FROM cat WHERE name = 'Postres')),
  ('Volcán de chocolate', 'Volcán de chocolate con centro fundido y helado de vainilla', 6200, (SELECT id FROM cat WHERE name = 'Postres')),
  ('Crème brûlée', 'Crème brûlée de vainilla con caramelo crocante y frutos rojos', 5500, (SELECT id FROM cat WHERE name = 'Postres')),
  ('Panna cotta', 'Panna cotta de vainilla con coulis de frutos rojos y menta fresca', 5200, (SELECT id FROM cat WHERE name = 'Postres')),
  ('Mousse de chocolate blanco', 'Mousse de chocolate blanco con coulis de frutos rojos y crocante de almendras', 5800, (SELECT id FROM cat WHERE name = 'Postres')),
  ('Flan casero', 'Flan casero con dulce de leche y crema batida', 4800, (SELECT id FROM cat WHERE name = 'Postres')),
  ('Helado artesanal', 'Dos bochas de helado artesanal (vainilla, chocolate, dulce de leche o frutilla)', 4200, (SELECT id FROM cat WHERE name = 'Postres')),
  ('Brownie con helado', 'Brownie de chocolate con nueces, helado de vainilla y salsa de dulce de leche', 5800, (SELECT id FROM cat WHERE name = 'Postres')),
  ('Tarta de limón', 'Tarta de limón con merengue italiano y base sablée', 5200, (SELECT id FROM cat WHERE name = 'Postres')),
  -- Bebidas
  ('Agua mineral', 'Agua mineral sin gas 500ml', 1800, (SELECT id FROM cat WHERE name = 'Bebidas')),
  ('Gaseosa', 'Coca-Cola, Sprite o Fanta 350ml', 2000, (SELECT id FROM cat WHERE name = 'Bebidas')),
  ('Jugo natural', 'Jugo de naranja o limonada natural', 2800, (SELECT id FROM cat WHERE name = 'Bebidas')),
  ('Café', 'Café expreso o americano', 2200, (SELECT id FROM cat WHERE name = 'Bebidas')),
  ('Té', 'Té negro, verde o de hierbas', 1800, (SELECT id FROM cat WHERE name = 'Bebidas'));
