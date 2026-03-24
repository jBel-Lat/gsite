require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const { testConnection, getDbConfig, getAuthSchema, getDbType } = require('./config/database');
const { getUploadsRoot } = require('./utils/uploadPaths');
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/api');
const { attachUser } = require('./middleware/auth');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

const sessionSecret = process.env.SESSION_SECRET || 'change-this-in-production';
const publicDir = path.join(__dirname, 'public');
const assetsDir = path.join(__dirname, 'assets');
const uploadsDir = getUploadsRoot();

app.disable('x-powered-by');
if (isProduction) {
  // Required behind Render/Reverse proxy so secure cookies are accepted.
  app.set('trust proxy', 1);
}

app.use(
  session({
    name: 'ccs_sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 12,
    },
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(attachUser);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(assetsDir, { maxAge: isProduction ? '1d' : 0 }));
app.use('/uploads', express.static(uploadsDir, { maxAge: isProduction ? '1d' : 0 }));

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

app.get('/', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
app.get(['/index', '/index.html'], (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));

// Login aliases (frontend is served from /public/pages).
app.get('/admin/login', (_req, res) => res.redirect('/pages/admin-login.html'));
app.get('/superadmin/login', (_req, res) => res.redirect('/pages/superadmin-login.html'));

app.use('/api', (_req, res) => {
  res.status(404).json({ ok: false, error: 'API route not found' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  console.error('[server:error]', {
    method: req.method,
    path: req.originalUrl || req.path,
    message: error.message,
    code: error.code || null,
    stack: isProduction ? undefined : error.stack,
  });

  const message = isProduction ? 'Internal server error' : error.message;

  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ ok: false, error: message });
  }

  return res.status(500).send(message);
});

app.listen(PORT, () => {
  const dbConfig = getDbConfig();
  const authSchema = getAuthSchema();
  const dbType = typeof getDbType === 'function' ? getDbType() : 'mysql';

  console.log(`Server listening on port ${PORT}`);
  console.log('API base: /api');
  console.log(`Public directory: ${publicDir}`);
  console.log(`Uploads directory: ${uploadsDir}`);
  console.log('Auth routes: GET /api/auth/health, GET /api/auth/db-debug, POST /api/auth/login, POST /api/auth/register, GET /api/auth/me, POST /api/auth/logout');
  console.log('Database type:', dbType);
  console.log('DB env summary:', {
    host: dbConfig.host,
    port: Number(dbConfig.port),
    database: dbConfig.database,
    user: dbConfig.user,
  });
  console.log('Auth schema summary:', {
    table: authSchema.table,
    username: authSchema.username,
    email: authSchema.email,
    password: authSchema.password,
    role: authSchema.role,
  });
});

testConnection()
  .then((result) => {
    console.log('Database connection test: OK');
    console.log('Database probe:', result);
  })
  .catch((error) => {
    console.error('Database connection test FAILED:', {
      message: error.message,
      code: error.code || null,
    });
  });
