const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcryptjs');
const qrcode = require('qrcode');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection pool
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Session store
const sessionStore = new MySQLStore({}, pool);

// Error handlers
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

// Middleware CORS mejorado
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  key: 'inman_session',
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: false, // Set to true in production with HTTPS
    httpOnly: true
  }
}));

// Static files for QR codes
app.use('/uploads', express.static('uploads'));

// Create uploads directory
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}
if (!fs.existsSync('uploads/qr-codes')) {
  fs.mkdirSync('uploads/qr-codes', { recursive: true });
}

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Get user permissions based on profile
const getUserPermissions = (perfil) => {
  const permissionsMap = {
    'Administrador': {
      can_manage_users: true,
      can_manage_equipos: true,
      can_manage_reportes: true,
      can_manage_mantenimientos: true,
      can_view_dashboard: true,
      can_view_monitoreo: true,
      can_use_qr: true,
      modules: ['dashboard', 'equipos', 'reportes', 'monitoreo', 'mantenimientos', 'usuarios']
    },
    'Técnico': {
      can_manage_users: false,
      can_manage_equipos: true,
      can_manage_reportes: true,
      can_manage_mantenimientos: true,
      can_view_dashboard: true,
      can_view_monitoreo: true,
      can_use_qr: true,
      modules: ['dashboard', 'equipos', 'reportes', 'monitoreo', 'mantenimientos']
    },
    'Instructor': {
      can_manage_users: false,
      can_manage_equipos: false,
      can_manage_reportes: false,
      can_manage_mantenimientos: false,
      can_view_dashboard: true,
      can_view_monitoreo: true,
      can_use_qr: false,
      can_create_reportes: true,
      modules: ['dashboard', 'equipos', 'reportes', 'monitoreo']
    },
    'Aprendiz': {
      can_manage_users: false,
      can_manage_equipos: false,
      can_manage_reportes: false,
      can_manage_mantenimientos: false,
      can_view_dashboard: false,
      can_view_monitoreo: false,
      can_use_qr: true,
      modules: ['qr']
    }
  };
  return permissionsMap[perfil] || {};
};
// CREAR EQUIPO - Agregar después de app.get('/api/equipos')
app.post('/api/equipos', requireAuth, async (req, res) => {
  try {
    const permissions = getUserPermissions(req.session.userProfile);
    if (!permissions.can_manage_equipos) {
      return res.status(403).json({ error: 'Sin permisos para crear equipos' });
    }
    
    const { tipoEquipo_id, marca_id, modelo, procesador, RAM, disco, descripcion, estado = 'Disponible' } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO equipo (tipoEquipo_id, marca_id, modelo, procesador, RAM, disco, descripcion, estado, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [tipoEquipo_id, marca_id, modelo, procesador, RAM, disco, descripcion, estado]
    );
    
    const equipoId = result.insertId;
    
    // Generate QR code
    const codigoQR = `QR${equipoId.toString().padStart(3, '0')}${modelo.substring(0, 3).toUpperCase()}${equipoId.toString().padStart(3, '0')}`;
    
    await pool.execute(
      'UPDATE equipo SET codigo_qr = ? WHERE id = ?',
      [codigoQR, equipoId]
    );
    
    res.status(201).json({ 
      id: equipoId, 
      codigo_qr: codigoQR, 
      message: 'Equipo creado exitosamente' 
    });
  } catch (error) {
    console.error('Create equipo error:', error);
    res.status(500).json({ error: 'Error al crear equipo' });
  }
});

