const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../../config/db');
const { cleanText } = require('../../utils/http');
const { toStoredUploadPath, resolveStoredUploadAbsolutePath } = require('../../utils/uploadPaths');
const {
  MULTIMEDIA_HEAD_ROLE,
  canAccessAssignedTeam,
} = require('../../middleware/multimediaAccess');

const MEMBER_ROLES = ['photographer', 'videographer', 'graphic_designer', 'documentator'];
const ASSIGNED_TEAMS = [...MEMBER_ROLES, 'all_teams'];
const FILE_STATUS = ['pending', 'processing', 'done'];
const ANNOUNCEMENT_AUDIENCE = ['students', 'multimedia_team', 'all'];

const toInt = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const normalizeSortDir = (value) => (String(value || '').toUpperCase() === 'ASC' ? 'ASC' : 'DESC');

const normalizeEnum = (value, allowed, fallback = null) => {
  const normalized = String(value || '').trim().toLowerCase();
  return allowed.includes(normalized) ? normalized : fallback;
};

const removeLocalFile = (storedPath) => {
  if (!storedPath) return;
  const absolutePath = resolveStoredUploadAbsolutePath(storedPath);
  if (!absolutePath) return;
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
};

const getInsertId = (insertResult) => {
  if (!insertResult || typeof insertResult !== 'object') return null;
  if (Object.prototype.hasOwnProperty.call(insertResult, 'insertId')) {
    return Number(insertResult.insertId) || null;
  }
  return null;
};

const isMissingTableError = (error) => {
  return error && (error.code === 'ER_NO_SUCH_TABLE' || error.errno === 1146);
};

const isUnknownColumnError = (error) => {
  return error && (error.code === 'ER_BAD_FIELD_ERROR' || error.errno === 1054);
};

const normalizeBcryptHash = (hash) => {
  const raw = String(hash || '');
  return raw.startsWith('$2y$') ? `$2a$${raw.slice(4)}` : raw;
};

const verifyPassword = (plainText, storedHash) => {
  const hash = String(storedHash || '');
  if (!hash) return false;

  try {
    if (/^\$2[aby]\$/.test(hash) || hash.startsWith('$2y$')) {
      return bcrypt.compareSync(String(plainText || ''), normalizeBcryptHash(hash));
    }
  } catch (_error) {
    // Fallback to direct comparison for temporary legacy rows.
  }

  return String(plainText || '') === hash;
};

const formatMember = (row) => ({
  id: row.id,
  user_id: row.user_id,
  photo: row.photo,
  name: row.name,
  email: row.email,
  username: row.username,
  password: '********',
  role: row.role,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const formatFile = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  file_name: row.file_name,
  file_path: row.file_path,
  mime_type: row.mime_type,
  file_size: row.file_size,
  assigned_team: row.assigned_team,
  status: row.status,
  uploaded_by: row.uploaded_by,
  uploaded_by_name: row.uploaded_by_name || 'Unknown',
  created_at: row.created_at,
  updated_at: row.updated_at,
  download_url: `/api/multimedia/files/${row.id}/download`,
  view_url: `/api/multimedia/files/${row.id}/view`,
});

const formatAnnouncement = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  image: row.image,
  posted_by: row.posted_by,
  posted_by_name: row.posted_by_name || 'Unknown',
  target_audience: row.target_audience,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const buildOrderBy = (requestedSort, requestedDir, allowedMap, fallbackField) => {
  const safeField = Object.prototype.hasOwnProperty.call(allowedMap, requestedSort)
    ? allowedMap[requestedSort]
    : allowedMap[fallbackField] || fallbackField;
  const safeDir = normalizeSortDir(requestedDir);
  return `${safeField} ${safeDir}`;
};

const getActor = (req) => {
  const user = req.user || req.session?.user || {};
  return {
    id: user.id || null,
    role: user.role || null,
    name: user.name || user.username || 'Unknown User',
  };
};

const writeActivityLog = async (req, action, details = '') => {
  const actor = getActor(req);

  try {
    await pool.query(
      `
        INSERT INTO activity_logs (user_id, user_role, user_name, action, details, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `,
      [actor.id, actor.role, actor.name, action, cleanText(details, 2000)]
    );
  } catch (error) {
    if (isMissingTableError(error)) {
      return;
    }

    if (isUnknownColumnError(error)) {
      try {
        await pool.query('INSERT INTO activity_logs (user_id, action) VALUES (?, ?)', [actor.id, action]);
      } catch (_ignore) {
        // Keep action non-blocking for the main request.
      }
      return;
    }

    throw error;
  }
};

