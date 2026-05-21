const { Router } = require('express');
const courierRoutes = require('./courier.routes');
const restaurantRoutes = require('./restaurant.routes');
const clienteRoutes = require('./cliente.routes');
const internalAuthRoutes = require('./internalAuth.routes');
const internalAuthController = require('../controllers/internalAuth.controller');

const router = Router();

router.post('/auth/login', internalAuthController.verifyUser);
router.use('/couriers', courierRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/clientes', clienteRoutes);
router.use('/internal', internalAuthRoutes);

module.exports = router;
