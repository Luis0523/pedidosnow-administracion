const { withTransaction } = require('../db');
const usuarioModel = require('../models/usuario.model');
const restaurantModel = require('../models/restaurant.model');
const { hashPassword } = require('../helpers/password.helper');
const { BadRequestError, ForbiddenError, NotFoundError } = require('../utils/errors');

const OWNER_ACCESS = 'owner';
const MANAGE_ACCESS = new Set(['owner', 'admin_restaurante']);

const normalizeRestaurant = (restaurant = {}) => ({
  nombre: restaurant.nombre?.trim(),
  descripcion: restaurant.descripcion?.trim() || null,
  telefono: restaurant.telefono?.trim() || null,
  direccion: restaurant.direccion?.trim() || null
});

const normalizeUser = (user = {}) => ({
  firstName: user.firstName?.trim(),
  lastName: user.lastName?.trim(),
  email: user.email?.trim().toLowerCase(),
  phone: user.phone?.trim() || null,
  passwordRaw: user.passwordRaw
});

const validateRestaurant = (restaurant) => {
  if (!restaurant.nombre) {
    throw new BadRequestError('El nombre del restaurante es requerido.');
  }
};

const validateUser = (user) => {
  if (!user.firstName || !user.lastName || !user.email || !user.passwordRaw) {
    throw new BadRequestError('firstName, lastName, email y passwordRaw son requeridos.');
  }

  if (!user.email.includes('@')) {
    throw new BadRequestError('El correo electronico no es valido.');
  }

  if (String(user.passwordRaw).length < 8) {
    throw new BadRequestError('La contrasena debe tener al menos 8 caracteres.');
  }
};

const ensureRestaurantAccess = async (restaurantId, userId, allowedAccess = null) => {
  const access = await restaurantModel.findAccess(restaurantId, userId);

  if (!access) {
    throw new ForbiddenError('No tienes acceso a este restaurante.');
  }

  if (allowedAccess && !allowedAccess.has(access.tipo_acceso)) {
    throw new ForbiddenError('No tienes permisos suficientes para esta operacion.');
  }

  return access;
};

const registerRestaurant = async (payload) => {
  const restaurant = normalizeRestaurant(payload?.restaurant);
  const owner = normalizeUser(payload?.owner);

  validateRestaurant(restaurant);
  validateUser(owner);

  const existingUser = await usuarioModel.findByEmail(owner.email);

  if (existingUser) {
    throw new BadRequestError('Ya existe un usuario registrado con ese correo.');
  }

  const passwordHash = await hashPassword(owner.passwordRaw);
  let createdRestaurant;
  let createdUser;

  await withTransaction(async (client) => {
    const restaurantRole = await usuarioModel.findRoleByCode('restaurante', client);

    if (!restaurantRole) {
      throw new BadRequestError('El rol restaurante no existe. Ejecuta los seeders.');
    }

    createdUser = await usuarioModel.create(
      {
        rolId: restaurantRole.id,
        nombre: owner.firstName,
        apellido: owner.lastName,
        correo: owner.email,
        telefono: owner.phone,
        passwordHash
      },
      client
    );

    createdRestaurant = await restaurantModel.createRestaurant(restaurant, client);

    await restaurantModel.createRestaurantUser(
      {
        restauranteId: createdRestaurant.id,
        usuarioId: createdUser.id,
        tipoAcceso: OWNER_ACCESS
      },
      client
    );
  });

  return {
    message: 'Restaurante registrado exitosamente.',
    id: createdUser.id,
    id_usuario: createdUser.id,
    userId: createdUser.id,
    email: owner.email,
    rol: 'restaurante',
    role: 'restaurante',
    restaurantId: createdRestaurant.id
  };
};

const listMyRestaurants = async (userId) => {
  const restaurants = await restaurantModel.findByUserId(userId);

  return {
    restaurants: restaurants.map((restaurant) => ({
      id: restaurant.id,
      nombre: restaurant.nombre,
      descripcion: restaurant.descripcion,
      telefono: restaurant.telefono,
      direccion: restaurant.direccion,
      tipoAcceso: restaurant.tipo_acceso
    }))
  };
};

const getRestaurant = async (restaurantId, userId) => {
  await ensureRestaurantAccess(restaurantId, userId);

  const restaurant = await restaurantModel.findById(restaurantId);

  if (!restaurant) {
    throw new NotFoundError('Restaurante no encontrado.');
  }

  return restaurant;
};

