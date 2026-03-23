require('dotenv').config();

const http = require('http');
const pool = require('./config/db');

const PORT = Number(process.env.PORT || 3000);

const sendJson = (res, statusCode, data) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
};

const requestHandler = async (req, res) => {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  if (req.url === '/' || req.url === '/health') {
    return sendJson(res, 200, { ok: true, service: 'node-api', message: 'Server is running' });
  }

  if (req.url === '/db-test') {
    try {
      const [rows] = await pool.query('SELECT NOW() AS server_time');
      return sendJson(res, 200, { ok: true, db: rows[0] || null });
    } catch (error) {
      return sendJson(res, 500, { ok: false, error: error.message });
    }
  }

  return sendJson(res, 404, { ok: false, error: 'Not found' });
};

const server = http.createServer((req, res) => {
  requestHandler(req, res).catch((error) => {
    sendJson(res, 500, { ok: false, error: error.message });
  });
});

server.listen(PORT, () => {
  console.log(`Node server running at http://localhost:${PORT}`);
  console.log('Routes: GET /health, GET /db-test');
});

