const Attendance = require('../models/Attendance');
const AttendanceSettings = require('../models/AttendanceSettings');
const { checkNetworkAuth } = require('../utils/networkAuth');
const logAudit = require('../utils/auditLogger');
const moment = require('moment');

// @desc    Mark Check-in
// @route   POST /api/attendance/check-in
// @access  Private/Employee
const checkIn = async (req, res, next) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    const currentTime = new Date();
    const netAuth = await checkNetworkAuth(req);

    if (!netAuth.authorized) {
      res.status(403);
      throw new Error(netAuth.message || 'You are not connected to an authorized office Wi-Fi network or IP address.');
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
      ipAddress: netAuth.clientIP || req.ip,
      networkAuthorized: true,
      breaks: [],
      isOnBreak: false,
      totalBreakMinutes: 0,
    });

    res.status(200).json({ success: true, message: 'Checked in successfully', data: attendance });
  } catch (error) {
    next(error);
  }
};

// @desc    Start Lunch / General Break
// @route   POST /api/attendance/break/start
// @access  Private/Employee
const startBreak = async (req, res, next) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    const currentTime = new Date();
    const netAuth = await checkNetworkAuth(req);

    if (!netAuth.authorized) {
      res.status(403);
      throw new Error(netAuth.message || 'Network authorization required to log break.');
    }

    const record = await Attendance.findOne({ employee: req.user._id, date: today });
    if (!record) {
      res.status(400);
      throw new Error('Please check in first before taking a break.');
    }
    if (record.checkOut) {
      res.status(400);
      throw new Error('You have already checked out for today.');
    }
    if (record.isOnBreak) {
      res.status(400);
      throw new Error('You are already on a break.');
    }

    const breakType = req.body.breakType || 'Lunch Break';

    record.isOnBreak = true;
    record.currentBreakStart = currentTime;
    record.breaks.push({
      breakType,
      startTime: currentTime,
      remarks: req.body.remarks || '',
    });

    await record.save();

    res.status(200).json({
      success: true,
      message: `${breakType} started. Work hours are paused and will be deducted until break is ended.`,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    End Break / Resume Work
// @route   POST /api/attendance/break/end
// @access  Private/Employee
const endBreak = async (req, res, next) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    const currentTime = new Date();
    const netAuth = await checkNetworkAuth(req);

    if (!netAuth.authorized) {
      res.status(403);
      throw new Error(netAuth.message || 'Network authorization required to resume from break.');
    }

    const record = await Attendance.findOne({ employee: req.user._id, date: today });
    if (!record) {
      res.status(400);
      throw new Error('No attendance record found for today.');
    }
    if (!record.isOnBreak) {
      res.status(400);
      throw new Error('You are not currently on a break.');
    }

    // Find the currently active break
    const activeBreak = record.breaks.slice().reverse().find((b) => !b.endTime);
    const breakStartTime = activeBreak?.startTime || record.currentBreakStart || currentTime;
    const durationMinutes = Math.max(0, Math.floor(moment(currentTime).diff(moment(breakStartTime), 'minutes')));

    if (activeBreak) {
      activeBreak.endTime = currentTime;
      activeBreak.duration = durationMinutes;
    }

    // Tally all completed break durations
    const totalBreakMinutes = record.breaks.reduce((acc, curr) => acc + (curr.duration || 0), 0);

    record.isOnBreak = false;
    record.currentBreakStart = null;
    record.totalBreakMinutes = totalBreakMinutes;

    // Recalculate net working hours up to now (elapsed minus break time)
    const grossMinutes = Math.max(0, Math.floor(moment(currentTime).diff(moment(record.checkIn), 'minutes')));
    record.workingHours = Math.max(0, grossMinutes - totalBreakMinutes);

    await record.save();

    res.status(200).json({
      success: true,
      message: `Break ended successfully (${durationMinutes} mins deducted). Resumed duty!`,
      data: record,
    });
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
    const netAuth = await checkNetworkAuth(req);

    if (!netAuth.authorized) {
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

    // If employee was still on break, automatically close the open break at checkout
    if (record.isOnBreak) {
      const activeBreak = record.breaks.slice().reverse().find((b) => !b.endTime);
      const breakStartTime = activeBreak?.startTime || record.currentBreakStart || currentTime;
      const durationMinutes = Math.max(0, Math.floor(moment(currentTime).diff(moment(breakStartTime), 'minutes')));

      if (activeBreak) {
        activeBreak.endTime = currentTime;
        activeBreak.duration = durationMinutes;
      }
      record.isOnBreak = false;
      record.currentBreakStart = null;
    }

    // Recalculate total completed break minutes
    const totalBreakMinutes = record.breaks.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    record.totalBreakMinutes = totalBreakMinutes;

    // Net working hours = Total Shift Duration MINUS Total Break Minutes
    const grossShiftMinutes = Math.max(0, Math.floor(moment(currentTime).diff(moment(record.checkIn), 'minutes')));
    const netWorkingHours = Math.max(0, grossShiftMinutes - totalBreakMinutes);

    record.checkOut = currentTime;
    record.workingHours = netWorkingHours;
    await record.save();

    res.status(200).json({ success: true, message: 'Checked out successfully. Shift completed.', data: record });
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

// @desc    Get Network Status (checks Wi-Fi Name and IP address)
// @route   GET /api/attendance/network-status
// @access  Public or Private
const getNetworkStatus = async (req, res, next) => {
  try {
    const authResult = await checkNetworkAuth(req);
    res.status(200).json({
      authorized: authResult.authorized,
      restrictionEnabled: authResult.restrictionEnabled,
      matchedBy: authResult.matchedBy,
      ipMatches: authResult.ipMatches,
      wifiMatches: authResult.wifiMatches,
      clientIP: authResult.clientIP,
      clientWifiName: authResult.clientWifiName,
      allowedIPs: authResult.allowedIPs,
      allowedWifiNames: authResult.allowedWifiNames,
      networkName: authResult.authorized
        ? (authResult.clientWifiName || 'DevBhoomi Office Network')
        : 'External / Unauthorized Network',
      message: authResult.message,
    });
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
    const totalBreakMinutes = records.reduce((acc, curr) => acc + (curr.totalBreakMinutes || 0), 0);
    const totalBreakHours = (totalBreakMinutes / 60).toFixed(1);

    res.status(200).json({
      success: true,
      data: records,
      summary: {
        totalPresent,
        totalLate,
        totalMinutes,
        totalHours,
        totalBreakMinutes,
        totalBreakHours,
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
    const { employeeId, date, checkIn, checkOut, late, attendanceType, remarks, totalBreakMinutes } = req.body;

    if (!employeeId || !date) {
      res.status(400);
      throw new Error('Employee ID and date are required');
    }

    let record = await Attendance.findOne({ employee: employeeId, date });

    const breakMins = totalBreakMinutes !== undefined ? Math.max(0, parseInt(totalBreakMinutes) || 0) : (record?.totalBreakMinutes || 0);

    let workingHours = 0;
    if (checkIn && checkOut) {
      const diffMs = moment(checkOut).diff(moment(checkIn));
      const grossMinutes = Math.max(0, Math.floor(moment.duration(diffMs).asMinutes()));
      workingHours = Math.max(0, grossMinutes - breakMins);
    }

    if (record) {
      if (checkIn !== undefined) record.checkIn = checkIn ? new Date(checkIn) : null;
      if (checkOut !== undefined) record.checkOut = checkOut ? new Date(checkOut) : null;
      if (late !== undefined) record.late = Boolean(late);
      if (attendanceType) record.attendanceType = attendanceType;
      if (remarks !== undefined) record.remarks = remarks;
      record.totalBreakMinutes = breakMins;
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
        totalBreakMinutes: breakMins,
        workingHours,
        networkAuthorized: true,
      });
    }

    await logAudit({
      user: req.user._id,
      action: 'MANUAL_ATTENDANCE',
      targetType: 'Attendance',
      targetId: record._id,
      newValue: { employeeId, date, attendanceType, totalBreakMinutes: breakMins, workingHours },
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
  startBreak,
  endBreak,
  checkOut,
  getMyAttendanceStatus,
  getMyAttendanceHistory,
  getNetworkStatus,
  getAllAttendances,
  manualAttendance,
  deleteAttendance,
};
