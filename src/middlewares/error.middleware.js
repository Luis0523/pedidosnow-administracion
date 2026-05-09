const config = require('../config');

const errorMiddleware = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const response = {
    message: error.publicMessage || 'Error interno del servidor.'
  };

  if (config.env !== 'production') {
    response.error = error.message;
  }

  res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
