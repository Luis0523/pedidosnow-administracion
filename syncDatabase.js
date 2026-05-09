const { pool } = require('./src/db');
const { runMigrations } = require('./src/db/migrations');

const run = async () => {
  await runMigrations();
  console.log('Base de datos sincronizada.');
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
