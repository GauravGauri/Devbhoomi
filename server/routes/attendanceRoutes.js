const express = require('express');
const router = express.Router();
const { checkIn, checkOut, getMyAttendanceStatus, getNetworkStatus } = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);
router.get('/me', protect, getMyAttendanceStatus);
router.get('/network-status', protect, getNetworkStatus);

module.exports = router;
