-- Base de Datos INMAN - Sistema de Gestión de Inventario y Mantenimiento
-- Centro de Biotecnología Agropecuaria (CBA) - SENA Mosquera

CREATE DATABASE IF NOT EXISTS inman_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inman_db;

-- Tabla de Perfiles/Roles
CREATE TABLE perfil (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

-- Tabla de Usuarios
CREATE TABLE usuario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    perfil_id INT NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (perfil_id) REFERENCES perfil(id)
);

-- Tabla de Marcas
CREATE TABLE marca (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- Tabla de Tipos de Equipo
CREATE TABLE tipoEquipo (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- Tabla de Areas/Bloques
CREATE TABLE area (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- Tabla de Espacios/Ambientes
CREATE TABLE espacio (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    area_id INT NOT NULL,
    capacidad INT DEFAULT 0,
    FOREIGN KEY (area_id) REFERENCES area(id)
);

-- Tabla de Estados
CREATE TABLE estado (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- Tabla de Equipos
CREATE TABLE equipo (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipoEquipo_id INT NOT NULL,
    procesador VARCHAR(100),
    RAM VARCHAR(50),
    disco VARCHAR(50),
    marca_id INT NOT NULL,
    modelo VARCHAR(100),
    dimana VARCHAR(100), -- Dimensiones o tamaño
    idarea VARCHAR(100), -- Código de area específico
    clasificacion VARCHAR(50),
    descripcion TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    codigo_qr VARCHAR(255) UNIQUE,
    FOREIGN KEY (tipoEquipo_id) REFERENCES tipoEquipo(id),
    FOREIGN KEY (marca_id) REFERENCES marca(id)
);

-- Tabla de Reportes
CREATE TABLE reporte (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    equipo_id INT NOT NULL,
    area_id INT NOT NULL,
    espacio_id INT NOT NULL,
    observacion TEXT,
    fechahora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    idusuario INT, -- Campo adicional para referencia
    idequipo INT,  -- Campo adicional para referencia  
    idespacio INT, -- Campo adicional para referencia
    FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    FOREIGN KEY (equipo_id) REFERENCES equipo(id),
    FOREIGN KEY (area_id) REFERENCES area(id),
    FOREIGN KEY (espacio_id) REFERENCES espacio(id)
);

-- Tabla de Actividades/Mantenimientos
CREATE TABLE actividades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL
);

-- Tabla de Actividades realizadas (Mantenimientos)
CREATE TABLE actividad (
    id INT PRIMARY KEY AUTO_INCREMENT,
    equipo_id INT NOT NULL,
    usuario_id INT NOT NULL,
    actividades_id INT NOT NULL,
    fechahora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacion TEXT,
    idequipo INT, -- Campo adicional para referencia
    idusuario INT, -- Campo adicional para referencia
    fechafin TIMESTAMP NULL,
    identidad VARCHAR(50),
    observaciones TEXT,
    FOREIGN KEY (equipo_id) REFERENCES equipo(id),
    FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    FOREIGN KEY (actividades_id) REFERENCES actividades(id)
);

-- Inserción de datos básicos
INSERT INTO perfil (nombre, descripcion) VALUES 
('Administrador', 'Acceso completo al sistema'),
('Técnico', 'Gestión de mantenimientos y equipos'),
('Instructor', 'Reportes y monitoreo de aulas'),
('Aprendiz', 'Vinculación con equipos via QR');

INSERT INTO estado (nombre) VALUES 
('Disponible'),
('En mantenimiento'),
('Dañado'),
('Fuera de servicio'),
('En reparación');

INSERT INTO marca (nombre) VALUES 
('HP'),
('Dell'),
('Lenovo'),
('ASUS'),
('Acer'),
('Samsung'),
('LG'),
('Epson'),
('Canon');

INSERT INTO tipoEquipo (nombre) VALUES 
('Computador de escritorio'),
('Portátil'),
('Monitor'),
('Impresora'),
('Proyector'),
('Teclado'),
('Mouse'),
('Parlantes'),
('Cámara web'),
('Scanner');

INSERT INTO area (nombre) VALUES 
('Bloque A'),
('Bloque B'),
('Bloque C'),
('Laboratorio'),
('Biblioteca'),
('Auditorio'),
('Sala de instructores');

INSERT INTO espacio (nombre, area_id, capacidad) VALUES 
('Aula 101', 1, 30),
('Aula 102', 1, 25),
('Aula 201', 2, 30),
('Aula 202', 2, 25),
('Lab Sistemas', 4, 20),
('Lab Redes', 4, 15),
('Sala principal', 5, 50),
('Auditorio principal', 6, 100);

INSERT INTO actividades (nombre) VALUES 
('Mantenimiento preventivo'),
('Mantenimiento correctivo'),
('Actualización de software'),
('Limpieza general'),
('Revisión técnica'),
('Calibración'),
('Reparación'),
('Instalación'),
('Configuración'),
('Respaldo de datos');

-- Usuarios de ejemplo
INSERT INTO usuario (nombre, email, password, perfil_id) VALUES 
('Administrador Sistema', 'admin@cba.sena.edu.co', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewLxSJhBV.vGD/1G', 1),
('Angel Carrillo', 'acarrillo@cba.sena.edu.co', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewLxSJhBV.vGD/1G', 2),
('Angel Vega', 'avega@cba.sena.edu.co', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewLxSJhBV.vGD/1G', 2),
('Instructor Ejemplo', 'instructor@cba.sena.edu.co', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewLxSJhBV.vGD/1G', 3),
('Aprendiz Ejemplo', 'aprendiz@cba.sena.edu.co', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewLxSJhBV.vGD/1G', 4);

-- Equipos de ejemplo
INSERT INTO equipo (tipoEquipo_id, procesador, RAM, disco, marca_id, modelo, clasificacion, descripcion, codigo_qr, dimana, idarea) VALUES 
(1, 'Intel Core i5-10400', '8GB DDR4', '500GB SSD', 1, 'HP ProDesk 600', 'Escritorio', 'Computador para aula de sistemas', 'QR001HP001', 'Mini Tower', 'A101-001'),
(1, 'Intel Core i3-9100', '8GB DDR4', '1TB HDD', 2, 'Dell OptiPlex 3070', 'Escritorio', 'Computador para laboratorio', 'QR002DELL001', 'SFF', 'LAB-001'),
(3, NULL, NULL, NULL, 3, 'Lenovo ThinkVision E24', 'Monitor', 'Monitor LED 24 pulgadas', 'QR003LEN001', '24 inches', 'A101-MON1'),
(4, NULL, NULL, NULL, 8, 'Epson L3150', 'Multifuncional', 'Impresora multifuncional', 'QR004EPS001', 'Compact', 'A101-IMP1'),
(5, NULL, NULL, NULL, 8, 'Epson PowerLite X41+', 'Proyector', 'Proyector para aula', 'QR005EPS002', 'Portable', 'A101-PROY');

-- Reportes de ejemplo
INSERT INTO reporte (usuario_id, equipo_id, area_id, espacio_id, observacion, idusuario, idequipo, idespacio) VALUES 
(4, 1, 1, 1, 'El computador se reinicia constantemente durante las clases', 4, 1, 1),
(4, 3, 1, 1, 'El monitor tiene líneas verticales en la pantalla', 4, 3, 1),
(4, 4, 1, 1, 'La impresora no responde a comandos de impresión', 4, 4, 1);

-- Actividades de mantenimiento de ejemplo
INSERT INTO actividad (equipo_id, usuario_id, actividades_id, observacion, idequipo, idusuario, identidad) VALUES 
(1, 2, 1, 'Mantenimiento preventivo realizado - limpieza y actualización', 1, 2, 'MANT-001'),
(2, 2, 2, 'Reparación de disco duro - reemplazo por SSD', 2, 2, 'MANT-002'),
(3, 3, 1, 'Calibración de colores y limpieza de pantalla', 3, 3, 'MANT-003');

-- Vistas útiles para reportes
CREATE VIEW vista_equipos_completa AS
SELECT 
    e.id,
    e.codigo_qr,
    te.nombre as tipo_equipo,
    m.nombre as marca,
    e.modelo,
    e.procesador,
    e.RAM,
    e.disco,
    e.clasificacion,
    e.descripcion,
    e.fecha_registro,
    a.nombre as area,
    esp.nombre as espacio
FROM equipo e
JOIN tipoEquipo te ON e.tipoEquipo_id = te.id
JOIN marca m ON e.marca_id = m.id
LEFT JOIN area a ON e.idarea LIKE CONCAT(LEFT(a.nombre, 1), '%')
LEFT JOIN espacio esp ON e.idarea LIKE CONCAT(esp.nombre, '%');

CREATE VIEW vista_reportes_completa AS
SELECT 
    r.id,
    r.fechahora,
    u.nombre as usuario,
    te.nombre as tipo_equipo,
    e.modelo,
    a.nombre as area,
    esp.nombre as espacio,
    r.observacion
FROM reporte r
JOIN usuario u ON r.usuario_id = u.id
JOIN equipo e ON r.equipo_id = e.id
JOIN tipoEquipo te ON e.tipoEquipo_id = te.id
JOIN area a ON r.area_id = a.id
JOIN espacio esp ON r.espacio_id = esp.id
ORDER BY r.fechahora DESC;

CREATE VIEW vista_mantenimientos AS
SELECT 
    act.id,
    act.fechahora,
    act.fechafin,
    u.nombre as tecnico,
    te.nombre as tipo_equipo,
    e.modelo,
    e.codigo_qr,
    acti.nombre as actividad,
    act.observacion
FROM actividad act
JOIN usuario u ON act.usuario_id = u.id
JOIN equipo e ON act.equipo_id = e.id
JOIN tipoEquipo te ON e.tipoEquipo_id = te.id
JOIN actividades acti ON act.actividades_id = acti.id
ORDER BY act.fechahora DESC;