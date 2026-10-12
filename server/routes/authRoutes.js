const express = require('express');
const router = express.Router();
const {
  loginUser,
  loginAdmin,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  changePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.post('/admin/login', loginAdmin);
router.post('/logout', logoutUser);
router.get('/me', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
