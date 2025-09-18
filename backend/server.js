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
  secret: process.env.SESSION_SECRET || 'default-secret-key-change-in-production',
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

// Get user permissions based on profile - ACTUALIZADO PARA NUEVOS ROLES
const getUserPermissions = (rol) => {
  const permissionsMap = {
    'admin': {
      can_manage_users: true,
      can_manage_equipos: true,
      can_manage_reportes: true,
      can_manage_mantenimientos: true,
      can_view_dashboard: true,
      can_view_monitoreo: true,
      can_use_qr: true,
      modules: ['dashboard', 'equipos', 'reportes', 'monitoreo', 'mantenimientos', 'usuarios']
    },
    'tecnico': {
      can_manage_users: false,
      can_manage_equipos: true,
      can_manage_reportes: true,
      can_manage_mantenimientos: true,
      can_view_dashboard: true,
      can_view_monitoreo: true,
      can_use_qr: true,
      modules: ['dashboard', 'equipos', 'reportes', 'monitoreo', 'mantenimientos']
    },
    'usuario': {
      can_manage_users: false,
      can_manage_equipos: false,
      can_manage_reportes: false,
      can_manage_mantenimientos: false,
      can_view_dashboard: true,
      can_view_monitoreo: true,
      can_use_qr: false,
      can_create_reportes: true,
      modules: ['dashboard', 'equipos', 'reportes', 'monitoreo']
    }
  };
  return permissionsMap[rol] || {};
};

// CREAR EQUIPO - CORREGIDO PARA NUEVA ESTRUCTURA
app.post('/api/equipos', requireAuth, async (req, res) => {
  try {
    console.log('Datos recibidos:', req.body); // Para debugging
    
    const permissions = getUserPermissions(req.session.userProfile);
    if (!permissions.can_manage_equipos) {
      return res.status(403).json({ error: 'Sin permisos para crear equipos' });
    }
    
    const { 
      tipoEquipo_id, 
      marca_id, 
      modelo, 
      procesador, 
      RAM, 
      disco, 
      descripcion, 
      estado_id = 1,
      dimana,
      idarea,
      clasificacion
    } = req.body;
    
    // Convertir undefined a null para evitar el error
    const cleanValues = [
      tipoEquipo_id || null,
      marca_id || null, 
      modelo || null,
      procesador || null,
      RAM || null,
      disco || null,
      descripcion || null,
      estado_id || 1,
      dimana || null,
      idarea || null,
      clasificacion || null
    ];
    
    console.log('Valores limpiados:', cleanValues); // Para debugging
    
    const [result] = await pool.execute(
      'INSERT INTO equipo (tipoEquipo_id, marca_id, modelo, procesador, RAM, disco, descripcion, estado_id, dimana, idarea, clasificacion, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      cleanValues
    );
    
    const equipoId = result.insertId;
    
    // Generate QR code
    const codigoQR = `QR${equipoId.toString().padStart(3, '0')}${modelo ? modelo.substring(0, 3).toUpperCase() : 'EQP'}${equipoId.toString().padStart(3, '0')}`;
    
    await pool.execute(
      'UPDATE equipo SET codigo_qr = ? WHERE id = ?',
      [codigoQR, equipoId]
    );
    
    // Registrar actividad (solo si la tabla existe)
    try {
      await pool.execute(
        'INSERT INTO actividad (equipo_id, usuario_id, tipo_actividad, descripcion, estado_nuevo_id) VALUES (?, ?, ?, ?, ?)',
        [equipoId, req.session.userId, 'creacion', 'Registro inicial del equipo', estado_id || 1]
      );
    } catch (activityError) {
      console.warn('No se pudo registrar actividad:', activityError.message);
      // Continuar sin error si la tabla actividad no existe
    }
    
    res.status(201).json({ 
      id: equipoId, 
      codigo_qr: codigoQR, 
      message: 'Equipo creado exitosamente' 
    });
  } catch (error) {
    console.error('Create equipo error:', error);
    res.status(500).json({ error: 'Error al crear equipo', details: error.message });
  }
});

// ELIMINAR EQUIPO - CORREGIDO
app.delete('/api/equipos/:id', requireAuth, async (req, res) => {
  try {
    const permissions = getUserPermissions(req.session.userProfile);
    if (!permissions.can_manage_equipos) {
      return res.status(403).json({ error: 'Sin permisos para eliminar equipos' });
    }
    
    const { id } = req.params;
    
    // Cambiar estado a inactivo en lugar de eliminar
    const [result] = await pool.execute('UPDATE equipo SET activo = FALSE WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    
    // Registrar actividad
    await pool.execute(
      'INSERT INTO actividad (equipo_id, usuario_id, tipo_actividad, descripcion) VALUES (?, ?, ?, ?)',
      [id, req.session.userId, 'baja', 'Equipo dado de baja']
    );
    
    res.json({ message: 'Equipo eliminado exitosamente' });
  } catch (error) {
    console.error('Delete equipo error:', error);
    res.status(500).json({ error: 'Error al eliminar equipo' });
  }
});

// AUTH ROUTES - CORREGIDOS PARA NUEVA ESTRUCTURA
app.post('/api/auth/login', async (req, res) => {
  console.log('Login attempt:', req.body);
  try {
    const { email, password } = req.body;
    
    // CORREGIDO: Usar tabla 'usuarios' y columna 'activo'
    const [users] = await pool.execute(
      'SELECT * FROM usuarios WHERE email = ? AND activo = TRUE',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ success: false, error: 'Usuario no encontrado' });
    }
    
    const user = users[0];
    
    // For demo purposes, using plain text password comparison
    const isValidPassword = password === 'password123';
    
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
    }
    
    // Actualizar última sesión
    await pool.execute(
      'UPDATE usuarios SET fecha_ultima_sesion = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );
    
    req.session.userId = user.id;
    req.session.userProfile = user.rol; // CORREGIDO: usar 'rol' en lugar de 'perfil_nombre'
    
    const permissions = getUserPermissions(user.rol);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        perfil: user.rol // CORREGIDO: usar 'rol'
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

// CORREGIDO: current-user endpoint
app.get('/api/auth/current-user', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.json({ authenticated: false });
    }
    
    // CORREGIDO: Usar tabla 'usuarios' sin JOIN
    const [users] = await pool.execute(
      'SELECT * FROM usuarios WHERE id = ?',
      [req.session.userId]
    );
    
    if (users.length === 0) {
      return res.json({ authenticated: false });
    }
    
    const user = users[0];
    const permissions = getUserPermissions(user.rol); // CORREGIDO: usar 'rol'
    
    res.json({
      authenticated: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        perfil: user.rol // CORREGIDO: usar 'rol'
      },
      permissions
    });
  } catch (error) {
    console.error('Current user error:', error);
    res.status(500).json({ error: 'Error al obtener usuario actual' });
  }
});