const createNotification = async (type, title, message, referenceId, createdBy) => {
  try {
    await pool.query(
      `
        INSERT INTO notifications (type, title, message, reference_id, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `,
      [type, cleanText(title, 255), cleanText(message, 2000), referenceId || null, createdBy || null]
    );
  } catch (error) {
    if (isMissingTableError(error)) {
      return;
    }
    throw error;
  }
};

const fetchMemberById = async (memberId) => {
  const [rows] = await pool.query(
    `
      SELECT id, user_id, photo, name, email, username, password_hash, role, created_at, updated_at
      FROM multimedia_members
      WHERE id = ?
      LIMIT 1
    `,
    [memberId]
  );

  return rows[0] || null;
};

const fetchFileById = async (fileId) => {
  const [rows] = await pool.query(
    `
      SELECT mf.id, mf.title, mf.description, mf.file_path, mf.file_name, mf.mime_type, mf.file_size,
             mf.assigned_team, mf.status, mf.uploaded_by, mf.created_at, mf.updated_at,
             u.name AS uploaded_by_name
      FROM multimedia_files mf
      LEFT JOIN users u ON u.id = mf.uploaded_by
      WHERE mf.id = ?
      LIMIT 1
    `,
    [fileId]
  );

  return rows[0] || null;
};

const fetchAnnouncementById = async (announcementId) => {
  const [rows] = await pool.query(
    `
      SELECT a.id, a.title, a.description, a.image, a.posted_by, a.target_audience, a.created_at, a.updated_at,
             u.name AS posted_by_name
      FROM announcements a
      LEFT JOIN users u ON u.id = a.posted_by
      WHERE a.id = ?
      LIMIT 1
    `,
    [announcementId]
  );

  return rows[0] || null;
};

const ensureFileRoleAccess = (req, fileRow) => {
  const role = req.user?.role || req.session?.user?.role || '';
  if (!canAccessAssignedTeam(role, fileRow.assigned_team)) {
    return false;
  }
  return true;
};

const getDashboardSummary = async (_req, res) => {
  const [[members], [files], [pending], [processing], [done], [announcements]] = await Promise.all([
    pool.query('SELECT COUNT(*) AS total FROM multimedia_members'),
    pool.query('SELECT COUNT(*) AS total FROM multimedia_files'),
    pool.query("SELECT COUNT(*) AS total FROM multimedia_files WHERE status = 'pending'"),
    pool.query("SELECT COUNT(*) AS total FROM multimedia_files WHERE status = 'processing'"),
    pool.query("SELECT COUNT(*) AS total FROM multimedia_files WHERE status = 'done'"),
    pool.query(
      `
        SELECT COUNT(*) AS total
        FROM announcements a
        JOIN users u ON u.id = a.posted_by
        WHERE u.role = 'multimedia_head'
      `
    ),
  ]);

  return res.json({
    ok: true,
    summary: {
      total_multimedia_team_members: members[0].total,
      total_uploaded_files: files[0].total,
      pending_files: pending[0].total,
      processing_files: processing[0].total,
      done_files: done[0].total,
      total_announcements: announcements[0].total,
    },
  });
};
const listMembers = async (req, res) => {
  const search = cleanText(req.query.search, 120);
  const role = normalizeEnum(req.query.role, MEMBER_ROLES, '');
  const orderBy = buildOrderBy(
    cleanText(req.query.sort, 40),
    req.query.dir,
    {
      name: 'name',
      email: 'email',
      username: 'username',
      role: 'role',
      created_at: 'created_at',
    },
    'created_at'
  );

  const params = [];
  let sql = `
    SELECT id, user_id, photo, name, email, username, role, created_at, updated_at
    FROM multimedia_members
    WHERE 1 = 1
  `;

  if (search) {
    sql += ' AND (name LIKE ? OR email LIKE ? OR username LIKE ?)';
    const pattern = `%${search}%`;
    params.push(pattern, pattern, pattern);
  }

  if (role) {
    sql += ' AND role = ?';
    params.push(role);
  }

  sql += ` ORDER BY ${orderBy}`;

  const [rows] = await pool.query(sql, params);

  return res.json({
    ok: true,
    members: rows.map(formatMember),
  });
};

const getMember = async (req, res) => {
  const memberId = toInt(req.params.id);
  if (!memberId) {
    return res.status(400).json({ ok: false, error: 'Invalid member id' });
  }

  const member = await fetchMemberById(memberId);
  if (!member) {
    return res.status(404).json({ ok: false, error: 'Member not found' });
  }

  return res.json({ ok: true, member: formatMember(member) });
};

