require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const AuditLog = require('../models/AuditLog');
const AttendanceSettings = require('../models/AttendanceSettings');

const resetDatabase = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB. Starting database reset...');

    // 1. Clear all users, attendances, leaves, and audit logs
    const userDel = await User.deleteMany({});
    console.log(`Cleared ${userDel.deletedCount} users.`);

    const attDel = await Attendance.deleteMany({});
    console.log(`Cleared ${attDel.deletedCount} attendance records.`);

    const leaveDel = await Leave.deleteMany({});
    console.log(`Cleared ${leaveDel.deletedCount} leave records.`);

    const auditDel = await AuditLog.deleteMany({});
    console.log(`Cleared ${auditDel.deletedCount} audit logs.`);

    // 2. Create the single Admin requested by user:
    // email: Jpbhatt@gmail.com
    // username: Jpbhatt
    // password: Jpbhatt@123
    const adminUser = new User({
      employeeId: 'ADM001',
      name: 'JP Bhatt',
      username: 'Jpbhatt',
      email: 'Jpbhatt@gmail.com',
      password: 'Jpbhatt@123', // Will be hashed by User pre('save') hook
      role: 'admin',
      status: 'Active',
    });

    await adminUser.save();
    console.log('----------------------------------------------------');
    console.log('Admin user created successfully:');
    console.log('Name:     JP Bhatt');
    console.log('Username: Jpbhatt');
    console.log('Email:    Jpbhatt@gmail.com');
    console.log('Password: Jpbhatt@123');
    console.log('Role:     admin');
    console.log('----------------------------------------------------');

    // 3. Ensure AttendanceSettings exists with clean defaults
    let settings = await AttendanceSettings.findOne();
    if (!settings) {
      settings = await AttendanceSettings.create({
        officeStartTime: '09:30',
        officeEndTime: '18:30',
        gracePeriod: 15,
        minimumWorkingHours: 480,
        networkRestrictionEnabled: false,
        allowedWifiNames: ['DevBhoomi-WiFi'],
        allowedIPs: ['127.0.0.1'],
        autoCheckoutEnabled: true,
      });
      console.log('Created default attendance settings.');
    } else {
      settings.networkRestrictionEnabled = false;
      if (!settings.allowedWifiNames || settings.allowedWifiNames.length === 0) {
        settings.allowedWifiNames = ['DevBhoomi-WiFi'];
      }
      if (!settings.allowedIPs || settings.allowedIPs.length === 0) {
        settings.allowedIPs = ['127.0.0.1'];
      }
      await settings.save();
      console.log('Updated existing attendance settings with default network options.');
    }

    console.log('Database reset completed successfully! Admin can now create employees.');
    process.exit(0);
  } catch (error) {
    console.error(`Database reset failed: ${error.message}`);
    process.exit(1);
  }
};

resetDatabase();
