const { StatusCodes } = require('http-status-codes');

class ApiError extends Error {
  constructor(statusCode, message, errors = [], stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.isOperational = true;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message, errors = []) {
    return new ApiError(StatusCodes.BAD_REQUEST, message, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(StatusCodes.UNAUTHORIZED, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(StatusCodes.FORBIDDEN, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(StatusCodes.NOT_FOUND, message);
  }

  static conflict(message) {
    return new ApiError(StatusCodes.CONFLICT, message);
  }

  static unprocessable(message, errors = []) {
    return new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, message, errors);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, message);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(StatusCodes.TOO_MANY_REQUESTS, message);
  }
}

module.exports = ApiError;
