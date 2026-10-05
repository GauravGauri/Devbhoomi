const jwt = require('jsonwebtoken');

const generateToken = (res, userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });

  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('jwt', accessToken, {
    httpOnly: true,
    secure: isProduction, // Secure requires HTTPS, only use in production
    sameSite: isProduction ? 'none' : 'strict', // Must be 'none' for cross-origin (Vercel <-> Render)
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('jwtRefresh', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return { accessToken, refreshToken };
};

const clearToken = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict',
    expires: new Date(0),
  });
  res.cookie('jwtRefresh', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict',
    expires: new Date(0),
  });
};

module.exports = { generateToken, clearToken };
