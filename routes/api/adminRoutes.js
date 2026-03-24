const express = require('express');
const { asyncHandler } = require('../../utils/http');
const { requireRoles } = require('../../middleware/auth');
const adminController = require('../../controllers/api/adminController');

const router = express.Router();

router.use(requireRoles(['superadmin', 'admin']));

router.get('/dashboard', asyncHandler(adminController.getDashboardSummary));
router.get('/groups', asyncHandler(adminController.listGroups));
router.get('/users', asyncHandler(adminController.listUsers));
router.post('/users', asyncHandler(adminController.createUser));
router.put('/users/:id', asyncHandler(adminController.updateUser));
router.delete('/users/:id', asyncHandler(adminController.deleteUser));
router.get('/teams', asyncHandler(adminController.teamOverview));

module.exports = router;
