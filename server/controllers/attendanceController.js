const Attendance = require('../models/Attendance');
const AttendanceSettings = require('../models/AttendanceSettings');
const logAudit = require('../utils/auditLogger');
const moment = require('moment');

// Helper to check network authorization
const checkNetworkAuth = async (reqIP) => {
  const settings = await AttendanceSettings.findOne();
  if (!settings || !settings.networkRestrictionEnabled) return true;
  return settings.allowedIPs.includes(reqIP) || reqIP === process.env.OFFICE_PUBLIC_IP;
};

// @desc    Mark Check-in
// @route   POST /api/attendance/check-in
// @access  Private/Employee
const checkIn = async (req, res, next) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    const currentTime = new Date();
    const isAuthorized = await checkNetworkAuth(req.ip);

    if (!isAuthorized) {
      res.status(403);
      throw new Error('You are not connected to the authorized DevBhoomi office network. Attendance marking is currently unavailable.');
    }

    const existingRecord = await Attendance.findOne({ employee: req.user._id, date: today });
    if (existingRecord) {
      res.status(400);
      throw new Error("You have already marked today's attendance.");
    }

    const settings = await AttendanceSettings.findOne();
    const officeStartTime = moment(settings?.officeStartTime || '09:30', 'HH:mm');
    const gracePeriod = settings?.gracePeriod || 15;
    
    const lateThreshold = officeStartTime.clone().add(gracePeriod, 'minutes');
    const isLate = moment(currentTime).isAfter(lateThreshold);
    const lateMinutes = isLate ? moment(currentTime).diff(officeStartTime, 'minutes') : 0;

    const attendance = await Attendance.create({
      employee: req.user._id,
      date: today,
      checkIn: currentTime,
      attendanceType: 'Present',
      late: isLate,
      lateMinutes,
      ipAddress: req.ip,
      networkAuthorized: true,
    });

    res.status(200).json({ success: true, message: 'Checked in successfully', data: attendance });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark Check-out
// @route   POST /api/attendance/check-out
// @access  Private/Employee
const checkOut = async (req, res, next) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    const currentTime = new Date();
    const isAuthorized = await checkNetworkAuth(req.ip);

    if (!isAuthorized) {
      res.status(403);
      throw new Error('You are not connected to the authorized office network.');
    }

    const record = await Attendance.findOne({ employee: req.user._id, date: today });
    
    if (!record) {
      res.status(400);
      throw new Error('No check-in record found for today.');
    }
    if (record.checkOut) {
      res.status(400);
      throw new Error('You have already checked out today.');
    }

    const workingHoursMs = moment(currentTime).diff(moment(record.checkIn));
    const workingHoursMinutes = Math.floor(moment.duration(workingHoursMs).asMinutes());

    record.checkOut = currentTime;
    record.workingHours = workingHoursMinutes;
    await record.save();

    res.status(200).json({ success: true, message: 'Checked out successfully', data: record });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my current day attendance status
// @route   GET /api/attendance/me
// @access  Private/Employee
const getMyAttendanceStatus = async (req, res, next) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    const record = await Attendance.findOne({ employee: req.user._id, date: today });
    res.status(200).json({ success: true, data: record || null });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Network Status
// @route   GET /api/attendance/network-status
// @access  Private/Employee
const getNetworkStatus = async (req, res, next) => {
  try {
    const isAuthorized = await checkNetworkAuth(req.ip);
    if (isAuthorized) {
      res.status(200).json({ authorized: true, networkName: 'DevBhoomi Office', message: 'Connected to authorized network.' });
    } else {
      res.status(200).json({ authorized: false, networkName: 'Unknown', message: 'Not connected to authorized network.' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all attendances (Admin)
// @route   GET /api/attendance/all
// @access  Private/Admin
const getAllAttendances = async (req, res, next) => {
  try {
    const records = await Attendance.find().populate('employee', 'name employeeId').sort('-date -createdAt');
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

module.exports = { checkIn, checkOut, getMyAttendanceStatus, getNetworkStatus, getAllAttendances };
