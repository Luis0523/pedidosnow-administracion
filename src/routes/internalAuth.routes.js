const { Router } = require('express');
const internalAuthController = require('../controllers/internalAuth.controller');
const restaurantController = require('../controllers/restaurant.controller');

const router = Router();

router.post('/auth/verify-user', internalAuthController.verifyUser);
router.get('/restaurants/:restaurantId/users/:userId/access', restaurantController.validateAccess);

module.exports = router;
