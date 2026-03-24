const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('../../config/db');
const { cleanText } = require('../../utils/http');
const { isHeadRole } = require('../../utils/roles');

const assertTeam = (team) => {
  if (!['developer', 'multimedia'].includes(team)) {
    throw new Error(`Unsupported team: ${team}`);
  }
};

const isTeamHead = (user, team) => user && user.role === `${team}_head`;

const getDashboard = (team) => async (req, res) => {
  assertTeam(team);

  const userId = req.session.user.id;
  const [memberRows] = await pool.query(
    'SELECT COUNT(*) AS count FROM users WHERE team = ? AND role = ?',
    [team, `${team}_member`]
  );

  const [announcementRows] = await pool.query(
    'SELECT COUNT(*) AS count FROM team_announcements WHERE team = ?',
    [team]
  );

  const [recentAnnouncements] = await pool.query(
    `
      SELECT ta.id, ta.title, ta.content, ta.created_at, u.name AS author_name,
             (SELECT COUNT(*) FROM announcement_comments ac WHERE ac.announcement_id = ta.id) AS comment_count
      FROM team_announcements ta
      LEFT JOIN users u ON u.id = ta.author_id
      WHERE ta.team = ?
      ORDER BY ta.created_at DESC
      LIMIT 5
    `,
    [team]
  );

  let extra = {};
  if (team === 'multimedia') {
    const [repoRows] = await pool.query(
      "SELECT COUNT(*) AS count FROM repositories WHERE team_type = 'multimedia'"
    );
    const [uploadRows] = await pool.query(
      `
        SELECT COUNT(*) AS count
        FROM uploads up
        JOIN repositories r ON r.id = up.repository_id
        WHERE r.team_type = 'multimedia' AND up.user_id = ?
      `,
      [userId]
    );
    extra = {
      totalRepositories: repoRows[0].count,
      myUploads: uploadRows[0].count,
    };
  }

  return res.json({
    ok: true,
    dashboard: {
      totalMembers: memberRows[0].count,
      totalAnnouncements: announcementRows[0].count,
      recentAnnouncements,
      ...extra,
    },
  });
};

