const Attendance = require('../models/Attendance');
const AttendanceSettings = require('../models/AttendanceSettings');
const User = require('../models/User');
const Leave = require('../models/Leave');
const { checkNetworkAuth } = require('../utils/networkAuth');
const { checkGeofenceAuth } = require('../utils/geoAuth');
const logAudit = require('../utils/auditLogger');
const moment = require('moment');

// @desc    Mark Check-in
// @route   POST /api/attendance/check-in
// @access  Private/Employee
const checkIn = async (req, res, next) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    const currentTime = new Date();
    const settings = await AttendanceSettings.findOne();

    // 1. Check GPS Geofence (Physical Office Location)
    const geoAuth = await checkGeofenceAuth(req);
    if (geoAuth.geofenceEnabled && geoAuth.officeSet && !geoAuth.withinGeofence) {
      res.status(403);
      throw new Error(geoAuth.message || 'Outside office boundary. You must be physically inside the office premise to punch in.');
    }

    // 2. Check Network Auth (if network restriction is enabled and geofencing is not active)
    if (settings?.networkRestrictionEnabled && (!geoAuth.geofenceEnabled || !geoAuth.officeSet)) {
      const netAuth = await checkNetworkAuth(req);
      if (!netAuth.authorized) {
        res.status(403);
        throw new Error('Office Wi-Fi not connected. Please connect to authorized office Wi-Fi or office network to punch in.');
      }
    }

    const existingRecord = await Attendance.findOne({ employee: req.user._id, date: today });
    if (existingRecord) {
      res.status(400);
      throw new Error("You have already marked today's attendance.");
    }

    const officeStartTime = moment(settings?.officeStartTime || '09:30', 'HH:mm');
    const gracePeriod = settings?.gracePeriod || 15;
    
    const lateThreshold = officeStartTime.clone().add(gracePeriod, 'minutes');
    const isLate = moment(currentTime).isAfter(lateThreshold);
    const lateMinutes = isLate ? moment(currentTime).diff(officeStartTime, 'minutes') : 0;

    const checkInLocation = geoAuth.employeeCoords ? {
      latitude: geoAuth.employeeCoords.latitude,
      longitude: geoAuth.employeeCoords.longitude,
      distanceMeters: geoAuth.distanceMeters !== null ? geoAuth.distanceMeters : 0,
    } : null;

    const attendance = await Attendance.create({
      employee: req.user._id,
      date: today,
      checkIn: currentTime,
      attendanceType: 'Present',
      late: isLate,
      lateMinutes,
      ipAddress: req.headers['x-forwarded-for']?.split(',')[0] || req.ip,
      networkAuthorized: true,
      checkInLocation,
      breaks: [],
      isOnBreak: false,
      totalBreakMinutes: 0,
    });

    res.status(200).json({
      success: true,
      message: 'Checked in successfully. Welcome to work!',
      data: attendance,
      geoAuth,
    });
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
    const geoAuth = await checkGeofenceAuth(req);

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

    const startLocation = geoAuth.employeeCoords ? {
      latitude: geoAuth.employeeCoords.latitude,
      longitude: geoAuth.employeeCoords.longitude,
      distanceMeters: geoAuth.distanceMeters !== null ? geoAuth.distanceMeters : 0,
    } : null;

    record.isOnBreak = true;
    record.currentBreakStart = currentTime;
    record.breaks.push({
      breakType,
      startTime: currentTime,
      remarks: req.body.remarks || '',
      isAutomatic: false,
      startLocation,
    });

    await record.save();

    res.status(200).json({
      success: true,
      message: `${breakType} started. Work hours are paused and will be deducted until break is ended.`,
      data: record,
      geoAuth,
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

    // 1. Check GPS Geofence (Employee must return inside office boundary to end break and resume work)
    const geoAuth = await checkGeofenceAuth(req);
    if (geoAuth.geofenceEnabled && geoAuth.officeSet && !geoAuth.withinGeofence) {
      res.status(403);
      throw new Error(geoAuth.message || 'Outside office boundary. You must return inside the office premise to end break and resume work.');
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

    const endLocation = geoAuth.employeeCoords ? {
      latitude: geoAuth.employeeCoords.latitude,
      longitude: geoAuth.employeeCoords.longitude,
      distanceMeters: geoAuth.distanceMeters !== null ? geoAuth.distanceMeters : 0,
    } : null;

    if (activeBreak) {
      activeBreak.endTime = currentTime;
      activeBreak.duration = durationMinutes;
      activeBreak.endLocation = endLocation;
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
      geoAuth,
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
    const settings = await AttendanceSettings.findOne();

    // 1. Check GPS Geofence (Physical Office Location)
    const geoAuth = await checkGeofenceAuth(req);
    if (geoAuth.geofenceEnabled && geoAuth.officeSet && !geoAuth.withinGeofence) {
      res.status(403);
      throw new Error(geoAuth.message || 'Outside office boundary. You must be physically inside the office premise to punch out.');
    }

    // 2. Check Network Auth (if network restriction is enabled and geofencing is not active)
    if (settings?.networkRestrictionEnabled && (!geoAuth.geofenceEnabled || !geoAuth.officeSet)) {
      const netAuth = await checkNetworkAuth(req);
      if (!netAuth.authorized) {
        res.status(403);
        throw new Error('Office Wi-Fi not connected. Please connect to authorized office Wi-Fi or office network to punch out.');
      }
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

    const checkOutLocation = geoAuth.employeeCoords ? {
      latitude: geoAuth.employeeCoords.latitude,
      longitude: geoAuth.employeeCoords.longitude,
      distanceMeters: geoAuth.distanceMeters !== null ? geoAuth.distanceMeters : 0,
    } : null;

    record.checkOut = currentTime;
    record.workingHours = netWorkingHours;
    record.checkOutLocation = checkOutLocation;
    await record.save();

    res.status(200).json({
      success: true,
      message: 'Checked out successfully. Shift completed.',
      data: record,
      geoAuth,
    });
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

// @desc    Verify employee GPS location & trigger auto-break if employee left office boundary
// @route   POST /api/attendance/verify-location
// @access  Private/Employee
const verifyLocationAndAutoBreak = async (req, res, next) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    const currentTime = new Date();
    const geoAuth = await checkGeofenceAuth(req);
    const settings = await AttendanceSettings.findOne();

    const record = await Attendance.findOne({ employee: req.user._id, date: today });
    let autoBreakTriggered = false;

    // Only apply automatic break if employee has checked in and not checked out
    if (record && record.checkIn && !record.checkOut) {
      const isOut = geoAuth.geofenceEnabled && geoAuth.officeSet && !geoAuth.withinGeofence;
      const shouldAutoBreak = settings?.autoBreakOutOfOffice !== false;

      // If outside office boundary and NOT already on break -> TRIGGER AUTOMATIC BREAK
      if (isOut && shouldAutoBreak && !record.isOnBreak) {
        record.isOnBreak = true;
        record.currentBreakStart = currentTime;
        record.breaks.push({
          breakType: 'Auto Break (Out of Office)',
          startTime: currentTime,
          isAutomatic: true,
          remarks: `Automatically triggered: ${geoAuth.distanceMeters}m from office (allowed: ${settings?.geofenceRadiusMeters || 100}m)`,
          startLocation: geoAuth.employeeCoords ? {
            latitude: geoAuth.employeeCoords.latitude,
            longitude: geoAuth.employeeCoords.longitude,
            distanceMeters: geoAuth.distanceMeters || 0,
          } : null,
        });

        await record.save();
        autoBreakTriggered = true;
      }
    }

    res.status(200).json({
      success: true,
      autoBreakTriggered,
      attendance: record || null,
      geoAuth,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Geofence Status
// @route   GET /api/attendance/geo-status
// @access  Private/Employee
const getGeoStatus = async (req, res, next) => {
  try {
    const geoAuth = await checkGeofenceAuth(req);
    res.status(200).json({
      success: true,
      geoAuth,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get individual employee attendance with monthly & weekly working hours breakdown
// @route   GET /api/attendance/employee/:employeeId
// @access  Private/Admin
const getIndividualEmployeeAttendance = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { month } = req.query; // YYYY-MM

    const targetMonth = month || moment().format('YYYY-MM');
    const startOfMonth = moment(targetMonth, 'YYYY-MM').startOf('month');
    const endOfMonth = moment(targetMonth, 'YYYY-MM').endOf('month');
    const daysInMonth = startOfMonth.daysInMonth();

    const employee = await User.findById(employeeId)
      .select('-password')
      .populate('department', 'name code')
      .populate('shift');

    if (!employee) {
      res.status(404);
      throw new Error('Employee not found');
    }

    const startStr = startOfMonth.format('YYYY-MM-DD');
    const endStr = endOfMonth.format('YYYY-MM-DD');

    // Fetch all attendance records for this month
    const records = await Attendance.find({
      employee: employee._id,
      date: { $gte: startStr, $lte: endStr },
    }).sort({ date: 1 });

    // Fetch leaves for this month
    const leaves = await Leave.find({
      employee: employee._id,
      status: { $in: ['Approved', 'Pending'] },
      startDate: { $lte: endStr },
      endDate: { $gte: startStr },
    }).sort({ startDate: 1 });

    // Monthly aggregates
    const totalPresent = records.filter((r) => r.attendanceType === 'Present').length;
    const totalLate = records.filter((r) => r.late).length;
    const totalLateMinutes = records.reduce((sum, r) => sum + (r.lateMinutes || 0), 0);
    const totalHalfDay = records.filter((r) => r.attendanceType === 'Half Day').length;

    const totalWorkingMinutes = records.reduce((sum, r) => sum + (r.workingHours || 0), 0);
    const totalBreakMinutes = records.reduce((sum, r) => sum + (r.totalBreakMinutes || 0), 0);

    const avgDailyWorkingMinutes = totalPresent > 0 ? Math.round(totalWorkingMinutes / totalPresent) : 0;

    // Shift settings
    const shiftHoursDaily = employee.shift?.minimumWorkingHours ? employee.shift.minimumWorkingHours / 60 : 8;

    // Build weekly breakdown for the entire month
    const weeklyBreakdown = [];
    let currentDay = startOfMonth.clone();
    let weekIndex = 1;

    while (currentDay.isSameOrBefore(endOfMonth)) {
      const weekStart = currentDay.clone();
      let weekEnd = currentDay.clone().endOf('isoWeek');
      if (weekEnd.isAfter(endOfMonth)) {
        weekEnd = endOfMonth.clone();
      }

      const wStartStr = weekStart.format('YYYY-MM-DD');
      const wEndStr = weekEnd.format('YYYY-MM-DD');

      const weekRecords = records.filter((r) => r.date >= wStartStr && r.date <= wEndStr);
      const weekWorkMins = weekRecords.reduce((sum, r) => sum + (r.workingHours || 0), 0);
      const weekBreakMins = weekRecords.reduce((sum, r) => sum + (r.totalBreakMinutes || 0), 0);
      const weekPresent = weekRecords.filter((r) => r.attendanceType === 'Present').length;
      const weekLate = weekRecords.filter((r) => r.late).length;
      const weekHalfDay = weekRecords.filter((r) => r.attendanceType === 'Half Day').length;

      // Count working days (Mon-Sat, excluding Sun)
      let workingDays = 0;
      let temp = weekStart.clone();
      while (temp.isSameOrBefore(weekEnd)) {
        if (temp.day() !== 0) workingDays++;
        temp.add(1, 'day');
      }
      const expectedMins = workingDays * (shiftHoursDaily * 60);

      weeklyBreakdown.push({
        weekNumber: weekIndex,
        label: `Week ${weekIndex} (${weekStart.format('MMM D')} - ${weekEnd.format('MMM D')})`,
        startDate: wStartStr,
        endDate: wEndStr,
        totalDays: weekEnd.diff(weekStart, 'days') + 1,
        workingDaysCount: workingDays,
        daysPresent: weekPresent,
        daysLate: weekLate,
        daysHalfDay: weekHalfDay,
        totalWorkMinutes: weekWorkMins,
        totalWorkHours: (weekWorkMins / 60).toFixed(1),
        formattedWorkHours: `${Math.floor(weekWorkMins / 60)}h ${weekWorkMins % 60}m`,
        totalBreakMinutes: weekBreakMins,
        formattedBreakHours: `${Math.floor(weekBreakMins / 60)}h ${weekBreakMins % 60}m`,
        expectedWorkMinutes: expectedMins,
        formattedExpectedHours: `${Math.floor(expectedMins / 60)}h ${expectedMins % 60}m`,
        overtimeOrDeficitMinutes: weekWorkMins - expectedMins,
        attendanceRate: workingDays > 0 ? Math.round((weekPresent / workingDays) * 100) : 0,
        records: weekRecords,
      });

      weekIndex++;
      currentDay = weekEnd.clone().add(1, 'day');
    }

    // Ongoing current calendar week
    const currentWeekStart = moment().startOf('isoWeek').format('YYYY-MM-DD');
    const currentWeekEnd = moment().endOf('isoWeek').format('YYYY-MM-DD');
    const currentWeekRecords = await Attendance.find({
      employee: employee._id,
      date: { $gte: currentWeekStart, $lte: currentWeekEnd },
    });
    const currentWeekWorkMins = currentWeekRecords.reduce((sum, r) => sum + (r.workingHours || 0), 0);
    const currentWeekBreakMins = currentWeekRecords.reduce((sum, r) => sum + (r.totalBreakMinutes || 0), 0);
    const currentWeekPresent = currentWeekRecords.filter((r) => r.attendanceType === 'Present').length;
    const currentWeekLate = currentWeekRecords.filter((r) => r.late).length;

    res.status(200).json({
      success: true,
      employee,
      month: targetMonth,
      summary: {
        totalDaysInMonth: daysInMonth,
        totalLoggedRecords: records.length,
        totalPresent,
        totalLate,
        totalLateMinutes,
        totalHalfDay,
        totalWorkingMinutes,
        totalWorkingHours: (totalWorkingMinutes / 60).toFixed(1),
        formattedTotalWorkingHours: `${Math.floor(totalWorkingMinutes / 60)}h ${totalWorkingMinutes % 60}m`,
        totalBreakMinutes,
        totalBreakHours: (totalBreakMinutes / 60).toFixed(1),
        formattedTotalBreakHours: `${Math.floor(totalBreakMinutes / 60)}h ${totalBreakMinutes % 60}m`,
        avgDailyWorkingMinutes,
        formattedAvgDailyHours: `${Math.floor(avgDailyWorkingMinutes / 60)}h ${avgDailyWorkingMinutes % 60}m`,
        approvedLeavesCount: leaves.filter((l) => l.status === 'Approved').length,
        pendingLeavesCount: leaves.filter((l) => l.status === 'Pending').length,
      },
      weeklyBreakdown,
      currentWeek: {
        startDate: currentWeekStart,
        endDate: currentWeekEnd,
        totalWorkMinutes: currentWeekWorkMins,
        totalWorkHours: (currentWeekWorkMins / 60).toFixed(1),
        formattedWorkHours: `${Math.floor(currentWeekWorkMins / 60)}h ${currentWeekWorkMins % 60}m`,
        totalBreakMinutes: currentWeekBreakMins,
        formattedBreakHours: `${Math.floor(currentWeekBreakMins / 60)}h ${currentWeekBreakMins % 60}m`,
        daysPresent: currentWeekPresent,
        daysLate: currentWeekLate,
        recordsCount: currentWeekRecords.length,
      },
      records,
      leaves,
    });
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
  verifyLocationAndAutoBreak,
  getGeoStatus,
  getIndividualEmployeeAttendance,
};