const updateRestaurant = async (restaurantId, userId, payload) => {
  await ensureRestaurantAccess(restaurantId, userId, MANAGE_ACCESS);

  const restaurant = normalizeRestaurant(payload);
  validateRestaurant(restaurant);

  const updatedRestaurant = await restaurantModel.updateRestaurant(restaurantId, restaurant);

  if (!updatedRestaurant) {
    throw new NotFoundError('Restaurante no encontrado.');
  }

  return {
    message: 'Restaurante actualizado correctamente.'
  };
};

const setRestaurantActive = async (restaurantId, userId, payload) => {
  await ensureRestaurantAccess(restaurantId, userId, new Set([OWNER_ACCESS]));

  if (typeof payload?.active !== 'boolean') {
    throw new BadRequestError('active debe ser boolean.');
  }

  const restaurant = await restaurantModel.setRestaurantActive(restaurantId, payload.active);

  if (!restaurant) {
    throw new NotFoundError('Restaurante no encontrado.');
  }

  return {
    message: payload.active ? 'Restaurante activado correctamente.' : 'Restaurante desactivado correctamente.'
  };
};

const listRestaurantUsers = async (restaurantId, userId) => {
  await ensureRestaurantAccess(restaurantId, userId, MANAGE_ACCESS);

  const users = await restaurantModel.findUsersByRestaurantId(restaurantId);

  return {
    users: users.map((user) => ({
      id: user.id,
      firstName: user.nombre,
      lastName: user.apellido,
      email: user.correo,
      phone: user.telefono,
      active: user.activo,
      verified: user.verificado,
      tipoAcceso: user.tipo_acceso,
      accesoActivo: user.acceso_activo
    }))
  };
};

const createRestaurantCollaborator = async (restaurantId, userId, payload) => {
  await ensureRestaurantAccess(restaurantId, userId, MANAGE_ACCESS);

  const collaborator = normalizeUser(payload);
  const tipoAcceso = payload?.tipoAcceso;

  validateUser(collaborator);

  if (!restaurantModel.VALID_ACCESS.includes(tipoAcceso) || tipoAcceso === OWNER_ACCESS) {
    throw new BadRequestError('tipoAcceso no es valido para colaborador.');
  }

  const existingUser = await usuarioModel.findByEmail(collaborator.email);

  if (existingUser) {
    throw new BadRequestError('Ya existe un usuario registrado con ese correo.');
  }

  const passwordHash = await hashPassword(collaborator.passwordRaw);
  let createdUser;

  await withTransaction(async (client) => {
    const restaurantRole = await usuarioModel.findRoleByCode('restaurante', client);

    if (!restaurantRole) {
      throw new BadRequestError('El rol restaurante no existe. Ejecuta los seeders.');
    }

    createdUser = await usuarioModel.create(
      {
        rolId: restaurantRole.id,
        nombre: collaborator.firstName,
        apellido: collaborator.lastName,
        correo: collaborator.email,
        telefono: collaborator.phone,
        passwordHash
      },
      client
    );

    await restaurantModel.createRestaurantUser(
      {
        restauranteId: restaurantId,
        usuarioId: createdUser.id,
        tipoAcceso
      },
      client
    );
  });

  return {
    message: 'Colaborador creado correctamente.',
    userId: createdUser.id
  };
};

const updateRestaurantCollaboratorAccess = async (restaurantId, collaboratorUserId, userId, payload) => {
  await ensureRestaurantAccess(restaurantId, userId, MANAGE_ACCESS);

  const tipoAcceso = payload?.tipoAcceso;
  const active = payload?.active;

  if (!restaurantModel.VALID_ACCESS.includes(tipoAcceso) || tipoAcceso === OWNER_ACCESS) {
    throw new BadRequestError('tipoAcceso no es valido para colaborador.');
  }

  if (typeof active !== 'boolean') {
    throw new BadRequestError('active debe ser boolean.');
  }

  const updatedAccess = await restaurantModel.updateRestaurantUserAccess(
    restaurantId,
    collaboratorUserId,
    tipoAcceso,
    active
  );

  if (!updatedAccess) {
    throw new NotFoundError('Colaborador no encontrado en este restaurante.');
  }

  return {
    message: 'Acceso de colaborador actualizado correctamente.'
  };
};

const validateRestaurantAccess = async (restaurantId, userId) => {
  const access = await ensureRestaurantAccess(restaurantId, userId);

  return {
    allowed: true,
    restaurantId: Number(restaurantId),
    userId: Number(userId),
    tipoAcceso: access.tipo_acceso
  };
};

module.exports = {
  registerRestaurant,
  listMyRestaurants,
  getRestaurant,
  updateRestaurant,
  setRestaurantActive,
  listRestaurantUsers,
  createRestaurantCollaborator,
  updateRestaurantCollaboratorAccess,
  validateRestaurantAccess
};
