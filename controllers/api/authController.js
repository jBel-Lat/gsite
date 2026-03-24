const bcrypt = require('bcryptjs');
const pool = require('../../config/db');
const { getTeamFromRole } = require('../../utils/roles');
const { cleanText } = require('../../utils/http');

const normalizeBcryptHash = (hash) => {
  if (!hash) return '';
  return hash.startsWith('$2y$') ? `$2a$${hash.slice(4)}` : hash;
};

const getPasswordValue = (user) => {
  return user.password_hash || user.password || user.pass_hash || '';
};

const verifyPassword = (plainText, storedValue) => {
  if (!storedValue) return false;

  const normalized = normalizeBcryptHash(String(storedValue));
  try {
    return bcrypt.compareSync(plainText, normalized);
  } catch (_error) {
    // Legacy fallback: some old tables may still store plain passwords.
    return String(storedValue) === plainText;
  }
};

const isDbError = (error) => {
  if (!error) return false;
  return Boolean(
    error.code ||
      error.errno ||
      String(error.message || '').includes('ECONN') ||
      String(error.message || '').includes('ER_')
  );
};

const mapDbError = (error) => {
  const code = error.code || '';
  if (code === 'ER_ACCESS_DENIED_ERROR') {
    return { status: 500, message: 'Database authentication failed. Check DB username/password.', code };
  }
  if (code === 'ER_BAD_DB_ERROR') {
    return { status: 500, message: 'Database not found. Check DB_NAME/MYSQLDATABASE.', code };
  }
  if (code === 'ER_NO_SUCH_TABLE') {
    return { status: 500, message: 'Required table is missing. Expected table: users.', code };
  }
  if (code === 'ER_BAD_FIELD_ERROR') {
    return { status: 500, message: 'users table schema mismatch (missing expected columns).', code };
  }
  if (code === 'ER_DUP_ENTRY') {
    return { status: 409, message: 'Username or email already exists.', code };
  }
  if (code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ETIMEDOUT') {
    return { status: 500, message: 'Cannot reach database server. Check host/port/network.', code };
  }
  return { status: 500, message: `Database error: ${error.message}`, code: code || 'UNKNOWN_DB_ERROR' };
};

const sendDbError = (res, error, context) => {
  const mapped = mapDbError(error);
  console.error(`[auth:${context}] database error`, {
    code: mapped.code,
    message: error.message,
    sqlMessage: error.sqlMessage || null,
    sqlState: error.sqlState || null,
  });
  return res.status(mapped.status).json({
    ok: false,
    error: mapped.message,
    code: mapped.code,
  });
};

const buildSessionUser = (row) => {
  const role = row.role || row.user_role || null;
  return {
    id: row.id,
    username: row.username || row.user_name || '',
    name: row.name || row.full_name || row.username || '',
    role,
    team: row.team || row.user_team || getTeamFromRole(role),
    profile_picture: row.profile_picture || row.avatar || null,
  };
};

const login = async (req, res) => {
  const username = cleanText(req.body?.username, 80);
  const password = String(req.body?.password ?? '');
  const scope = cleanText(req.body?.scope || 'admin', 30);

  try {
    if (!username || !password) {
      return res.status(400).json({ ok: false, error: 'username and password are required' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
    if (!rows.length) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    const user = rows[0];
    const validPassword = verifyPassword(password, getPasswordValue(user));
    if (!validPassword) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    const role = user.role || user.user_role || null;
    if (!role) {
      return res
        .status(500)
        .json({ ok: false, error: 'User role is missing in database row. Check users table schema.' });
    }

    if (scope === 'superadmin' && role !== 'superadmin') {
      return res.status(403).json({ ok: false, error: 'Superadmin credentials required' });
    }

    if (scope === 'admin' && role === 'superadmin') {
      return res.status(403).json({ ok: false, error: 'Use superadmin login for this account' });
    }

    req.session.user = buildSessionUser(user);
    console.log('[auth:login] success', { username, role, scope });
    return res.json({ ok: true, user: req.session.user });
  } catch (error) {
    if (isDbError(error)) {
      return sendDbError(res, error, 'login');
    }
    console.error('[auth:login] unexpected error', error);
    return res.status(500).json({ ok: false, error: `Login failed: ${error.message}` });
  }
};

const register = async (req, res) => {
  const username = cleanText(req.body?.username, 80);
  const password = String(req.body?.password ?? '');
  const email = cleanText(req.body?.email, 120);
  const name = cleanText(req.body?.name, 120);
  const role = cleanText(req.body?.role || 'developer_member', 40);

  try {
    const allowPublicRegister = String(process.env.ALLOW_PUBLIC_REGISTER || '').toLowerCase() === 'true';
    const isSuperadminSession = req.session?.user?.role === 'superadmin';
    if (!allowPublicRegister && !isSuperadminSession) {
      return res.status(403).json({
        ok: false,
        error: 'Registration is disabled. Set ALLOW_PUBLIC_REGISTER=true or register while logged in as superadmin.',
      });
    }

    if (!username || !password || !email || !name) {
      return res.status(400).json({ ok: false, error: 'username, password, email, and name are required' });
    }

    if (role === 'superadmin' && !isSuperadminSession) {
      return res.status(403).json({ ok: false, error: 'Only superadmin can register another superadmin.' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const team = req.body?.team || getTeamFromRole(role);

    try {
      await pool.query(
        `
          INSERT INTO users (username, password_hash, email, name, role, team)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [username, hash, email, name, role, team]
      );
    } catch (error) {
      const isUnknownColumn = error && (error.code === 'ER_BAD_FIELD_ERROR' || error.errno === 1054);
      if (!isUnknownColumn) throw error;

      // Legacy fallback if users table has no team column.
      await pool.query(
        `
          INSERT INTO users (username, password_hash, email, name, role)
          VALUES (?, ?, ?, ?, ?)
        `,
        [username, hash, email, name, role]
      );
    }

    return res.status(201).json({
      ok: true,
      message: 'User registered',
      user: { username, email, name, role, team },
    });
  } catch (error) {
    if (isDbError(error)) {
      return sendDbError(res, error, 'register');
    }
    console.error('[auth:register] unexpected error', error);
    return res.status(500).json({ ok: false, error: `Register failed: ${error.message}` });
  }
};

const me = async (req, res) => {
  if (!req.session?.user) {
    return res.status(200).json({ ok: true, user: null });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [req.session.user.id]
    );

    if (!rows.length) {
      req.session.destroy(() => {});
      return res.status(200).json({ ok: true, user: null });
    }

    req.session.user = buildSessionUser(rows[0]);
    return res.json({ ok: true, user: req.session.user });
  } catch (error) {
    if (isDbError(error)) {
      return sendDbError(res, error, 'me');
    }
    console.error('[auth:me] unexpected error', error);
    return res.status(500).json({ ok: false, error: `Auth session check failed: ${error.message}` });
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy((error) => {
      if (error) {
        console.error('[auth:logout] session destroy failed', error);
        return res.status(500).json({ ok: false, error: 'Logout failed while clearing session' });
      }
      res.clearCookie('ccs_sid');
      return res.json({ ok: true, message: 'Logged out' });
    });
  } catch (error) {
    console.error('[auth:logout] unexpected error', error);
    return res.status(500).json({ ok: false, error: `Logout failed: ${error.message}` });
  }
};

module.exports = {
  login,
  register,
  logout,
  me,
};
