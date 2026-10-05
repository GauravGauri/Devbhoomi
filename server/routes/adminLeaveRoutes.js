const express = require('express');
const router = express.Router();
const { getAllLeaves, updateLeaveStatus } = require('../controllers/leaveController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, admin, getAllLeaves);
router.put('/:id/status', protect, admin, updateLeaveStatus);

module.exports = router;
