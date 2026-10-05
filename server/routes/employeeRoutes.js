const express = require('express');
const router = express.Router();
const { getEmployees, getEmployeeById, createEmployee, updateEmployeeStatus } = require('../controllers/employeeController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, admin, getEmployees)
  .post(protect, admin, createEmployee);

router.route('/:id')
  .get(protect, admin, getEmployeeById);

router.patch('/:id/status', protect, admin, updateEmployeeStatus);

module.exports = router;
