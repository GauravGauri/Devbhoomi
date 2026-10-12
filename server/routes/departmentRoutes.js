const express = require('express');
const router = express.Router();
const {
  getDepartments,
  createDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, admin, getDepartments)
  .post(protect, admin, createDepartment);

router.delete('/:id', protect, admin, deleteDepartment);

module.exports = router;
