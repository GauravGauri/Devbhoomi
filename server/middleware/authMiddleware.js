const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // 1. Check Bearer token in Authorization header (standard for cross-origin SPA)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Fallback to HTTP-only cookie
  else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = await User.findById(decoded.userId).select('-password');
      
      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }
      
      if (req.user.status !== 'Active') {
        res.status(403);
        throw new Error('User account is not active');
      }

      next();
    } catch (error) {
      console.error('Auth verification error:', error.message);
      res.status(401);
      next(new Error('Not authorized, token invalid or expired'));
    }
  } else {
    res.status(401);
    next(new Error('Not authorized, no token provided'));
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    next(new Error('Not authorized as an admin'));
  }
};

module.exports = { protect, admin };
