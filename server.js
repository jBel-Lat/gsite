require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const pool = require('./config/db');
const apiRoutes = require('./routes/api');
const webRoutes = require('./routes/webRoutes');
const { attachUser } = require('./middleware/auth');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

const sessionSecret = process.env.SESSION_SECRET || 'change-this-in-production';
const publicDir = path.join(__dirname, 'public');
const assetsDir = path.join(__dirname, 'assets');
const uploadsDir = path.join(__dirname, 'uploads');
const defaultIndex = path.join(publicDir, 'index.html');
const faviconPath = path.join(publicDir, 'favicon.ico');

app.disable('x-powered-by');

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

// Optional: avoid noisy 404 logs when favicon is missing.
app.get('/favicon.ico', (_req, res) => {
  if (fs.existsSync(faviconPath)) {
    return res.sendFile(faviconPath);
  }
  return res.status(204).end();
});

app.use(
  express.static(publicDir, {
    index: false,
    maxAge: isProduction ? '1h' : 0,
  })
);

if (fs.existsSync(assetsDir)) {
  app.use('/assets', express.static(assetsDir, { maxAge: isProduction ? '1d' : 0 }));
}

if (fs.existsSync(uploadsDir)) {
  app.use('/uploads', express.static(uploadsDir, { maxAge: isProduction ? '1d' : 0 }));
}

app.use('/api', apiRoutes);
app.use(webRoutes);

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  if (path.extname(req.path)) {
    return res.status(404).send('Not found');
  }

  if (!fs.existsSync(defaultIndex)) {
    return res.status(500).send('public/index.html not found');
  }

  return res.sendFile(defaultIndex);
});

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
  console.log(`Server listening on port ${PORT}`);
  console.log('API base: /api');
  console.log(`Public directory: ${publicDir}`);
  console.log('Auth routes: POST /api/auth/login, POST /api/auth/register, GET /api/auth/me, POST /api/auth/logout');
  console.log('DB env summary:', {
    host: process.env.MYSQLHOST || process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'cc_gsite_db',
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  });
});

pool
  .query('SELECT 1 AS ok')
  .then(() => {
    console.log('Database connection test: OK');
  })
  .catch((error) => {
    console.error('Database connection test FAILED:', {
      message: error.message,
      code: error.code || null,
    });
  });
