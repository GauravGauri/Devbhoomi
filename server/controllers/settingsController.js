const AttendanceSettings = require('../models/AttendanceSettings');
const logAudit = require('../utils/auditLogger');

// @desc    Get Settings
// @route   GET /api/admin/settings
// @access  Private/Admin
const getSettings = async (req, res, next) => {
  try {
    let settings = await AttendanceSettings.findOne();
    if (!settings) {
      settings = await AttendanceSettings.create({
        officeStartTime: '09:30',
        officeEndTime: '18:30',
        gracePeriod: 15,
        networkRestrictionEnabled: false,
        allowedWifiNames: ['DevBhoomi-WiFi'],
        allowedIPs: ['127.0.0.1'],
      });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
const updateSettings = async (req, res, next) => {
  try {
    const { officeStartTime, officeEndTime, gracePeriod, networkRestrictionEnabled, allowedWifiNames, allowedIPs } = req.body;
    
    let settings = await AttendanceSettings.findOne();
    if (!settings) {
      settings = new AttendanceSettings();
    }
    
    settings.officeStartTime = officeStartTime !== undefined ? officeStartTime : settings.officeStartTime;
    settings.officeEndTime = officeEndTime !== undefined ? officeEndTime : settings.officeEndTime;
    settings.gracePeriod = gracePeriod !== undefined ? gracePeriod : settings.gracePeriod;
    settings.networkRestrictionEnabled = networkRestrictionEnabled !== undefined ? networkRestrictionEnabled : settings.networkRestrictionEnabled;
    if (allowedWifiNames !== undefined) {
      settings.allowedWifiNames = Array.isArray(allowedWifiNames) ? allowedWifiNames.map(s => s.trim()).filter(Boolean) : settings.allowedWifiNames;
    }
    if (allowedIPs !== undefined) {
      settings.allowedIPs = Array.isArray(allowedIPs) ? allowedIPs.map(s => s.trim()).filter(Boolean) : settings.allowedIPs;
    }
    
    await settings.save();
    
    await logAudit({
      user: req.user._id,
      action: 'UPDATE_SETTINGS',
      targetType: 'AttendanceSettings',
      targetId: settings._id,
      newValue: { officeStartTime, officeEndTime, gracePeriod, networkRestrictionEnabled, allowedWifiNames: settings.allowedWifiNames, allowedIPs: settings.allowedIPs },
      ipAddress: req.ip,
    });
    
    res.status(200).json({ success: true, data: settings, message: 'Settings updated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings };
