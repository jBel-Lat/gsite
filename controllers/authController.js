const bcrypt = require('bcryptjs');
const { pool, getAuthSchema, getDbType, getPublicDbConfig } = require('../config/database');
const { cleanText } = require('../utils/http');
const { getTeamFromRole } = require('../utils/roles');

const isProduction = process.env.NODE_ENV === 'production';
const authStrategy = String(process.env.AUTH_STRATEGY || 'session').toLowerCase();
const dbType = typeof getDbType === 'function' ? getDbType() : 'mysql';

const defaultSchema = {
  table: 'users',
  id: 'id',
  username: 'username',
  email: 'email',
  password: 'password_hash',
  role: 'role',
  name: 'name',
  team: 'team',
  profilePicture: 'profile_picture',
};

const rawSchema = typeof getAuthSchema === 'function' ? getAuthSchema() : {};

const asSafeIdentifier = (value, fallback) => {
  const text = String(value || fallback || '').trim();
  if (!text || !/^[A-Za-z0-9_]+$/.test(text)) {
    return fallback;
  }
  return text;
};

const schema = {
  table: asSafeIdentifier(rawSchema.table, defaultSchema.table),
  id: asSafeIdentifier(rawSchema.id, defaultSchema.id),
  username: asSafeIdentifier(rawSchema.username, defaultSchema.username),
  email: asSafeIdentifier(rawSchema.email, defaultSchema.email),
  password: asSafeIdentifier(rawSchema.password, defaultSchema.password),
  role: asSafeIdentifier(rawSchema.role, defaultSchema.role),
  name: asSafeIdentifier(rawSchema.name, defaultSchema.name),
  team: asSafeIdentifier(rawSchema.team, defaultSchema.team),
  profilePicture: asSafeIdentifier(rawSchema.profilePicture, defaultSchema.profilePicture),
};

const quoteIdent = (identifier) => {
  if (dbType === 'postgres') {
    return `"${String(identifier).replace(/"/g, '""')}"`;
  }
  return `\`${String(identifier).replace(/`/g, '``')}\``;
};

let cachedColumns = null;
let columnsCacheExpiresAt = 0;

const normalizeBcryptHash = (hash) => {
  const value = String(hash || '');
  return value.startsWith('$2y$') ? `$2a$${value.slice(4)}` : value;
};

const isLikelyBcryptHash = (hash) => /^\$2[aby]\$\d\d\$/.test(String(hash || ''));

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
  const code = error?.code || '';
  if (code === '28P01' || code === '28000') {
    return { status: 500, message: 'Database authentication failed. Check DB_USER/DB_PASSWORD.', code };
  }
  if (code === '3D000') {
    return { status: 500, message: 'Database not found. Check DB_NAME.', code };
  }
  if (code === '42P01') {
    return { status: 500, message: `Required table is missing. Expected table: ${schema.table}.`, code };
  }
  if (code === '42703') {
    return {
      status: 500,
      message: `Table schema mismatch. Check columns in ${schema.table} and auth column settings.`,
      code,
    };
  }
  if (code === '23505') {
    return { status: 409, message: 'Username or email already exists.', code };
  }
  if (code === 'ER_ACCESS_DENIED_ERROR') {
    return { status: 500, message: 'Database authentication failed. Check DB_USER/DB_PASSWORD.', code };
  }
  if (code === 'ER_BAD_DB_ERROR') {
    return { status: 500, message: 'Database not found. Check DB_NAME.', code };
  }
  if (code === 'ER_NO_SUCH_TABLE') {
    return { status: 500, message: `Required table is missing. Expected table: ${schema.table}.`, code };
  }
  if (code === 'ER_BAD_FIELD_ERROR') {
    return {
      status: 500,
      message: `Table schema mismatch. Check columns in ${schema.table} and auth column settings.`,
      code,
    };
  }
  if (code === 'ER_DUP_ENTRY') {
    return { status: 409, message: 'Username or email already exists.', code };
  }
  if (code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ETIMEDOUT') {
    return { status: 500, message: 'Cannot reach database server. Check host/port/network.', code };
  }
  return {
    status: 500,
    message: `Database error: ${error?.sqlMessage || error?.message || 'Unknown database error'}`,
    code: code || 'UNKNOWN_DB_ERROR',
  };
};

