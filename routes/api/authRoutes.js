const express = require('express');
const { asyncHandler } = require('../../utils/http');
const authController = require('../../controllers/api/authController');

const router = express.Router();

router.post('/login', asyncHandler(authController.login));
router.post('/logout', asyncHandler(authController.logout));
router.get('/me', asyncHandler(authController.me));

module.exports = router;

