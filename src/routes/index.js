const { Router } = require('express');
const courierRoutes = require('./courier.routes');
const restaurantRoutes = require('./restaurant.routes');
const internalAuthRoutes = require('./internalAuth.routes');

const router = Router();

router.use('/couriers', courierRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/internal', internalAuthRoutes);

module.exports = router;