const sendDbError = (res, error, context) => {
  const mapped = mapDbError(error);
  console.error(`[auth:${context}] database error`, {
    code: mapped.code,
    message: error?.message || null,
    sqlMessage: error?.sqlMessage || null,
    sqlState: error?.sqlState || null,
    dbType,
  });
  console.error(error);
  return res.status(mapped.status).json({
    ok: false,
    error: mapped.message,
    code: mapped.code,
    debug: error?.message || null,
  });
};

const pickColumn = (columns, candidates) => {
  for (const candidate of candidates) {
    if (columns.has(candidate)) {
      return candidate;
    }
  }
  return null;
};

const getValue = (row, candidates, fallback = null) => {
  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(row, key) && row[key] !== undefined) {
      return row[key];
    }
  }
  return fallback;
};

const getUsersColumns = async () => {
  const now = Date.now();
  if (cachedColumns && now < columnsCacheExpiresAt) {
    return cachedColumns;
  }

  let rows = [];
  if (dbType === 'postgres') {
    [rows] = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ?`,
      [schema.table]
    );
  } else {
    [rows] = await pool.query(`SHOW COLUMNS FROM ${quoteIdent(schema.table)}`);
  }

  const columns = new Set(
    rows.map((row) => String(row.Field || row.column_name || row.COLUMN_NAME || '')).filter(Boolean)
  );
  cachedColumns = columns;
  columnsCacheExpiresAt = now + 60_000;
  return columns;
};

const getColumnMap = (columns) => {
  return {
    id: pickColumn(columns, [schema.id, 'id', 'user_id']),
    username: pickColumn(columns, [schema.username, 'username', 'user_name']),
    email: pickColumn(columns, [schema.email, 'email', 'user_email']),
    password: pickColumn(columns, [schema.password, 'password_hash', 'password', 'pass_hash']),
    role: pickColumn(columns, [schema.role, 'role', 'user_role']),
    name: pickColumn(columns, [schema.name, 'name', 'full_name']),
    team: pickColumn(columns, [schema.team, 'team', 'user_team']),
    profilePicture: pickColumn(columns, [schema.profilePicture, 'profile_picture', 'avatar']),
  };
};

const buildSessionUser = (row, map) => {
  const role = getValue(row, [map.role, 'role', 'user_role'], null);
  const username = getValue(row, [map.username, 'username', 'user_name'], '');
  return {
    id: getValue(row, [map.id, 'id', 'user_id'], null),
    username,
    name: getValue(row, [map.name, 'name', 'full_name'], username),
    role,
    team: getValue(row, [map.team, 'team', 'user_team'], getTeamFromRole(role)),
    profile_picture: getValue(row, [map.profilePicture, 'profile_picture', 'avatar'], null),
  };
};

const verifyPassword = (plainText, storedPassword) => {
  if (!storedPassword) return false;
  const value = String(storedPassword);

  if (isLikelyBcryptHash(value)) {
    try {
      return bcrypt.compareSync(plainText, normalizeBcryptHash(value));
    } catch (error) {
      console.error('[auth:login] bcrypt compare failed, using plain-text fallback', {
        message: error.message,
      });
      return value === plainText;
    }
  }

  // Temporary fallback for legacy plain-text passwords.
  return value === plainText;
};

const createOptionalJwt = (sessionUser) => {
  if (authStrategy !== 'jwt') {
    return null;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    const error = new Error('JWT strategy is enabled but JWT_SECRET is missing.');
    error.code = 'JWT_SECRET_MISSING';
    throw error;
  }

  let jwt;
  try {
    // Loaded only when JWT mode is enabled.
    jwt = require('jsonwebtoken');
  } catch (_error) {
    const error = new Error('JWT strategy is enabled but jsonwebtoken package is not installed.');
    error.code = 'JWT_PACKAGE_MISSING';
    throw error;
  }

  return jwt.sign(
    { sub: sessionUser.id, role: sessionUser.role, username: sessionUser.username },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
  );
};

const login = async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const loginInput = cleanText(body.username || body.email || body.identifier, 120);
  const password = String(body.password ?? '');
  const scope = cleanText(body.scope || 'admin', 30);

  console.log('[auth:login] incoming request', {
    contentType: req.headers['content-type'] || null,
    bodyKeys: Object.keys(body),
    loginInput,
    hasPassword: Boolean(password),
    scope,
  });

  if (!loginInput || !password) {
    return res.status(400).json({
      ok: false,
      error: 'email/username and password are required',
      received: { hasLoginField: Boolean(loginInput), hasPassword: Boolean(password) },
    });
  }

  try {
    const columns = await getUsersColumns();
    const map = getColumnMap(columns);

    if (!map.username || !map.password) {
      return res.status(500).json({
        ok: false,
        error: `Login schema mismatch. Required columns not found in ${schema.table}.`,
        details: {
          requiredAnyOf: {
            username: ['username', 'user_name'],
            password: ['password_hash', 'password', 'pass_hash'],
          },
        },
      });
    }

    const whereClause = map.email
      ? `${quoteIdent(map.username)} = ? OR ${quoteIdent(map.email)} = ?`
      : `${quoteIdent(map.username)} = ?`;
    const params = map.email ? [loginInput, loginInput] : [loginInput];

    const [rows] = await pool.query(
      `SELECT * FROM ${quoteIdent(schema.table)} WHERE ${whereClause} LIMIT 1`,
      params
    );

    if (!rows.length) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    const user = rows[0];
    const storedPassword = getValue(user, [map.password, 'password_hash', 'password', 'pass_hash'], '');
    const validPassword = verifyPassword(password, storedPassword);

    if (!validPassword) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    const role = getValue(user, [map.role, 'role', 'user_role'], null);
    if (!role) {
      return res.status(500).json({
        ok: false,
        error: 'User role is missing. Check users table role column.',
      });
    }

    if (scope === 'superadmin' && role !== 'superadmin') {
      return res.status(403).json({ ok: false, error: 'Superadmin credentials required' });
    }

    if (scope === 'admin' && role === 'superadmin') {
      return res.status(403).json({ ok: false, error: 'Use superadmin login for this account' });
    }

    const sessionUser = buildSessionUser(user, map);
    req.session.user = sessionUser;

    let token = null;
    try {
      token = createOptionalJwt(sessionUser);
    } catch (jwtError) {
      console.error('[auth:login] jwt setup error', {
        code: jwtError.code || null,
        message: jwtError.message,
      });
      return res.status(500).json({
        ok: false,
        error: jwtError.message,
        code: jwtError.code || 'JWT_ERROR',
      });
    }

    console.log('[auth:login] success', {
      id: sessionUser.id,
      username: sessionUser.username,
      role: sessionUser.role,
      strategy: authStrategy,
    });

    return res.json({
      ok: true,
      success: true,
      user: sessionUser,
      role: sessionUser.role || null,
      token: token || null,
      auth: authStrategy,
    });
  } catch (error) {
    if (isDbError(error)) {
      return sendDbError(res, error, 'login');
    }

    console.error('[auth:login] unexpected error', error);
    return res.status(500).json({
      ok: false,
      error: `Login failed: ${error.message}`,
      debug: error.message,
    });
  }
};

const register = async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const username = cleanText(body.username, 80);
  const password = String(body.password ?? '');
  const email = cleanText(body.email, 120);
  const name = cleanText(body.name, 120);
  const role = cleanText(body.role || 'developer_member', 40);

  try {
    const allowPublicRegister = String(process.env.ALLOW_PUBLIC_REGISTER || '').toLowerCase() === 'true';
    const isSuperadminSession = req.session?.user?.role === 'superadmin';

    if (!allowPublicRegister && !isSuperadminSession) {
      return res.status(403).json({
        ok: false,
        error: 'Registration is disabled. Set ALLOW_PUBLIC_REGISTER=true or register as superadmin.',
      });
    }

    if (!username || !password) {
      return res.status(400).json({ ok: false, error: 'username and password are required' });
    }

    if (role === 'superadmin' && !isSuperadminSession) {
      return res.status(403).json({ ok: false, error: 'Only superadmin can create another superadmin.' });
    }

    const columns = await getUsersColumns();
    const map = getColumnMap(columns);

    if (!map.username || !map.password) {
      return res.status(500).json({
        ok: false,
        error: `Register schema mismatch. Missing username/password column in ${schema.table}.`,
      });
    }

    const duplicateWhere = map.email
      ? `${quoteIdent(map.username)} = ? OR ${quoteIdent(map.email)} = ?`
      : `${quoteIdent(map.username)} = ?`;
    const duplicateParams = map.email ? [username, email] : [username];

    const [existingRows] = await pool.query(
      `SELECT ${quoteIdent(map.username)}${map.email ? `, ${quoteIdent(map.email)}` : ''} FROM ${quoteIdent(schema.table)} WHERE ${duplicateWhere} LIMIT 1`,
      duplicateParams
    );
    if (existingRows.length) {
      return res.status(409).json({ ok: false, error: 'Username or email already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const team = cleanText(body.team || getTeamFromRole(role), 30) || null;

    const insertColumns = [map.username, map.password];
    const insertValues = [username, passwordHash];

    if (map.email) {
      insertColumns.push(map.email);
      insertValues.push(email || `${username}@example.local`);
    }
    if (map.name) {
      insertColumns.push(map.name);
      insertValues.push(name || username);
    }
    if (map.role) {
      insertColumns.push(map.role);
      insertValues.push(role);
    }
    if (map.team) {
      insertColumns.push(map.team);
      insertValues.push(team);
    }

    const placeholders = insertColumns.map(() => '?').join(', ');
    const columnSql = insertColumns.map((column) => quoteIdent(column)).join(', ');
    await pool.query(`INSERT INTO ${quoteIdent(schema.table)} (${columnSql}) VALUES (${placeholders})`, insertValues);

    return res.status(201).json({
      ok: true,
      message: 'User registered',
      user: { username, email, name: name || username, role, team },
    });
  } catch (error) {
    if (isDbError(error)) {
      return sendDbError(res, error, 'register');
    }
    console.error('[auth:register] unexpected error', {
      message: error.message,
      stack: isProduction ? undefined : error.stack,
    });
    return res.status(500).json({
      ok: false,
      error: isProduction ? 'Internal server error' : `Register failed: ${error.message}`,
    });
  }
};

const me = async (req, res) => {
  const sessionUser = req.session?.user || null;
  const requestUser = req.user || null;
  const userId = sessionUser?.id || requestUser?.id || null;

  if (!userId) {
    return res.status(200).json({ ok: true, user: null });
  }

  try {
    const columns = await getUsersColumns();
    const map = getColumnMap(columns);

    if (!map.id) {
      return res.status(500).json({
        ok: false,
        error: `Session check schema mismatch. Missing id column in ${schema.table}.`,
      });
    }

    const [rows] = await pool.query(
      `SELECT * FROM ${quoteIdent(schema.table)} WHERE ${quoteIdent(map.id)} = ? LIMIT 1`,
      [userId]
    );

    if (!rows.length) {
      if (req.session) {
        req.session.destroy(() => {});
      }
      return res.status(200).json({ ok: true, user: null });
    }

    const hydratedUser = buildSessionUser(rows[0], map);
    if (req.session) {
      req.session.user = hydratedUser;
    }
    return res.json({ ok: true, user: hydratedUser });
  } catch (error) {
    if (isDbError(error)) {
      return sendDbError(res, error, 'me');
    }
    console.error('[auth:me] unexpected error', {
      message: error.message,
      stack: isProduction ? undefined : error.stack,
    });
    return res.status(500).json({
      ok: false,
      error: isProduction ? 'Internal server error' : `Auth session check failed: ${error.message}`,
    });
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy((error) => {
      if (error) {
        console.error('[auth:logout] session destroy failed', {
          message: error.message,
        });
        return res.status(500).json({
          ok: false,
          error: 'Logout failed while clearing session',
        });
      }
      res.clearCookie('ccs_sid');
      return res.json({ ok: true, message: 'Logged out' });
    });
  } catch (error) {
    console.error('[auth:logout] unexpected error', {
      message: error.message,
      stack: isProduction ? undefined : error.stack,
    });
    return res.status(500).json({
      ok: false,
      error: isProduction ? 'Internal server error' : `Logout failed: ${error.message}`,
    });
  }
};

const dbDebug = async (_req, res) => {
  const publicConfig = typeof getPublicDbConfig === 'function' ? getPublicDbConfig() : {};
  let connection_ok = false;
  let connection_error = null;

  try {
    await pool.query('SELECT 1 AS ok');
    connection_ok = true;
  } catch (error) {
    console.error('[auth:db-debug] connection test failed', error);
    connection_error = error?.message || 'Connection test failed';
  }

  return res.json({
    db_type: publicConfig.db_type || dbType,
    host: publicConfig.host || process.env.DB_HOST || null,
    port: publicConfig.port || process.env.DB_PORT || null,
    database: publicConfig.database || process.env.DB_NAME || null,
    user: publicConfig.user || process.env.DB_USER || null,
    connection_ok,
    ...(connection_error ? { connection_error } : {}),
  });
};

module.exports = {
  login,
  register,
  logout,
  me,
  dbDebug,
};
