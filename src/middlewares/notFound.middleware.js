const { NotFoundError } = require('../utils/errors');

const notFoundMiddleware = (req, res, next) => {
  next(new NotFoundError('Ruta no encontrada.'));
};

module.exports = notFoundMiddleware;
