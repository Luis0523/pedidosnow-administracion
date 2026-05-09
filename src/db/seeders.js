const fs = require('fs/promises');
const path = require('path');
const { pool } = require('./index');

const seedersDir = path.join(__dirname, '../../seeders');

const runSeeders = async () => {
  const files = (await fs.readdir(seedersDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = await fs.readFile(path.join(seedersDir, file), 'utf8');
    await pool.query(sql);
    console.log(`Seeder ejecutado: ${file}`);
  }
};

module.exports = {
  runSeeders
};
