const authStrategy = String(process.env.AUTH_STRATEGY || 'session').toLowerCase();
const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'render-login-secret';

const parseBearerToken = (req) => {
  const raw = req.headers?.authorization || '';
  if (!raw) {
    return { token: null, error: null, hasAuthHeader: false };
  }

  const [scheme, token] = String(raw).split(' ');
  if (scheme !== 'Bearer' || !token) {
    return {
      token: null,
      error: 'Invalid authorization format. Expected Bearer token.',
      hasAuthHeader: true,
    };
  }

  return { token: token.trim(), error: null, hasAuthHeader: true };
};

const verifyJwtToken = (token) => {
  if (!token) {
    return { user: null, error: null };
  }

  let jwt;
  try {
    jwt = require('jsonwebtoken');
  } catch (_error) {
    return { user: null, error: 'JWT package is missing on server.' };
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    return {
      user: {
        id: payload?.sub || payload?.id || null,
        username: payload?.username || '',
        role: payload?.role || null,
      },
      error: null,
    };
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      return { user: null, error: 'Invalid or expired token' };
    }
    return { user: null, error: 'Invalid or expired token' };
  }
};

const resolveRequestAuth = (req) => {
  if (req.session?.user) {
    return { user: req.session.user, error: null, source: 'session', hasAuthHeader: false };
  }

  const parsed = parseBearerToken(req);
  if (parsed.error) {
    return { user: null, error: parsed.error, source: 'bearer', hasAuthHeader: parsed.hasAuthHeader };
  }

  if (!parsed.token) {
    return { user: null, error: null, source: authStrategy, hasAuthHeader: false };
  }

  const verified = verifyJwtToken(parsed.token);
  return {
    user: verified.user,
    error: verified.error,
    source: 'bearer',
    hasAuthHeader: true,
  };
};

const syncUserIntoSession = (req, user) => {
  if (!user) return;
  if (!req.session) return;
  if (!req.session.user) {
    req.session.user = { ...user };
  }
};

const requireAuth = (req, res, next) => {
  const rawAuthHeader = req.headers?.authorization || '';
  const authResult = resolveRequestAuth(req);
  const user = authResult.user;

  console.log('[auth:requireAuth] incoming', {
    method: req.method,
    path: req.originalUrl || req.url,
    strategy: authStrategy,
    hasAuthHeader: Boolean(rawAuthHeader),
    authHeaderPreview: rawAuthHeader ? `${String(rawAuthHeader).slice(0, 32)}...` : null,
    source: authResult.source,
    hasUser: Boolean(user),
    error: authResult.error || null,
  });

  if (authResult.error && !user) {
    return res.status(401).json({ ok: false, error: authResult.error });
  }

  if (!user) {
    return res.status(401).json({ ok: false, error: 'Authentication required' });
  }
  syncUserIntoSession(req, user);
  req.user = user;
  return next();
};

const requireRoles = (roles) => {
  const roleList = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    const rawAuthHeader = req.headers?.authorization || '';
    const authResult = resolveRequestAuth(req);
    const user = authResult.user;

    console.log('[auth:requireRoles] incoming', {
      method: req.method,
      path: req.originalUrl || req.url,
      requiredRoles: roleList,
      strategy: authStrategy,
      hasAuthHeader: Boolean(rawAuthHeader),
      authHeaderPreview: rawAuthHeader ? `${String(rawAuthHeader).slice(0, 32)}...` : null,
      source: authResult.source,
      hasUser: Boolean(user),
      role: user?.role || null,
      error: authResult.error || null,
    });

    if (authResult.error && !user) {
      return res.status(401).json({ ok: false, error: authResult.error });
    }

    if (!user) {
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }
    if (!roleList.includes(user.role)) {
      return res.status(403).json({ ok: false, error: 'Access denied' });
    }
    syncUserIntoSession(req, user);
    req.user = user;
    return next();
  };
};

const attachUser = (req, _res, next) => {
  const authResult = resolveRequestAuth(req);
  const user = authResult.user;
  syncUserIntoSession(req, user);
  req.user = user;
  req.authError = authResult.error || null;
  next();
};

module.exports = {
  attachUser,
  requireAuth,
  requireRoles,
};
