const AppError = require('../utils/AppError');

// MongoDB / Mongoose Cast Error (e.g. invalid ObjectId)
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400, true);
};

// MongoDB Duplicate Key Error (code 11000)
const handleDuplicateFieldsDB = (err) => {
  let duplicateValue = '';
  if (err.keyValue) {
    const keys = Object.keys(err.keyValue);
    duplicateValue = `${keys[0]}: "${err.keyValue[keys[0]]}"`;
  } else {
    const match = err.message ? err.message.match(/(["'])(\\?.)*?\1/) : null;
    duplicateValue = match ? match[0] : 'entered value';
  }

  const message = `Duplicate value entered for ${duplicateValue}. Please use another value.`;
  return new AppError(message, 400, true);
};

// Mongoose Validation Error
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors || {}).map((el) => el.message);
  const message = `Validation error: ${errors.join('. ')}`;
  return new AppError(message, 400, true);
};

// JWT Invalid Token
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again.', 401, true);
};

// JWT Expired Token
const handleJWTExpiredError = () => {
  return new AppError('Your session has expired. Please log in again.', 401, true);
};

// Multer Upload Errors
const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File size is too large. Please upload a smaller file.', 400, true);
  }
  return new AppError(err.message || 'File upload error.', 400, true);
};

// Error response in Development: leaks full error details & stack trace for easy debugging
const sendErrorDev = (err, req, res) => {
  const responsePayload = {
    status: err.status,
    message: err.message,
    isOperational: err.isOperational,
    error: err,
    stack: err.stack,
  };

  if (err.requiresVerification !== undefined) {
    responsePayload.requiresVerification = err.requiresVerification;
  }
  if (err.email) {
    responsePayload.email = err.email;
  }

  res.status(err.statusCode).json(responsePayload);
};

// Error response in Production: only sends trusted operational errors to clients
const sendErrorProd = (err, req, res) => {
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    const responsePayload = {
      status: err.status,
      message: err.message,
    };

    // Forward optional operational context if present (e.g. auth verification requirement)
    if (err.requiresVerification !== undefined) {
      responsePayload.requiresVerification = err.requiresVerification;
    }
    if (err.email) {
      responsePayload.email = err.email;
    }

    return res.status(err.statusCode).json(responsePayload);
  }

  // B) Programming or unknown error (non-operational): don't leak error details
  console.error('ERROR 💥 [NON-OPERATIONAL]:', err);

  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong on the server. Please try again later.',
  });
};

/**
 * Global Express Error Controller Middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || `${err.statusCode}`.startsWith('4') ? 'fail' : 'error';

  // Mark 4xx errors as operational by default if not explicitly marked
  if (err.isOperational === undefined && err.statusCode >= 400 && err.statusCode < 500) {
    err.isOperational = true;
  }

  const env = (process.env.NODE_ENV || 'development').trim().toLowerCase();

  if (env === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.name = err.name;
    error.message = err.message;
    error.stack = err.stack;
    error.isOperational = err.isOperational;
    error.statusCode = err.statusCode;
    error.status = err.status;
    if (err.requiresVerification !== undefined) error.requiresVerification = err.requiresVerification;
    if (err.email) error.email = err.email;

    // Convert known database / library errors to operational AppErrors
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.name === 'MulterError') error = handleMulterError(error);

    sendErrorProd(error, req, res);
  }
};

module.exports = globalErrorHandler;
module.exports.globalErrorHandler = globalErrorHandler;
module.exports.sendErrorDev = sendErrorDev;
module.exports.sendErrorProd = sendErrorProd;
