require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const { testConnection, getDbConfig, getAuthSchema, getDbType } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/api');
const { attachUser } = require('./middleware/auth');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

const sessionSecret = process.env.SESSION_SECRET || 'change-this-in-production';
const publicDir = path.join(__dirname, 'public');
const pagesDir = path.join(publicDir, 'pages');
const assetsDir = path.join(__dirname, 'assets');
const uploadsDir = path.join(__dirname, 'uploads');

app.disable('x-powered-by');

app.use(
  session({
    name: 'ccs_sid',
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 12,
    },
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(attachUser);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(assetsDir, { maxAge: isProduction ? '1d' : 0 }));
app.use('/uploads', express.static(uploadsDir, { maxAge: isProduction ? '1d' : 0 }));

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

const sendPage = (pageFile) => (_req, res) => res.sendFile(path.join(pagesDir, pageFile));

app.get('/', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
app.get(['/index', '/index.html'], (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));

// Canonical app pages
app.get('/admin/login', sendPage('admin-login.html'));
app.get('/superadmin/login', sendPage('superadmin-login.html'));
app.get('/pages/admin.html', sendPage('admin.html'));
app.get('/pages/student.html', sendPage('student.html'));
app.get('/pages/developer.html', sendPage('developer.html'));
app.get('/pages/multimedia.html', sendPage('multimedia.html'));
app.get('/pages/officer.html', sendPage('officer.html'));
app.get('/pages/profile.html', sendPage('profile.html'));
app.get('/pages/superadmin.html', sendPage('superadmin.html'));

// Legacy routes -> canonical static pages in /public/pages
const legacyPageMap = {
  '/views/admin/login.php': 'admin-login.html',
  '/views/admin/dashboard.php': 'admin.html',
  '/views/admin/users.php': 'admin.html',
  '/views/admin/teams.php': 'admin.html',

  '/views/superadmin/login.php': 'superadmin-login.html',
  '/views/superadmin/dashboard.php': 'superadmin.html',

  '/views/student/dashboard.php': 'student.html',
  '/views/profile/index.php': 'profile.html',

  '/views/developer/dashboard.php': 'developer.html',
  '/views/developer/announcements.php': 'developer-announcements.html',
  '/views/developer/editor.php': 'developer-editor.html',
  '/views/developer/event_registrations.php': 'developer-event-registrations.html',
  '/views/developer/gsite_events.php': 'developer-gsite-events.html',
  '/views/developer/gsite_posts.php': 'developer-gsite-posts.html',
  '/views/developer/members.php': 'developer-members.html',
  '/views/developer/projects.php': 'developer-projects.html',

  '/views/multimedia/dashboard.php': 'multimedia.html',
  '/views/multimedia/announcements.php': 'multimedia-announcements.html',
  '/views/multimedia/gsite_posts.php': 'multimedia-gsite-posts.html',
  '/views/multimedia/members.php': 'multimedia-members.html',
  '/views/multimedia/repositories.php': 'multimedia-repositories.html',

  '/views/member/developer/dashboard.php': 'developer.html',
  '/views/member/developer/announcements.php': 'developer-announcements.html',
  '/views/member/developer/editor.php': 'developer-editor.html',
  '/views/member/multimedia/dashboard.php': 'multimedia.html',
  '/views/member/multimedia/repositories.php': 'multimedia-repositories.html',

  '/views/officer/developer/dashboard.php': 'officer.html',
  '/views/officer/developer/announcements.php': 'officer.html',
  '/views/officer/developer/editor.php': 'officer.html',
  '/views/officer/developer/members.php': 'officer.html',
  '/views/officer/multimedia/dashboard.php': 'officer.html',
  '/views/officer/multimedia/members.php': 'officer.html',
  '/views/officer/multimedia/repositories.php': 'officer.html',
};

Object.entries(legacyPageMap).forEach(([legacyPath, pageFile]) => {
  app.get(legacyPath, sendPage(pageFile));
});

// Friendly legacy non-PHP aliases.
app.get('/admin/dashboard', sendPage('admin.html'));
app.get('/student/dashboard', sendPage('student.html'));
app.get('/developer/dashboard', sendPage('developer.html'));
app.get('/multimedia/dashboard', sendPage('multimedia.html'));
app.get('/officer/dashboard', sendPage('officer.html'));
app.get('/profile', sendPage('profile.html'));
app.get('/superadmin/dashboard', sendPage('superadmin.html'));

app.use('/api', (_req, res) => {
  res.status(404).json({ ok: false, error: 'API route not found' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  console.error('[server:error]', {
    method: req.method,
    path: req.originalUrl || req.path,
    message: error.message,
    code: error.code || null,
    stack: isProduction ? undefined : error.stack,
  });

  const message = isProduction ? 'Internal server error' : error.message;

  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ ok: false, error: message });
  }

  return res.status(500).send(message);
});

app.listen(PORT, () => {
  const dbConfig = getDbConfig();
  const authSchema = getAuthSchema();
  const dbType = typeof getDbType === 'function' ? getDbType() : 'mysql';

  console.log(`Server listening on port ${PORT}`);
  console.log('API base: /api');
  console.log(`Public directory: ${publicDir}`);
  console.log('Auth routes: GET /api/auth/health, GET /api/auth/db-debug, POST /api/auth/login, POST /api/auth/register, GET /api/auth/me, POST /api/auth/logout');
  console.log('Database type:', dbType);
  console.log('DB env summary:', {
    host: dbConfig.host,
    port: Number(dbConfig.port),
    database: dbConfig.database,
    user: dbConfig.user,
  });
  console.log('Auth schema summary:', {
    table: authSchema.table,
    username: authSchema.username,
    email: authSchema.email,
    password: authSchema.password,
    role: authSchema.role,
  });
});

testConnection()
  .then((result) => {
    console.log('Database connection test: OK');
    console.log('Database probe:', result);
  })
  .catch((error) => {
    console.error('Database connection test FAILED:', {
      message: error.message,
      code: error.code || null,
    });
  });
