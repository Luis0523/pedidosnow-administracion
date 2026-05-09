require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3001),
  version: process.env.APP_VERSION || 'V1.1',
  brokerUrl: process.env.BROKER_URL || 'http://localhost:3000',
  passwordSaltRounds: Number(process.env.PASSWORD_SALT_ROUNDS || 10),
  db: process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME || 'administracion_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'secret',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
      }
};

module.exports = config;
