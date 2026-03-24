const express = require('express');
const pool = require('../../config/db');
const { asyncHandler } = require('../../utils/http');
const authRoutes = require('./authRoutes');
const studentRoutes = require('./studentRoutes');
const adminRoutes = require('./adminRoutes');
const developerRoutes = require('./developerRoutes');
const multimediaRoutes = require('./multimediaRoutes');
const profileRoutes = require('./profileRoutes');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'node-api', message: 'Server is running' });
});

router.get(
  '/db-test',
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.query('SELECT NOW() AS server_time');
    res.json({ ok: true, db: rows[0] || null });
  })
);

router.use('/auth', authRoutes);
router.use('/student', studentRoutes);
router.use('/admin', adminRoutes);
router.use('/developer', developerRoutes);
router.use('/multimedia', multimediaRoutes);
router.use('/profile', profileRoutes);

module.exports = router;

