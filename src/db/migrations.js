const fs = require('fs/promises');
const path = require('path');
const { pool } = require('./index');

const migrationsDir = path.join(__dirname, '../../migrations');

const ensureMigrationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const getExecutedMigrations = async () => {
  const result = await pool.query('SELECT filename FROM schema_migrations');
  return new Set(result.rows.map((row) => row.filename));
};

const runMigrations = async () => {
  await ensureMigrationsTable();

  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const executedMigrations = await getExecutedMigrations();

  for (const file of files) {
    if (executedMigrations.has(file)) {
      continue;
    }

    const client = await pool.connect();

    try {
      const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`Migracion ejecutada: ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = {
  runMigrations
};
