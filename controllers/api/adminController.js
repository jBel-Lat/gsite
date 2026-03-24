const bcrypt = require('bcryptjs');
const pool = require('../../config/db');
const { getTeamFromRole } = require('../../utils/roles');
const { cleanText } = require('../../utils/http');

const getDashboardSummary = async (_req, res) => {
  const [[totalUsers], [totalMultimedia], [totalDeveloper]] = await Promise.all([
    pool.query('SELECT COUNT(*) AS count FROM users'),
    pool.query(
      "SELECT COUNT(*) AS count FROM users WHERE role IN ('multimedia_head','multimedia_member')"
    ),
    pool.query(
      "SELECT COUNT(*) AS count FROM users WHERE role IN ('developer_head','developer_member')"
    ),
  ]);

  res.json({
    ok: true,
    summary: {
      totalUsers: totalUsers[0].count,
      totalMultimedia: totalMultimedia[0].count,
      totalDeveloper: totalDeveloper[0].count,
    },
  });
};

const listUsers = async (_req, res) => {
  const [rows] = await pool.query(
    `
      SELECT u.id, u.username, u.email, u.name, u.contact_number, u.role, u.team, u.group_id, u.profile_picture, u.created_at,
             g.group_name
      FROM users u
      LEFT JOIN groups g ON g.id = u.group_id
      ORDER BY u.created_at DESC
    `
  );
  res.json({ ok: true, users: rows });
};

const createUser = async (req, res) => {
  const username = cleanText(req.body.username, 80);
  const password = String(req.body.password ?? '');
  const email = cleanText(req.body.email, 120);
  const name = cleanText(req.body.name, 120);
  const role = cleanText(req.body.role, 40);
  const contactNumber = cleanText(req.body.contact_number, 30) || null;
  const groupId = req.body.group_id ? Number(req.body.group_id) : null;

  if (!username || !password || !email || !name || !role) {
    return res.status(400).json({ ok: false, error: 'username, password, email, name, role are required' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const team = req.body.team || getTeamFromRole(role);

  await pool.query(
    `
      INSERT INTO users (username, password_hash, email, name, contact_number, role, team, group_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [username, hash, email, name, contactNumber, role, team, groupId]
  );

  return res.status(201).json({ ok: true, message: 'User created' });
};

const updateUser = async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ ok: false, error: 'Invalid user id' });
  }

  const name = cleanText(req.body.name, 120);
  const email = cleanText(req.body.email, 120);
  const role = cleanText(req.body.role, 40);
  const team = req.body.team || getTeamFromRole(role);
  const contactNumber = cleanText(req.body.contact_number, 30) || null;
  const groupId = req.body.group_id ? Number(req.body.group_id) : null;
  const nextPassword = String(req.body.password || '');

  await pool.query(
    `
      UPDATE users
      SET name = ?, email = ?, role = ?, team = ?, contact_number = ?, group_id = ?
      WHERE id = ?
    `,
    [name, email, role, team, contactNumber, groupId, userId]
  );

  if (nextPassword) {
    const hash = bcrypt.hashSync(nextPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId]);
  }

  return res.json({ ok: true, message: 'User updated' });
};

const deleteUser = async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ ok: false, error: 'Invalid user id' });
  }

  if (req.session.user.id === userId) {
    return res.status(400).json({ ok: false, error: 'You cannot delete your own account' });
  }

  await pool.query('DELETE FROM users WHERE id = ?', [userId]);
  return res.json({ ok: true, message: 'User deleted' });
};

const teamOverview = async (_req, res) => {
  const [multimediaRows] = await pool.query(
    `
      SELECT u.id, u.username, u.name, u.email, u.role, g.group_name
      FROM users u
      LEFT JOIN groups g ON g.id = u.group_id
      WHERE u.role IN ('multimedia_head','multimedia_member')
      ORDER BY u.created_at DESC
    `
  );

  const [developerRows] = await pool.query(
    `
      SELECT id, username, name, email, role
      FROM users
      WHERE role IN ('developer_head','developer_member')
      ORDER BY created_at DESC
    `
  );

  res.json({
    ok: true,
    teams: {
      multimedia: multimediaRows,
      developer: developerRows,
    },
  });
};

const listGroups = async (_req, res) => {
  const [rows] = await pool.query('SELECT id, group_name FROM groups ORDER BY group_name ASC');
  res.json({ ok: true, groups: rows });
};

module.exports = {
  createUser,
  deleteUser,
  getDashboardSummary,
  listGroups,
  listUsers,
  teamOverview,
  updateUser,
};
