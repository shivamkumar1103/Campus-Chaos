/**
 * Custom Error Class for Application Errors
 * Distinguishes between trusted operational errors (client mistakes, known validation failures)
 * and non-operational errors (programming bugs, system/hardware failures).
 */
class AppError extends Error {
  /**
   * @param {string} message - Error description
   * @param {number} [statusCode=500] - HTTP status code
   * @param {boolean} [isOperational=true] - Indicates if error is operational (trusted) or non-operational (bug)
   */
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = Boolean(isOperational);

    // Captures current stack trace, excluding the constructor call from the trace
    Error.captureStackTrace(this, this.constructor);
  }

  // Convenient static factories for common HTTP operational errors
  static badRequest(message = 'Bad Request') {
    return new AppError(message, 400, true);
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError(message, 401, true);
  }

  static forbidden(message = 'Forbidden') {
    return new AppError(message, 403, true);
  }

  static notFound(message = 'Resource not found') {
    return new AppError(message, 404, true);
  }

  static conflict(message = 'Conflict') {
    return new AppError(message, 409, true);
  }

  static internal(message = 'Internal Server Error', isOperational = false) {
    return new AppError(message, 500, isOperational);
  }
}

module.exports = AppError;
