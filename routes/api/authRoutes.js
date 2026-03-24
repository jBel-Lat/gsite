const express = require('express');
const { asyncHandler } = require('../../utils/http');
const authController = require('../../controllers/api/authController');

const router = express.Router();

router.use((req, _res, next) => {
  const body = req.body || {};
  console.log('[api/auth] request', {
    method: req.method,
    path: req.originalUrl || req.url,
    contentType: req.headers['content-type'] || null,
    bodyKeys: Object.keys(body),
    username: body.username || null,
    scope: body.scope || null,
  });
  next();
});

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'auth', message: 'Auth routes are registered' });
});

router.post('/login', asyncHandler(authController.login));
router.post('/register', asyncHandler(authController.register));
router.post('/logout', asyncHandler(authController.logout));
router.get('/me', asyncHandler(authController.me));

module.exports = router;
