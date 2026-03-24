const jwt = require('jsonwebtoken');
const defaultSessionSecret = 'change-this-in-production';
let jwtFallbackWarned = false;

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

const resolveJwtSecret = () => {
  const jwtSecret = String(process.env.JWT_SECRET || '').trim();
  if (jwtSecret) {
    return { secret: jwtSecret, source: 'JWT_SECRET' };
  }

  const sessionSecret = String(process.env.SESSION_SECRET || '').trim();
  if (sessionSecret) {
    return { secret: sessionSecret, source: 'SESSION_SECRET' };
  }

  return { secret: defaultSessionSecret, source: 'SESSION_SECRET_DEFAULT' };
};

const requireAuth = (req, res, next) => {
  const authHeader = req.headers?.authorization || '';

  console.log('[authMiddleware] authorization header:', authHeader || null);

  const parsed = parseBearerToken(authHeader);
  if (parsed.error) {
    return res.status(401).json({ ok: false, error: parsed.error });
  }

  const resolved = resolveJwtSecret();
  if ((resolved.source === 'SESSION_SECRET' || resolved.source === 'SESSION_SECRET_DEFAULT') && !jwtFallbackWarned) {
    jwtFallbackWarned = true;
    const mode =
      resolved.source === 'SESSION_SECRET_DEFAULT'
        ? 'default insecure SESSION_SECRET fallback'
        : 'SESSION_SECRET fallback';
    console.warn(`[authMiddleware] JWT_SECRET missing; using ${mode} for token verification. Set JWT_SECRET in production.`);
  }

  try {
    const decoded = jwt.verify(parsed.token, resolved.secret);
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
