const express = require('express');
const router = express.Router();
const { checkIn, checkOut, getMyAttendanceStatus, getNetworkStatus, getAllAttendances } = require('../controllers/attendanceController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);
router.get('/me', protect, getMyAttendanceStatus);
router.get('/network-status', protect, getNetworkStatus);
router.get('/all', protect, admin, getAllAttendances);

module.exports = router;
