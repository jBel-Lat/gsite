const { createPool: createMySqlPool } = require('mysql2/promise');

let PgPool = null;
try {
  ({ Pool: PgPool } = require('pg'));
} catch (_error) {
  PgPool = null;
}

const normalizeDbType = (value) => {
  const type = String(value || '').trim().toLowerCase();
  if (type === 'postgres' || type === 'postgresql' || type === 'pg') return 'postgres';
  if (type === 'mysql') return 'mysql';
  return null;
};

const parseDatabaseUrl = () => {
  const raw = String(process.env.DATABASE_URL || '').trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const database = url.pathname ? url.pathname.replace(/^\//, '') : '';
    return {
      protocol: String(url.protocol || '').replace(':', ''),
      host: url.hostname || undefined,
      port: url.port ? Number(url.port) : undefined,
      user: url.username ? decodeURIComponent(url.username) : undefined,
      password: url.password ? decodeURIComponent(url.password) : undefined,
      database: database || undefined,
      ssl:
        url.searchParams.get('sslmode') === 'require' ||
        String(url.searchParams.get('ssl') || '').toLowerCase() === 'true',
    };
  } catch (_error) {
    return null;
  }
};

const detectDbType = () => {
  const explicit = normalizeDbType(process.env.DB_TYPE);
  if (explicit) return explicit;

  const fromUrl = parseDatabaseUrl();
  const fromUrlType = normalizeDbType(fromUrl?.protocol);
  if (fromUrlType) return fromUrlType;

  // Render Postgres commonly provides PG* vars.
  if (process.env.PGHOST || process.env.PGDATABASE || process.env.PGUSER) {
    return 'postgres';
  }

  return 'mysql';
};

const dbType = detectDbType();

const getDbConfig = () => {
  const fromUrl = parseDatabaseUrl();
  const defaultPort = dbType === 'postgres' ? 5432 : 3306;
  const defaultUser = dbType === 'postgres' ? 'postgres' : 'root';
  const defaultDatabase = dbType === 'postgres' ? 'postgres' : 'railway';

  return {
    host:
      process.env.DB_HOST ||
      process.env.MYSQLHOST ||
      process.env.PGHOST ||
      fromUrl?.host ||
      '127.0.0.1',
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT || process.env.PGPORT || fromUrl?.port || defaultPort),
    user:
      process.env.DB_USER ||
      process.env.MYSQLUSER ||
      process.env.PGUSER ||
      fromUrl?.user ||
      defaultUser,
    password:
      process.env.DB_PASSWORD ||
      process.env.DB_PASS ||
      process.env.MYSQLPASSWORD ||
      process.env.PGPASSWORD ||
      fromUrl?.password ||
      '',
    database:
      process.env.DB_NAME ||
      process.env.MYSQLDATABASE ||
      process.env.PGDATABASE ||
      fromUrl?.database ||
      defaultDatabase,
    ssl:
      String(process.env.DB_SSL || '').toLowerCase() === 'true' ||
      String(process.env.PGSSLMODE || '').toLowerCase() === 'require' ||
      Boolean(fromUrl?.ssl),
  };
};

const convertMySqlPlaceholdersToPg = (sql) => {
  if (typeof sql !== 'string' || !sql.includes('?')) return sql;

  let index = 0;
  let output = '';
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i];
    const prev = sql[i - 1];

    if (char === "'" && !inDouble && prev !== '\\') {
      inSingle = !inSingle;
      output += char;
      continue;
    }

    if (char === '"' && !inSingle && prev !== '\\') {
      inDouble = !inDouble;
      output += char;
      continue;
    }

    if (char === '?' && !inSingle && !inDouble) {
      index += 1;
      output += `$${index}`;
      continue;
    }

    output += char;
  }

  return output;
};

const createPool = () => {
  const config = getDbConfig();

  if (dbType === 'postgres') {
    if (!PgPool) {
      throw new Error('DB_TYPE is postgres but "pg" package is not installed. Run: npm install pg');
    }

    const pgPool = new PgPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
      max: Number(process.env.DB_POOL_SIZE || 10),
      connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000),
    });

    return {
      type: 'postgres',
      raw: pgPool,
      query: async (sql, params = []) => {
        const normalizedSql = convertMySqlPlaceholdersToPg(sql);
        const result = await pgPool.query(normalizedSql, params);
        return [result.rows || [], result];
      },
      end: async () => pgPool.end(),
    };
  }

  const mySqlPool = createMySqlPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
    queueLimit: 0,
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000),
  });

  return {
    type: 'mysql',
    raw: mySqlPool,
    query: async (sql, params = []) => mySqlPool.query(sql, params),
    end: async () => mySqlPool.end(),
  };
};

const getAuthSchema = () => {
  return {
    table: process.env.AUTH_USERS_TABLE || 'users',
    id: process.env.AUTH_USER_ID_COLUMN || 'id',
    username: process.env.AUTH_USERNAME_COLUMN || 'username',
    email: process.env.AUTH_EMAIL_COLUMN || 'email',
    password: process.env.AUTH_PASSWORD_COLUMN || 'password_hash',
    role: process.env.AUTH_ROLE_COLUMN || 'role',
    name: process.env.AUTH_NAME_COLUMN || 'name',
    team: process.env.AUTH_TEAM_COLUMN || 'team',
    profilePicture: process.env.AUTH_PROFILE_PICTURE_COLUMN || 'profile_picture',
  };
};

const pool = createPool();

const getDbType = () => dbType;

const getPublicDbConfig = () => {
  const config = getDbConfig();
  return {
    db_type: dbType,
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
  };
};

const testConnection = async () => {
  const [rows] = await pool.query('SELECT 1 AS ok');
  return rows[0];
};

module.exports = {
  pool,
  testConnection,
  getDbConfig,
  getDbType,
  getPublicDbConfig,
  getAuthSchema,
};
