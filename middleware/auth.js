const requireAuth = (req, res, next) => {
  if (!req.session?.user) {
    return res.status(401).json({ ok: false, error: 'Authentication required' });
  }
  return next();
};

const requireRoles = (roles) => {
  const roleList = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.session?.user) {
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }
    if (!roleList.includes(req.session.user.role)) {
      return res.status(403).json({ ok: false, error: 'Access denied' });
    }
    return next();
  };
};

const attachUser = (req, _res, next) => {
  req.user = req.session?.user || null;
  next();
};

module.exports = {
  attachUser,
  requireAuth,
  requireRoles,
};

