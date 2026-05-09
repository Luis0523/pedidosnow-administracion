const { Router } = require('express');
const restaurantController = require('../controllers/restaurant.controller');
const { requireRestaurantUser } = require('../middlewares/auth.middleware');

const router = Router();

router.post('/register', restaurantController.register);
router.get('/me', requireRestaurantUser, restaurantController.listMine);
router.get('/:restaurantId', requireRestaurantUser, restaurantController.getById);
router.put('/:restaurantId', requireRestaurantUser, restaurantController.update);
router.patch('/:restaurantId/status', requireRestaurantUser, restaurantController.setActive);
router.get('/:restaurantId/users', requireRestaurantUser, restaurantController.listUsers);
router.post('/:restaurantId/users', requireRestaurantUser, restaurantController.createCollaborator);
router.patch('/:restaurantId/users/:userId/access', requireRestaurantUser, restaurantController.updateCollaboratorAccess);

module.exports = router;
