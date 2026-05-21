const { Router } = require('express');
const clienteController = require('../controllers/cliente.controller');

const router = Router();

router.post('/register', clienteController.register);

module.exports = router;
