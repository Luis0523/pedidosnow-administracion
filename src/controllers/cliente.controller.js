const clienteService = require('../services/cliente.service');

const register = async (req, res, next) => {
  try {
    const result = await clienteService.registerCliente(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register
};
