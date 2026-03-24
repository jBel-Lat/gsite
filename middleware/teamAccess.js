const TEAM_ROLE_ALLOW = {
  developer: ['developer_head', 'developer_member'],
  multimedia: ['multimedia_head', 'multimedia_member'],
};

const requireTeamAccess = (team) => {
  const allowedRoles = TEAM_ROLE_ALLOW[team] || [];

  return (req, res, next) => {
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ ok: false, error: `Access denied for ${team} module` });
    }
    return next();
  };
};

const requireTeamHead = (team) => {
  return (req, res, next) => {
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }
    const expectedRole = `${team}_head`;
    if (user.role !== expectedRole) {
      return res.status(403).json({ ok: false, error: `Only ${team} head can perform this action` });
    }
    return next();
  };
};

module.exports = {
  requireTeamAccess,
  requireTeamHead,
};
