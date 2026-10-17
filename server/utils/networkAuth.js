const AttendanceSettings = require('../models/AttendanceSettings');

/**
 * Checks if the request is from an authorized office network (by Wi-Fi name OR IP address)
 * @param {import('express').Request} req
 * @returns {Promise<{
 *   authorized: boolean,
 *   restrictionEnabled: boolean,
 *   ipMatches: boolean,
 *   wifiMatches: boolean,
 *   matchedBy: 'both' | 'ip' | 'wifi' | null,
 *   clientIP: string,
 *   clientWifiName: string,
 *   allowedIPs: string[],
 *   allowedWifiNames: string[],
 *   message: string
 * }>}
 */
const checkNetworkAuth = async (req) => {
  const settings = await AttendanceSettings.findOne();

  // If no settings exist or network restriction is disabled, allow all
  if (!settings || !settings.networkRestrictionEnabled) {
    const rawIP = (req.headers['x-forwarded-for']?.split(',')[0] || req.ip || req.connection?.remoteAddress || '').trim();
    const clientIP = rawIP.startsWith('::ffff:') ? rawIP.substring(7) : rawIP;
    const clientWifiName = (req.headers['x-wifi-name'] || req.query.wifiName || req.body?.wifiName || '').trim();

    return {
      authorized: true,
      restrictionEnabled: false,
      ipMatches: true,
      wifiMatches: true,
      matchedBy: 'disabled',
      clientIP: clientIP || '127.0.0.1',
      clientWifiName: clientWifiName || '',
      allowedIPs: settings?.allowedIPs || ['127.0.0.1'],
      allowedWifiNames: settings?.allowedWifiNames || ['DevBhoomi-WiFi'],
      message: 'Network restriction is currently disabled by Admin.',
    };
  }

  // Extract client IP
  const rawIP = (req.headers['x-forwarded-for']?.split(',')[0] || req.ip || req.connection?.remoteAddress || '').trim();
  let clientIP = rawIP.startsWith('::ffff:') ? rawIP.substring(7) : rawIP;
  if (clientIP === '::1') clientIP = '127.0.0.1';

  // Extract client Wi-Fi Name
  const clientWifiName = (req.headers['x-wifi-name'] || req.query.wifiName || req.body?.wifiName || '').trim();

  // 1. Check IP match
  let ipMatches = false;
  const allowedIPs = settings.allowedIPs || [];

  if (process.env.OFFICE_PUBLIC_IP && clientIP === process.env.OFFICE_PUBLIC_IP) {
    ipMatches = true;
  }

  for (const allowed of allowedIPs) {
    let cleanAllowed = allowed.trim();
    if (cleanAllowed.startsWith('::ffff:')) cleanAllowed = cleanAllowed.substring(7);
    if (cleanAllowed === '::1') cleanAllowed = '127.0.0.1';

    if (cleanAllowed === '*' || cleanAllowed === '0.0.0.0/0') {
      ipMatches = true;
      break;
    }

    if (cleanAllowed.toLowerCase() === clientIP.toLowerCase()) {
      ipMatches = true;
      break;
    }
  }

  // 2. Check Wi-Fi Name match
  let wifiMatches = false;
  const allowedWifiNames = settings.allowedWifiNames || [];

  if (clientWifiName && allowedWifiNames.length > 0) {
    for (const allowed of allowedWifiNames) {
      if (allowed.trim().toLowerCase() === clientWifiName.toLowerCase()) {
        wifiMatches = true;
        break;
      }
    }
  }

  const hasConfiguredWifi = allowedWifiNames.length > 0;
  const hasConfiguredIP = allowedIPs.length > 0;

  // Authorized if specific Wi-Fi name matches OR IP address matches
  // If only IP is configured, authorized depends on IP
  // If only Wi-Fi is configured, authorized depends on Wi-Fi
  // If both are configured, authorized if either matches
  const authorized = Boolean(ipMatches || wifiMatches);
  const matchedBy = ipMatches && wifiMatches ? 'both' : ipMatches ? 'ip' : wifiMatches ? 'wifi' : null;

  let failMessage = 'Office Wi-Fi not connected: You must connect to the authorized office Wi-Fi network or IP address.';
  if (hasConfiguredIP && !hasConfiguredWifi) {
    failMessage = `Office Wi-Fi not connected: Your connection IP (${clientIP}) does not match the office Wi-Fi IP address set by Admin.`;
  } else if (hasConfiguredWifi && !hasConfiguredIP) {
    failMessage = `Office Wi-Fi not connected: Your Wi-Fi name ("${clientWifiName || 'Unknown'}") does not match the office Wi-Fi name set by Admin.`;
  }

  return {
    authorized,
    restrictionEnabled: true,
    hasConfiguredWifi,
    hasConfiguredIP,
    ipMatches,
    wifiMatches,
    matchedBy,
    clientIP,
    clientWifiName,
    allowedIPs,
    allowedWifiNames,
    message: authorized
      ? `Office Wi-Fi connected (${matchedBy === 'wifi' ? `Wi-Fi: ${clientWifiName}` : matchedBy === 'ip' ? `Office IP: ${clientIP}` : `Wi-Fi: ${clientWifiName} & IP: ${clientIP}`}).`
      : failMessage,
  };
};

module.exports = { checkNetworkAuth };
