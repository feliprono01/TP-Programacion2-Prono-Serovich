-- ============================================================
--  LANA & LINO — Script Completo (Único)
--  Combina: lanaylino.sql + scriptTablaCarrito.sql + seed_data.sql
--
--  Pasos:
--    1. Crear la base de datos "lanaylino" si no existe
--    2. Crear todas las tablas (incluida `carrito`)
--    3. Cargar datos: 6 categorías, 30 productos, inventario,
--       usuarios (1 admin + 2 demo)
--
--  Uso rápido:
--    mysql -u root -p < setup_completo.sql
--  O importar desde phpMyAdmin / HeidiSQL / DBeaver
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- ============================================================
--  BASE DE DATOS
-- ============================================================
CREATE DATABASE IF NOT EXISTS `lanaylino`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE `lanaylino`;

-- ============================================================
--  TABLAS
-- ============================================================

--
-- Tabla: categoria
--
CREATE TABLE IF NOT EXISTS `categoria` (
  `id_categoria` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id_categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tabla: usuario
--
CREATE TABLE IF NOT EXISTS `usuario` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `email` varchar(50) NOT NULL,
  `password` varchar(20) NOT NULL,
  `direccion` varchar(50) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `rol` varchar(20) NOT NULL,
  PRIMARY KEY (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tabla: producto
--
CREATE TABLE IF NOT EXISTS `producto` (
  `id_producto` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `genero` varchar(20) NOT NULL,
  `id_categoria` int(11) NOT NULL,
  `imagen` varchar(255) NOT NULL,
  PRIMARY KEY (`id_producto`),
  KEY `id_categoria` (`id_categoria`),
  CONSTRAINT `producto_ibfk_1` FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id_categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tabla: inventario
--
CREATE TABLE IF NOT EXISTS `inventario` (
  `id_inventario` int(11) NOT NULL AUTO_INCREMENT,
  `talle` varchar(20) NOT NULL,
  `color` varchar(50) NOT NULL,
  `stock` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  PRIMARY KEY (`id_inventario`),
  KEY `id_producto` (`id_producto`),
  CONSTRAINT `inventario_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `producto` (`id_producto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tabla: pedido
--
CREATE TABLE IF NOT EXISTS `pedido` (
  `id_pedido` int(11) NOT NULL AUTO_INCREMENT,
  `fecha_pedido` date NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `metodo_pago` varchar(20) NOT NULL,
  `estado` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  PRIMARY KEY (`id_pedido`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `pedido_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tabla: detalle_pedido
--
CREATE TABLE IF NOT EXISTS `detalle_pedido` (
  `id_detalle_pedido` int(11) NOT NULL AUTO_INCREMENT,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `id_pedido` int(11) NOT NULL,
  `id_inventario` int(11) NOT NULL,
  PRIMARY KEY (`id_detalle_pedido`),
  KEY `id_pedido` (`id_pedido`),
  KEY `id_inventario` (`id_inventario`),
  CONSTRAINT `detalle_pedido_ibfk_1` FOREIGN KEY (`id_pedido`) REFERENCES `pedido` (`id_pedido`),
  CONSTRAINT `detalle_pedido_ibfk_2` FOREIGN KEY (`id_inventario`) REFERENCES `inventario` (`id_inventario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tabla: favorito
--
CREATE TABLE IF NOT EXISTS `favorito` (
  `id_favorito` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  PRIMARY KEY (`id_favorito`),
  KEY `id_usuario` (`id_usuario`),
  KEY `id_producto` (`id_producto`),
  CONSTRAINT `favorito_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`),
  CONSTRAINT `favorito_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `producto` (`id_producto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tabla: carrito  (scriptTablaCarrito.sql)
--
CREATE TABLE IF NOT EXISTS `carrito` (
  `id_carrito` int(11) NOT NULL AUTO_INCREMENT,
  `id_inventario` int(11) DEFAULT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_carrito`),
  KEY `id_inventario` (`id_inventario`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `carrito_ibfk_1` FOREIGN KEY (`id_inventario`) REFERENCES `inventario` (`id_inventario`),
  CONSTRAINT `carrito_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;

-- ============================================================
--  DATOS DE PRUEBA (SEED)
-- ============================================================

-- Limpiar datos previos respetando FK
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM carrito;
DELETE FROM detalle_pedido;
DELETE FROM pedido;
DELETE FROM favorito;
DELETE FROM inventario;
DELETE FROM producto;
DELETE FROM categoria;
DELETE FROM usuario;

ALTER TABLE carrito         AUTO_INCREMENT = 1;
ALTER TABLE detalle_pedido  AUTO_INCREMENT = 1;
ALTER TABLE pedido          AUTO_INCREMENT = 1;
ALTER TABLE favorito        AUTO_INCREMENT = 1;
ALTER TABLE inventario      AUTO_INCREMENT = 1;
ALTER TABLE producto        AUTO_INCREMENT = 1;
ALTER TABLE categoria       AUTO_INCREMENT = 1;
ALTER TABLE usuario         AUTO_INCREMENT = 1;
SET FOREIGN_KEY_CHECKS = 1;

-- ──────────────────────────────────────────────────────────
--  CATEGORÍAS  (6 categorías)
-- ──────────────────────────────────────────────────────────
INSERT INTO categoria (nombre) VALUES
  ('Remeras'),       -- id 1
  ('Pantalones'),    -- id 2
  ('Camperas'),      -- id 3
  ('Vestidos'),      -- id 4
  ('Accesorios'),    -- id 5
  ('Calzado');       -- id 6

-- ──────────────────────────────────────────────────────────
--  PRODUCTOS  (30 productos)
-- ──────────────────────────────────────────────────────────

INSERT INTO producto (nombre, descripcion, precio, genero, id_categoria, imagen) VALUES

-- ── REMERAS (cat 1) ── productos 1-7 ──────────────────────
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
  'Remera Básica Rayada',
  'Clásica remera marinera de manga larga en azul y blanco. Tejido de punto jersey, cómoda y versátil.',
  11200,
  'Hombre',
  1,
  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80'
),
(
  'Remera Estampada Vintage',
  'Remera con estampado retro de los años 90. Algodón peinado suave, corte regular. Edición limitada.',
  14900,
  'Unisex',
  1,
  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80'
),
(
  'Remera Polo Piqué',
  'Polo de algodón piqué con cuello y botones. Look smart-casual ideal para el trabajo o salidas.',
  18500,
  'Hombre',
  1,
  'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80'
),
(
  'Remera Tie Dye Multicolor',
  'Remera teñida a mano con técnica tie dye. Cada prenda es única. Algodón 100%, corte holgado.',
  13200,
  'Mujer',
  1,
  'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80'
),
(
  'Remera Manga Larga Termal',
  'Remera térmica de manga larga ideal para el frío. Tejido stretch que acompaña el movimiento.',
  16800,
  'Unisex',
  1,
  'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80'
),

-- ── PANTALONES (cat 2) ── productos 8-12 ──────────────────
(
  'Jean Straight Azul',
  'Jean de corte recto y tiro medio. Denim pesado de alta calidad, detalles de costura en contraste.',
  38000,
  'Unisex',
  2,
  'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80'
),
(
  'Pantalón de Lino Beige',
  'Pantalón fluido de lino 100%, ideal para el verano. Corte recto con bolsillos laterales y pretina elástica.',
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
(
  'Pantalón Cargo Verde',
  'Pantalón cargo de gabardina con bolsillos laterales. Tiro medio, cierre con botón y cremallera.',
  34500,
  'Unisex',
  2,
  'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80'
),
(
  'Bermuda Denim Azul',
  'Bermuda de jean clásica hasta la rodilla. Denim liviano, ideal para días cálidos. Cintura con presillas.',
  19900,
  'Hombre',
  2,
  'https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=600&q=80'
),

-- ── CAMPERAS (cat 3) ── productos 13-17 ───────────────────
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
(
  'Campera Puffer Acolchada',
  'Campera acolchada ultraliviana con relleno sintético. Resistente al viento, ideal para el invierno.',
  75000,
  'Unisex',
  3,
  'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=600&q=80'
),
(
  'Buzo Cuello Redondo',
  'Buzo básico de felpa con cuello redondo. Algodón 80% poliéster 20%. Suave y duradero.',
  28500,
  'Unisex',
  3,
  'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80'
),
(
  'Campera Rompevientos',
  'Campera rompevientos de nylon liviana y resistente al agua. Corte oversize, capucha plegable en cuello.',
  55000,
  'Hombre',
  3,
  'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80'
),

-- ── VESTIDOS (cat 4) ── productos 18-22 ───────────────────
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
(
  'Vestido Mini Satinado',
  'Vestido mini de tela satinada con tirantes finos. Elegante y versátil, ideal para salidas nocturnas.',
  42000,
  'Mujer',
  4,
  'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&q=80'
),
(
  'Vestido Boho Bordado',
  'Vestido largo estilo boho con bordados en el pecho y mangas. Tela liviana con caída suave.',
  52000,
  'Mujer',
  4,
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80'
),
(
  'Vestido Camisero Stripes',
  'Vestido camisero a rayas con botones delanteros y cinturón a tono. Largo midi, ideal para el día.',
  47500,
  'Mujer',
  4,
  'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&q=80'
),

-- ── ACCESORIOS (cat 5) ── productos 23-26 ─────────────────
(
  'Gorra de Baseball Negra',
  'Gorra clásica con frente estructurado y cierre ajustable trasero. Logo bordado minimalista.',
  8500,
  'Unisex',
  5,
  'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80'
),
(
  'Cinturón de Cuero Marrón',
  'Cinturón de cuero genuino con hebilla metálica dorada. Disponible en distintos largos. Clásico y duradero.',
  15000,
  'Unisex',
  5,
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80'
),
(
  'Bolso Tote Canvas',
  'Bolso tipo tote de canvas resistente. Asas largas, bolsillo interior con cierre. Impresión minimalista.',
  22000,
  'Mujer',
  5,
  'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80'
),
(
  'Bufanda de Lana Merino',
  'Bufanda ancha de lana merino extra suave. Ideal para el invierno. Disponible en varios colores.',
  18500,
  'Unisex',
  5,
  'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600&q=80'
),

-- ── CALZADO (cat 6) ── productos 27-30 ────────────────────
(
  'Zapatillas Urbanas Blancas',
  'Zapatillas cuero vegano con suela de goma vulcanizada. Diseño clean y minimalista, versátiles para todo outfit.',
  65000,
  'Unisex',
  6,
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80'
),
(
  'Botas Chelsea Negras',
  'Botas Chelsea de cuero ecológico con elástico lateral. Suela de goma gruesa, caña al tobillo.',
  98000,
  'Mujer',
  6,
  'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80'
),
(
  'Mocasines Marrones',
  'Mocasines de cuero genuino con detalle de hebilla. Suela de cuero cosida. Elegantes y cómodos.',
  72000,
  'Hombre',
  6,
  'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=600&q=80'
),
(
  'Ojotas de Goma',
  'Ojotas livianas de goma EVA con tira anatómica. Ideales para la playa o la pileta. Antideslizantes.',
  12000,
  'Unisex',
  6,
  'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600&q=80'
);

-- ──────────────────────────────────────────────────────────
--  INVENTARIO  (variantes por producto: talle + color + stock)
-- ──────────────────────────────────────────────────────────

-- Producto 1: Remera Oversize Negra
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('S',  'Negro',  15, 1),
  ('M',  'Negro',  20, 1),
  ('L',  'Negro',  18, 1),
  ('XL', 'Negro',  10, 1),
  ('S',  'Blanco', 12, 1),
  ('M',  'Blanco', 16, 1),
  ('L',  'Blanco', 14, 1);

-- Producto 2: Remera Crop Blanca
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('XS', 'Blanco',    10, 2),
  ('S',  'Blanco',    15, 2),
  ('M',  'Blanco',    12, 2),
  ('L',  'Blanco',    8,  2),
  ('S',  'Rosa',      10, 2),
  ('M',  'Rosa',      10, 2);

-- Producto 3: Remera Básica Rayada
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('S',  'Azul',  8,  3),
  ('M',  'Azul',  12, 3),
  ('L',  'Azul',  10, 3),
  ('XL', 'Azul',  6,  3),
  ('M',  'Negro', 8,  3),
  ('L',  'Negro', 8,  3);

-- Producto 4: Remera Estampada Vintage
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('S',  'Blanco', 10, 4),
  ('M',  'Blanco', 14, 4),
  ('L',  'Blanco', 10, 4),
  ('XL', 'Blanco', 6,  4),
  ('S',  'Negro',  8,  4),
  ('M',  'Negro',  10, 4),
  ('L',  'Negro',  8,  4);

-- Producto 5: Remera Polo Piqué
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('S',  'Blanco', 8,  5),
  ('M',  'Blanco', 12, 5),
  ('L',  'Blanco', 10, 5),
  ('XL', 'Blanco', 6,  5),
  ('S',  'Azul',   8,  5),
  ('M',  'Azul',   10, 5),
  ('L',  'Azul',   8,  5),
  ('M',  'Rojo',   6,  5),
  ('L',  'Rojo',   4,  5);

-- Producto 6: Remera Tie Dye Multicolor
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('XS', 'Multicolor', 5,  6),
  ('S',  'Multicolor', 8,  6),
  ('M',  'Multicolor', 10, 6),
  ('L',  'Multicolor', 8,  6),
  ('XL', 'Multicolor', 4,  6);

-- Producto 7: Remera Manga Larga Termal
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('S',  'Negro', 10, 7),
  ('M',  'Negro', 15, 7),
  ('L',  'Negro', 12, 7),
  ('XL', 'Negro', 8,  7),
  ('S',  'Gris',  8,  7),
  ('M',  'Gris',  10, 7),
  ('L',  'Gris',  8,  7);

-- Producto 8: Jean Straight Azul
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('38', 'Azul',  8,  8),
  ('40', 'Azul',  12, 8),
  ('42', 'Azul',  10, 8),
  ('44', 'Azul',  6,  8),
  ('46', 'Azul',  4,  8),
  ('40', 'Negro', 8,  8),
  ('42', 'Negro', 8,  8),
  ('44', 'Negro', 6,  8);

-- Producto 9: Pantalón de Lino Beige
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('S',  'Beige',  10, 9),
  ('M',  'Beige',  12, 9),
  ('L',  'Beige',  10, 9),
  ('XL', 'Beige',  6,  9),
  ('S',  'Blanco', 8,  9),
  ('M',  'Blanco', 8,  9),
  ('L',  'Blanco', 6,  9);

-- Producto 10: Jogger Urbano Gris
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('S',  'Gris',  10, 10),
  ('M',  'Gris',  15, 10),
  ('L',  'Gris',  12, 10),
  ('XL', 'Gris',  8,  10),
  ('M',  'Negro', 12, 10),
  ('L',  'Negro', 10, 10),
  ('XL', 'Negro', 6,  10);

-- Producto 11: Pantalón Cargo Verde
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('S',  'Verde', 8,  11),
  ('M',  'Verde', 12, 11),
  ('L',  'Verde', 10, 11),
  ('XL', 'Verde', 6,  11),
  ('M',  'Negro', 10, 11),
  ('L',  'Negro', 8,  11),
  ('XL', 'Negro', 4,  11);

-- Producto 12: Bermuda Denim Azul
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('S',  'Azul', 10, 12),
  ('M',  'Azul', 15, 12),
  ('L',  'Azul', 12, 12),
  ('XL', 'Azul', 8,  12),
  ('M',  'Negro', 10, 12),
  ('L',  'Negro', 8,  12);

-- Producto 13: Campera de Cuero Negra
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('XS', 'Negro',  5, 13),
  ('S',  'Negro',  8, 13),
  ('M',  'Negro',  8, 13),
  ('L',  'Negro',  5, 13),
  ('S',  'Marrón', 4, 13),
  ('M',  'Marrón', 4, 13);

-- Producto 14: Hoodie Premium Gris
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('S',   'Gris',  12, 14),
  ('M',   'Gris',  18, 14),
  ('L',   'Gris',  15, 14),
  ('XL',  'Gris',  10, 14),
  ('XXL', 'Gris',  6,  14),
  ('S',   'Negro', 10, 14),
  ('M',   'Negro', 15, 14),
  ('L',   'Negro', 12, 14),
  ('S',   'Crema', 8,  14),
  ('M',   'Crema', 8,  14);

-- Producto 15: Campera Puffer Acolchada
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('S',  'Negro', 6,  15),
  ('M',  'Negro', 10, 15),
  ('L',  'Negro', 8,  15),
  ('XL', 'Negro', 4,  15),
  ('S',  'Verde', 4,  15),
  ('M',  'Verde', 6,  15),
  ('L',  'Verde', 4,  15),
  ('S',  'Rojo',  4,  15),
  ('M',  'Rojo',  6,  15);

-- Producto 16: Buzo Cuello Redondo
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('S',  'Gris',  12, 16),
  ('M',  'Gris',  18, 16),
  ('L',  'Gris',  14, 16),
  ('XL', 'Gris',  8,  16),
  ('S',  'Negro', 10, 16),
  ('M',  'Negro', 15, 16),
  ('L',  'Negro', 12, 16),
  ('M',  'Azul',  8,  16),
  ('L',  'Azul',  6,  16);

-- Producto 17: Campera Rompevientos
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('S',  'Negro',   5, 17),
  ('M',  'Negro',   8, 17),
  ('L',  'Negro',   8, 17),
  ('XL', 'Negro',   4, 17),
  ('S',  'Azul',    4, 17),
  ('M',  'Azul',    6, 17),
  ('L',  'Azul',    4, 17);

-- Producto 18: Vestido Midi Floral
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('XS', 'Negro', 6,  18),
  ('S',  'Negro', 10, 18),
  ('M',  'Negro', 10, 18),
  ('L',  'Negro', 6,  18),
  ('XL', 'Negro', 4,  18);

-- Producto 19: Vestido Lino Natural
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('XS', 'Natural', 5, 19),
  ('S',  'Natural', 8, 19),
  ('M',  'Natural', 8, 19),
  ('L',  'Natural', 6, 19),
  ('S',  'Arena',   6, 19),
  ('M',  'Arena',   6, 19),
  ('L',  'Arena',   4, 19);

-- Producto 20: Vestido Mini Satinado
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('XS', 'Negro',  6, 20),
  ('S',  'Negro',  8, 20),
  ('M',  'Negro',  8, 20),
  ('L',  'Negro',  4, 20),
  ('S',  'Bordo',  6, 20),
  ('M',  'Bordo',  6, 20),
  ('S',  'Verde',  4, 20),
  ('M',  'Verde',  4, 20);

-- Producto 21: Vestido Boho Bordado
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('S',  'Blanco',   6, 21),
  ('M',  'Blanco',   8, 21),
  ('L',  'Blanco',   6, 21),
  ('XL', 'Blanco',   4, 21),
  ('M',  'Celeste',  6, 21),
  ('L',  'Celeste',  4, 21);

-- Producto 22: Vestido Camisero Stripes
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('XS', 'Azul/Blanco',  4, 22),
  ('S',  'Azul/Blanco',  8, 22),
  ('M',  'Azul/Blanco',  8, 22),
  ('L',  'Azul/Blanco',  6, 22),
  ('S',  'Negro/Blanco', 6, 22),
  ('M',  'Negro/Blanco', 6, 22),
  ('L',  'Negro/Blanco', 4, 22);

-- Producto 23: Gorra de Baseball Negra
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('Única', 'Negro',  25, 23),
  ('Única', 'Blanco', 20, 23),
  ('Única', 'Beige',  15, 23),
  ('Única', 'Rojo',   10, 23);

-- Producto 24: Cinturón de Cuero Marrón
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('90cm',  'Marrón', 8, 24),
  ('95cm',  'Marrón', 10, 24),
  ('100cm', 'Marrón', 8, 24),
  ('105cm', 'Marrón', 6, 24),
  ('95cm',  'Negro',  8, 24),
  ('100cm', 'Negro',  8, 24),
  ('105cm', 'Negro',  6, 24);

-- Producto 25: Bolso Tote Canvas
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('Única', 'Crema', 15, 25),
  ('Única', 'Negro', 12, 25),
  ('Única', 'Azul',  10, 25);

-- Producto 26: Bufanda de Lana Merino
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('Única', 'Gris',    12, 26),
  ('Única', 'Beige',   10, 26),
  ('Única', 'Negro',   10, 26),
  ('Única', 'Bordo',   8,  26),
  ('Única', 'Azul',    6,  26);

-- Producto 27: Zapatillas Urbanas Blancas
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('37', 'Blanco', 6,  27),
  ('38', 'Blanco', 8,  27),
  ('39', 'Blanco', 10, 27),
  ('40', 'Blanco', 10, 27),
  ('41', 'Blanco', 8,  27),
  ('42', 'Blanco', 8,  27),
  ('43', 'Blanco', 6,  27),
  ('44', 'Blanco', 4,  27),
  ('39', 'Negro',  6,  27),
  ('40', 'Negro',  8,  27),
  ('41', 'Negro',  6,  27),
  ('42', 'Negro',  6,  27);

-- Producto 28: Botas Chelsea Negras
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('35', 'Negro',  4, 28),
  ('36', 'Negro',  6, 28),
  ('37', 'Negro',  8, 28),
  ('38', 'Negro',  8, 28),
  ('39', 'Negro',  6, 28),
  ('40', 'Negro',  4, 28),
  ('37', 'Marrón', 4, 28),
  ('38', 'Marrón', 6, 28),
  ('39', 'Marrón', 4, 28);

-- Producto 29: Mocasines Marrones
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('40', 'Marrón', 6, 29),
  ('41', 'Marrón', 8, 29),
  ('42', 'Marrón', 8, 29),
  ('43', 'Marrón', 6, 29),
  ('44', 'Marrón', 4, 29),
  ('41', 'Negro',  6, 29),
  ('42', 'Negro',  6, 29),
  ('43', 'Negro',  4, 29);

-- Producto 30: Ojotas de Goma
INSERT INTO inventario (talle, color, stock, id_producto) VALUES
  ('35', 'Azul',  10, 30),
  ('36', 'Azul',  10, 30),
  ('37', 'Azul',  12, 30),
  ('38', 'Azul',  12, 30),
  ('39', 'Azul',  10, 30),
  ('40', 'Azul',  8,  30),
  ('37', 'Negro', 10, 30),
  ('38', 'Negro', 10, 30),
  ('39', 'Negro', 8,  30),
  ('40', 'Negro', 8,  30),
  ('37', 'Beige', 8,  30),
  ('38', 'Beige', 8,  30),
  ('39', 'Beige', 6,  30);

-- ──────────────────────────────────────────────────────────
--  USUARIOS
--  Contraseñas en texto plano (el backend no usa bcrypt)
-- ──────────────────────────────────────────────────────────
INSERT INTO usuario (nombre, apellido, email, password, direccion, telefono, rol) VALUES
  ('Admin',   'Lana',    'admin@lanaylino.com', 'admin123', 'Oficina Central 1',  '+5491100000001', 'admin'),
  ('María',   'García',  'maria@demo.com',      '1234',     'Av. Rivadavia 1234', '+5491122334455', 'cliente'),
  ('Carlos',  'López',   'carlos@demo.com',     '1234',     'Calle Falsa 123',    '+5491166778899', 'cliente');

-- ──────────────────────────────────────────────────────────
--  VERIFICACIÓN (cantidad de registros cargados)
-- ──────────────────────────────────────────────────────────
SELECT 'categorias' AS tabla, COUNT(*) AS registros FROM categoria
UNION ALL
SELECT 'productos',  COUNT(*) FROM producto
UNION ALL
SELECT 'inventario', COUNT(*) FROM inventario
UNION ALL
SELECT 'usuarios',   COUNT(*) FROM usuario;
