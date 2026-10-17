/**
 * Location Service for DevBhoomi Geofencing
 * Fetches accurate GPS coordinates using HTML5 navigator.geolocation
 */

let cachedPosition = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 15000; // 15 seconds cache

export const getCurrentLocation = (forceFresh = false) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser or device.'));
      return;
    }

    const now = Date.now();
    if (!forceFresh && cachedPosition && (now - lastFetchTime < CACHE_DURATION_MS)) {
      resolve(cachedPosition);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        cachedPosition = coords;
        lastFetchTime = Date.now();
        try {
          sessionStorage.setItem('client_geo_coords', JSON.stringify(coords));
        } catch (e) {}
        resolve(coords);
      },
      (err) => {
        let msg = 'Failed to get location.';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            msg = 'Location permission denied. Please enable location access in your browser settings to mark attendance.';
            break;
          case err.POSITION_UNAVAILABLE:
            msg = 'Location information is unavailable on your device.';
            break;
          case err.TIMEOUT:
            msg = 'Location request timed out. Please ensure GPS/Location is turned on.';
            break;
          default:
            msg = err.message || msg;
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  });
};

export const getStoredLocation = () => {
  try {
    const raw = sessionStorage.getItem('client_geo_coords');
    return raw ? JSON.parse(raw) : cachedPosition;
  } catch (e) {
    return cachedPosition;
  }
};
