const express = require('express');
const { asyncHandler } = require('../../utils/http');
const studentController = require('../../controllers/api/studentController');

const router = express.Router();

router.get('/dashboard-data', asyncHandler(studentController.dashboardData));
router.post('/comments', asyncHandler(studentController.postComment));
router.post('/register-event', asyncHandler(studentController.registerEvent));

module.exports = router;

