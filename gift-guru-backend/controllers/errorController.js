const AppError = require('../utils/appError'); // Adjust path if needed

// Basic error handler function
const sendErrorDev = (err, res) => {
    console.error('ERROR 💥', err); // Log error details in development
    res.status(err.statusCode || 500).json({
        status: err.status || 'error',
        error: err, // Send full error details in dev
        message: err.message,
        stack: err.stack
    });
};

// You'd add a sendErrorProd for production later

module.exports = (err, req, res, next) => {
  // Default to 500 if statusCode not set
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // In a real app, you'd distinguish between dev and prod here
  sendErrorDev(err, res);
};