const mongoose = require('mongoose');

const attendanceSettingsSchema = new mongoose.Schema({
  officeStartTime: {
    type: String,
    default: '09:30',
  },
  officeEndTime: {
    type: String,
    default: '18:30',
  },
  gracePeriod: {
    type: Number,
    default: 15, // minutes
  },
  minimumWorkingHours: {
    type: Number,
    default: 480, // 8 hours in minutes
  },
  halfDayHours: {
    type: Number,
    default: 240, // 4 hours in minutes
  },
  shortLeaveMaximumMinutes: {
    type: Number,
    default: 120, // 2 hours in minutes
  },
  weeklyOffDays: {
    type: [Number], // 0 for Sunday, 6 for Saturday
    default: [0, 6],
  },
  networkRestrictionEnabled: {
    type: Boolean,
    default: true,
  },
  allowedIPs: {
    type: [String],
    default: ['127.0.0.1'], // Can include ranges or specific IPs
  },
  autoCheckoutEnabled: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

const AttendanceSettings = mongoose.model('AttendanceSettings', attendanceSettingsSchema);
module.exports = AttendanceSettings;
