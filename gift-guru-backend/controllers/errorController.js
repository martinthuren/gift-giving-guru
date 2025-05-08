// FULL CODE SNIPPET: controllers/errorController.js (With Production Logic)

const AppError = require('../utils/appError');

// --- Development Error Handler ---
const sendErrorDev = (err, res) => {
    console.error('DEV ERROR 💥:', err);
    res.status(err.statusCode || 500).json({
        status: err.status || 'error',
        error: err,
        message: err.message,
        stack: err.stack
    });
};

// --- Production Error Handler ---
const handleCastErrorDB = err => new AppError(`Invalid ${err.path}: ${err.value}.`, 400);
const handleDuplicateFieldsDB = err => {
  let value = 'Unknown'; try { value = err.message.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0]; } catch (e) {}
  return new AppError(`Duplicate field value: ${value}. Please use another value.`, 400);
};
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  return new AppError(`Invalid input data. ${errors.join('. ')}`, 400);
};
const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

const sendErrorProd = (err, res) => {
    if (err.isOperational) {
         res.status(err.statusCode).json({ status: err.status, message: err.message });
    } else {
        console.error('PRODUCTION ERROR 💥 (Non-Operational):', err);
        res.status(500).json({ status: 'error', message: 'Something went very wrong!' });
    }
};

// --- Global Error Handling Middleware ---
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'production') {
    let error = { ...err, message: err.message, name: err.name, code: err.code, path: err.path, value: err.value, errors: err.errors };

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  } else {
    sendErrorDev(err, res);
  }
};