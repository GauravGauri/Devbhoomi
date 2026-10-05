const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  action: {
    type: String,
    required: true,
  },
  targetType: {
    type: String, // e.g. "Attendance", "User", "Leave"
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed,
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed,
  },
  ipAddress: {
    type: String,
  },
  reason: {
    type: String,
  },
}, {
  timestamps: true,
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
