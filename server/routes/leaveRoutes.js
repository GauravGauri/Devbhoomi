const express = require('express');
const router = express.Router();
const { createLeaveRequest, getMyLeaves, cancelMyLeave } = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createLeaveRequest);

router.get('/me', protect, getMyLeaves);
router.delete('/:id', protect, cancelMyLeave);

module.exports = router;
