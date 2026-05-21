const { Router } = require('express');
const clienteController = require('../controllers/cliente.controller');
const { requireCliente } = require('../middlewares/auth.middleware');

const router = Router();

router.post('/register', clienteController.register);
router.get('/me', requireCliente, clienteController.getProfile);

module.exports = router;
