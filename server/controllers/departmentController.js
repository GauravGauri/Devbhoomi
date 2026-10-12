const Department = require('../models/Department');
const User = require('../models/User');

// @desc    Get all departments
// @route   GET /api/admin/departments
// @access  Private/Admin
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().sort('name');
    const departmentsWithCounts = await Promise.all(
      departments.map(async (d) => {
        const employeeCount = await User.countDocuments({ department: d._id, role: 'employee' });
        return {
          _id: d._id,
          name: d.name,
          description: d.description,
          status: d.status,
          employeeCount,
          createdAt: d.createdAt,
        };
      })
    );
    res.status(200).json({ success: true, data: departmentsWithCounts });
  } catch (error) {
    next(error);
  }
};

// @desc    Create department
// @route   POST /api/admin/departments
// @access  Private/Admin
const createDepartment = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      res.status(400);
      throw new Error('Department name is required');
    }

    const existing = await Department.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existing) {
      res.status(400);
      throw new Error('Department already exists');
    }

    const department = await Department.create({
      name: name.trim(),
      description: description?.trim() || '',
      status: 'Active',
    });

    res.status(201).json({ success: true, message: 'Department created successfully', data: department });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete department
// @route   DELETE /api/admin/departments/:id
// @access  Private/Admin
const deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      res.status(404);
      throw new Error('Department not found');
    }

    // Set department to null for employees who were in this department
    await User.updateMany({ department: department._id }, { department: null });
    await Department.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  deleteDepartment,
};
