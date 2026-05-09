const bcrypt = require('bcryptjs');
const config = require('../config');

const hashPassword = (password) => bcrypt.hash(password, config.passwordSaltRounds);

const comparePassword = (password, passwordHash) => bcrypt.compare(password, passwordHash);

module.exports = {
  hashPassword,
  comparePassword
};
