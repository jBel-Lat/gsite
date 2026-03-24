const bcrypt = require('bcryptjs');
const pool = require('../../config/db');
const { getTeamFromRole } = require('../../utils/roles');
const { cleanText } = require('../../utils/http');

const normalizeBcryptHash = (hash) => {
  if (!hash) return '';
  return hash.startsWith('$2y$') ? `$2a$${hash.slice(4)}` : hash;
};

const buildSessionUser = (row) => {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
    team: row.team || getTeamFromRole(row.role),
    profile_picture: row.profile_picture || null,
  };
};

const login = async (req, res) => {
  const username = cleanText(req.body.username, 80);
  const password = String(req.body.password ?? '');
  const scope = cleanText(req.body.scope || 'admin', 30);

  if (!username || !password) {
    return res.status(400).json({ ok: false, error: 'username and password are required' });
  }

  const [rows] = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
  if (!rows.length) {
    return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  }

  const user = rows[0];
  const passwordHash = normalizeBcryptHash(user.password_hash);
  const validPassword = bcrypt.compareSync(password, passwordHash);
  if (!validPassword) {
    return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  }

  if (scope === 'superadmin' && user.role !== 'superadmin') {
    return res.status(403).json({ ok: false, error: 'Superadmin credentials required' });
  }

  if (scope === 'admin' && user.role === 'superadmin') {
    return res.status(403).json({ ok: false, error: 'Use superadmin login for this account' });
  }

  req.session.user = buildSessionUser(user);
  return res.json({ ok: true, user: req.session.user });
};

const me = async (req, res) => {
  if (!req.session?.user) {
    return res.status(200).json({ ok: true, user: null });
  }

  const [rows] = await pool.query(
    'SELECT id, username, name, role, team, profile_picture FROM users WHERE id = ? LIMIT 1',
    [req.session.user.id]
  );

  if (!rows.length) {
    req.session.destroy(() => {});
    return res.status(200).json({ ok: true, user: null });
  }

  req.session.user = buildSessionUser(rows[0]);
  return res.json({ ok: true, user: req.session.user });
};

const logout = async (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('ccs_sid');
    res.json({ ok: true, message: 'Logged out' });
  });
};

module.exports = {
  login,
  logout,
  me,
};

