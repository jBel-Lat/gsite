const { createPool } = require('mysql2/promise');

const getDbConfig = () => {
  return {
    host: process.env.MYSQLHOST || process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASS || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'cc_gsite_db',
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

const pool = createPool({
  ...getDbConfig(),
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  queueLimit: 0,
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000),
});

const testConnection = async () => {
  const [rows] = await pool.query('SELECT 1 AS ok');
  return rows[0];
};

module.exports = {
  pool,
  testConnection,
  getDbConfig,
  getAuthSchema,
};
