const express = require('express');
const { asyncHandler } = require('../../utils/http');
const { requireAuth } = require('../../middleware/auth');
const { requireMultimediaAccess, requireMultimediaHead } = require('../../middleware/multimediaAccess');
const {
  memberPhotoUpload,
  multimediaFileUpload,
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
router.use(requireMultimediaAccess);

router.get('/dashboard/summary', requireMultimediaHead, asyncHandler(multimediaHeadController.getDashboardSummary));

router.get('/members', requireMultimediaHead, asyncHandler(multimediaHeadController.listMembers));
router.get('/members/:id', requireMultimediaHead, asyncHandler(multimediaHeadController.getMember));
router.post(
  '/members',
  requireMultimediaHead,
  withUpload(memberPhotoUpload.single('photo')),
  asyncHandler(multimediaHeadController.createMember)
);
router.put(
  '/members/:id',
  requireMultimediaHead,
  withUpload(memberPhotoUpload.single('photo')),
  asyncHandler(multimediaHeadController.updateMember)
);
router.put('/members/:id/reset-password', requireMultimediaHead, asyncHandler(multimediaHeadController.resetMemberPassword));
router.delete('/members/:id', requireMultimediaHead, asyncHandler(multimediaHeadController.deleteMember));

router.get('/files', asyncHandler(multimediaHeadController.listFiles));
router.get('/files/:id', asyncHandler(multimediaHeadController.getFile));
router.get('/files/:id/download', asyncHandler(multimediaHeadController.downloadFile));
router.get('/files/:id/view', asyncHandler(multimediaHeadController.viewFile));
router.post(
  '/files',
  requireMultimediaHead,
  withUpload(multimediaFileUpload.single('file')),
  asyncHandler(multimediaHeadController.createFile)
);
router.put(
  '/files/:id',
  requireMultimediaHead,
  withUpload(multimediaFileUpload.single('file')),
  asyncHandler(multimediaHeadController.updateFile)
);
router.put('/files/:id/status', asyncHandler(multimediaHeadController.changeFileStatus));
router.delete('/files/:id', requireMultimediaHead, asyncHandler(multimediaHeadController.deleteFile));

router.get('/announcements', asyncHandler(multimediaHeadController.listAnnouncements));
router.get('/announcements/:id', asyncHandler(multimediaHeadController.getAnnouncement));
router.post(
  '/announcements',
  requireMultimediaHead,
  withUpload(announcementImageUpload.single('image')),
  asyncHandler(multimediaHeadController.createAnnouncement)
);
router.put(
  '/announcements/:id',
  requireMultimediaHead,
  withUpload(announcementImageUpload.single('image')),
  asyncHandler(multimediaHeadController.updateAnnouncement)
);
router.delete('/announcements/:id', requireMultimediaHead, asyncHandler(multimediaHeadController.deleteAnnouncement));

router.get('/logs', requireMultimediaHead, asyncHandler(multimediaHeadController.listActivityLogs));
router.get('/reports', requireMultimediaHead, asyncHandler(multimediaHeadController.getReports));
router.get('/notifications', requireMultimediaHead, asyncHandler(multimediaHeadController.listNotifications));

router.get('/profile', requireMultimediaHead, asyncHandler(multimediaHeadController.getProfile));
router.put(
  '/profile',
  requireMultimediaHead,
  withUpload(memberPhotoUpload.single('photo')),
  asyncHandler(multimediaHeadController.updateProfile)
);
router.put('/profile/password', requireMultimediaHead, asyncHandler(multimediaHeadController.changePassword));

module.exports = router;
