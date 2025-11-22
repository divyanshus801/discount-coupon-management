const errorHandler = (err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'SequelizeValidationError') {
    status = 400;
    message = err.errors.map(e => e.message).join(', ');
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    status = 409;
    message = `${err.errors[0].path} already exists`;
  }

  if (err.name === 'SequelizeWhere' || err.name === 'SequelizeAssociationError') {
    status = 400;
    message = 'Invalid request data';
  }

  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
  }

  // Log error
  console.error('[ERROR]', {
    status,
    message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Send response
  res.status(status).json({
    success: false,
    error: message,
    status,
  });
};

module.exports = errorHandler;
