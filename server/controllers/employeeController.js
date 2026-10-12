const User = require('../models/User');
require('../models/Department');
require('../models/Shift');
const logAudit = require('../utils/auditLogger');

// @desc    Get all employees
// @route   GET /api/admin/employees
// @access  Private/Admin
const getEmployees = async (req, res, next) => {
  try {
    const query = { role: 'employee' };
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [{ name: searchRegex }, { employeeId: searchRegex }, { email: searchRegex }, { username: searchRegex }];
    }
    if (req.query.department) {
      query.department = req.query.department;
    }
    if (req.query.status && req.query.status !== 'All') {
      query.status = req.query.status;
    }
    const employees = await User.find(query)
      .select('-password')
      .populate('department')
      .populate('shift')
      .sort('-createdAt');
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
      designation: designation || 'Staff Member',
      shift: shift || null,
      joiningDate: joiningDate || new Date(),
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
        data: { _id: user._id, name: user.name, email: user.email, employeeId: user.employeeId }
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update employee details
// @route   PUT /api/admin/employees/:id
// @access  Private/Admin
const updateEmployee = async (req, res, next) => {
  try {
    const { name, email, phone, department, designation, status, shift } = req.body;
    const employee = await User.findById(req.params.id);

    if (!employee) {
      res.status(404);
      throw new Error('Employee not found');
    }

    if (name) employee.name = name;
    if (email) employee.email = email;
    if (phone !== undefined) employee.phone = phone;
    if (department !== undefined) employee.department = department || null;
    if (designation !== undefined) employee.designation = designation;
    if (status) employee.status = status;
    if (shift !== undefined) employee.shift = shift || null;

    await employee.save();

    res.status(200).json({ success: true, message: 'Employee updated successfully', data: employee });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete employee
// @route   DELETE /api/admin/employees/:id
// @access  Private/Admin
const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      res.status(404);
      throw new Error('Employee not found');
    }

    await User.findByIdAndDelete(req.params.id);

    await logAudit({
      user: req.user._id,
      action: 'DELETE_EMPLOYEE',
      targetType: 'User',
      targetId: employee._id,
      oldValue: { name: employee.name, employeeId: employee.employeeId },
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset employee password
// @route   POST /api/admin/employees/:id/reset-password
// @access  Private/Admin
const resetEmployeePassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters');
    }

    const employee = await User.findById(req.params.id);
    if (!employee) {
      res.status(404);
      throw new Error('Employee not found');
    }

    employee.password = password;
    await employee.save();

    res.status(200).json({ success: true, message: 'Employee password reset successfully' });
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

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  resetEmployeePassword,
  updateEmployeeStatus
};
