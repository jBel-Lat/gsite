const express = require('express');
const { asyncHandler } = require('../../utils/http');
const { requireTeamAccess } = require('../../middleware/teamAccess');
const { makeUploader } = require('../../middleware/upload');
const teamController = require('../../controllers/api/teamController');

const router = express.Router();
const postUpload = makeUploader('uploads/posts');
const eventUpload = makeUploader('uploads/events');
const projectUpload = makeUploader('uploads/projects');

router.use(requireTeamAccess('developer'));

router.get('/dashboard', asyncHandler(teamController.getDashboard('developer')));

router.get('/announcements', asyncHandler(teamController.listAnnouncements('developer')));
router.post('/announcements', asyncHandler(teamController.createAnnouncement('developer')));
router.put('/announcements/:id', asyncHandler(teamController.updateAnnouncement('developer')));
router.delete('/announcements/:id', asyncHandler(teamController.deleteAnnouncement('developer')));
router.post('/announcements/:id/comments', asyncHandler(teamController.addAnnouncementComment('developer')));
router.put(
  '/announcement-comments/:commentId',
  asyncHandler(teamController.updateAnnouncementComment('developer'))
);
router.delete(
  '/announcement-comments/:commentId',
  asyncHandler(teamController.deleteAnnouncementComment('developer'))
);

router.get('/members', asyncHandler(teamController.listMembers('developer')));
router.post('/members', asyncHandler(teamController.createMember('developer')));
router.put('/members/:id', asyncHandler(teamController.updateMember('developer')));
router.delete('/members/:id', asyncHandler(teamController.deleteMember('developer')));

router.get('/gsite-posts', asyncHandler(teamController.listGsitePosts('developer')));
router.post('/gsite-posts', postUpload.single('image'), asyncHandler(teamController.createGsitePost('developer')));
router.put('/gsite-posts/:id', postUpload.single('image'), asyncHandler(teamController.updateGsitePost('developer')));
router.delete('/gsite-posts/:id', asyncHandler(teamController.deleteGsitePost('developer')));

router.get('/events', asyncHandler(teamController.listEvents));
router.post('/events', eventUpload.single('image'), asyncHandler(teamController.createEvent));
router.put('/events/:id', eventUpload.single('image'), asyncHandler(teamController.updateEvent));
router.delete('/events/:id', asyncHandler(teamController.deleteEvent));
router.get('/events/:id/registrations', asyncHandler(teamController.listEventRegistrations));
router.delete(
  '/event-registrations/:registrationId',
  asyncHandler(teamController.deleteEventRegistration)
);

router.get('/projects', asyncHandler(teamController.listProjects));
router.post('/projects/upload', projectUpload.single('file'), asyncHandler(teamController.uploadProjectFile));
router.put('/projects/files/:id', asyncHandler(teamController.updateProjectFile));
router.delete('/projects/files/:id', asyncHandler(teamController.deleteProjectFile));
router.post('/projects/files/:id/comments', asyncHandler(teamController.addProjectComment));

router.post('/editor/query', asyncHandler(teamController.runEditorQuery));

module.exports = router;

