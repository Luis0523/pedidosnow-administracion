const usuarioModel = require('../models/usuario.model');
const { hashPassword } = require('../helpers/password.helper');
const { BadRequestError } = require('../utils/errors');

const requiredFields = ['firstName', 'email', 'passwordRaw'];

const normalizePayload = (payload) => ({
  firstName: payload.firstName?.trim(),
  lastName: payload.lastName?.trim(),
  email: payload.email?.trim().toLowerCase(),
  phone: payload.phone?.trim(),
  passwordRaw: payload.passwordRaw
});

const validatePayload = (payload) => {
  const missingFields = requiredFields.filter((field) => !payload[field]);

  if (missingFields.length > 0) {
    throw new BadRequestError(`Campos requeridos faltantes: ${missingFields.join(', ')}.`);
  }

  if (!payload.email.includes('@')) {
    throw new BadRequestError('El correo electronico no es valido.');
  }

  if (String(payload.passwordRaw).length < 8) {
    throw new BadRequestError('La contrasena debe tener al menos 8 caracteres.');
  }
};

const registerCliente = async (payload) => {
  const normalized = normalizePayload(payload || {});

  validatePayload(normalized);

  const existing = await usuarioModel.findByEmail(normalized.email);

  if (existing) {
    throw new BadRequestError('Ya existe un usuario registrado con ese correo.');
  }

  const passwordHash = await hashPassword(normalized.passwordRaw);
  const clienteRole = await usuarioModel.findRoleByCode('cliente');

  if (!clienteRole) {
    throw new BadRequestError('El rol cliente no existe. Ejecuta los seeders.');
  }

  const user = await usuarioModel.create({
    rolId: clienteRole.id,
    nombre: normalized.firstName,
    apellido: normalized.lastName,
    correo: normalized.email,
    telefono: normalized.phone,
    passwordHash
  });

  return {
    message: 'Cliente registrado exitosamente.',
    id: user.id,
    id_usuario: user.id,
    userId: user.id,
    email: user.correo,
    firstName: user.nombre,
    lastName: user.apellido,
    phone: user.telefono,
    rol: 'cliente',
    role: 'cliente'
  };
};

module.exports = {
  registerCliente
};
