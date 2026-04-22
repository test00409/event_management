'use strict';
const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Sequelize Validation Error
  if (err instanceof ValidationError) {
    const messages = err.errors.map((e) => ({ field: e.path, message: e.message }));
    error = AppError.badRequest('Validation failed', messages);
  }

  // Sequelize Unique Constraint
  if (err instanceof UniqueConstraintError) {
    const field = err.errors[0]?.path || 'field';
    error = AppError.conflict(`${field} already exists`);
  }

  // Sequelize Foreign Key Constraint
  if (err instanceof ForeignKeyConstraintError) {
    error = AppError.badRequest('Invalid reference: related resource not found');
  }

  // JWT errors are handled in verifyAccessToken — they throw AppError directly

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = AppError.badRequest(`File too large. Max size: ${process.env.UPLOAD_MAX_SIZE_MB || 10}MB`);
  }

  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational || false;

  // Log non-operational errors (unexpected crashes) at error level
  if (!isOperational) {
    logger.error('Unexpected error:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      userId: req.user?.id,
    });
  } else {
    logger.warn('Operational error:', {
      message: error.message,
      statusCode,
      url: req.url,
      method: req.method,
      userId: req.user?.id,
    });
  }

  const response = {
    success: false,
    message: isOperational ? error.message : 'Something went wrong. Please try again later.',
    timestamp: new Date().toISOString(),
  };

  if (error.errors) response.errors = error.errors;

  if (process.env.NODE_ENV === 'development' && !isOperational) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

const notFoundHandler = (req, res, next) => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = { errorHandler, notFoundHandler };
