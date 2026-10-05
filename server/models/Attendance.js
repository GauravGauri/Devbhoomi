const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  checkIn: {
    type: Date,
  },
  checkOut: {
    type: Date,
  },
  workingHours: {
    type: Number, // in minutes
    default: 0,
  },
  attendanceType: {
    type: String,
    enum: ['Present', 'Absent', 'Half Day', 'Short Leave', 'Full Day Leave', 'Holiday', 'Week Off', 'Late', 'Early Checkout'],
    default: 'Absent',
  },
  late: {
    type: Boolean,
    default: false,
  },
  lateMinutes: {
    type: Number,
    default: 0,
  },
  shortLeave: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Approved',
  },
  remarks: {
    type: String,
  },
  ipAddress: {
    type: String,
  },
  networkAuthorized: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

// Ensure one attendance per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
