const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      logger.warn(`Unauthorized access attempt to ${req.path} from ${req.ip}`);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      logger.warn(`User not found for token: ${decoded.id}`);
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.isActive) {
      logger.warn(`Inactive user attempted access: ${user.email}`);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    
    logger.error(`Auth middleware error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
};

const vendorOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'vendor' || req.user.role === 'admin')) {
    next();
  } else {
    logger.warn(`Non-vendor user ${req.user?.email} attempted vendor access to ${req.path}`);
    return res.status(403).json({
      success: false,
      message: 'Access denied. Vendor privileges required.',
    });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    logger.warn(`Non-admin user ${req.user?.email} attempted admin access to ${req.path}`);
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };

  res.cookie('token', token, cookieOptions);
  return token;
};

const clearToken = (res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
};

module.exports = {
  protect,
  vendorOnly,
  adminOnly,
  optionalAuth,
  generateToken,
  clearToken,
};