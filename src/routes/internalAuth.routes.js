const { Router } = require('express');
const internalAuthController = require('../controllers/internalAuth.controller');
const restaurantController = require('../controllers/restaurant.controller');
const courierController = require('../controllers/courier.controller');

const router = Router();

router.post('/auth/verify-user', internalAuthController.verifyUser);
router.get('/couriers', courierController.listInternal);
router.get('/couriers/:courierId', courierController.getInternalById);
router.patch('/couriers/:courierId/status', courierController.updateInternalState);
router.get('/restaurants/:restaurantId/users/:userId/access', restaurantController.validateAccess);

module.exports = router;
