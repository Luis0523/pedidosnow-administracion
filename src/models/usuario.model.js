const db = require('../db');

const findByEmail = async (correo) => {
  const result = await db.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
  return result.rows[0] || null;
};

const findAuthUserByEmail = async (correo) => {
  const result = await db.query(
    `SELECT
      u.id,
      u.nombre,
      u.apellido,
      u.correo,
      u.telefono,
      u.password_hash,
      u.activo,
      u.verificado,
      r.codigo AS role
    FROM usuarios u
    INNER JOIN roles r ON r.id = u.rol_id
    WHERE u.correo = $1`,
    [correo]
  );

  return result.rows[0] || null;
};

const findRoleByCode = async (codigo, client = db) => {
  const result = await client.query('SELECT * FROM roles WHERE codigo = $1 AND activo = true', [codigo]);
  return result.rows[0] || null;
};

const create = async (usuario, client) => {
  const result = await client.query(
    `INSERT INTO usuarios (
      rol_id,
      nombre,
      apellido,
      correo,
      telefono,
      password_hash,
      proveedor_auth,
      verificado
    ) VALUES ($1, $2, $3, $4, $5, $6, 'mock', false)
    RETURNING *`,
    [
      usuario.rolId,
      usuario.nombre,
      usuario.apellido,
      usuario.correo,
      usuario.telefono,
      usuario.passwordHash
    ]
  );

  return result.rows[0];
};

module.exports = {
  findByEmail,
  findAuthUserByEmail,
  findRoleByCode,
  create
};
