-- ============================================================
--  LANA & LINO — Seed de datos de prueba
--  Ejecutar con: mysql -u root -p lanaylino < seed_data.sql
--  O importar desde phpMyAdmin / HeidiSQL / DBeaver
--
--  Incluye:
--    - 6 categorías
--    - 12 productos con imágenes reales (Unsplash)
--    - Inventario por producto (talles + colores + stock)
--    - 1 usuario admin
--    - 2 usuarios regulares de prueba
-- ============================================================

USE lanaylino;

-- Configurar la codificación para evitar problemas con las tildes y ñ
SET NAMES utf8mb4;

-- ──────────────────────────────────────────────────────────
--  LIMPIAR DATOS PREVIOS (orden para respetar FK)
-- ──────────────────────────────────────────────────────────
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM detalle_pedido;
DELETE FROM pedido;
DELETE FROM inventario;
DELETE FROM producto;
DELETE FROM categoria;
DELETE FROM usuario;

ALTER TABLE detalle_pedido AUTO_INCREMENT = 1;
ALTER TABLE pedido AUTO_INCREMENT = 1;
ALTER TABLE inventario AUTO_INCREMENT = 1;
ALTER TABLE producto AUTO_INCREMENT = 1;
ALTER TABLE categoria AUTO_INCREMENT = 1;
ALTER TABLE usuario AUTO_INCREMENT = 1;
SET FOREIGN_KEY_CHECKS = 1;

-- ──────────────────────────────────────────────────────────
--  CATEGORÍAS
-- ──────────────────────────────────────────────────────────
INSERT INTO categoria (nombre) VALUES
  ('Remeras'),       -- 1
  ('Pantalones'),    -- 2
  ('Camperas'),      -- 3
  ('Vestidos'),      -- 4
  ('Accesorios'),    -- 5
  ('Calzado');       -- 6

-- ──────────────────────────────────────────────────────────
--  PRODUCTOS
--  Imágenes: Unsplash (URLs directas, sin cuenta necesaria)
--  Formato: https://images.unsplash.com/photo-<ID>?w=600&q=80
-- ──────────────────────────────────────────────────────────

INSERT INTO producto (nombre, descripcion, precio, genero, id_categoria, imagen) VALUES

-- Remeras (cat 1)
(
  'Remera Oversize Negra',
  'Remera de algodón 100% con corte oversized. Perfecta para el día a día, combina con todo. Lavado a máquina.',
  12500,
  'Unisex',
  1,
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80'
),
(
  'Remera Crop Blanca',
  'Remera cropped de algodón suave con terminación recta. Ideal para usar sola o como base de looks.',
  9800,
  'Mujer',
  1,
  'https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=600&q=80'
),
(
  'Remera Basica Rayada',
  'Clasica remera marinera de manga larga en azul y blanco. Tejido de punto jersey, comoda y versatil.',
  11200,
  'Hombre',
  1,
  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80'
),

-- Pantalones (cat 2)
(
  'Jean Straight Azul',
  'Jean de corte recto y tiro medio. Denim pesado de alta calidad, detalles de costura en contraste.',
  38000,
  'Unisex',
  2,
  'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80'
),
(
  'Pantalon de Lino Beige',
  'Pantalon fluido de lino 100%, ideal para el verano. Corte recto con bolsillos laterales y pretina elastica.',
  29500,
  'Mujer',
  2,
  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80'
),
(
  'Jogger Urbano Gris',
  'Pantalón jogger de algodón french terry. Puños en tobillo, cintura elástica con cordón. Estilo street.',
  24900,
  'Hombre',
  2,
  'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80'
),

-- Camperas (cat 3)
(
  'Campera de Cuero Negra',
  'Campera de cuero ecológico estilo biker. Cierre central, bolsillos con cierre laterales. Look rockero y atemporal.',
  89000,
  'Mujer',
  3,
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80'
),
(
  'Hoodie Premium Gris',
  'Buzo con capucha de algodón 320g. Interior frisado suave, canguro frontal y cordones metálicos.',
  32000,
  'Unisex',
  3,
  'https://images.unsplash.com/photo-1611911813383-67769b37a149?w=600&q=80'
),

-- Vestidos (cat 4)
(
  'Vestido Midi Floral',
  'Vestido a media pierna con estampa floral en fondo negro. Escote en V, manga corta globo. Tela liviana.',
  45000,
  'Mujer',
  4,
  'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80'
),
(
  'Vestido Lino Natural',
  'Vestido recto de lino en color natural. Corte minimal y relajado, largo a la rodilla. Ideal para el calor.',
  38500,
  'Mujer',
  4,
  'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80'
),

-- Accesorios (cat 5)
(
  'Gorra de Baseball Negra',
  'Gorra clásica con frente estructurado y cierre ajustable trasero. Logo bordado minimalista.',
  8500,
  'Unisex',
  5,
  'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80'
),

-- Calzado (cat 6)
(
  'Zapatillas Urbanas Blancas',
  'Zapatillas cuero vegano con suela de goma vulcanizada. Diseño clean y minimalista, versátiles para todo outfit.',
  65000,
  'Unisex',
  6,
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80'
);

-- ──────────────────────────────────────────────────────────
--  INVENTARIO
--  Se agregan múltiples variantes (talle + color + stock)
--  por producto
-- ──────────────────────────────────────────────────────────

-- Producto 1: Remera Oversize Negra
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('S',  'Negro', 15, 1),
  ('M',  'Negro', 20, 1),
  ('L',  'Negro', 18, 1),
  ('XL', 'Negro', 10, 1),
  ('S',  'Blanco', 12, 1),
  ('M',  'Blanco', 16, 1),
  ('L',  'Blanco', 14, 1);

