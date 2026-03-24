const pool = require('../../config/db');
const { cleanText } = require('../../utils/http');

const isUnknownColumnError = (error) => {
  return error && (error.code === 'ER_BAD_FIELD_ERROR' || error.errno === 1054);
};

const getCommentsForDashboard = async () => {
  try {
    const [comments] = await pool.query(
      `
        SELECT post_id, author_name, comment, created_at
        FROM post_comments
        ORDER BY created_at ASC
      `
    );
    return comments;
  } catch (error) {
    if (!isUnknownColumnError(error)) {
      throw error;
    }

    const [comments] = await pool.query(
      `
        SELECT post_id, commenter_name AS author_name, comment, created_at
        FROM post_comments
        ORDER BY created_at ASC
      `
    );
    return comments;
  }
};

const insertComment = async ({ postId, name, comment }) => {
  try {
    await pool.query(
      'INSERT INTO post_comments (post_id, author_name, comment) VALUES (?, ?, ?)',
      [postId, name, comment]
    );
  } catch (error) {
    if (!isUnknownColumnError(error)) {
      throw error;
    }
    await pool.query(
      'INSERT INTO post_comments (post_id, commenter_name, comment) VALUES (?, ?, ?)',
      [postId, name, comment]
    );
  }
};

const dashboardData = async (_req, res) => {
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

  const [[multimediaPosts], [developerPosts], [events], comments] = await Promise.all([
    pool.query(multimediaSql),
    pool.query(developerSql),
    pool.query(eventsSql),
    getCommentsForDashboard(),
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
};

const postComment = async (req, res) => {
  const postId = Number(req.body.post_id);
  const name = cleanText(req.body.name, 100);
  const comment = cleanText(req.body.comment, 1000);

  if (!Number.isInteger(postId) || postId <= 0) {
    return res.status(400).json({ ok: false, error: 'Invalid post_id' });
  }
  if (!name || !comment) {
    return res.status(400).json({ ok: false, error: 'name and comment are required' });
  }

  await insertComment({ postId, name, comment });
  return res.status(201).json({ ok: true, message: 'Comment added' });
};

const registerEvent = async (req, res) => {
  const eventId = Number(req.body.event_id);
  const fullName = cleanText(req.body.full_name, 120);
  const email = cleanText(req.body.email, 120);
  const contactNumber = cleanText(req.body.contact_number, 40);
  const studentId = cleanText(req.body.student_id, 40);
  const yearSection = cleanText(req.body.year_section, 60);

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
};

module.exports = {
  dashboardData,
  postComment,
  registerEvent,
};

