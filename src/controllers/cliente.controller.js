const clienteService = require('../services/cliente.service');
const usuarioModel = require('../models/usuario.model');

const register = async (req, res, next) => {
  try {
    const result = await clienteService.registerCliente(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await usuarioModel.findById(req.user.user_id);

    if (!user) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }

    res.json({
      id: user.id,
      id_usuario: user.id,
      userId: user.id,
      firstName: user.nombre,
      lastName: user.apellido,
      email: user.correo,
      rol: user.rol,
      role: user.rol
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  getProfile
};
