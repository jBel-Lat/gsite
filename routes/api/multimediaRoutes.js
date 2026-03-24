const express = require('express');
const { asyncHandler } = require('../../utils/http');
const { requireAuth } = require('../../middleware/authMiddleware');
const { requireAnyRole, requireRole } = require('../../middleware/roleMiddleware');
const {
  memberPhotoUpload,
  announcementImageUpload,
} = require('../../middleware/multimediaUpload');
const multimediaHeadController = require('../../controllers/api/multimediaHeadController');

const router = express.Router();

const withUpload = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (error) => {
    if (!error) {
      return next();
    }

    const message = error.message || 'Upload failed';
    return res.status(400).json({ ok: false, error: message });
  });
};

router.use(requireAuth);
router.use(
  requireAnyRole([
    'superadmin',
    'admin',
    'multimedia_head',
    'photographer',
    'videographer',
    'graphic_designer',
    'documentator',
    'multimedia_member',
  ])
);
router.use((req, _res, next) => {
  const authHeader = req.headers?.authorization || '';
  console.log('[api/multimedia] request', {
    method: req.method,
    path: req.originalUrl || req.url,
    hasAuthHeader: Boolean(authHeader),
    authHeaderPreview: authHeader ? `${String(authHeader).slice(0, 32)}...` : null,
    userId: req.user?.id || null,
    role: req.user?.role || null,
  });
  next();
});

router.get('/dashboard/summary', asyncHandler(multimediaHeadController.getDashboardSummary));
router.get('/stream', multimediaHeadController.streamEvents);

router.get('/members', requireRole('multimedia_head'), asyncHandler(multimediaHeadController.listMembers));
router.get('/members/:id', requireRole('multimedia_head'), asyncHandler(multimediaHeadController.getMember));
router.post(
  '/members',
  requireRole('multimedia_head'),
  withUpload(memberPhotoUpload.single('photo')),
  asyncHandler(multimediaHeadController.createMember)
);
router.put(
  '/members/:id',
  requireRole('multimedia_head'),
  withUpload(memberPhotoUpload.single('photo')),
  asyncHandler(multimediaHeadController.updateMember)
);
router.put('/members/:id/reset-password', requireRole('multimedia_head'), asyncHandler(multimediaHeadController.resetMemberPassword));
router.delete('/members/:id', requireRole('multimedia_head'), asyncHandler(multimediaHeadController.deleteMember));

router.get('/files', asyncHandler(multimediaHeadController.listFiles));
router.get('/files/:id', asyncHandler(multimediaHeadController.getFile));
router.get('/files/:id/download', asyncHandler(multimediaHeadController.downloadFile));
router.get('/files/:id/view', asyncHandler(multimediaHeadController.viewFile));
router.post('/files', requireRole('multimedia_head'), asyncHandler(multimediaHeadController.createFile));
router.put('/files/:id', requireRole('multimedia_head'), asyncHandler(multimediaHeadController.updateFile));
router.put('/files/:id/status', asyncHandler(multimediaHeadController.changeFileStatus));
router.delete('/files/:id', requireRole('multimedia_head'), asyncHandler(multimediaHeadController.deleteFile));

router.get('/announcements', asyncHandler(multimediaHeadController.listAnnouncements));
router.get('/announcements/:id', asyncHandler(multimediaHeadController.getAnnouncement));
router.post(
  '/announcements',
  requireRole('multimedia_head'),
  withUpload(announcementImageUpload.single('image')),
  asyncHandler(multimediaHeadController.createAnnouncement)
);
router.put(
  '/announcements/:id',
  requireRole('multimedia_head'),
  withUpload(announcementImageUpload.single('image')),
  asyncHandler(multimediaHeadController.updateAnnouncement)
);
router.delete('/announcements/:id', requireRole('multimedia_head'), asyncHandler(multimediaHeadController.deleteAnnouncement));

router.get('/logs', requireRole('multimedia_head'), asyncHandler(multimediaHeadController.listActivityLogs));
router.delete('/logs', requireRole('multimedia_head'), asyncHandler(multimediaHeadController.clearActivityLogs));
router.get('/reports', requireRole('multimedia_head'), asyncHandler(multimediaHeadController.getReports));
router.get('/notifications', requireRole('multimedia_head'), asyncHandler(multimediaHeadController.listNotifications));

router.get('/profile', asyncHandler(multimediaHeadController.getProfile));
router.put(
  '/profile',
  withUpload(memberPhotoUpload.single('photo')),
  asyncHandler(multimediaHeadController.updateProfile)
);
router.put('/profile/password', asyncHandler(multimediaHeadController.changePassword));

module.exports = router;
