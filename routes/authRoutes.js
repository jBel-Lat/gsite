const express = require('express');
const authController = require('../controllers/authController');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

router.use((req, _res, next) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  console.log('[api/auth] request', {
    method: req.method,
    path: req.originalUrl || req.url,
    contentType: req.headers['content-type'] || null,
    bodyKeys: Object.keys(body),
    username: body.username || body.email || null,
    scope: body.scope || null,
  });
  next();
});

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'auth', message: 'Auth routes are registered' });
});
router.get('/db-debug', asyncHandler(authController.dbDebug));

router.post('/login', asyncHandler(authController.login));
router.post('/register', asyncHandler(authController.register));
router.get('/me', asyncHandler(authController.me));
router.post('/logout', asyncHandler(authController.logout));

module.exports = router;
