const express = require('express');
const router = express.Router();
const { createLeaveRequest, getMyLeaves } = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createLeaveRequest);

router.get('/me', protect, getMyLeaves);

module.exports = router;
