const AuditLog = require('../models/AuditLog');

const logAudit = async ({ user, action, targetType, targetId, oldValue, newValue, ipAddress, reason }) => {
  try {
    await AuditLog.create({
      user,
      action,
      targetType,
      targetId,
      oldValue,
      newValue,
      ipAddress,
      reason,
    });
  } catch (error) {
    console.error('Audit Log Error:', error);
  }
};

module.exports = logAudit;
