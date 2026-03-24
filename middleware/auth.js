const authStrategy = String(process.env.AUTH_STRATEGY || 'session').toLowerCase();
const jwtSecret = process.env.JWT_SECRET || '';

const parseBearerToken = (req) => {
  const raw = req.headers?.authorization || '';
  const [scheme, token] = String(raw).split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token.trim();
};

const getUserFromJwt = (req) => {
  if (authStrategy !== 'jwt') return null;

  const token = parseBearerToken(req);
  if (!token) return null;
  if (!jwtSecret) return null;

  let jwt;
  try {
    jwt = require('jsonwebtoken');
  } catch (_error) {
    return null;
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    return {
      id: payload?.sub || payload?.id || null,
      username: payload?.username || '',
      role: payload?.role || null,
    };
  } catch (_error) {
    return null;
  }
};

const getRequestUser = (req) => {
  if (req.session?.user) return req.session.user;
  return getUserFromJwt(req);
};

const syncUserIntoSession = (req, user) => {
  if (!user) return;
  if (!req.session) return;
  if (!req.session.user) {
    req.session.user = { ...user };
  }
};

const requireAuth = (req, res, next) => {
  const user = getRequestUser(req);
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
    const user = getRequestUser(req);
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
  const user = getRequestUser(req);
  syncUserIntoSession(req, user);
  req.user = user;
  next();
};

module.exports = {
  attachUser,
  requireAuth,
  requireRoles,
};
