const jwt = require('jsonwebtoken');
const { authConfig } = require('../config/app.config');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User.model');

const authenticate = asyncHandler(async (req, _res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw ApiError.unauthorized('Access token required');

  const decoded = jwt.verify(token, authConfig.jwtSecret);
  const user = await User.findById(decoded.sub).select('-password');
  if (!user) throw ApiError.unauthorized('User no longer exists');
  if (!user.isActive) throw ApiError.forbidden('Account deactivated');

  req.user = user;
  next();
});

const authorize = (...roles) =>
  asyncHandler(async (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden('Insufficient permissions');
    }
    next();
  });

module.exports = { authenticate, authorize };