const createMember = async (req, res) => {
  const name = cleanText(req.body.name, 120);
  const email = cleanText(req.body.email, 120).toLowerCase();
  const username = cleanText(req.body.username, 80);
  const password = String(req.body.password || '');
  const role = normalizeEnum(req.body.role, MEMBER_ROLES, '');

  if (!name || !email || !username || !password || !role) {
    return res.status(400).json({
      ok: false,
      error: 'name, email, username, password, and role are required',
    });
  }

  if (password.length < 8) {
    return res.status(400).json({ ok: false, error: 'Password must be at least 8 characters long' });
  }

  const [existingMemberRows] = await pool.query(
    'SELECT id FROM multimedia_members WHERE username = ? OR email = ? LIMIT 1',
    [username, email]
  );

  if (existingMemberRows.length) {
    return res.status(409).json({ ok: false, error: 'Duplicate username or email in multimedia members' });
  }

  const [existingUserRows] = await pool.query(
    'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
    [username, email]
  );

  if (existingUserRows.length) {
    return res.status(409).json({ ok: false, error: 'Duplicate username or email in users table' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const photo = req.file ? toStoredUploadPath(req.file.path) : null;
  const actor = getActor(req);

  const [userInsertResult] = await pool.query(
    `
      INSERT INTO users (username, password_hash, email, name, role, team, profile_picture)
      VALUES (?, ?, ?, ?, ?, 'multimedia', ?)
    `,
    [username, passwordHash, email, name, role, photo || 'default.png']
  );

  const userId = getInsertId(userInsertResult);

  try {
    const [memberInsertResult] = await pool.query(
      `
        INSERT INTO multimedia_members (user_id, photo, name, email, username, password_hash, role, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [userId, photo, name, email, username, passwordHash, role, actor.id]
    );

    await writeActivityLog(req, 'Created multimedia team member', `${name} (${role})`);

    return res.status(201).json({
      ok: true,
      message: 'Multimedia member created successfully',
      member_id: getInsertId(memberInsertResult),
      user_id: userId,
    });
  } catch (error) {
    if (userId) {
      await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    }
    throw error;
  }
};

const updateMember = async (req, res) => {
  const memberId = toInt(req.params.id);
  if (!memberId) {
    return res.status(400).json({ ok: false, error: 'Invalid member id' });
  }

  const member = await fetchMemberById(memberId);
  if (!member) {
    return res.status(404).json({ ok: false, error: 'Member not found' });
  }

  const name = cleanText(req.body.name || member.name, 120);
  const email = cleanText(req.body.email || member.email, 120).toLowerCase();
  const username = cleanText(req.body.username || member.username, 80);
  const role = normalizeEnum(req.body.role || member.role, MEMBER_ROLES, member.role);
  const nextPassword = String(req.body.password || '');
  const nextPhoto = req.file ? toStoredUploadPath(req.file.path) : member.photo;

  if (!name || !email || !username || !role) {
    return res.status(400).json({ ok: false, error: 'name, email, username, and role are required' });
  }

  const [existingRows] = await pool.query(
    `
      SELECT id
      FROM multimedia_members
      WHERE (username = ? OR email = ?) AND id <> ?
      LIMIT 1
    `,
    [username, email, memberId]
  );

  if (existingRows.length) {
    return res.status(409).json({ ok: false, error: 'Duplicate username or email in multimedia members' });
  }

  if (member.user_id) {
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE (username = ? OR email = ?) AND id <> ? LIMIT 1',
      [username, email, member.user_id]
    );

    if (existingUsers.length) {
      return res.status(409).json({ ok: false, error: 'Duplicate username or email in users table' });
    }
  }

  let passwordHash = null;
  if (nextPassword) {
    if (nextPassword.length < 8) {
      return res.status(400).json({ ok: false, error: 'Password must be at least 8 characters long' });
    }
    passwordHash = await bcrypt.hash(nextPassword, 10);
  }

  if (passwordHash) {
    await pool.query(
      `
        UPDATE multimedia_members
        SET photo = ?, name = ?, email = ?, username = ?, role = ?, password_hash = ?, updated_at = NOW()
        WHERE id = ?
      `,
      [nextPhoto, name, email, username, role, passwordHash, memberId]
    );
  } else {
    await pool.query(
      `
        UPDATE multimedia_members
        SET photo = ?, name = ?, email = ?, username = ?, role = ?, updated_at = NOW()
        WHERE id = ?
      `,
      [nextPhoto, name, email, username, role, memberId]
    );
  }

  if (member.user_id) {
    if (passwordHash) {
      await pool.query(
        `
          UPDATE users
          SET profile_picture = ?, name = ?, email = ?, username = ?, role = ?, password_hash = ?
          WHERE id = ?
        `,
        [nextPhoto || 'default.png', name, email, username, role, passwordHash, member.user_id]
      );
    } else {
      await pool.query(
        `
          UPDATE users
          SET profile_picture = ?, name = ?, email = ?, username = ?, role = ?
          WHERE id = ?
        `,
        [nextPhoto || 'default.png', name, email, username, role, member.user_id]
      );
    }
  }

  if (req.file && member.photo && member.photo !== nextPhoto) {
    removeLocalFile(member.photo);
  }

  await writeActivityLog(req, 'Updated multimedia team member', `${name} (${role})`);

  return res.json({ ok: true, message: 'Member updated successfully' });
};

const resetMemberPassword = async (req, res) => {
  const memberId = toInt(req.params.id);
  if (!memberId) {
    return res.status(400).json({ ok: false, error: 'Invalid member id' });
  }

  const member = await fetchMemberById(memberId);
  if (!member) {
    return res.status(404).json({ ok: false, error: 'Member not found' });
  }

  const providedPassword = String(req.body.new_password || '');
  const generatedPassword = crypto.randomBytes(6).toString('base64url');
  const nextPassword = providedPassword || generatedPassword;

  if (nextPassword.length < 8) {
    return res.status(400).json({ ok: false, error: 'Password must be at least 8 characters long' });
  }

  const passwordHash = await bcrypt.hash(nextPassword, 10);

  await pool.query('UPDATE multimedia_members SET password_hash = ?, updated_at = NOW() WHERE id = ?', [
    passwordHash,
    memberId,
  ]);

  if (member.user_id) {
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, member.user_id]);
  }

  await writeActivityLog(req, 'Reset multimedia member password', `${member.username} (${member.role})`);

  return res.json({
    ok: true,
    message: 'Password reset successfully',
    ...(providedPassword ? {} : { temporary_password: nextPassword }),
  });
};

const deleteMember = async (req, res) => {
  const memberId = toInt(req.params.id);
  if (!memberId) {
    return res.status(400).json({ ok: false, error: 'Invalid member id' });
  }

  const member = await fetchMemberById(memberId);
  if (!member) {
    return res.status(404).json({ ok: false, error: 'Member not found' });
  }

  await pool.query('DELETE FROM multimedia_members WHERE id = ?', [memberId]);

  if (member.user_id) {
    await pool.query('DELETE FROM users WHERE id = ?', [member.user_id]);
  }

  if (member.photo) {
    removeLocalFile(member.photo);
  }

  await writeActivityLog(req, 'Deleted multimedia team member', `${member.username} (${member.role})`);

  return res.json({ ok: true, message: 'Member deleted successfully' });
};
const listFiles = async (req, res) => {
  const role = req.user?.role || req.session?.user?.role || '';
  const search = cleanText(req.query.search, 120);
  const status = normalizeEnum(req.query.status, FILE_STATUS, '');
  const assignedTeam = normalizeEnum(req.query.assigned_team, ASSIGNED_TEAMS, '');
  const orderBy = buildOrderBy(
    cleanText(req.query.sort, 40),
    req.query.dir,
    {
      title: 'mf.title',
      assigned_team: 'mf.assigned_team',
      status: 'mf.status',
      created_at: 'mf.created_at',
    },
    'created_at'
  );

  const params = [];
  let sql = `
    SELECT mf.id, mf.title, mf.description, mf.file_path, mf.file_name, mf.mime_type, mf.file_size,
           mf.assigned_team, mf.status, mf.uploaded_by, mf.created_at, mf.updated_at,
           u.name AS uploaded_by_name
    FROM multimedia_files mf
    LEFT JOIN users u ON u.id = mf.uploaded_by
    WHERE 1 = 1
  `;

  if (search) {
    sql += ' AND (mf.title LIKE ? OR mf.description LIKE ? OR mf.file_name LIKE ?)';
    const pattern = `%${search}%`;
    params.push(pattern, pattern, pattern);
  }

  if (status) {
    sql += ' AND mf.status = ?';
    params.push(status);
  }

  if (assignedTeam) {
    sql += ' AND mf.assigned_team = ?';
    params.push(assignedTeam);
  }

  if (![MULTIMEDIA_HEAD_ROLE, 'superadmin', 'admin'].includes(role)) {
    if (role === 'multimedia_member') {
      // Legacy member role has broad access.
    } else {
      sql += " AND (mf.assigned_team = 'all_teams' OR mf.assigned_team = ?)";
      params.push(role);
    }
  }

  sql += ` ORDER BY ${orderBy}`;

  const [rows] = await pool.query(sql, params);

  const files = rows.map((row) => {
    const formatted = formatFile(row);
    return {
      ...formatted,
      file_available: Boolean(resolveStoredUploadAbsolutePath(formatted.file_path)),
    };
  });

  return res.json({ ok: true, files });
};

const getFile = async (req, res) => {
  const fileId = toInt(req.params.id);
  if (!fileId) {
    return res.status(400).json({ ok: false, error: 'Invalid file id' });
  }

  const file = await fetchFileById(fileId);
  if (!file) {
    return res.status(404).json({ ok: false, error: 'File not found' });
  }

  if (!ensureFileRoleAccess(req, file)) {
    return res.status(403).json({ ok: false, error: 'You do not have access to this file' });
  }

  return res.json({ ok: true, file: formatFile(file) });
};

const createFile = async (req, res) => {
  const title = cleanText(req.body.title, 255);
  const description = cleanText(req.body.description, 2000);
  const assignedTeam = normalizeEnum(req.body.assigned_team, ASSIGNED_TEAMS, '');

  if (!title || !assignedTeam) {
    return res.status(400).json({ ok: false, error: 'title and assigned_team are required' });
  }

  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'File upload is required' });
  }

  const relativePath = toStoredUploadPath(req.file.path);
  const uploadedAbsolutePath = resolveStoredUploadAbsolutePath(relativePath);
  if (!uploadedAbsolutePath) {
    return res.status(500).json({
      ok: false,
      error: 'Uploaded file could not be saved on server storage',
    });
  }
  const actor = getActor(req);

  const [insertResult] = await pool.query(
    `
      INSERT INTO multimedia_files
      (title, description, file_path, file_name, mime_type, file_size, assigned_team, status, uploaded_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW(), NOW())
    `,
    [
      title,
      description || null,
      relativePath,
      req.file.originalname,
      req.file.mimetype || null,
      req.file.size || 0,
      assignedTeam,
      actor.id,
    ]
  );

  const fileId = getInsertId(insertResult);

  await writeActivityLog(req, 'Uploaded multimedia file', `${title} (${assignedTeam})`);
  await createNotification(
    'file_uploaded',
    'New multimedia file uploaded',
    `${title} assigned to ${assignedTeam}`,
    fileId,
    actor.id
  );

  return res.status(201).json({
    ok: true,
    message: 'File uploaded successfully',
    file_id: fileId,
  });
};

const updateFile = async (req, res) => {
  const fileId = toInt(req.params.id);
  if (!fileId) {
    return res.status(400).json({ ok: false, error: 'Invalid file id' });
  }

  const existing = await fetchFileById(fileId);
  if (!existing) {
    return res.status(404).json({ ok: false, error: 'File not found' });
  }

  const title = cleanText(req.body.title || existing.title, 255);
  const description = cleanText(req.body.description || existing.description, 2000);
  const assignedTeam = normalizeEnum(req.body.assigned_team || existing.assigned_team, ASSIGNED_TEAMS, existing.assigned_team);
  const status = normalizeEnum(req.body.status || existing.status, FILE_STATUS, existing.status);

  let filePath = existing.file_path;
  let fileName = existing.file_name;
  let mimeType = existing.mime_type;
  let fileSize = existing.file_size;

  if (req.file) {
    filePath = toStoredUploadPath(req.file.path);
    const uploadedAbsolutePath = resolveStoredUploadAbsolutePath(filePath);
    if (!uploadedAbsolutePath) {
      return res.status(500).json({
        ok: false,
        error: 'Uploaded file could not be saved on server storage',
      });
    }
    fileName = req.file.originalname;
    mimeType = req.file.mimetype || null;
    fileSize = req.file.size || 0;
  }

  await pool.query(
    `
      UPDATE multimedia_files
      SET title = ?, description = ?, file_path = ?, file_name = ?, mime_type = ?, file_size = ?,
          assigned_team = ?, status = ?, updated_at = NOW()
      WHERE id = ?
    `,
    [title, description || null, filePath, fileName, mimeType, fileSize, assignedTeam, status, fileId]
  );

  if (req.file && existing.file_path && existing.file_path !== filePath) {
    removeLocalFile(existing.file_path);
  }

  await writeActivityLog(req, 'Updated multimedia file', `${title} (${assignedTeam}/${status})`);

  return res.json({ ok: true, message: 'File updated successfully' });
};

const deleteFile = async (req, res) => {
  const fileId = toInt(req.params.id);
  if (!fileId) {
    return res.status(400).json({ ok: false, error: 'Invalid file id' });
  }

  const file = await fetchFileById(fileId);
  if (!file) {
    return res.status(404).json({ ok: false, error: 'File not found' });
  }

  await pool.query('DELETE FROM multimedia_files WHERE id = ?', [fileId]);

  if (file.file_path) {
    removeLocalFile(file.file_path);
  }

  await writeActivityLog(req, 'Deleted multimedia file', `${file.title} (${file.assigned_team})`);

  return res.json({ ok: true, message: 'File deleted successfully' });
};

const changeFileStatus = async (req, res) => {
  const fileId = toInt(req.params.id);
  const nextStatus = normalizeEnum(req.body.status, FILE_STATUS, '');

  if (!fileId || !nextStatus) {
    return res.status(400).json({ ok: false, error: 'Valid file id and status are required' });
  }

  const file = await fetchFileById(fileId);
  if (!file) {
    return res.status(404).json({ ok: false, error: 'File not found' });
  }

  if (!ensureFileRoleAccess(req, file)) {
    return res.status(403).json({ ok: false, error: 'You do not have access to update this file status' });
  }

  await pool.query('UPDATE multimedia_files SET status = ?, updated_at = NOW() WHERE id = ?', [nextStatus, fileId]);

  const actor = getActor(req);
  await writeActivityLog(req, 'Changed multimedia file status', `${file.title}: ${file.status} -> ${nextStatus}`);
  await createNotification(
    'file_status_changed',
    'Multimedia file status updated',
    `${file.title} is now ${nextStatus}`,
    fileId,
    actor.id
  );

  return res.json({ ok: true, message: 'File status updated successfully' });
};

const downloadFile = async (req, res) => {
  const fileId = toInt(req.params.id);
  if (!fileId) {
    return res.status(400).json({ ok: false, error: 'Invalid file id' });
  }

  const file = await fetchFileById(fileId);
  if (!file) {
    return res.status(404).json({ ok: false, error: 'File not found' });
  }

  if (!ensureFileRoleAccess(req, file)) {
    return res.status(403).json({ ok: false, error: 'You do not have access to this file' });
  }

  const absolutePath = resolveStoredUploadAbsolutePath(file.file_path);
  if (!absolutePath || !fs.existsSync(absolutePath)) {
    console.error('[multimedia:downloadFile] file missing', {
      fileId: file.id,
      filePath: file.file_path,
      cwd: process.cwd(),
    });
    return res.status(404).json({ ok: false, error: 'File is missing from server storage' });
  }

  return res.download(absolutePath, file.file_name);
};

const viewFile = async (req, res) => {
  const fileId = toInt(req.params.id);
  if (!fileId) {
    return res.status(400).json({ ok: false, error: 'Invalid file id' });
  }

  const file = await fetchFileById(fileId);
  if (!file) {
    return res.status(404).json({ ok: false, error: 'File not found' });
  }

  if (!ensureFileRoleAccess(req, file)) {
    return res.status(403).json({ ok: false, error: 'You do not have access to this file' });
  }

  const absolutePath = resolveStoredUploadAbsolutePath(file.file_path);
  if (!absolutePath || !fs.existsSync(absolutePath)) {
    console.error('[multimedia:viewFile] file missing', {
      fileId: file.id,
      filePath: file.file_path,
      cwd: process.cwd(),
    });
    return res.status(404).json({ ok: false, error: 'File is missing from server storage' });
  }

  const contentType = file.mime_type || 'application/octet-stream';
  const canInline = contentType.startsWith('image/') || contentType === 'application/pdf' || contentType === 'text/plain';

  res.setHeader('Content-Type', contentType);
  res.setHeader(
    'Content-Disposition',
    `${canInline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(file.file_name)}"`
  );

  return res.sendFile(absolutePath);
};
const listAnnouncements = async (req, res) => {
  const search = cleanText(req.query.search, 120);
  const audience = normalizeEnum(req.query.target_audience, ANNOUNCEMENT_AUDIENCE, '');
  const orderBy = buildOrderBy(
    cleanText(req.query.sort, 40),
    req.query.dir,
    {
      title: 'a.title',
      created_at: 'a.created_at',
      target_audience: 'a.target_audience',
    },
    'created_at'
  );

  const params = [];
  let sql = `
    SELECT a.id, a.title, a.description, a.image, a.posted_by, a.target_audience, a.created_at, a.updated_at,
           u.name AS posted_by_name
    FROM announcements a
    LEFT JOIN users u ON u.id = a.posted_by
    WHERE 1 = 1
  `;

  if (search) {
    sql += ' AND (a.title LIKE ? OR a.description LIKE ?)';
    const pattern = `%${search}%`;
    params.push(pattern, pattern);
  }

  if (audience) {
    sql += ' AND a.target_audience = ?';
    params.push(audience);
  }

  sql += ` ORDER BY ${orderBy}`;

  const [rows] = await pool.query(sql, params);

  return res.json({ ok: true, announcements: rows.map(formatAnnouncement) });
};

const getAnnouncement = async (req, res) => {
  const announcementId = toInt(req.params.id);
  if (!announcementId) {
    return res.status(400).json({ ok: false, error: 'Invalid announcement id' });
  }

  const announcement = await fetchAnnouncementById(announcementId);
  if (!announcement) {
    return res.status(404).json({ ok: false, error: 'Announcement not found' });
  }

  return res.json({ ok: true, announcement: formatAnnouncement(announcement) });
};

const createAnnouncement = async (req, res) => {
  const title = cleanText(req.body.title, 255);
  const description = cleanText(req.body.description, 4000);
  const targetAudience = normalizeEnum(req.body.target_audience, ANNOUNCEMENT_AUDIENCE, 'students');
  const image = req.file ? toStoredUploadPath(req.file.path) : null;

  if (!title || !description) {
    return res.status(400).json({ ok: false, error: 'title and description are required' });
  }

  const actor = getActor(req);

  const [insertResult] = await pool.query(
    `
      INSERT INTO announcements (title, description, image, posted_by, target_audience, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `,
    [title, description, image, actor.id, targetAudience]
  );

  const announcementId = getInsertId(insertResult);

  await writeActivityLog(req, 'Posted announcement', title);
  await createNotification('announcement_posted', 'New announcement posted', title, announcementId, actor.id);

  return res.status(201).json({
    ok: true,
    message: 'Announcement created successfully',
    announcement_id: announcementId,
  });
};

const updateAnnouncement = async (req, res) => {
  const announcementId = toInt(req.params.id);
  if (!announcementId) {
    return res.status(400).json({ ok: false, error: 'Invalid announcement id' });
  }

  const existing = await fetchAnnouncementById(announcementId);
  if (!existing) {
    return res.status(404).json({ ok: false, error: 'Announcement not found' });
  }

  const title = cleanText(req.body.title || existing.title, 255);
  const description = cleanText(req.body.description || existing.description, 4000);
  const targetAudience = normalizeEnum(
    req.body.target_audience || existing.target_audience,
    ANNOUNCEMENT_AUDIENCE,
    existing.target_audience
  );
  const image = req.file ? toStoredUploadPath(req.file.path) : existing.image;

  await pool.query(
    `
      UPDATE announcements
      SET title = ?, description = ?, image = ?, target_audience = ?, updated_at = NOW()
      WHERE id = ?
    `,
    [title, description, image, targetAudience, announcementId]
  );

  if (req.file && existing.image && existing.image !== image) {
    removeLocalFile(existing.image);
  }

  await writeActivityLog(req, 'Edited announcement', title);

  return res.json({ ok: true, message: 'Announcement updated successfully' });
};

const deleteAnnouncement = async (req, res) => {
  const announcementId = toInt(req.params.id);
  if (!announcementId) {
    return res.status(400).json({ ok: false, error: 'Invalid announcement id' });
  }

  const existing = await fetchAnnouncementById(announcementId);
  if (!existing) {
    return res.status(404).json({ ok: false, error: 'Announcement not found' });
  }

  await pool.query('DELETE FROM announcements WHERE id = ?', [announcementId]);

  if (existing.image) {
    removeLocalFile(existing.image);
  }

  await writeActivityLog(req, 'Deleted announcement', existing.title);

  return res.json({ ok: true, message: 'Announcement deleted successfully' });
};
const listActivityLogs = async (req, res) => {
  const search = cleanText(req.query.search, 120);
  const params = [];

  let sql = `
    SELECT id, user_role, user_name, action, details, created_at
    FROM activity_logs
    WHERE 1 = 1
  `;

  if (search) {
    sql += ' AND (action LIKE ? OR details LIKE ? OR user_name LIKE ?)';
    const pattern = `%${search}%`;
    params.push(pattern, pattern, pattern);
  }

  sql += ' ORDER BY created_at DESC LIMIT 200';

  try {
    const [rows] = await pool.query(sql, params);
    return res.json({ ok: true, logs: rows });
  } catch (error) {
    if (isUnknownColumnError(error)) {
      const [rows] = await pool.query(
        `
          SELECT id, NULL AS user_role, NULL AS user_name, action, NULL AS details, timestamp AS created_at
          FROM activity_logs
          ORDER BY timestamp DESC
          LIMIT 200
        `
      );
      return res.json({ ok: true, logs: rows });
    }

    if (isMissingTableError(error)) {
      return res.json({ ok: true, logs: [] });
    }

    throw error;
  }
};

const getReports = async (_req, res) => {
  const [[statusRows], [teamRows], [memberRows], [monthlyRows]] = await Promise.all([
    pool.query(
      `
        SELECT status, COUNT(*) AS total
        FROM multimedia_files
        GROUP BY status
      `
    ),
    pool.query(
      `
        SELECT assigned_team, COUNT(*) AS total
        FROM multimedia_files
        GROUP BY assigned_team
      `
    ),
    pool.query(
      `
        SELECT role, COUNT(*) AS total
        FROM multimedia_members
        GROUP BY role
      `
    ),
    pool.query(
      `
        SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS total
        FROM multimedia_files
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
      `
    ),
  ]);

  return res.json({
    ok: true,
    reports: {
      uploads_by_status: statusRows,
      uploads_by_team: teamRows,
      members_by_role: memberRows,
      monthly_uploads: monthlyRows,
    },
  });
};

const listNotifications = async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `
        SELECT id, type, title, message, reference_id, created_by, created_at
        FROM notifications
        ORDER BY created_at DESC
        LIMIT 50
      `
    );

    return res.json({ ok: true, notifications: rows });
  } catch (error) {
    if (isMissingTableError(error)) {
      return res.json({ ok: true, notifications: [] });
    }
    throw error;
  }
};

const getProfile = async (req, res) => {
  const actor = getActor(req);
  const [rows] = await pool.query(
    'SELECT id, username, name, email, role, profile_picture, created_at FROM users WHERE id = ? LIMIT 1',
    [actor.id]
  );

  if (!rows.length) {
    return res.status(404).json({ ok: false, error: 'User not found' });
  }

  return res.json({ ok: true, profile: rows[0] });
};

const updateProfile = async (req, res) => {
  const actor = getActor(req);
  const name = cleanText(req.body.name, 120);
  const email = cleanText(req.body.email, 120).toLowerCase();

  if (!name || !email) {
    return res.status(400).json({ ok: false, error: 'name and email are required' });
  }

  const [rows] = await pool.query('SELECT profile_picture FROM users WHERE id = ? LIMIT 1', [actor.id]);
  if (!rows.length) {
    return res.status(404).json({ ok: false, error: 'User not found' });
  }

  const [existingEmailRows] = await pool.query('SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1', [
    email,
    actor.id,
  ]);
  if (existingEmailRows.length) {
    return res.status(409).json({ ok: false, error: 'Email is already in use' });
  }

  const currentPicture = rows[0].profile_picture;
  const nextPicture = req.file ? toStoredUploadPath(req.file.path) : currentPicture;

  await pool.query('UPDATE users SET name = ?, email = ?, profile_picture = ? WHERE id = ?', [
    name,
    email,
    nextPicture,
    actor.id,
  ]);

  if (req.file && currentPicture && currentPicture !== 'default.png' && currentPicture !== nextPicture) {
    removeLocalFile(currentPicture);
  }

  await writeActivityLog(req, 'Updated multimedia head profile', `${name} <${email}>`);

  return res.json({ ok: true, message: 'Profile updated successfully' });
};

const changePassword = async (req, res) => {
  const actor = getActor(req);
  const currentPassword = String(req.body.current_password || '');
  const newPassword = String(req.body.new_password || '');

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ ok: false, error: 'current_password and new_password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ ok: false, error: 'New password must be at least 8 characters long' });
  }

  const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [actor.id]);
  if (!rows.length) {
    return res.status(404).json({ ok: false, error: 'User not found' });
  }

  const isValid = verifyPassword(currentPassword, rows[0].password_hash);
  if (!isValid) {
    return res.status(401).json({ ok: false, error: 'Current password is incorrect' });
  }

  const nextHash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [nextHash, actor.id]);

  await writeActivityLog(req, 'Changed multimedia head password', `User ID ${actor.id}`);

  return res.json({ ok: true, message: 'Password changed successfully' });
};

module.exports = {
  getDashboardSummary,
  listMembers,
  getMember,
  createMember,
  updateMember,
  resetMemberPassword,
  deleteMember,
  listFiles,
  getFile,
  createFile,
  updateFile,
  deleteFile,
  changeFileStatus,
  downloadFile,
  viewFile,
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  listActivityLogs,
  getReports,
  listNotifications,
  getProfile,
  updateProfile,
  changePassword,
};
