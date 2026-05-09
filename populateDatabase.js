const { pool } = require('./src/db');
const { runSeeders } = require('./src/db/seeders');

const run = async () => {
  await runSeeders();
  console.log('Seeders de base de datos completados.');
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
