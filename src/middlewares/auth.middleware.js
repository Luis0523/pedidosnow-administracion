const brokerService = require('../services/broker.service');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const config = require('../config');

const requireCourier = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');
    const developmentUserId = req.headers['x-user-id'];

    if (config.env !== 'production' && developmentUserId) {
      req.user = {
        user_id: Number(developmentUserId),
        role: 'repartidor'
      };
      return next();
    }

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedError('Token de autenticacion requerido.');
    }

    const user = await brokerService.validateToken(token);

    if (user.role !== 'repartidor') {
      throw new ForbiddenError('El usuario no tiene permisos de repartidor.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const requireRestaurantUser = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');
    const developmentUserId = req.headers['x-user-id'];

    if (config.env !== 'production' && developmentUserId) {
      req.user = {
        user_id: Number(developmentUserId),
        role: 'restaurante'
      };
      return next();
    }

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedError('Token de autenticacion requerido.');
    }

    const user = await brokerService.validateToken(token);

    if (user.role !== 'restaurante') {
      throw new ForbiddenError('El usuario no tiene permisos de restaurante.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireCourier,
  requireRestaurantUser
};
