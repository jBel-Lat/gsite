const MULTIMEDIA_HEAD_ROLE = 'multimedia_head';
const MULTIMEDIA_MEMBER_ROLES = [
  'photographer',
  'videographer',
  'graphic_designer',
  'documentator',
  // Backward compatibility with old schema/data.
  'multimedia_member',
  'multimedia',
];

const MULTIMEDIA_ALLOWED_ROLES = ['superadmin', 'admin', MULTIMEDIA_HEAD_ROLE, ...MULTIMEDIA_MEMBER_ROLES];

const getUser = (req) => req.user || req.session?.user || null;

const requireMultimediaAccess = (req, res, next) => {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ ok: false, error: 'Authentication required' });
  }

  if (!MULTIMEDIA_ALLOWED_ROLES.includes(user.role)) {
    return res.status(403).json({ ok: false, error: 'Access denied for multimedia module' });
  }

  req.user = user;
  return next();
};

const requireMultimediaHead = (req, res, next) => {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ ok: false, error: 'Authentication required' });
  }

  if (user.role !== MULTIMEDIA_HEAD_ROLE && user.role !== 'superadmin') {
    return res.status(403).json({ ok: false, error: 'Only Multimedia Head can perform this action' });
  }

  req.user = user;
  return next();
};

const canAccessAssignedTeam = (role, assignedTeam) => {
  if (!role) return false;
  if (role === MULTIMEDIA_HEAD_ROLE || role === 'superadmin' || role === 'admin') return true;

  const normalizedTeam = String(assignedTeam || '').toLowerCase();
  if (normalizedTeam === 'all_teams') return true;

  if (role === 'multimedia_member') {
    // Legacy role can access all multimedia files.
    return true;
  }

  return role === normalizedTeam;
};

module.exports = {
  MULTIMEDIA_HEAD_ROLE,
  MULTIMEDIA_MEMBER_ROLES,
  MULTIMEDIA_ALLOWED_ROLES,
  requireMultimediaAccess,
  requireMultimediaHead,
  canAccessAssignedTeam,
};
