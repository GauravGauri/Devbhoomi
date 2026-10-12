const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  resetEmployeePassword,
  updateEmployeeStatus
} = require('../controllers/employeeController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, admin, getEmployees)
  .post(protect, admin, createEmployee);

router.route('/:id')
  .get(protect, admin, getEmployeeById)
  .put(protect, admin, updateEmployee)
  .delete(protect, admin, deleteEmployee);

router.patch('/:id/status', protect, admin, updateEmployeeStatus);
router.post('/:id/reset-password', protect, admin, resetEmployeePassword);

module.exports = router;
