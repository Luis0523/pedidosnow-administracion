const courierService = require('../services/courier.service');

const register = async (req, res, next) => {
  try {
    const result = await courierService.registerCourier(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getAccountStatus = async (req, res, next) => {
  try {
    const result = await courierService.getAccountStatus(req.user.user_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const updateAccountStatus = async (req, res, next) => {
  try {
    const result = await courierService.updateAccountStatus(req.user.user_id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getAvailability = async (req, res, next) => {
  try {
    const result = await courierService.getAvailability(req.user.user_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const updateAvailability = async (req, res, next) => {
  try {
    const result = await courierService.updateAvailability(req.user.user_id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const result = await courierService.getProfile(req.user.user_id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const result = await courierService.updateProfile(req.user.user_id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const createUnlockRequest = async (req, res, next) => {
  try {
    const result = await courierService.createUnlockRequest(req.user.user_id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  getAccountStatus,
  updateAccountStatus,
  getAvailability,
  updateAvailability,
  getProfile,
  updateProfile,
  createUnlockRequest
};