const listAnnouncements = (team) => async (_req, res) => {
  assertTeam(team);

  const [announcements] = await pool.query(
    `
      SELECT ta.id, ta.title, ta.content, ta.created_at, ta.updated_at, ta.author_id, u.name AS author_name
      FROM team_announcements ta
      LEFT JOIN users u ON u.id = ta.author_id
      WHERE ta.team = ?
      ORDER BY ta.created_at DESC
    `,
    [team]
  );

  const [comments] = await pool.query(
    `
      SELECT ac.id, ac.announcement_id, ac.author_id, ac.comment, ac.created_at, ac.updated_at, u.name AS commenter_name
      FROM announcement_comments ac
      JOIN users u ON u.id = ac.author_id
      ORDER BY ac.created_at ASC
    `
  );

  const groupedComments = comments.reduce((acc, item) => {
    const key = String(item.announcement_id);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return res.json({
    ok: true,
    announcements,
    comments: groupedComments,
  });
};

const createAnnouncement = (team) => async (req, res) => {
  assertTeam(team);
  if (!isTeamHead(req.session.user, team)) {
    return res.status(403).json({ ok: false, error: 'Only team head can create announcements' });
  }

  const title = cleanText(req.body.title, 255);
  const content = cleanText(req.body.content, 5000);
  if (!title || !content) {
    return res.status(400).json({ ok: false, error: 'title and content are required' });
  }

  await pool.query(
    'INSERT INTO team_announcements (author_id, team, title, content) VALUES (?, ?, ?, ?)',
    [req.session.user.id, team, title, content]
  );

  return res.status(201).json({ ok: true, message: 'Announcement created' });
};

const updateAnnouncement = (team) => async (req, res) => {
  assertTeam(team);
  if (!isTeamHead(req.session.user, team)) {
    return res.status(403).json({ ok: false, error: 'Only team head can update announcements' });
  }

  const announcementId = Number(req.params.id);
  const title = cleanText(req.body.title, 255);
  const content = cleanText(req.body.content, 5000);

  await pool.query(
    `
      UPDATE team_announcements
      SET title = ?, content = ?
      WHERE id = ? AND team = ?
    `,
    [title, content, announcementId, team]
  );

  return res.json({ ok: true, message: 'Announcement updated' });
};

const deleteAnnouncement = (team) => async (req, res) => {
  assertTeam(team);
  if (!isTeamHead(req.session.user, team)) {
    return res.status(403).json({ ok: false, error: 'Only team head can delete announcements' });
  }

  const announcementId = Number(req.params.id);
  await pool.query('DELETE FROM team_announcements WHERE id = ? AND team = ?', [announcementId, team]);
  return res.json({ ok: true, message: 'Announcement deleted' });
};

const addAnnouncementComment = (_team) => async (req, res) => {
  const announcementId = Number(req.params.id);
  const comment = cleanText(req.body.comment, 2000);

  if (!comment) {
    return res.status(400).json({ ok: false, error: 'comment is required' });
  }

  await pool.query(
    'INSERT INTO announcement_comments (announcement_id, author_id, comment) VALUES (?, ?, ?)',
    [announcementId, req.session.user.id, comment]
  );

  return res.status(201).json({ ok: true, message: 'Comment added' });
};

const updateAnnouncementComment = (_team) => async (req, res) => {
  const commentId = Number(req.params.commentId);
  const comment = cleanText(req.body.comment, 2000);

  await pool.query(
    'UPDATE announcement_comments SET comment = ? WHERE id = ? AND author_id = ?',
    [comment, commentId, req.session.user.id]
  );

  return res.json({ ok: true, message: 'Comment updated' });
};

const deleteAnnouncementComment = (_team) => async (req, res) => {
  const commentId = Number(req.params.commentId);
  await pool.query('DELETE FROM announcement_comments WHERE id = ? AND author_id = ?', [
    commentId,
    req.session.user.id,
  ]);
  return res.json({ ok: true, message: 'Comment deleted' });
};

const listMembers = (team) => async (_req, res) => {
  const [members] = await pool.query(
    `
      SELECT u.id, u.username, u.name, u.email, u.contact_number, u.role, u.group_id, u.created_at, g.group_name
      FROM users u
      LEFT JOIN groups g ON g.id = u.group_id
      WHERE u.team = ? AND u.role = ?
      ORDER BY u.created_at DESC
    `,
    [team, `${team}_member`]
  );

  const payload = { ok: true, members };
  if (team === 'multimedia') {
    const [groups] = await pool.query('SELECT id, group_name FROM groups ORDER BY group_name ASC');
    payload.groups = groups;
  }
  return res.json(payload);
};

const createMember = (team) => async (req, res) => {
  if (!isTeamHead(req.session.user, team)) {
    return res.status(403).json({ ok: false, error: 'Only team head can create members' });
  }

  const username = cleanText(req.body.username, 80);
  const password = String(req.body.password ?? '');
  const email = cleanText(req.body.email, 120);
  const name = cleanText(req.body.name, 120);
  const contactNumber = cleanText(req.body.contact_number, 30) || null;
  const groupId = team === 'multimedia' && req.body.group_id ? Number(req.body.group_id) : null;

  if (!username || !password || !email || !name) {
    return res.status(400).json({ ok: false, error: 'username, password, email, and name are required' });
  }

  const hash = bcrypt.hashSync(password, 10);
  await pool.query(
    `
      INSERT INTO users (username, password_hash, email, name, contact_number, role, team, group_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [username, hash, email, name, contactNumber, `${team}_member`, team, groupId]
  );

  return res.status(201).json({ ok: true, message: 'Member created' });
};

const updateMember = (team) => async (req, res) => {
  if (!isTeamHead(req.session.user, team)) {
    return res.status(403).json({ ok: false, error: 'Only team head can update members' });
  }

  const memberId = Number(req.params.id);
  const name = cleanText(req.body.name, 120);
  const email = cleanText(req.body.email, 120);
  const contactNumber = cleanText(req.body.contact_number, 30) || null;
  const groupId = team === 'multimedia' && req.body.group_id ? Number(req.body.group_id) : null;
  const password = String(req.body.password || '');

  await pool.query(
    `
      UPDATE users
      SET name = ?, email = ?, contact_number = ?, group_id = ?
      WHERE id = ? AND team = ? AND role = ?
    `,
    [name, email, contactNumber, groupId, memberId, team, `${team}_member`]
  );

  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, memberId]);
  }

  return res.json({ ok: true, message: 'Member updated' });
};

const deleteMember = (team) => async (req, res) => {
  if (!isTeamHead(req.session.user, team)) {
    return res.status(403).json({ ok: false, error: 'Only team head can delete members' });
  }
  const memberId = Number(req.params.id);
  await pool.query('DELETE FROM users WHERE id = ? AND team = ? AND role = ?', [
    memberId,
    team,
    `${team}_member`,
  ]);
  return res.json({ ok: true, message: 'Member deleted' });
};

const listGsitePosts = (team) => async (_req, res) => {
  const [posts] = await pool.query(
    `
      SELECT p.id, p.title, p.details, p.image, p.is_banner, p.auto_hide_at, p.created_at
      FROM posts p
      WHERE p.team = ?
      ORDER BY p.created_at DESC
    `,
    [team]
  );
  return res.json({ ok: true, posts });
};

const createGsitePost = (team) => async (req, res) => {
  if (!isTeamHead(req.session.user, team)) {
    return res.status(403).json({ ok: false, error: 'Only team head can create posts' });
  }

  const title = cleanText(req.body.title, 255);
  const details = cleanText(req.body.details, 10000);
  const isBanner = req.body.is_banner ? 1 : 0;
  const autoHideAt = req.body.auto_hide_at || null;
  const imageName = req.file ? req.file.filename : null;

  if (!title || !details) {
    return res.status(400).json({ ok: false, error: 'title and details are required' });
  }

  if (isBanner) {
    await pool.query('UPDATE posts SET is_banner = 0 WHERE team = ?', [team]);
  }

  await pool.query(
    `
      INSERT INTO posts (author_id, team, title, details, image, is_banner, auto_hide_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [req.session.user.id, team, title, details, imageName, isBanner, autoHideAt]
  );

  return res.status(201).json({ ok: true, message: 'Post created' });
};

const updateGsitePost = (team) => async (req, res) => {
  if (!isTeamHead(req.session.user, team)) {
    return res.status(403).json({ ok: false, error: 'Only team head can update posts' });
  }

  const postId = Number(req.params.id);
  const title = cleanText(req.body.title, 255);
  const details = cleanText(req.body.details, 10000);
  const isBanner = req.body.is_banner ? 1 : 0;
  const autoHideAt = req.body.auto_hide_at || null;

  if (isBanner) {
    await pool.query('UPDATE posts SET is_banner = 0 WHERE team = ?', [team]);
  }

  if (req.file) {
    await pool.query(
      `
        UPDATE posts
        SET title = ?, details = ?, is_banner = ?, auto_hide_at = ?, image = ?
        WHERE id = ? AND team = ?
      `,
      [title, details, isBanner, autoHideAt, req.file.filename, postId, team]
    );
  } else {
    await pool.query(
      `
        UPDATE posts
        SET title = ?, details = ?, is_banner = ?, auto_hide_at = ?
        WHERE id = ? AND team = ?
      `,
      [title, details, isBanner, autoHideAt, postId, team]
    );
  }

  return res.json({ ok: true, message: 'Post updated' });
};

const deleteGsitePost = (team) => async (req, res) => {
  if (!isTeamHead(req.session.user, team)) {
    return res.status(403).json({ ok: false, error: 'Only team head can delete posts' });
  }
  const postId = Number(req.params.id);
  await pool.query('DELETE FROM posts WHERE id = ? AND team = ?', [postId, team]);
  return res.json({ ok: true, message: 'Post deleted' });
};

const listEvents = async (_req, res) => {
  const [events] = await pool.query(
    `
      SELECT e.id, e.title, e.description, e.image, e.participant_limit, e.start_date, e.end_date, e.created_at,
             (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id) AS reg_count
      FROM events e
      ORDER BY e.created_at DESC
    `
  );
  return res.json({ ok: true, events });
};

const createEvent = async (req, res) => {
  if (req.session.user.role !== 'developer_head') {
    return res.status(403).json({ ok: false, error: 'Only developer head can create events' });
  }

  const title = cleanText(req.body.title, 255);
  const description = cleanText(req.body.description, 5000);
  const participantLimit = req.body.participant_limit ? Number(req.body.participant_limit) : null;
  const startDate = req.body.start_date;
  const endDate = req.body.end_date;
  const imageName = req.file ? req.file.filename : null;

  await pool.query(
    `
      INSERT INTO events (author_id, title, description, image, participant_limit, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [req.session.user.id, title, description, imageName, participantLimit, startDate, endDate]
  );

  return res.status(201).json({ ok: true, message: 'Event created' });
};

const updateEvent = async (req, res) => {
  if (req.session.user.role !== 'developer_head') {
    return res.status(403).json({ ok: false, error: 'Only developer head can update events' });
  }

  const eventId = Number(req.params.id);
  const title = cleanText(req.body.title, 255);
  const description = cleanText(req.body.description, 5000);
  const participantLimit = req.body.participant_limit ? Number(req.body.participant_limit) : null;
  const startDate = req.body.start_date;
  const endDate = req.body.end_date;

  if (req.file) {
    await pool.query(
      `
        UPDATE events
        SET title = ?, description = ?, participant_limit = ?, start_date = ?, end_date = ?, image = ?
        WHERE id = ?
      `,
      [title, description, participantLimit, startDate, endDate, req.file.filename, eventId]
    );
  } else {
    await pool.query(
      `
        UPDATE events
        SET title = ?, description = ?, participant_limit = ?, start_date = ?, end_date = ?
        WHERE id = ?
      `,
      [title, description, participantLimit, startDate, endDate, eventId]
    );
  }

  return res.json({ ok: true, message: 'Event updated' });
};

const deleteEvent = async (req, res) => {
  if (req.session.user.role !== 'developer_head') {
    return res.status(403).json({ ok: false, error: 'Only developer head can delete events' });
  }
  const eventId = Number(req.params.id);
  await pool.query('DELETE FROM events WHERE id = ?', [eventId]);
  return res.json({ ok: true, message: 'Event deleted' });
};

const listEventRegistrations = async (req, res) => {
  const eventId = Number(req.params.id);

  const [eventRows] = await pool.query('SELECT * FROM events WHERE id = ? LIMIT 1', [eventId]);
  const [registrations] = await pool.query(
    'SELECT * FROM event_registrations WHERE event_id = ? ORDER BY registered_at DESC',
    [eventId]
  );

  return res.json({
    ok: true,
    event: eventRows[0] || null,
    registrations,
  });
};

const deleteEventRegistration = async (req, res) => {
  if (req.session.user.role !== 'developer_head') {
    return res.status(403).json({ ok: false, error: 'Only developer head can delete registrations' });
  }
  const regId = Number(req.params.registrationId);
  await pool.query('DELETE FROM event_registrations WHERE id = ?', [regId]);
  return res.json({ ok: true, message: 'Registration deleted' });
};

const listProjects = async (_req, res) => {
  const [files] = await pool.query(
    `
      SELECT pf.id, pf.uploader_id, pf.filename, pf.filepath, pf.file_content, pf.folder_path, pf.filetype, pf.created_at, pf.updated_at,
             u.name AS uploader_name
      FROM project_files pf
      JOIN users u ON u.id = pf.uploader_id
      ORDER BY pf.folder_path, pf.filename
    `
  );

  const [history] = await pool.query(
    `
      SELECT h.id, h.file_id, h.editor_id, h.change_summary, h.changed_at, u.name AS editor_name, pf.filename
      FROM project_file_history h
      JOIN users u ON u.id = h.editor_id
      JOIN project_files pf ON pf.id = h.file_id
      ORDER BY h.changed_at DESC
      LIMIT 50
    `
  );

  const [comments] = await pool.query(
    `
      SELECT pc.id, pc.file_id, pc.author_id, pc.comment, pc.created_at, u.name AS author_name
      FROM project_file_comments pc
      JOIN users u ON u.id = pc.author_id
      ORDER BY pc.created_at ASC
    `
  );

  const groupedComments = comments.reduce((acc, row) => {
    const key = String(row.file_id);
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  return res.json({
    ok: true,
    files,
    history,
    comments: groupedComments,
  });
};

const uploadProjectFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'file is required' });
  }

  const originalName = req.file.originalname;
  const ext = path.extname(originalName).replace('.', '').toLowerCase() || 'bin';
  const folderPath = cleanText(req.body.folder_path || '/', 300);
  const fileContent = ['php', 'js', 'css', 'html', 'sql', 'txt', 'md', 'json'].includes(ext)
    ? fs.readFileSync(req.file.path, 'utf8')
    : null;

  await pool.query(
    `
      INSERT INTO project_files (uploader_id, filename, filepath, file_content, folder_path, filetype)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [req.session.user.id, originalName, req.file.path.replace(/\\/g, '/'), fileContent, folderPath, ext]
  );

  return res.status(201).json({ ok: true, message: 'File uploaded' });
};

const updateProjectFile = async (req, res) => {
  const fileId = Number(req.params.id);
  const content = String(req.body.file_content ?? '');
  const summary = cleanText(req.body.change_summary || 'Update file', 255);

  const [rows] = await pool.query('SELECT file_content FROM project_files WHERE id = ? LIMIT 1', [fileId]);
  if (!rows.length) {
    return res.status(404).json({ ok: false, error: 'Project file not found' });
  }

  const oldContent = rows[0].file_content;
  await pool.query('UPDATE project_files SET file_content = ? WHERE id = ?', [content, fileId]);

  await pool.query(
    `
      INSERT INTO project_file_history (file_id, editor_id, old_content, new_content, change_summary)
      VALUES (?, ?, ?, ?, ?)
    `,
    [fileId, req.session.user.id, oldContent, content, summary]
  );

  return res.json({ ok: true, message: 'File saved' });
};

const deleteProjectFile = async (req, res) => {
  if (!isHeadRole(req.session.user.role)) {
    return res.status(403).json({ ok: false, error: 'Only heads can delete files' });
  }
  const fileId = Number(req.params.id);
  await pool.query('DELETE FROM project_files WHERE id = ?', [fileId]);
  return res.json({ ok: true, message: 'File deleted' });
};

const addProjectComment = async (req, res) => {
  const fileId = Number(req.params.id);
  const comment = cleanText(req.body.comment, 2000);
  if (!comment) {
    return res.status(400).json({ ok: false, error: 'comment is required' });
  }
  await pool.query(
    'INSERT INTO project_file_comments (file_id, author_id, comment) VALUES (?, ?, ?)',
    [fileId, req.session.user.id, comment]
  );
  return res.status(201).json({ ok: true, message: 'Comment added' });
};

const runEditorQuery = async (req, res) => {
  const sqlQuery = cleanText(req.body.sql_query, 10000);
  if (!sqlQuery) {
    return res.status(400).json({ ok: false, error: 'sql_query is required' });
  }

  if (!/^\s*(SELECT|SHOW|DESCRIBE)\b/i.test(sqlQuery)) {
    return res
      .status(400)
      .json({ ok: false, error: 'Only SELECT/SHOW/DESCRIBE statements are allowed in Node sandbox mode' });
  }

  const [rows] = await pool.query(sqlQuery);
  return res.json({ ok: true, rows });
};

const listRepositories = async (_req, res) => {
  const [repositories] = await pool.query(
    `
      SELECT r.id, r.name, r.created_by, r.created_at, u.name AS creator_name
      FROM repositories r
      LEFT JOIN users u ON u.id = r.created_by
      WHERE r.team_type = 'multimedia'
      ORDER BY r.created_at DESC
    `
  );

  const [uploads] = await pool.query(
    `
      SELECT up.id, up.repository_id, up.user_id, up.filename, up.filepath, up.filetype, up.size, up.task_status, up.uploaded_at,
             u.name AS uploader_name, r.name AS repo_name
      FROM uploads up
      LEFT JOIN users u ON u.id = up.user_id
      LEFT JOIN repositories r ON r.id = up.repository_id
      WHERE r.team_type = 'multimedia'
      ORDER BY up.uploaded_at DESC
      LIMIT 100
    `
  );

  return res.json({ ok: true, repositories, uploads });
};

const createRepository = async (req, res) => {
  if (!isTeamHead(req.session.user, 'multimedia')) {
    return res.status(403).json({ ok: false, error: 'Only multimedia head can create repositories' });
  }

  const name = cleanText(req.body.name, 255);
  if (!name) {
    return res.status(400).json({ ok: false, error: 'name is required' });
  }

  await pool.query(
    'INSERT INTO repositories (name, team_type, created_by) VALUES (?, ?, ?)',
    [name, 'multimedia', req.session.user.id]
  );

  return res.status(201).json({ ok: true, message: 'Repository created' });
};

const deleteRepository = async (req, res) => {
  if (!isTeamHead(req.session.user, 'multimedia')) {
    return res.status(403).json({ ok: false, error: 'Only multimedia head can delete repositories' });
  }

  const repoId = Number(req.params.id);
  await pool.query('DELETE FROM repositories WHERE id = ? AND team_type = ?', [repoId, 'multimedia']);
  return res.json({ ok: true, message: 'Repository deleted' });
};

const uploadRepositoryFile = async (req, res) => {
  const repositoryId = Number(req.body.repository_id);
  if (!req.file || !repositoryId) {
    return res.status(400).json({ ok: false, error: 'repository_id and file are required' });
  }

  await pool.query(
    `
      INSERT INTO uploads (repository_id, user_id, filename, filepath, filetype, size, task_status)
      VALUES (?, ?, ?, ?, ?, ?, 'not_complete')
    `,
    [
      repositoryId,
      req.session.user.id,
      req.file.originalname,
      req.file.path.replace(/\\/g, '/'),
      req.file.mimetype,
      req.file.size,
    ]
  );

  return res.status(201).json({ ok: true, message: 'File uploaded' });
};

const updateUploadStatus = async (req, res) => {
  const uploadId = Number(req.params.uploadId);
  const taskStatus = cleanText(req.body.task_status, 30);
  const allowed = ['not_complete', 'processing', 'done'];
  if (!allowed.includes(taskStatus)) {
    return res.status(400).json({ ok: false, error: 'Invalid task_status' });
  }

  await pool.query('UPDATE uploads SET task_status = ? WHERE id = ?', [taskStatus, uploadId]);
  return res.json({ ok: true, message: 'Upload status updated' });
};

module.exports = {
  addAnnouncementComment,
  addProjectComment,
  createAnnouncement,
  createEvent,
  createGsitePost,
  createMember,
  createRepository,
  deleteAnnouncement,
  deleteAnnouncementComment,
  deleteEvent,
  deleteEventRegistration,
  deleteGsitePost,
  deleteMember,
  deleteProjectFile,
  deleteRepository,
  getDashboard,
  listAnnouncements,
  listEventRegistrations,
  listEvents,
  listGsitePosts,
  listMembers,
  listProjects,
  listRepositories,
  runEditorQuery,
  updateAnnouncement,
  updateAnnouncementComment,
  updateEvent,
  updateGsitePost,
  updateMember,
  updateProjectFile,
  updateUploadStatus,
  uploadProjectFile,
  uploadRepositoryFile,
};

