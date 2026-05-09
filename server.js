const app = require('./src/app');
const config = require('./src/config');
const { pool } = require('./src/db');
const { runMigrations } = require('./src/db/migrations');
const { runSeeders } = require('./src/db/seeders');

let server;

const start = async () => {
  await pool.query('SELECT 1');
  console.log('Base de datos conectada.');

  await runMigrations();
  await runSeeders();
  console.log('Base de datos sincronizada.');
  console.log(`PEDIDOSNOW ADMINISTRACION DEPLOY ACTIVO - ${config.version}`);

  server = app.listen(config.port, () => {
    console.log(`Administracion service listening on port ${config.port}`);
  });
};

const shutdown = async () => {
  if (!server) {
    await pool.end();
    process.exit(0);
  }

  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};

start().catch(async (error) => {
  console.error('Error al iniciar el servicio de administracion.');
  console.error(error);
  await pool.end();
  process.exit(1);
});

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
