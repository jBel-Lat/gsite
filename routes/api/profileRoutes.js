const express = require('express');
const { asyncHandler } = require('../../utils/http');
const { requireAuth } = require('../../middleware/auth');
const { makeUploader } = require('../../middleware/upload');
const profileController = require('../../controllers/api/profileController');

const router = express.Router();
const profileUpload = makeUploader('uploads/profiles');

router.use(requireAuth);

router.get('/me', asyncHandler(profileController.getProfile));
router.put('/me', asyncHandler(profileController.updateProfile));
router.post(
  '/picture',
  profileUpload.single('profile_picture'),
  asyncHandler(profileController.updateProfilePicture)
);

module.exports = router;

