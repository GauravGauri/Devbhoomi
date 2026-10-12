const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Department = require('../models/Department');
const moment = require('moment');

// @desc    Get Admin Dashboard Stats & Metrics
// @route   GET /api/admin/dashboard/stats
// @access  Private/Admin
const getDashboardStats = async (req, res, next) => {
  try {
    const today = moment().format('YYYY-MM-DD');

    // 1. Employees counts
    const totalEmployees = await User.countDocuments({ role: 'employee', status: 'Active' });
    const totalAllEmployees = await User.countDocuments({ role: 'employee' });

    // 2. Attendance today
    const todayAttendances = await Attendance.find({ date: today }).populate('employee', 'name employeeId department designation');
    const presentToday = todayAttendances.filter(a => Boolean(a.checkIn)).length;
    const lateToday = todayAttendances.filter(a => Boolean(a.late)).length;

    // 3. Leaves active today
    const onLeaveToday = await Leave.countDocuments({
      status: 'Approved',
      startDate: { $lte: today },
      endDate: { $gte: today }
    });

    // 4. Absent today
    const absentToday = Math.max(0, totalEmployees - presentToday - onLeaveToday);

    // 5. Pending leaves
    const pendingLeavesCount = await Leave.countDocuments({ status: 'Pending' });

    // 6. Recent Attendance (latest 6 records)
    const recentAttendance = await Attendance.find()
      .sort('-date -createdAt')
      .limit(6)
      .populate('employee', 'name employeeId email designation');

    // 7. Last 7 days attendance trend
    const weeklyTrends = [];
    for (let i = 6; i >= 0; i--) {
      const d = moment().subtract(i, 'days').format('YYYY-MM-DD');
      const dayName = moment(d).format('ddd');
      const countPresent = await Attendance.countDocuments({ date: d, checkIn: { $ne: null } });
      const countLate = await Attendance.countDocuments({ date: d, late: true });
      weeklyTrends.push({
        date: d,
        day: dayName,
        present: countPresent,
        late: countLate,
      });
    }

    // 8. Department breakdown
    const departments = await Department.find();
    const departmentStats = [];
    for (const dept of departments) {
      const count = await User.countDocuments({ department: dept._id, role: 'employee' });
      departmentStats.push({ name: dept.name, count });
    }

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        totalAllEmployees,
        presentToday,
        lateToday,
        absentToday,
        onLeaveToday,
        pendingLeavesCount,
        recentAttendance,
        weeklyTrends,
        departmentStats,
        todayDate: today,
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
