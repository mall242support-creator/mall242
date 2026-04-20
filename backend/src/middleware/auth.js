const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Protect routes - Verify JWT token from HTTP-only cookie
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in cookies (HTTP-only)
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Also check Authorization header as fallback (for mobile apps)
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

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
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

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.warn(`Invalid JWT token: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
    if (error.name === 'TokenExpiredError') {
      logger.warn(`Expired JWT token`);
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
      });
    }
    
    logger.error(`Auth middleware error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication',
    });
  }
};

/**
 * Vendor only middleware
 */
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

/**
 * Admin only middleware
 */
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

/**
 * Optional auth - doesn't require authentication but attaches user if present
 */
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
    // Just continue without user
    next();
  }
};

/**
 * Check if user owns the resource or is admin
 */
const checkOwnership = (getResourceUserId) => {
  return async (req, res, next) => {
    try {
      const resourceOwnerId = await getResourceUserId(req);
      
      if (req.user.role === 'admin' || req.user._id.toString() === resourceOwnerId.toString()) {
        next();
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this resource.',
        });
      }
    } catch (error) {
      logger.error(`Ownership check error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Server error during authorization',
      });
    }
  };
};

/**
 * Generate JWT token and set HTTP-only cookie
 */
const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

  // Set cookie options
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };

  res.cookie('token', token, cookieOptions);
  return token;
};

/**
 * Clear JWT cookie (logout)
 */
const clearToken = (res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
};

/**
 * Verify refresh token and generate new access token
 */
const refreshToken = async (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.refreshToken) {
      token = req.cookies.refreshToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    // Generate new access token
    const newToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    });

    res.cookie('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    req.user = user;
    next();
  } catch (error) {
    logger.error(`Refresh token error: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }
};

module.exports = {
  protect,
  vendorOnly,
  adminOnly,
  optionalAuth,
  checkOwnership,
  generateToken,
  clearToken,
  refreshToken,
};