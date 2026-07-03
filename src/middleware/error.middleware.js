const { StatusCodes } = require('http-status-codes');
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const globalErrorHandler = (err, req, res, _next) => {
  let error = err;

  // Normalize known error types into ApiError
  if (err instanceof mongoose.Error.CastError) {
    error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    error = ApiError.conflict(`${field} already exists`);
  } else if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    error = ApiError.unprocessable('Validation failed', errors);
  } else if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid token');
  } else if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Token expired');
  } else if (!(err instanceof ApiError)) {
    error = ApiError.internal(
      process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    );
  }

  logger.error(error.message, {
    traceId: req.traceId,
    statusCode: error.statusCode,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
  });

  return res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors,
    traceId: req.traceId,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

const notFoundHandler = (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    traceId: req.traceId,
  });
};

module.exports = { globalErrorHandler, notFoundHandler };
