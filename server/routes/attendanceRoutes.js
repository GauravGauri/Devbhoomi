const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getMyAttendanceStatus,
  getMyAttendanceHistory,
  getNetworkStatus,
  getAllAttendances,
  manualAttendance,
  deleteAttendance
} = require('../controllers/attendanceController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);
router.get('/me', protect, getMyAttendanceStatus);
router.get('/my-history', protect, getMyAttendanceHistory);
router.get('/network-status', protect, getNetworkStatus);
router.get('/all', protect, admin, getAllAttendances);
router.post('/manual', protect, admin, manualAttendance);
router.delete('/:id', protect, admin, deleteAttendance);

module.exports = router;
