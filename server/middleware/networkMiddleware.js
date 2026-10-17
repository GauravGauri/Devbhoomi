const { checkNetworkAuth } = require('../utils/networkAuth');

/**
 * Middleware that strictly blocks employee requests if neither Wi-Fi name nor IP matches
 */
const requireEmployeeNetwork = async (req, res, next) => {
  try {
    // Only enforce on employee users (admins configuring the system from elsewhere are exempt)
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    const authResult = await checkNetworkAuth(req);
    if (!authResult.authorized) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted: You must be connected to an authorized office Wi-Fi network or IP address set by Admin.',
        code: 'NETWORK_RESTRICTED',
        details: {
          clientIP: authResult.clientIP,
          clientWifiName: authResult.clientWifiName,
          allowedIPs: authResult.allowedIPs,
          allowedWifiNames: authResult.allowedWifiNames,
        }
      });
    }

    req.networkAuth = authResult;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireEmployeeNetwork };
