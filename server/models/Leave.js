const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  leaveType: {
    type: String,
    enum: ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Unpaid Leave', 'Emergency Leave', 'Half Day', 'Short Leave', 'Other'],
    required: true,
  },
  startDate: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  endDate: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  startTime: {
    type: String, // for short leave / half day HH:mm
  },
  endTime: {
    type: String, // for short leave / half day HH:mm
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  }
}, {
  timestamps: true,
});

const Leave = mongoose.model('Leave', leaveSchema);
module.exports = Leave;
