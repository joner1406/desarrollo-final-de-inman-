-- Base de Datos INMAN - Sistema de Inventario de Equipos
-- Versión Corregida

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS inman_db;
USE inman_db;

-- Eliminar tablas si existen (en orden correcto para evitar conflictos de FK)
DROP TABLE IF EXISTS actividad;
DROP TABLE IF EXISTS equipo;
DROP TABLE IF EXISTS estado;
DROP TABLE IF EXISTS tipoEquipo;
DROP TABLE IF EXISTS marca;
DROP TABLE IF EXISTS usuarios;

-- =============================================
-- TABLA DE USUARIOS
-- =============================================
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'usuario', 'tecnico') DEFAULT 'usuario',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_sesion TIMESTAMP NULL
);

-- =============================================
-- TABLA DE TIPOS DE EQUIPO
-- =============================================
CREATE TABLE tipoEquipo (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLA DE MARCAS
-- =============================================
CREATE TABLE marca (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLA DE ESTADOS
-- =============================================
CREATE TABLE estado (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#000000', -- Para código de color hexadecimal
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLA DE EQUIPOS (CORREGIDA)
-- =============================================
CREATE TABLE equipo (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipoEquipo_id INT NOT NULL,
    marca_id INT NOT NULL,
    modelo VARCHAR(100),
    procesador VARCHAR(100),
    RAM VARCHAR(50),
    disco VARCHAR(50),
    dimana VARCHAR(100), -- Dimensiones o tamaño
    idarea VARCHAR(100), -- Código de area específico
    clasificacion VARCHAR(50),
    descripcion TEXT,
    estado_id INT NOT NULL DEFAULT 1, -- COLUMNA CORREGIDA
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    codigo_qr VARCHAR(255) UNIQUE,
    activo BOOLEAN DEFAULT TRUE,
    
    -- Llaves foráneas
    FOREIGN KEY (tipoEquipo_id) REFERENCES tipoEquipo(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (marca_id) REFERENCES marca(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (estado_id) REFERENCES estado(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Índices para mejor rendimiento
    INDEX idx_tipo_equipo (tipoEquipo_id),
    INDEX idx_marca (marca_id),
    INDEX idx_estado (estado_id),
    INDEX idx_codigo_qr (codigo_qr),
    INDEX idx_activo (activo)
);

-- =============================================
-- TABLA DE ACTIVIDADES/HISTORIAL
-- =============================================
CREATE TABLE actividad (
    id INT PRIMARY KEY AUTO_INCREMENT,
    equipo_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo_actividad ENUM('creacion', 'actualizacion', 'mantenimiento', 'reparacion', 'baja', 'asignacion', 'devolucion') NOT NULL,
    descripcion TEXT,
    estado_anterior_id INT,
    estado_nuevo_id INT,
    fecha_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    
    -- Llaves foráneas
    FOREIGN KEY (equipo_id) REFERENCES equipo(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (estado_anterior_id) REFERENCES estado(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (estado_nuevo_id) REFERENCES estado(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- Índices
    INDEX idx_equipo (equipo_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_fecha (fecha_actividad),
    INDEX idx_tipo (tipo_actividad)
);

-- =============================================
-- INSERTAR DATOS INICIALES
-- =============================================

-- Insertar usuarios por defecto
INSERT INTO usuarios (nombre, email, password, rol) VALUES 
('Administrador', 'admin@cba.sena.edu.co', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Usuario Técnico', 'tecnico@cba.sena.edu.co', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'tecnico'),
('Usuario Normal', 'usuario@cba.sena.edu.co', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario');

-- Insertar tipos de equipo
INSERT INTO tipoEquipo (nombre, descripcion) VALUES 
('Computador de Escritorio', 'Equipos de cómputo para uso en escritorio'),
('Laptop', 'Computadores portátiles'),
('Monitor', 'Pantallas y monitores'),
('Impresora', 'Equipos de impresión'),
('Proyector', 'Equipos de proyección'),
('Router', 'Equipos de red'),
('Switch', 'Conmutadores de red'),
('Scanner', 'Equipos de digitalización'),
('Tablet', 'Dispositivos tablet'),
('Smartphone', 'Teléfonos inteligentes');

-- Insertar marcas
INSERT INTO marca (nombre, descripcion) VALUES 
('HP', 'Hewlett-Packard'),
('Dell', 'Dell Technologies'),
('Lenovo', 'Lenovo Group'),
('Asus', 'ASUSTeK Computer Inc.'),
('Acer', 'Acer Inc.'),
('Samsung', 'Samsung Electronics'),
('LG', 'LG Electronics'),
('Epson', 'Seiko Epson Corporation'),
('Canon', 'Canon Inc.'),
('Cisco', 'Cisco Systems');

-- Insertar estados
INSERT INTO estado (nombre, descripcion, color) VALUES 
('Disponible', 'Equipo disponible para uso', '#28a745'),
('En Uso', 'Equipo actualmente en uso', '#007bff'),
('Mantenimiento', 'Equipo en proceso de mantenimiento', '#ffc107'),
('Dañado', 'Equipo con fallas o daños', '#dc3545'),
('Baja', 'Equipo dado de baja', '#6c757d'),
('En Reparación', 'Equipo en proceso de reparación', '#fd7e14');

-- Insertar equipos de ejemplo (CORREGIDOS)
INSERT INTO equipo (tipoEquipo_id, marca_id, modelo, procesador, RAM, disco, descripcion, estado_id, codigo_qr, dimana, idarea, clasificacion) VALUES 
(1, 1, 'ProDesk 600 G5', 'Intel Core i5-10400', '8GB DDR4', '500GB SSD', 'Computador para aula de sistemas', 1, 'QR001HP001', 'Mini Tower', 'A101-001', 'Educativo'),
(1, 2, 'OptiPlex 3070', 'Intel Core i3-9100', '8GB DDR4', '1TB HDD', 'Computador para laboratorio', 1, 'QR002DELL001', 'SFF', 'LAB-001', 'Educativo'),
(3, 3, 'ThinkVision E24-20', NULL, NULL, NULL, 'Monitor LED 24 pulgadas', 1, 'QR003LEN001', '24 inches', 'A101-MON1', 'Periférico'),
(4, 8, 'EcoTank L3150', NULL, NULL, NULL, 'Impresora multifuncional', 1, 'QR004EPS001', 'Compact', 'A101-IMP1', 'Periférico'),
(5, 8, 'PowerLite X41+', NULL, NULL, NULL, 'Proyector para aula', 1, 'QR005EPS002', 'Portable', 'A101-PROY1', 'Audiovisual');

-- Insertar actividades iniciales
INSERT INTO actividad (equipo_id, usuario_id, tipo_actividad, descripcion, estado_nuevo_id) VALUES 
(1, 1, 'creacion', 'Registro inicial del equipo HP ProDesk 600', 1),
(2, 1, 'creacion', 'Registro inicial del equipo Dell OptiPlex 3070', 1),
(3, 1, 'creacion', 'Registro inicial del monitor Lenovo ThinkVision', 1),
(4, 1, 'creacion', 'Registro inicial de la impresora Epson L3150', 1),
(5, 1, 'creacion', 'Registro inicial del proyector Epson PowerLite', 1);

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Vista completa de equipos con información relacionada
CREATE VIEW vista_equipos_completa AS
SELECT 
    e.id,
    e.codigo_qr,
    te.nombre AS tipo_equipo,
    m.nombre AS marca,
    e.modelo,
    e.procesador,
    e.RAM,
    e.disco,
    e.descripcion,
    est.nombre AS estado,
    est.color AS estado_color,
    e.dimana,
    e.idarea,
    e.clasificacion,
    e.fecha_registro,
    e.fecha_actualizacion,
    e.activo
FROM equipo e
JOIN tipoEquipo te ON e.tipoEquipo_id = te.id
JOIN marca m ON e.marca_id = m.id
JOIN estado est ON e.estado_id = est.id
WHERE e.activo = TRUE;

-- Vista de actividades con información completa
CREATE VIEW vista_actividades_completa AS
SELECT 
    a.id,
    e.codigo_qr,
    CONCAT(te.nombre, ' - ', m.nombre, ' ', e.modelo) AS equipo_info,
    u.nombre AS usuario,
    a.tipo_actividad,
    a.descripcion,
    ea.nombre AS estado_anterior,
    en.nombre AS estado_nuevo,
    a.fecha_actividad,
    a.observaciones
FROM actividad a
JOIN equipo e ON a.equipo_id = e.id
JOIN tipoEquipo te ON e.tipoEquipo_id = te.id
JOIN marca m ON e.marca_id = m.id
JOIN usuarios u ON a.usuario_id = u.id
LEFT JOIN estado ea ON a.estado_anterior_id = ea.id
LEFT JOIN estado en ON a.estado_nuevo_id = en.id
ORDER BY a.fecha_actividad DESC;

-- =============================================
-- PROCEDIMIENTOS ALMACENADOS ÚTILES
-- =============================================

-- Procedimiento para cambiar estado de equipo
DELIMITER //
CREATE PROCEDURE CambiarEstadoEquipo(
    IN p_equipo_id INT,
    IN p_usuario_id INT,
    IN p_nuevo_estado_id INT,
    IN p_observaciones TEXT
)
BEGIN
    DECLARE v_estado_anterior_id INT;
    
    -- Obtener estado actual
    SELECT estado_id INTO v_estado_anterior_id 
    FROM equipo 
    WHERE id = p_equipo_id;
    
    -- Actualizar estado del equipo
    UPDATE equipo 
    SET estado_id = p_nuevo_estado_id,
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id = p_equipo_id;
    
    -- Registrar actividad
    INSERT INTO actividad (equipo_id, usuario_id, tipo_actividad, descripcion, estado_anterior_id, estado_nuevo_id, observaciones)
    VALUES (p_equipo_id, p_usuario_id, 'actualizacion', 'Cambio de estado', v_estado_anterior_id, p_nuevo_estado_id, p_observaciones);
END //
DELIMITER ;

-- =============================================
-- CONFIGURACIONES FINALES
-- =============================================

-- Configurar charset
ALTER DATABASE inman_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Mensaje final
SELECT 'Base de datos INMAN creada exitosamente!' AS mensaje;