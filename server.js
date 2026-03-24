require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const publicDir = path.join(__dirname, 'public');
const indexFile = path.join(publicDir, 'index.html');

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const api = express.Router();

const toSafeString = (value, maxLength = 255) => {
  return String(value ?? '').trim().slice(0, maxLength);
};

api.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'node-api', message: 'Server is running' });
});

api.get('/db-test', async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS server_time');
    res.json({ ok: true, db: rows[0] || null });
  } catch (error) {
    next(error);
  }
});

api.get('/student/dashboard-data', async (_req, res, next) => {
  try {
    const multimediaSql = `
      SELECT p.id, p.title, p.details, p.image, p.created_at,
             u.name AS author_name, u.profile_picture AS author_image
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.team = 'multimedia'
        AND (p.auto_hide_at IS NULL OR p.auto_hide_at > NOW())
      ORDER BY p.created_at DESC
    `;

    const developerSql = `
      SELECT p.id, p.title, p.details, p.image, p.created_at,
             u.name AS author_name, u.profile_picture AS author_image
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.team = 'developer'
        AND (p.auto_hide_at IS NULL OR p.auto_hide_at > NOW())
      ORDER BY p.created_at DESC
    `;

    const eventsSql = `
      SELECT e.id, e.title, e.start_date, e.end_date, e.participant_limit,
             (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id) AS reg_count
      FROM events e
      WHERE e.end_date >= DATE(NOW())
      ORDER BY e.start_date ASC
    `;

    const commentsSql = `
      SELECT post_id, author_name, comment, created_at
      FROM post_comments
      ORDER BY created_at ASC
    `;

    const [[multimediaPosts], [developerPosts], [events], [comments]] = await Promise.all([
      pool.query(multimediaSql),
      pool.query(developerSql),
      pool.query(eventsSql),
      pool.query(commentsSql),
    ]);

    const groupedComments = comments.reduce((acc, item) => {
      const key = String(item.post_id);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    res.json({
      ok: true,
      multimedia_posts: multimediaPosts,
      developer_posts: developerPosts,
      comments: groupedComments,
      events,
    });
  } catch (error) {
    next(error);
  }
});

api.post('/student/comments', async (req, res, next) => {
  try {
    const postId = Number(req.body.post_id);
    const name = toSafeString(req.body.name, 100);
    const comment = toSafeString(req.body.comment, 1000);

    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ ok: false, error: 'Invalid post_id' });
    }

    if (!name || !comment) {
      return res.status(400).json({ ok: false, error: 'name and comment are required' });
    }

    await pool.query(
      'INSERT INTO post_comments (post_id, author_name, comment) VALUES (?, ?, ?)',
      [postId, name, comment]
    );

    return res.status(201).json({ ok: true, message: 'Comment added' });
  } catch (error) {
    return next(error);
  }
});

api.post('/student/register-event', async (req, res, next) => {
  try {
    const eventId = Number(req.body.event_id);
    const fullName = toSafeString(req.body.full_name, 120);
    const email = toSafeString(req.body.email, 120);
    const contactNumber = toSafeString(req.body.contact_number, 40);
    const studentId = toSafeString(req.body.student_id, 40);
    const yearSection = toSafeString(req.body.year_section, 60);

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({ ok: false, error: 'Invalid event_id' });
    }

    if (!fullName || !email || !contactNumber || !studentId || !yearSection) {
      return res.status(400).json({ ok: false, error: 'All fields are required' });
    }

    const [eventRows] = await pool.query(
      `
        SELECT participant_limit,
               (SELECT COUNT(*) FROM event_registrations WHERE event_id = ?) AS reg_count
        FROM events
        WHERE id = ?
        LIMIT 1
      `,
      [eventId, eventId]
    );

    if (!eventRows.length) {
      return res.status(404).json({ ok: false, error: 'Event not found' });
    }

    const eventInfo = eventRows[0];
    if (eventInfo.participant_limit && eventInfo.reg_count >= eventInfo.participant_limit) {
      return res.status(409).json({ ok: false, error: 'Event is full' });
    }

    await pool.query(
      `
        INSERT INTO event_registrations
          (event_id, full_name, email, contact_number, student_id, year_section)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [eventId, fullName, email, contactNumber, studentId, yearSection]
    );

    return res.status(201).json({ ok: true, message: 'Registered successfully' });
  } catch (error) {
    return next(error);
  }
});

app.use('/api', api);

const assetsDir = path.join(__dirname, 'assets');
if (fs.existsSync(assetsDir)) {
  app.use('/assets', express.static(assetsDir, { maxAge: isProduction ? '1d' : 0 }));
}

const uploadsDir = path.join(__dirname, 'uploads');
if (fs.existsSync(uploadsDir)) {
  app.use('/uploads', express.static(uploadsDir, { maxAge: isProduction ? '1d' : 0 }));
}

app.use(
  express.static(publicDir, {
    index: false,
    maxAge: isProduction ? '1h' : 0,
  })
);

app.get('/', (_req, res) => {
  if (!fs.existsSync(indexFile)) {
    return res.status(500).json({
      ok: false,
      error: 'public/index.html not found',
    });
  }

  return res.sendFile(indexFile);
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  if (path.extname(req.path)) {
    return next();
  }

  if (!fs.existsSync(indexFile)) {
    return res.status(500).json({
      ok: false,
      error: 'public/index.html not found',
    });
  }

  return res.sendFile(indexFile);
});

app.use('/api', (_req, res) => {
  res.status(404).json({ ok: false, error: 'API route not found' });
});

app.use((_req, res) => {
  res.status(404).send('Not found');
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  console.error(error);
  const message = isProduction ? 'Internal server error' : error.message;

  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ ok: false, error: message });
  }

  return res.status(500).send(message);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log('API routes: /api/health, /api/db-test, /api/student/dashboard-data');
  console.log(`Frontend file: ${indexFile}`);
});