// DASHBOARD ROUTES - CORREGIDO PARA NUEVA ESTRUCTURA
app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
  try {
    const permissions = getUserPermissions(req.session.userProfile);
    if (!permissions.can_view_dashboard) {
      return res.status(403).json({ error: 'Sin permisos para ver dashboard' });
    }
    
    // Equipment stats - CORREGIDO: usar estado_id con JOIN
    const [equiposStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN est.nombre = 'Disponible' THEN 1 ELSE 0 END) as disponibles,
        SUM(CASE WHEN est.nombre = 'Mantenimiento' THEN 1 ELSE 0 END) as mantenimiento,
        SUM(CASE WHEN est.nombre = 'Dañado' THEN 1 ELSE 0 END) as danados
      FROM equipo e
      JOIN estado est ON e.estado_id = est.id
      WHERE e.activo = TRUE
    `);
    
    // Recent activities (reemplazar reportes por actividades)
    const [recentActivities] = await pool.execute(`
      SELECT a.id, a.descripcion, a.fecha_actividad, u.nombre as usuario,
             CONCAT(te.nombre, ' - ', m.nombre, ' ', e.modelo) as equipo
      FROM actividad a
      JOIN usuarios u ON a.usuario_id = u.id
      JOIN equipo e ON a.equipo_id = e.id
      JOIN tipoEquipo te ON e.tipoEquipo_id = te.id
      JOIN marca m ON e.marca_id = m.id
      ORDER BY a.fecha_actividad DESC LIMIT 5
    `);
    
    const actividadesRecientes = recentActivities.map(activity => ({
      id: activity.id,
      usuario: activity.usuario,
      equipo: activity.equipo,
      descripcion: activity.descripcion && activity.descripcion.length > 100 ? 
        activity.descripcion.substring(0, 100) + '...' : activity.descripcion,
      fecha: new Date(activity.fecha_actividad).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    }));
    
    res.json({
      equipos_stats: equiposStats[0],
      actividades_recientes: actividadesRecientes
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Error al cargar estadísticas' });
  }
});

// EQUIPOS ROUTES - CORREGIDO
app.get('/api/equipos', requireAuth, async (req, res) => {
  try {
    const [equipos] = await pool.execute(`
      SELECT e.*, te.nombre as tipo_equipo, m.nombre as marca_nombre, est.nombre as estado_nombre, est.color as estado_color
      FROM equipo e
      JOIN tipoEquipo te ON e.tipoEquipo_id = te.id
      JOIN marca m ON e.marca_id = m.id
      JOIN estado est ON e.estado_id = est.id
      WHERE e.activo = TRUE
      ORDER BY e.id DESC
    `);
    
    res.json(equipos);
  } catch (error) {
    console.error('Get equipos error:', error);
    res.status(500).json({ error: 'Error al cargar equipos' });
  }
});

// BASIC DATA ROUTES - MANTENER LOS EXISTENTES PERO AGREGAR ESTADOS
app.get('/api/estados', requireAuth, async (req, res) => {
  try {
    const [estados] = await pool.execute('SELECT * FROM estado ORDER BY nombre');
    res.json(estados);
  } catch (error) {
    console.error('Get estados error:', error);
    res.status(500).json({ error: 'Error al cargar estados' });
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

// ACTIVIDADES ROUTES - NUEVO ENDPOINT
app.get('/api/actividades', requireAuth, async (req, res) => {
  try {
    const [actividades] = await pool.execute(`
      SELECT a.*, u.nombre as usuario_nombre, 
             te.nombre as equipo_tipo, m.nombre as equipo_marca, e.modelo as equipo_modelo,
             ea.nombre as estado_anterior, en.nombre as estado_nuevo
      FROM actividad a
      JOIN usuarios u ON a.usuario_id = u.id
      JOIN equipo e ON a.equipo_id = e.id
      JOIN tipoEquipo te ON e.tipoEquipo_id = te.id
      JOIN marca m ON e.marca_id = m.id
      LEFT JOIN estado ea ON a.estado_anterior_id = ea.id
      LEFT JOIN estado en ON a.estado_nuevo_id = en.id
      ORDER BY a.fecha_actividad DESC
    `);
    
    res.json(actividades);
  } catch (error) {
    console.error('Get actividades error:', error);
    res.status(500).json({ error: 'Error al cargar actividades' });
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