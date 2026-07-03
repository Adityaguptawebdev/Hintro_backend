const { StatusCodes } = require('http-status-codes');

class ApiResponse {
  constructor(statusCode, message, data = null) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    if (data !== null) this.data = data;
  }

  send(res) {
    // Attach traceId set by traceId.middleware into every success response body
    const traceId = res.getHeader('X-Trace-Id');
    if (traceId) this.traceId = traceId;
    return res.status(this.statusCode).json(this);
  }

  static ok(res, message, data) {
    return new ApiResponse(StatusCodes.OK, message, data).send(res);
  }

  static created(res, message, data) {
    return new ApiResponse(StatusCodes.CREATED, message, data).send(res);
  }

  static noContent(res) {
    return res.status(StatusCodes.NO_CONTENT).end();
  }

  static paginated(res, message, data, pagination) {
    return new ApiResponse(StatusCodes.OK, message, { items: data, pagination }).send(res);
  }
}

module.exports = ApiResponse;
