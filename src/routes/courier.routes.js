const { Router } = require('express');
const courierController = require('../controllers/courier.controller');
const { requireCourier } = require('../middlewares/auth.middleware');

const router = Router();

router.post('/register', courierController.register);
router.get('/me/account-status', requireCourier, courierController.getAccountStatus);
router.patch('/me/account-status', requireCourier, courierController.updateAccountStatus);
router.get('/me/availability', requireCourier, courierController.getAvailability);
router.patch('/me/availability', requireCourier, courierController.updateAvailability);
router.get('/me', requireCourier, courierController.getProfile);
router.put('/me', requireCourier, courierController.updateProfile);
router.post('/me/unlock-request', requireCourier, courierController.createUnlockRequest);

module.exports = router;
