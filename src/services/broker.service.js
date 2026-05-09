const config = require('../config');
const { UnauthorizedError } = require('../utils/errors');

const validateToken = async (token) => {
  const response = await fetch(`${config.brokerUrl}/api/auth/validate`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new UnauthorizedError('Token invalido o expirado.');
  }

  return response.json();
};

module.exports = {
  validateToken
};
