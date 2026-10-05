const User = require('../models/User');
const logAudit = require('../utils/auditLogger');

// @desc    Get all employees
// @route   GET /api/admin/employees
// @access  Private/Admin
const getEmployees = async (req, res, next) => {
  try {
    const employees = await User.find({ role: 'employee' })
      .select('-password')
      .populate('department')
      .populate('shift');
    res.status(200).json({ success: true, data: employees });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single employee
// @route   GET /api/admin/employees/:id
// @access  Private/Admin
const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id)
      .select('-password')
      .populate('department')
      .populate('shift')
      .populate('manager', 'name employeeId');

    if (employee) {
      res.status(200).json({ success: true, data: employee });
    } else {
      res.status(404);
      throw new Error('Employee not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create new employee
// @route   POST /api/admin/employees
// @access  Private/Admin
const createEmployee = async (req, res, next) => {
  try {
    const { employeeId, name, username, email, phone, password, department, designation, shift, joiningDate } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { username }, { employeeId }] });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists (check email, username, or employee ID)');
    }

    const user = await User.create({
      employeeId, name, username, email, phone, password, role: 'employee',
      department: department || null,
      designation,
      shift: shift || null,
      joiningDate,
      status: 'Active',
    });

    if (user) {
      await logAudit({
        user: req.user._id,
        action: 'CREATE_EMPLOYEE',
        targetType: 'User',
        targetId: user._id,
        newValue: { username: user.username, email: user.email },
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: { _id: user._id, name: user.name, email: user.email }
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update employee status
// @route   PATCH /api/admin/employees/:id/status
// @access  Private/Admin
const updateEmployeeStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    const employee = await User.findById(req.params.id);

    if (employee) {
      const oldStatus = employee.status;
      employee.status = status;
      await employee.save();

      await logAudit({
        user: req.user._id,
        action: 'UPDATE_EMPLOYEE_STATUS',
        targetType: 'User',
        targetId: employee._id,
        oldValue: { status: oldStatus },
        newValue: { status },
        ipAddress: req.ip,
        reason,
      });

      res.status(200).json({ success: true, message: 'Status updated' });
    } else {
      res.status(404);
      throw new Error('Employee not found');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { getEmployees, getEmployeeById, createEmployee, updateEmployeeStatus };
