const usuarioModel = require('../models/usuario.model');
const courierModel = require('../models/courier.model');
const restaurantModel = require('../models/restaurant.model');
const { comparePassword } = require('../helpers/password.helper');
const { UnauthorizedError, NotFoundError } = require('../utils/errors');

const verifyUser = async (payload) => {
  const email = payload?.email?.trim().toLowerCase();
  const password = payload?.password;

  if (!email || !password) {
    throw new UnauthorizedError('Credenciales invalidas.');
  }

  const user = await usuarioModel.findAuthUserByEmail(email);

  if (!user) {
    throw new UnauthorizedError('Credenciales invalidas.');
  }

  const isValidPassword = await comparePassword(password, user.password_hash);

  if (!isValidPassword) {
    throw new UnauthorizedError('Credenciales invalidas.');
  }

  if (!user.activo) {
    throw new UnauthorizedError('Usuario inactivo.');
  }

  const response = {
    id: user.id,
    id_usuario: user.id,
    userId: user.id,
    email: user.correo,
    firstName: user.nombre,
    lastName: user.apellido,
    phone: user.telefono,
    rol: user.role,
    role: user.role,
    activo: user.activo,
    verificado: user.verificado
  };

  if (user.role === 'repartidor') {
    const courier = await courierModel.findByUserId(user.id);

    response.courier = courier
      ? {
          id: courier.id,
          accountStatus: courier.account_status,
          operationalStatus: courier.operational_status
        }
      : null;
  }

  if (user.role === 'restaurante') {
    const restaurants = await restaurantModel.findByUserId(user.id);

    response.restaurantes = restaurants.map((restaurant) => ({
      id: restaurant.id,
      nombre: restaurant.nombre,
      tipoAcceso: restaurant.tipo_acceso
    }));
  }

  return response;
};

const getUserById = async (userId) => {
  const user = await usuarioModel.findById(userId);

  if (!user) {
    throw new NotFoundError('Usuario no encontrado.');
  }

  return {
    id: user.id,
    rol: user.rol,
    nombre: `${user.nombre}${user.apellido ? ` ${user.apellido}` : ''}`
  };
};

module.exports = {
  verifyUser,
  getUserById
};
