const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool(config.db);

const query = (text, params) => pool.query(text, params);

const withTransaction = async (callback) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  withTransaction
};
