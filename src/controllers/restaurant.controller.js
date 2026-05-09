const restaurantService = require('../services/restaurant.service');

const register = async (req, res, next) => {
  try {
    const result = await restaurantService.registerRestaurant(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const listMine = async (req, res, next) => {
  try {
    const result = await restaurantService.listMyRestaurants(req.user.user_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const result = await restaurantService.getRestaurant(req.params.restaurantId, req.user.user_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await restaurantService.updateRestaurant(req.params.restaurantId, req.user.user_id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const setActive = async (req, res, next) => {
  try {
    const result = await restaurantService.setRestaurantActive(req.params.restaurantId, req.user.user_id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const result = await restaurantService.listRestaurantUsers(req.params.restaurantId, req.user.user_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const createCollaborator = async (req, res, next) => {
  try {
    const result = await restaurantService.createRestaurantCollaborator(
      req.params.restaurantId,
      req.user.user_id,
      req.body
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const updateCollaboratorAccess = async (req, res, next) => {
  try {
    const result = await restaurantService.updateRestaurantCollaboratorAccess(
      req.params.restaurantId,
      req.params.userId,
      req.user.user_id,
      req.body
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const validateAccess = async (req, res, next) => {
  try {
    const result = await restaurantService.validateRestaurantAccess(req.params.restaurantId, req.params.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  listMine,
  getById,
  update,
  setActive,
  listUsers,
  createCollaborator,
  updateCollaboratorAccess,
  validateAccess
};
