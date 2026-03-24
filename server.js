require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const publicDir = path.join(__dirname, 'public');
const indexFile = path.join(publicDir, 'index.html');

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const api = express.Router();

api.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'node-api', message: 'Server is running' });
});

api.get('/db-test', async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS server_time');
    res.json({ ok: true, db: rows[0] || null });
  } catch (error) {
    next(error);
  }
});

app.use('/api', api);

const assetsDir = path.join(__dirname, 'assets');
if (fs.existsSync(assetsDir)) {
  app.use('/assets', express.static(assetsDir, { maxAge: isProduction ? '1d' : 0 }));
}

const uploadsDir = path.join(__dirname, 'uploads');
if (fs.existsSync(uploadsDir)) {
  app.use('/uploads', express.static(uploadsDir, { maxAge: isProduction ? '1d' : 0 }));
}

app.use(
  express.static(publicDir, {
    index: false,
    maxAge: isProduction ? '1h' : 0,
  })
);

app.get('/', (_req, res) => {
  if (!fs.existsSync(indexFile)) {
    return res.status(500).json({
      ok: false,
      error: 'public/index.html not found',
    });
  }

  return res.sendFile(indexFile);
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  if (path.extname(req.path)) {
    return next();
  }

  if (!fs.existsSync(indexFile)) {
    return res.status(500).json({
      ok: false,
      error: 'public/index.html not found',
    });
  }

  return res.sendFile(indexFile);
});

app.use('/api', (_req, res) => {
  res.status(404).json({ ok: false, error: 'API route not found' });
});

app.use((_req, res) => {
  res.status(404).send('Not found');
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  console.error(error);
  const message = isProduction ? 'Internal server error' : error.message;

  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ ok: false, error: message });
  }

  return res.status(500).send(message);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log('API routes: /api/health, /api/db-test');
  console.log(`Frontend file: ${indexFile}`);
});
