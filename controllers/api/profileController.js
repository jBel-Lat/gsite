const path = require('path');
const pool = require('../../config/db');
const { cleanText } = require('../../utils/http');

const getProfile = async (req, res) => {
  const [rows] = await pool.query(
    `
      SELECT u.id, u.username, u.name, u.email, u.contact_number, u.role, u.team, u.profile_picture, g.group_name
      FROM users u
      LEFT JOIN groups g ON g.id = u.group_id
      WHERE u.id = ?
      LIMIT 1
    `,
    [req.session.user.id]
  );

  if (!rows.length) {
    return res.status(404).json({ ok: false, error: 'Profile not found' });
  }

  return res.json({ ok: true, profile: rows[0] });
};

const updateProfile = async (req, res) => {
  const name = cleanText(req.body.name, 120);
  const email = cleanText(req.body.email, 120);
  const contactNumber = cleanText(req.body.contact_number, 30) || null;

  if (!name || !email) {
    return res.status(400).json({ ok: false, error: 'name and email are required' });
  }

  await pool.query(
    'UPDATE users SET name = ?, email = ?, contact_number = ? WHERE id = ?',
    [name, email, contactNumber, req.session.user.id]
  );

  req.session.user.name = name;
  return res.json({ ok: true, message: 'Profile updated' });
};

const updateProfilePicture = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'profile_picture file is required' });
  }

  const relativePath = path
    .join('uploads', 'profiles', req.file.filename)
    .replace(/\\/g, '/');

  await pool.query('UPDATE users SET profile_picture = ? WHERE id = ?', [
    relativePath,
    req.session.user.id,
  ]);

  req.session.user.profile_picture = relativePath;
  return res.json({ ok: true, message: 'Profile picture updated', profile_picture: relativePath });
};

module.exports = {
  getProfile,
  updateProfile,
  updateProfilePicture,
};

