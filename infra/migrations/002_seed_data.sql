-- 002_seed_data.sql
-- KIIROX Development Seed Data

-- 1. Categorías iniciales
INSERT INTO categories (id, name, slug, description, sort_order, is_active)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Geles Energéticos', 'geles-energeticos', 'Geles de absorción rápida para running, ciclismo y deportes de resistencia', 1, TRUE),
  ('c1000000-0000-0000-0000-000000000002', 'Proteínas & Recuperadores', 'proteinas-recuperadores', 'Proteínas de suero, aisladas y fórmulas avanzadas para recuperación muscular', 2, TRUE),
  ('c1000000-0000-0000-0000-000000000003', 'Hidratación & Electrolitos', 'hidratacion-electrolitos', 'Sales minerales, bebidas isotónicas y tabletas efervescentes', 3, TRUE),
  ('c1000000-0000-0000-0000-000000000004', 'Barras & Snacks', 'barras-snacks', 'Barras de proteína y carbohidratos naturales para entrenamientos exigentes', 4, TRUE),
  ('c1000000-0000-0000-0000-000000000005', 'Vitaminas & Salud', 'vitaminas-salud', 'Micronutrientes, Omega 3 y adaptógenos de alto rendimiento', 5, TRUE)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 2. Productos iniciales
INSERT INTO products (
  id, sku, name, slug, brand, short_description, description,
  price, currency, stock, low_stock_threshold, status,
  is_featured, is_new, sort_order, category_id
)
VALUES
  (
    'b1000000-0000-0000-0000-000000000001',
    'GEL-MAURTEN-100',
    'Gel Maurten 100 Hydrogel',
    'gel-maurten-100-hydrogel',
    'Maurten',
    'Gel energético con tecnología de hidrogel para máxima absorción estomacal sin irritación.',
    'Construido con tecnología de hidrogel patentada, contiene 25 gramos de carbohidratos por porción en una relación 0.8:1 de fructosa a glucosa. Sin saborizantes ni colorantes artificiales añadidos.',
    4800.00,
    'ARS',
    50,
    10,
    'published',
    TRUE,
    TRUE,
    1,
    'c1000000-0000-0000-0000-000000000001'
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    'GEL-SIS-ISOTONIC-APPLE',
    'SiS GO Isotonic Gel Manzana 60ml',
    'sis-go-isotonic-gel-manzana',
    'Science in Sport',
    'El primer gel isotónico del mundo. No requiere agua adicional para su asimilación.',
    'Proporciona 22 gramos de carbohidratos de asimilación inmediata. Fórmula verdaderamente isotónica que se digiere rápidamente en el estómago.',
    3200.00,
    'ARS',
    40,
    8,
    'published',
    TRUE,
    FALSE,
    2,
    'c1000000-0000-0000-0000-000000000001'
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'PROT-ON-GOLD-WHEY-2LB',
    'Optimum Nutrition Gold Standard 100% Whey 2lb',
    'on-gold-standard-whey-2lb',
    'Optimum Nutrition',
    'La proteína de suero aislada número 1 en el mundo para reconstrucción muscular.',
    'Cada porción aporta 24 gramos de proteína con aislado de suero de leche primario, 5.5 gramos de BCAAs naturales y 4 gramos de glutamina.',
    52000.00,
    'ARS',
    15,
    3,
    'published',
    TRUE,
    FALSE,
    1,
    'c1000000-0000-0000-0000-000000000002'
  ),
  (
    'b1000000-0000-0000-0000-000000000004',
    'HYD-SKRATCH-LEMON-440G',
    'Skratch Labs Sport Hydration Drink Mix Limón 440g',
    'skratch-labs-hydration-limon-440g',
    'Skratch Labs',
    'Mezcla hidratante con fruta real, electrolitos esenciales y azúcar de caña.',
    'Creado para reemplazar exactamente lo que pierdes al sudar. Sin saborizantes sintéticos, colorantes ni edulcorantes artificiales.',
    28500.00,
    'ARS',
    25,
    5,
    'published',
    FALSE,
    TRUE,
    1,
    'c1000000-0000-0000-0000-000000000003'
  ),
  (
    'b1000000-0000-0000-0000-000000000005',
    'HYD-SALTSTICK-CAPS-100',
    'SaltStick Electrolyte Caps 100 Cápsulas',
    'saltstick-electrolyte-caps-100',
    'SaltStick',
    'Cápsulas de sales minerales balanceadas para prevenir calambres y deshidratación.',
    'Fórmula de electrolitos quelados de alta biodisponibilidad que imita el perfil de pérdidas minerales por transpiración.',
    21000.00,
    'ARS',
    18,
    4,
    'published',
    FALSE,
    FALSE,
    2,
    'c1000000-0000-0000-0000-000000000003'
  )
ON CONFLICT (slug) DO UPDATE
SET price = EXCLUDED.price, stock = EXCLUDED.stock, status = EXCLUDED.status;

-- 3. Imágenes de muestra en Cloudinary
INSERT INTO product_images (product_id, public_id, public_url, alt_text, sort_order, is_primary)
VALUES
  (
    'b1000000-0000-0000-0000-000000000001',
    'kiirox/products/maurten-gel-100',
    'https://res.cloudinary.com/demo/image/upload/v1/kiirox/products/maurten-gel-100.jpg',
    'Gel Maurten 100 Hydrogel Pack',
    1,
    TRUE
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    'kiirox/products/sis-isotonic-apple',
    'https://res.cloudinary.com/demo/image/upload/v1/kiirox/products/sis-isotonic-apple.jpg',
    'SiS GO Isotonic Gel Manzana',
    1,
    TRUE
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'kiirox/products/on-gold-whey-2lb',
    'https://res.cloudinary.com/demo/image/upload/v1/kiirox/products/on-gold-whey-2lb.jpg',
    'Optimum Nutrition Gold Standard Whey 2lb',
    1,
    TRUE
  )
ON CONFLICT DO NOTHING;

-- 4. Movimiento de stock inicial de auditoría
INSERT INTO inventory_movements (product_id, delta, movement_type, reason, created_at)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 50, 'initial_stock', 'Carga de stock inicial seed', NOW()),
  ('b1000000-0000-0000-0000-000000000002', 40, 'initial_stock', 'Carga de stock inicial seed', NOW()),
  ('b1000000-0000-0000-0000-000000000003', 15, 'initial_stock', 'Carga de stock inicial seed', NOW()),
  ('b1000000-0000-0000-0000-000000000004', 25, 'initial_stock', 'Carga de stock inicial seed', NOW()),
  ('b1000000-0000-0000-0000-000000000005', 18, 'initial_stock', 'Carga de stock inicial seed', NOW())
ON CONFLICT DO NOTHING;
