const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const User = require('../models/User');
const moment = require('moment');

// @desc    Get Attendance Report data
// @route   GET /api/admin/reports/attendance
// @access  Private/Admin
const getAttendanceReport = async (req, res, next) => {
  try {
    const { month, startDate, endDate } = req.query;
    const query = {};

    if (month) {
      query.date = { $regex: `^${month}` };
    } else if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const records = await Attendance.find(query)
      .populate({
        path: 'employee',
        select: 'name employeeId department email designation',
        populate: { path: 'department', select: 'name' }
      })
      .sort('-date');

    const formatted = records.map(r => ({
      _id: r._id,
      employeeName: r.employee?.name || 'N/A',
      employeeId: r.employee?.employeeId || 'N/A',
      department: r.employee?.department?.name || 'General',
      designation: r.employee?.designation || 'Staff',
      date: r.date,
      checkIn: r.checkIn ? moment(r.checkIn).format('hh:mm A') : '-',
      checkOut: r.checkOut ? moment(r.checkOut).format('hh:mm A') : '-',
      workingHours: r.workingHours ? `${Math.floor(r.workingHours / 60)}h ${r.workingHours % 60}m` : '0h 0m',
      status: r.late ? 'Late' : r.attendanceType,
      lateMinutes: r.lateMinutes || 0,
      remarks: r.remarks || '',
    }));

    res.status(200).json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Leave Report data
// @route   GET /api/admin/reports/leaves
// @access  Private/Admin
const getLeaveReport = async (req, res, next) => {
  try {
    const { year, status, leaveType } = req.query;
    const query = {};

    if (year) {
      query.startDate = { $regex: `^${year}` };
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (leaveType && leaveType !== 'All') {
      query.leaveType = leaveType;
    }

    const records = await Leave.find(query)
      .populate({
        path: 'employee',
        select: 'name employeeId department designation email',
        populate: { path: 'department', select: 'name' }
      })
      .sort('-createdAt');

    const formatted = records.map(l => ({
      _id: l._id,
      employeeName: l.employee?.name || 'N/A',
      employeeId: l.employee?.employeeId || 'N/A',
      department: l.employee?.department?.name || 'General',
      leaveType: l.leaveType,
      startDate: l.startDate,
      endDate: l.endDate,
      durationDays: moment(l.endDate).diff(moment(l.startDate), 'days') + 1,
      reason: l.reason,
      status: l.status,
      appliedAt: moment(l.createdAt).format('YYYY-MM-DD'),
    }));

    res.status(200).json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Late Arrivals Report data
// @route   GET /api/admin/reports/late
// @access  Private/Admin
const getLateReport = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = moment().subtract(days, 'days').format('YYYY-MM-DD');

    const records = await Attendance.find({
      late: true,
      date: { $gte: startDate }
    })
      .populate({
        path: 'employee',
        select: 'name employeeId department designation',
        populate: { path: 'department', select: 'name' }
      })
      .sort('-date');

    const formatted = records.map(r => ({
      _id: r._id,
      employeeName: r.employee?.name || 'N/A',
      employeeId: r.employee?.employeeId || 'N/A',
      department: r.employee?.department?.name || 'General',
      date: r.date,
      checkIn: r.checkIn ? moment(r.checkIn).format('hh:mm A') : '-',
      lateMinutes: r.lateMinutes || 0,
      remarks: r.remarks || 'Late check-in',
    }));

    res.status(200).json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAttendanceReport,
  getLeaveReport,
  getLateReport,
};
