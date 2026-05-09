const internalAuthService = require('../services/internalAuth.service');

const verifyUser = async (req, res, next) => {
  try {
    const result = await internalAuthService.verifyUser(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyUser
};
