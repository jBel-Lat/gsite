const { normalizeRole } = require('./authMiddleware');

const requireAnyRole = (allowedRoles) => {
  const allowed = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]).map((item) =>
    normalizeRole(item)
  );

  return (req, res, next) => {
    const normalizedRole = normalizeRole(req.user?.role || req.user?.rawRole || '');
    req.user.role = normalizedRole;

    if (!normalizedRole) {
      return res.status(403).json({ ok: false, error: 'Access denied: missing role' });
    }

    if (!allowed.includes(normalizedRole)) {
      return res.status(403).json({ ok: false, error: 'Access denied: role not allowed' });
    }

    return next();
  };
};

const requireRole = (role) => requireAnyRole([role]);

module.exports = {
  requireAnyRole,
  requireRole,
};