// ELIMINAR EQUIPO - Agregar también esta ruta
app.delete('/api/equipos/:id', requireAuth, async (req, res) => {
  try {
    const permissions = getUserPermissions(req.session.userProfile);
    if (!permissions.can_manage_equipos) {
      return res.status(403).json({ error: 'Sin permisos para eliminar equipos' });
    }
    
    const { id } = req.params;
    
    const [result] = await pool.execute('DELETE FROM equipo WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    
    res.json({ message: 'Equipo eliminado exitosamente' });
  } catch (error) {
    console.error('Delete equipo error:', error);
    res.status(500).json({ error: 'Error al eliminar equipo' });
  }
});

// AUTH ROUTES
app.post('/api/auth/login', async (req, res) => {
  console.log('Login attempt:', req.body);
  try {
    const { email, password } = req.body;
    
    const [users] = await pool.execute(
      'SELECT u.*, p.nombre as perfil_nombre FROM usuario u JOIN perfil p ON u.perfil_id = p.id WHERE u.email = ? AND u.activo = 1',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ success: false, error: 'Usuario no encontrado' });
    }
    
    const user = users[0];
    
    // For demo purposes, using plain text password
    const isValidPassword = password === 'password123';
    
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    }
    
    req.session.userId = user.id;
    req.session.userProfile = user.perfil_nombre;
    
    const permissions = getUserPermissions(user.perfil_nombre);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        perfil: user.perfil_nombre
      },
      permissions
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Error en el login' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al cerrar sesión' });
    }
    res.json({ success: true });
  });
});

app.get('/api/auth/current-user', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.json({ authenticated: false });
    }
    
    const [users] = await pool.execute(
      'SELECT u.*, p.nombre as perfil_nombre FROM usuario u JOIN perfil p ON u.perfil_id = p.id WHERE u.id = ?',
      [req.session.userId]
    );
    
    if (users.length === 0) {
      return res.json({ authenticated: false });
    }
    
    const user = users[0];
    const permissions = getUserPermissions(user.perfil_nombre);
    
    res.json({
      authenticated: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        perfil: user.perfil_nombre
      },
      permissions
    });
  } catch (error) {
    console.error('Current user error:', error);
    res.status(500).json({ error: 'Error al obtener usuario actual' });
  }
});

