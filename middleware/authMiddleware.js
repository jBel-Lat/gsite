const jwt = require('jsonwebtoken');

const normalizeRole = (rawRole) => {
  const role = String(rawRole || '').trim().toLowerCase().replace(/\s+/g, '_');
  if (!role) return '';

  const aliases = {
    'multimedia-head': 'multimedia_head',
    multimedia_head: 'multimedia_head',
    multimedia: 'multimedia_head',
    media_head: 'multimedia_head',
    'multimedia_heads': 'multimedia_head',
  };

  return aliases[role] || role;
};

const parseBearerToken = (authHeader) => {
  if (!authHeader) {
    return { token: null, error: 'Authentication required' };
  }

  const [scheme, token] = String(authHeader).split(' ');
  if (scheme !== 'Bearer' || !token) {
    return { token: null, error: 'Authentication required' };
  }

  return { token: token.trim(), error: null };
};

const requireAuth = (req, res, next) => {
  const authHeader = req.headers?.authorization || '';

  console.log('[authMiddleware] authorization header:', authHeader || null);

  const parsed = parseBearerToken(authHeader);
  if (parsed.error) {
    return res.status(401).json({ ok: false, error: parsed.error });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('[authMiddleware] JWT_SECRET is missing');
    return res.status(500).json({ ok: false, error: 'Server JWT secret is not configured' });
  }

  try {
    const decoded = jwt.verify(parsed.token, jwtSecret);
    const normalizedRole = normalizeRole(decoded?.role);

    console.log('[authMiddleware] decoded token payload:', {
      sub: decoded?.sub || decoded?.id || null,
      username: decoded?.username || null,
      role: decoded?.role || null,
      normalizedRole,
    });

    req.user = {
      id: decoded?.sub || decoded?.id || null,
      username: decoded?.username || null,
      role: normalizedRole,
      rawRole: decoded?.role || null,
    };

    return next();
  } catch (error) {
    console.error('[authMiddleware] token verification error:', {
      message: error.message,
      name: error.name,
    });
    return res.status(401).json({ ok: false, error: 'Invalid or expired token' });
  }
};

module.exports = {
  requireAuth,
  normalizeRole,
};
