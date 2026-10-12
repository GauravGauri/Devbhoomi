const express = require('express');
const router = express.Router();
const {
  getAttendanceReport,
  getLeaveReport,
  getLateReport,
} = require('../controllers/reportController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/attendance', protect, admin, getAttendanceReport);
router.get('/leaves', protect, admin, getLeaveReport);
router.get('/late', protect, admin, getLateReport);

module.exports = router;