// DASHBOARD ROUTES
app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
  try {
    const permissions = getUserPermissions(req.session.userProfile);
    if (!permissions.can_view_dashboard) {
      return res.status(403).json({ error: 'Sin permisos para ver dashboard' });
    }
    
    // Equipment stats
    const [equiposStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'Disponible' THEN 1 ELSE 0 END) as disponibles,
        SUM(CASE WHEN estado = 'En mantenimiento' THEN 1 ELSE 0 END) as mantenimiento,
        SUM(CASE WHEN estado = 'Dañado' THEN 1 ELSE 0 END) as danados
      FROM equipo
    `);
    
    // Active reports
    const [reportesStats] = await pool.execute('SELECT COUNT(*) as count FROM reporte WHERE resuelto = 0');
    
    // Recent reports
    const [recentReports] = await pool.execute(`
      SELECT r.id, r.observacion, r.fechahora, u.nombre as usuario,
             CONCAT(te.nombre, ' - ', m.nombre, ' ', e.modelo) as equipo
      FROM reporte r
      JOIN usuario u ON r.usuario_id = u.id
      JOIN equipo e ON r.equipo_id = e.id
      JOIN tipoEquipo te ON e.tipoEquipo_id = te.id
      JOIN marca m ON e.marca_id = m.id
      ORDER BY r.fechahora DESC LIMIT 5
    `);
    
    const reportesRecientes = recentReports.map(report => ({
      id: report.id,
      usuario: report.usuario,
      equipo: report.equipo,
      observacion: report.observacion.length > 100 ? 
        report.observacion.substring(0, 100) + '...' : report.observacion,
      fecha: new Date(report.fechahora).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    }));
    
    res.json({
      equipos_stats: equiposStats[0],
      reportes_activos: reportesStats[0].count,
      reportes_recientes: reportesRecientes
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Error al cargar estadísticas' });
  }
});

// EQUIPOS ROUTES
app.get('/api/equipos', requireAuth, async (req, res) => {
  try {
    const [equipos] = await pool.execute(`
      SELECT e.*, te.nombre as tipo_equipo, m.nombre as marca_nombre
      FROM equipo e
      JOIN tipoEquipo te ON e.tipoEquipo_id = te.id
      JOIN marca m ON e.marca_id = m.id
      ORDER BY e.id DESC
    `);
    
    res.json(equipos);
  } catch (error) {
    console.error('Get equipos error:', error);
    res.status(500).json({ error: 'Error al cargar equipos' });
  }
});

// BASIC DATA ROUTES
app.get('/api/areas', requireAuth, async (req, res) => {
  try {
    const [areas] = await pool.execute('SELECT * FROM area ORDER BY nombre');
    res.json(areas);
  } catch (error) {
    console.error('Get areas error:', error);
    res.status(500).json({ error: 'Error al cargar áreas' });
  }
});

app.get('/api/espacios', requireAuth, async (req, res) => {
  try {
    const [espacios] = await pool.execute(`
      SELECT e.*, a.nombre as area_nombre 
      FROM espacio e 
      JOIN area a ON e.area_id = a.id 
      ORDER BY a.nombre, e.nombre
    `);
    res.json(espacios);
  } catch (error) {
    console.error('Get espacios error:', error);
    res.status(500).json({ error: 'Error al cargar espacios' });
  }
});

app.get('/api/marcas', requireAuth, async (req, res) => {
  try {
    const [marcas] = await pool.execute('SELECT * FROM marca ORDER BY nombre');
    res.json(marcas);
  } catch (error) {
    console.error('Get marcas error:', error);
    res.status(500).json({ error: 'Error al cargar marcas' });
  }
});

app.get('/api/tipos-equipo', requireAuth, async (req, res) => {
  try {
    const [tipos] = await pool.execute('SELECT * FROM tipoEquipo ORDER BY nombre');
    res.json(tipos);
  } catch (error) {
    console.error('Get tipos error:', error);
    res.status(500).json({ error: 'Error al cargar tipos de equipo' });
  }
});

// REPORTES ROUTES
app.get('/api/reportes', requireAuth, async (req, res) => {
  try {
    const [reportes] = await pool.execute(`
      SELECT r.*, u.nombre as usuario_nombre, 
             te.nombre as equipo_tipo, m.nombre as equipo_marca, e.modelo as equipo_modelo,
             a.nombre as area_nombre, esp.nombre as espacio_nombre
      FROM reporte r
      JOIN usuario u ON r.usuario_id = u.id
      JOIN equipo e ON r.equipo_id = e.id
      JOIN tipoEquipo te ON e.tipoEquipo_id = te.id
      JOIN marca m ON e.marca_id = m.id
      JOIN area a ON r.area_id = a.id
      JOIN espacio esp ON r.espacio_id = esp.id
      ORDER BY r.fechahora DESC
    `);
    
    res.json(reportes);
  } catch (error) {
    console.error('Get reportes error:', error);
    res.status(500).json({ error: 'Error al cargar reportes' });
  }
});

app.post('/api/reportes', requireAuth, async (req, res) => {
  try {
    const permissions = getUserPermissions(req.session.userProfile);
    if (!permissions.can_create_reportes && !permissions.can_manage_reportes) {
      return res.status(403).json({ error: 'Sin permisos para crear reportes' });
    }
    
    const { equipo, area, espacio, observacion } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO reporte (usuario_id, equipo_id, area_id, espacio_id, observacion, fechahora) VALUES (?, ?, ?, ?, ?, NOW())',
      [req.session.userId, equipo, area, espacio, observacion]
    );
    
    res.status(201).json({ id: result.insertId, message: 'Reporte creado exitosamente' });
  } catch (error) {
    console.error('Create reporte error:', error);
    res.status(500).json({ error: 'Error al crear reporte' });
  }
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT 1 as test');
    res.json({ status: 'Database connected successfully', data: rows });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 INMAN Backend running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/test-db`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV}`);
}).on('error', (err) => {
  console.error('❌ Server startup error:', err);
});

module.exports = app;