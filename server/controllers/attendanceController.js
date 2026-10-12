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
      res.status(200).json({ authorized: true, networkName: 'DevBhoomi Office Network', ip: req.ip, message: 'Connected to authorized network.' });
    } else {
      res.status(200).json({ authorized: false, networkName: 'External Network', ip: req.ip, message: 'Not connected to authorized network.' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get employee's attendance history
// @route   GET /api/attendance/my-history
// @access  Private/Employee
const getMyAttendanceHistory = async (req, res, next) => {
  try {
    const { month } = req.query; // YYYY-MM
    const query = { employee: req.user._id };

    if (month) {
      query.date = { $regex: `^${month}` };
    }

    const records = await Attendance.find(query).sort('-date');

    const totalPresent = records.filter(r => r.attendanceType === 'Present').length;
    const totalLate = records.filter(r => r.late).length;
    const totalMinutes = records.reduce((acc, curr) => acc + (curr.workingHours || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    res.status(200).json({
      success: true,
      data: records,
      summary: {
        totalPresent,
        totalLate,
        totalMinutes,
        totalHours
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all attendances (Admin) with search & filters
// @route   GET /api/attendance/all
// @access  Private/Admin
const getAllAttendances = async (req, res, next) => {
  try {
    const { date, search, status } = req.query;
    const query = {};

    if (date) {
      query.date = date;
    }

    if (status && status !== 'All') {
      if (status === 'Late') {
        query.late = true;
      } else if (status === 'On Time') {
        query.late = false;
        query.attendanceType = 'Present';
      } else {
        query.attendanceType = status;
      }
    }

    let records = await Attendance.find(query)
      .populate('employee', 'name employeeId email department')
      .sort('-date -createdAt');

    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      records = records.filter(r => {
        const name = r.employee?.name?.toLowerCase() || '';
        const empId = r.employee?.employeeId?.toLowerCase() || '';
        return name.includes(term) || empId.includes(term);
      });
    }

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

// @desc    Manual attendance creation/adjustment by Admin
// @route   POST /api/attendance/manual
// @access  Private/Admin
const manualAttendance = async (req, res, next) => {
  try {
    const { employeeId, date, checkIn, checkOut, late, attendanceType, remarks } = req.body;

    if (!employeeId || !date) {
      res.status(400);
      throw new Error('Employee ID and date are required');
    }

    let record = await Attendance.findOne({ employee: employeeId, date });

    let workingHours = 0;
    if (checkIn && checkOut) {
      const diffMs = moment(checkOut).diff(moment(checkIn));
      workingHours = Math.max(0, Math.floor(moment.duration(diffMs).asMinutes()));
    }

    if (record) {
      if (checkIn !== undefined) record.checkIn = checkIn ? new Date(checkIn) : null;
      if (checkOut !== undefined) record.checkOut = checkOut ? new Date(checkOut) : null;
      if (late !== undefined) record.late = Boolean(late);
      if (attendanceType) record.attendanceType = attendanceType;
      if (remarks !== undefined) record.remarks = remarks;
      record.workingHours = workingHours;
      await record.save();
    } else {
      record = await Attendance.create({
        employee: employeeId,
        date,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        late: Boolean(late),
        attendanceType: attendanceType || 'Present',
        remarks: remarks || 'Manually recorded by Admin',
        workingHours,
        networkAuthorized: true,
      });
    }

    await logAudit({
      user: req.user._id,
      action: 'MANUAL_ATTENDANCE',
      targetType: 'Attendance',
      targetId: record._id,
      newValue: { employeeId, date, attendanceType },
      ipAddress: req.ip,
      reason: remarks,
    });

    const populated = await Attendance.findById(record._id).populate('employee', 'name employeeId');
    res.status(200).json({ success: true, message: 'Attendance recorded successfully', data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private/Admin
const deleteAttendance = async (req, res, next) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) {
      res.status(404);
      throw new Error('Attendance record not found');
    }

    await Attendance.findByIdAndDelete(req.params.id);

    await logAudit({
      user: req.user._id,
      action: 'DELETE_ATTENDANCE',
      targetType: 'Attendance',
      targetId: record._id,
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, message: 'Attendance record deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getMyAttendanceStatus,
  getMyAttendanceHistory,
  getNetworkStatus,
  getAllAttendances,
  manualAttendance,
  deleteAttendance,
};