-- Producto 2: Remera Crop Blanca
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('XS', 'Blanco', 10, 2),
  ('S',  'Blanco', 15, 2),
  ('M',  'Blanco', 12, 2),
  ('L',  'Blanco', 8,  2),
  ('S',  'Rosa palo', 10, 2),
  ('M',  'Rosa palo', 10, 2);

-- Producto 3: Remera Básica Rayada
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('S',  'Azul/Blanco', 8,  3),
  ('M',  'Azul/Blanco', 12, 3),
  ('L',  'Azul/Blanco', 10, 3),
  ('XL', 'Azul/Blanco', 6,  3),
  ('M',  'Negro/Blanco', 8, 3),
  ('L',  'Negro/Blanco', 8, 3);

-- Producto 4: Jean Straight Azul
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('38', 'Azul oscuro', 8,  4),
  ('40', 'Azul oscuro', 12, 4),
  ('42', 'Azul oscuro', 10, 4),
  ('44', 'Azul oscuro', 6,  4),
  ('46', 'Azul oscuro', 4,  4),
  ('40', 'Negro', 8,  4),
  ('42', 'Negro', 8,  4),
  ('44', 'Negro', 6,  4);

-- Producto 5: Pantalón de Lino Beige
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('S',  'Beige', 10, 5),
  ('M',  'Beige', 12, 5),
  ('L',  'Beige', 10, 5),
  ('XL', 'Beige', 6,  5),
  ('S',  'Blanco', 8, 5),
  ('M',  'Blanco', 8, 5),
  ('L',  'Blanco', 6, 5);

-- Producto 6: Jogger Urbano Gris
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('S',  'Gris', 10, 6),
  ('M',  'Gris', 15, 6),
  ('L',  'Gris', 12, 6),
  ('XL', 'Gris', 8,  6),
  ('M',  'Negro', 12, 6),
  ('L',  'Negro', 10, 6),
  ('XL', 'Negro', 6,  6);

-- Producto 7: Campera de Cuero Negra
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('XS', 'Negro', 5, 7),
  ('S',  'Negro', 8, 7),
  ('M',  'Negro', 8, 7),
  ('L',  'Negro', 5, 7),
  ('S',  'Marrón', 4, 7),
  ('M',  'Marrón', 4, 7);

-- Producto 8: Hoodie Premium Gris
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('S',  'Gris', 12, 8),
  ('M',  'Gris', 18, 8),
  ('L',  'Gris', 15, 8),
  ('XL', 'Gris', 10, 8),
  ('XXL','Gris', 6,  8),
  ('S',  'Negro', 10, 8),
  ('M',  'Negro', 15, 8),
  ('L',  'Negro', 12, 8),
  ('S',  'Crema', 8,  8),
  ('M',  'Crema', 8,  8);

-- Producto 9: Vestido Midi Floral
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('XS', 'Negro floral', 6,  9),
  ('S',  'Negro floral', 10, 9),
  ('M',  'Negro floral', 10, 9),
  ('L',  'Negro floral', 6,  9),
  ('XL', 'Negro floral', 4,  9);

-- Producto 10: Vestido Lino Natural
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('XS', 'Natural', 5, 10),
  ('S',  'Natural', 8, 10),
  ('M',  'Natural', 8, 10),
  ('L',  'Natural', 6, 10),
  ('S',  'Arena',   6, 10),
  ('M',  'Arena',   6, 10),
  ('L',  'Arena',   4, 10);

-- Producto 11: Gorra de Baseball Negra
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('Única', 'Negro', 25, 11),
  ('Única', 'Blanco', 20, 11),
  ('Única', 'Beige', 15, 11),
  ('Única', 'Rojo', 10, 11);

-- Producto 12: Zapatillas Urbanas Blancas
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('37', 'Blanco', 6,  12),
  ('38', 'Blanco', 8,  12),
  ('39', 'Blanco', 10, 12),
  ('40', 'Blanco', 10, 12),
  ('41', 'Blanco', 8,  12),
  ('42', 'Blanco', 8,  12),
  ('43', 'Blanco', 6,  12),
  ('44', 'Blanco', 4,  12),
  ('39', 'Negro',  6,  12),
  ('40', 'Negro',  8,  12),
  ('41', 'Negro',  6,  12),
  ('42', 'Negro',  6,  12);

-- ──────────────────────────────────────────────────────────
--  USUARIOS
--  password: se guarda en texto plano (backend no usa bcrypt)
-- ──────────────────────────────────────────────────────────
INSERT INTO usuario (nombre, apellido, email, password, direccion, telefono, rol) VALUES
  ('Admin',  'Lana',   'admin@lanaylino.com', 'admin123', 'Oficina Central 1', '+5491100000001', 'admin'),
  ('María',  'García', 'maria@demo.com',      '1234',     'Av. Rivadavia 1234', '+5491122334455', 'cliente'),
  ('Carlos', 'López',  'carlos@demo.com',     '1234',     'Calle Falsa 123',   '+5491166778899', 'cliente');

-- ──────────────────────────────────────────────────────────
--  VERIFICACIÓN (filas cargadas)
-- ──────────────────────────────────────────────────────────
SELECT 'categorias' AS tabla, COUNT(*) AS registros FROM categoria
UNION ALL
SELECT 'productos',  COUNT(*) FROM producto
UNION ALL
SELECT 'inventario', COUNT(*) FROM inventario
UNION ALL
SELECT 'usuarios',   COUNT(*) FROM usuario;
