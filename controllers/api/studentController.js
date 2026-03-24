const pool = require('../../config/db');
const { cleanText } = require('../../utils/http');

const isUnknownColumnError = (error) => {
  return error && (error.code === 'ER_BAD_FIELD_ERROR' || error.errno === 1054);
};

const isMissingTableError = (error) => {
  return error && (error.code === 'ER_NO_SUCH_TABLE' || error.errno === 1146);
};

const getTeamPosts = async (team) => {
  try {
    const [rows] = await pool.query(
      `
        SELECT p.id, p.title, p.details, p.image, p.created_at,
               u.name AS author_name, u.profile_picture AS author_image
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.team = ?
          AND (p.auto_hide_at IS NULL OR p.auto_hide_at > NOW())
        ORDER BY p.created_at DESC
      `,
      [team]
    );
    return rows.map((item) => ({ ...item, allow_comments: true, source: 'post' }));
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    if (!isUnknownColumnError(error)) {
      throw error;
    }
  }

  try {
    const [rows] = await pool.query(
      `
        SELECT p.id, p.title, p.details, p.image, p.created_at,
               COALESCE(u.name, 'Unknown') AS author_name,
               COALESCE(u.profile_picture, 'default.png') AS author_image
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.team = ?
        ORDER BY p.created_at DESC
      `,
      [team]
    );
    return rows.map((item) => ({ ...item, allow_comments: true, source: 'post' }));
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    if (!isUnknownColumnError(error)) {
      throw error;
    }
  }

  // Final compatibility fallback when legacy schema lacks team/author/profile columns.
  try {
    const [rows] = await pool.query(
      `
        SELECT p.id,
               COALESCE(p.title, 'Untitled') AS title,
               COALESCE(p.details, '') AS details,
               NULL AS image,
               p.created_at,
               'Unknown' AS author_name,
               'default.png' AS author_image
        FROM posts p
        ORDER BY p.created_at DESC
        LIMIT 30
      `
    );
    return rows.map((item) => ({ ...item, allow_comments: true, source: 'post' }));
  } catch (error) {
    if (isMissingTableError(error) || isUnknownColumnError(error)) {
      return [];
    }
    throw error;
  }
};

const getMultimediaHeadAnnouncements = async () => {
  try {
    const [rows] = await pool.query(
      `
        SELECT a.id, a.title, a.description, a.image, a.created_at,
               u.name AS author_name, u.profile_picture AS author_image
        FROM announcements a
        LEFT JOIN users u ON u.id = a.posted_by
        WHERE a.target_audience IN ('students', 'all')
        ORDER BY a.created_at DESC
      `
    );

    return rows.map((item) => ({
      id: `announcement_${item.id}`,
      title: item.title,
      details: item.description,
      image: item.image ? String(item.image).split('/').pop() : null,
      created_at: item.created_at,
      author_name: item.author_name || 'Multimedia Head',
      author_image: item.author_image || 'default.png',
      allow_comments: false,
      source: 'announcement',
    }));
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }
};

const getEvents = async () => {
  try {
    const [rows] = await pool.query(
      `
        SELECT e.id, e.title, e.start_date, e.end_date, e.participant_limit,
               (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id) AS reg_count
        FROM events e
        WHERE e.end_date >= DATE(NOW())
        ORDER BY e.start_date ASC
      `
    );
    return rows;
  } catch (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    if (!isUnknownColumnError(error)) {
      throw error;
    }
  }

  try {
    const [rows] = await pool.query(
      `
        SELECT e.id, e.title, e.start_date, e.end_date,
               NULL AS participant_limit, 0 AS reg_count
        FROM events e
        ORDER BY e.start_date ASC
      `
    );
    return rows;
  } catch (error) {
    if (isMissingTableError(error) || isUnknownColumnError(error)) {
      return [];
    }
    throw error;
  }
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
    if (isMissingTableError(error)) {
      return [];
    }
    if (!isUnknownColumnError(error)) {
      throw error;
    }
    try {
      const [comments] = await pool.query(
        `
          SELECT post_id, commenter_name AS author_name, comment, created_at
          FROM post_comments
          ORDER BY created_at ASC
        `
      );
      return comments;
    } catch (fallbackError) {
      if (isMissingTableError(fallbackError) || isUnknownColumnError(fallbackError)) {
        return [];
      }
      throw fallbackError;
    }
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
  try {
    const [multimediaPosts, multimediaAnnouncements, developerPosts, events, comments] = await Promise.all([
      getTeamPosts('multimedia'),
      getMultimediaHeadAnnouncements(),
      getTeamPosts('developer'),
      getEvents(),
      getCommentsForDashboard(),
    ]);

    const multimediaFeed = [...multimediaAnnouncements, ...multimediaPosts].sort((a, b) => {
      const first = new Date(a.created_at).getTime() || 0;
      const second = new Date(b.created_at).getTime() || 0;
      return second - first;
    });

    const groupedComments = comments.reduce((acc, item) => {
      const key = String(item.post_id);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    res.json({
      ok: true,
      multimedia_posts: multimediaFeed,
      developer_posts: developerPosts,
      comments: groupedComments,
      events,
    });
  } catch (error) {
    // Do not break the student page due to partial/legacy schema issues.
    if (isMissingTableError(error) || isUnknownColumnError(error)) {
      return res.json({
        ok: true,
        multimedia_posts: [],
        developer_posts: [],
        comments: {},
        events: [],
      });
    }

    throw error;
  }
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
