require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const sendServiceStatus = (_req, res) => {
  res.json({ ok: true, service: 'node-api', message: 'Server is running' });
};

const dbTestHandler = async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS server_time');
    res.json({ ok: true, db: rows[0] || null });
  } catch (error) {
    next(error);
  }
};

const api = express.Router();
api.get('/health', sendServiceStatus);
api.get('/db-test', dbTestHandler);

app.use('/api', api);

app.get('/health', sendServiceStatus);
app.get('/db-test', dbTestHandler);

const frontendDirCandidates = [
  process.env.FRONTEND_DIR ? path.resolve(__dirname, process.env.FRONTEND_DIR) : null,
  path.join(__dirname, 'public'),
  path.join(__dirname, 'frontend', 'dist'),
  path.join(__dirname, 'frontend', 'build'),
  __dirname,
].filter(Boolean);

const frontendDir = frontendDirCandidates.find((dirPath) => {
  return fs.existsSync(path.join(dirPath, 'index.html'));
});

const assetsDir = path.join(__dirname, 'assets');
if (fs.existsSync(assetsDir)) {
  app.use('/assets', express.static(assetsDir));
}

const uploadsDir = path.join(__dirname, 'uploads');
if (fs.existsSync(uploadsDir)) {
  app.use('/uploads', express.static(uploadsDir));
}

if (frontendDir) {
  app.use(
    express.static(frontendDir, {
      index: false,
      maxAge: isProduction ? '1h' : 0,
    })
  );

  app.get('/', (_req, res) => {
    res.sendFile(path.join(frontendDir, 'index.html'));
  });

  app.get(/^(?!\/api(?:\/|$)).*/, (req, res, next) => {
    if (path.extname(req.path)) {
      return next();
    }

    return res.sendFile(path.join(frontendDir, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.status(200).json({
      ok: true,
      service: 'node-api',
      message: 'Frontend not found. Add index.html to public/, frontend/dist/, or frontend/build/.',
    });
  });
}

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ ok: false, error: 'API route not found' });
  }

  return res.status(404).send('Not found');
});

app.use((error, _req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  console.error(error);

  return res.status(500).json({
    ok: false,
    error: isProduction ? 'Internal server error' : error.message,
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log('API routes: /api/health, /api/db-test');
  console.log(frontendDir ? `Frontend directory: ${frontendDir}` : 'No frontend directory detected');
});
