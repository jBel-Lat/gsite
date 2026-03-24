const express = require('express');
const { asyncHandler } = require('../../utils/http');
const { requireTeamAccess } = require('../../middleware/teamAccess');
const { makeUploader } = require('../../middleware/upload');
const teamController = require('../../controllers/api/teamController');

const router = express.Router();
const postUpload = makeUploader('uploads/posts');
const repositoryUpload = makeUploader('uploads/files');

router.use(requireTeamAccess('multimedia'));

router.get('/dashboard', asyncHandler(teamController.getDashboard('multimedia')));

router.get('/announcements', asyncHandler(teamController.listAnnouncements('multimedia')));
router.post('/announcements', asyncHandler(teamController.createAnnouncement('multimedia')));
router.put('/announcements/:id', asyncHandler(teamController.updateAnnouncement('multimedia')));
router.delete('/announcements/:id', asyncHandler(teamController.deleteAnnouncement('multimedia')));
router.post('/announcements/:id/comments', asyncHandler(teamController.addAnnouncementComment('multimedia')));
router.put(
  '/announcement-comments/:commentId',
  asyncHandler(teamController.updateAnnouncementComment('multimedia'))
);
router.delete(
  '/announcement-comments/:commentId',
  asyncHandler(teamController.deleteAnnouncementComment('multimedia'))
);

router.get('/members', asyncHandler(teamController.listMembers('multimedia')));
router.post('/members', asyncHandler(teamController.createMember('multimedia')));
router.put('/members/:id', asyncHandler(teamController.updateMember('multimedia')));
router.delete('/members/:id', asyncHandler(teamController.deleteMember('multimedia')));

router.get('/gsite-posts', asyncHandler(teamController.listGsitePosts('multimedia')));
router.post('/gsite-posts', postUpload.single('image'), asyncHandler(teamController.createGsitePost('multimedia')));
router.put(
  '/gsite-posts/:id',
  postUpload.single('image'),
  asyncHandler(teamController.updateGsitePost('multimedia'))
);
router.delete('/gsite-posts/:id', asyncHandler(teamController.deleteGsitePost('multimedia')));

router.get('/repositories', asyncHandler(teamController.listRepositories));
router.post('/repositories', asyncHandler(teamController.createRepository));
router.delete('/repositories/:id', asyncHandler(teamController.deleteRepository));
router.post(
  '/repositories/uploads',
  repositoryUpload.single('file'),
  asyncHandler(teamController.uploadRepositoryFile)
);
router.put('/uploads/:uploadId/status', asyncHandler(teamController.updateUploadStatus));

module.exports = router;

