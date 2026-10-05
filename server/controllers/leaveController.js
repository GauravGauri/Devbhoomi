const Leave = require('../models/Leave');
const logAudit = require('../utils/auditLogger');

// @desc    Request leave
// @route   POST /api/leaves
// @access  Private/Employee
const createLeaveRequest = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, startTime, endTime, reason } = req.body;

    const leave = await Leave.create({
      employee: req.user._id,
      leaveType, startDate, endDate, startTime, endTime, reason,
    });

    res.status(201).json({ success: true, message: 'Leave request submitted successfully', data: leave });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my leaves
// @route   GET /api/leaves/me
// @access  Private/Employee
const getMyLeaves = async (req, res, next) => {
  try {
    const leaves = await Leave.find({ employee: req.user._id }).sort('-createdAt');
    res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all leaves (Admin)
// @route   GET /api/admin/leaves
// @access  Private/Admin
const getAllLeaves = async (req, res, next) => {
  try {
    const leaves = await Leave.find().populate('employee', 'name employeeId department').sort('-createdAt');
    res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/Reject leave
// @route   PUT /api/admin/leaves/:id/status
// @access  Private/Admin
const updateLeaveStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const leave = await Leave.findById(req.params.id);

    if (leave) {
      const oldStatus = leave.status;
      leave.status = status;
      leave.approvedBy = req.user._id;
      leave.approvedAt = new Date();
      await leave.save();

      await logAudit({
        user: req.user._id,
        action: 'UPDATE_LEAVE_STATUS',
        targetType: 'Leave',
        targetId: leave._id,
        oldValue: { status: oldStatus },
        newValue: { status },
        ipAddress: req.ip,
        reason: remarks,
      });

      res.status(200).json({ success: true, message: `Leave ${status.toLowerCase()}`, data: leave });
    } else {
      res.status(404);
      throw new Error('Leave request not found');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { createLeaveRequest, getMyLeaves, getAllLeaves, updateLeaveStatus };
