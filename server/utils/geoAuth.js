const AttendanceSettings = require('../models/AttendanceSettings');

/**
 * Calculate the great-circle distance between two GPS coordinates in meters using Haversine formula
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in meters
 */
const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return Infinity;
  }
  const R = 6371e3; // Earth's radius in meters
  const toRad = (val) => (val * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

/**
 * Checks if employee request is physically inside the authorized Office Geofence boundary
 * @param {import('express').Request} req
 * @returns {Promise<{
 *   geofenceEnabled: boolean,
 *   withinGeofence: boolean,
 *   distanceMeters: number | null,
 *   allowedRadiusMeters: number,
 *   missingCoords: boolean,
 *   officeSet: boolean,
 *   officeLocation: { latitude: number, longitude: number, name: string },
 *   employeeCoords: { latitude: number, longitude: number } | null,
 *   message: string
 * }>}
 */
const checkGeofenceAuth = async (req) => {
  const settings = await AttendanceSettings.findOne();

  const officeLat = settings?.officeLatitude || 0;
  const officeLon = settings?.officeLongitude || 0;
  const radius = settings?.geofenceRadiusMeters || 100;
  const officeName = settings?.officeLocationName || 'DevBhoomi Office';
  const isEnabled = Boolean(settings?.geofencingEnabled);
  const isOfficeConfigured = officeLat !== 0 && officeLon !== 0;

  // If geofencing is disabled or admin hasn't set coordinates yet, permit
  if (!settings || !isEnabled || !isOfficeConfigured) {
    return {
      geofenceEnabled: isEnabled,
      withinGeofence: true,
      distanceMeters: null,
      allowedRadiusMeters: radius,
      missingCoords: false,
      officeSet: isOfficeConfigured,
      officeLocation: { latitude: officeLat, longitude: officeLon, name: officeName },
      employeeCoords: null,
      message: !isOfficeConfigured
        ? 'Office coordinates have not been set by Admin yet.'
        : 'Geofencing restriction is currently disabled.',
    };
  }

  // Extract employee coordinates from headers, body, or query
  const rawLat = req.headers['x-latitude'] || req.body?.latitude || req.query?.latitude;
  const rawLon = req.headers['x-longitude'] || req.body?.longitude || req.query?.longitude;

  const empLat = parseFloat(rawLat);
  const empLon = parseFloat(rawLon);

  if (isNaN(empLat) || isNaN(empLon)) {
    return {
      geofenceEnabled: true,
      withinGeofence: false,
      distanceMeters: null,
      allowedRadiusMeters: radius,
      missingCoords: true,
      officeSet: true,
      officeLocation: { latitude: officeLat, longitude: officeLon, name: officeName },
      employeeCoords: null,
      message: 'Location access required. Please enable device location / GPS to mark attendance.',
    };
  }

  // Calculate distance in meters
  const distance = calculateDistanceMeters(empLat, empLon, officeLat, officeLon);
  const withinGeofence = distance <= radius;

  return {
    geofenceEnabled: true,
    withinGeofence,
    distanceMeters: distance,
    allowedRadiusMeters: radius,
    missingCoords: false,
    officeSet: true,
    officeLocation: { latitude: officeLat, longitude: officeLon, name: officeName },
    employeeCoords: { latitude: empLat, longitude: empLon },
    message: withinGeofence
      ? `Within office premise (${distance}m from ${officeName}).`
      : `Outside office boundary: You are ${distance}m away from ${officeName} (Allowed within ${radius}m).`,
  };
};

module.exports = {
  calculateDistanceMeters,
  checkGeofenceAuth,
};
