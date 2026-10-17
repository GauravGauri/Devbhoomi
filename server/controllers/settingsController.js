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
    const {
      officeStartTime,
      officeEndTime,
      gracePeriod,
      minimumWorkingHours,
      autoCheckoutEnabled,
      networkRestrictionEnabled,
      allowedWifiNames,
      allowedIPs,
      geofencingEnabled,
      officeLatitude,
      officeLongitude,
      geofenceRadiusMeters,
      officeLocationName,
      autoBreakOutOfOffice,
    } = req.body;
    
    let settings = await AttendanceSettings.findOne();
    if (!settings) {
      settings = new AttendanceSettings();
    }
    
    if (officeStartTime !== undefined) settings.officeStartTime = officeStartTime;
    if (officeEndTime !== undefined) settings.officeEndTime = officeEndTime;
    if (gracePeriod !== undefined) settings.gracePeriod = gracePeriod;
    if (minimumWorkingHours !== undefined) settings.minimumWorkingHours = minimumWorkingHours;
    if (autoCheckoutEnabled !== undefined) settings.autoCheckoutEnabled = autoCheckoutEnabled;
    if (networkRestrictionEnabled !== undefined) settings.networkRestrictionEnabled = networkRestrictionEnabled;
    if (allowedWifiNames !== undefined) {
      settings.allowedWifiNames = Array.isArray(allowedWifiNames) ? allowedWifiNames.map(s => s.trim()).filter(Boolean) : settings.allowedWifiNames;
    }
    if (allowedIPs !== undefined) {
      settings.allowedIPs = Array.isArray(allowedIPs) ? allowedIPs.map(s => s.trim()).filter(Boolean) : settings.allowedIPs;
    }

    // Geofencing updates
    if (geofencingEnabled !== undefined) settings.geofencingEnabled = geofencingEnabled;
    if (officeLatitude !== undefined) settings.officeLatitude = Number(officeLatitude);
    if (officeLongitude !== undefined) settings.officeLongitude = Number(officeLongitude);
    if (geofenceRadiusMeters !== undefined) settings.geofenceRadiusMeters = Number(geofenceRadiusMeters);
    if (officeLocationName !== undefined) settings.officeLocationName = officeLocationName.trim();
    if (autoBreakOutOfOffice !== undefined) settings.autoBreakOutOfOffice = autoBreakOutOfOffice;
    
    await settings.save();
    
    await logAudit({
      user: req.user._id,
      action: 'UPDATE_SETTINGS',
      targetType: 'AttendanceSettings',
      targetId: settings._id,
      newValue: {
        officeStartTime,
        officeEndTime,
        networkRestrictionEnabled,
        geofencingEnabled: settings.geofencingEnabled,
        officeLatitude: settings.officeLatitude,
        officeLongitude: settings.officeLongitude,
        geofenceRadiusMeters: settings.geofenceRadiusMeters,
        autoBreakOutOfOffice: settings.autoBreakOutOfOffice,
      },
      ipAddress: req.ip,
    });
    
    res.status(200).json({ success: true, data: settings, message: 'Settings updated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings };
