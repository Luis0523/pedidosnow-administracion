const db = require('../db');

const VALID_ACCESS = ['owner', 'admin_restaurante', 'operador', 'solo_lectura'];

const createRestaurant = async (restaurant, client) => {
  const result = await client.query(
    `INSERT INTO restaurantes (nombre, descripcion, telefono, direccion)
    VALUES ($1, $2, $3, $4)
    RETURNING *`,
    [restaurant.nombre, restaurant.descripcion, restaurant.telefono, restaurant.direccion]
  );

  return result.rows[0];
};

const createRestaurantUser = async (restaurantUser, client) => {
  const result = await client.query(
    `INSERT INTO restaurante_usuarios (restaurante_id, usuario_id, tipo_acceso)
    VALUES ($1, $2, $3)
    RETURNING *`,
    [restaurantUser.restauranteId, restaurantUser.usuarioId, restaurantUser.tipoAcceso]
  );

  return result.rows[0];
};

const findById = async (restaurantId) => {
  const result = await db.query('SELECT * FROM restaurantes WHERE id = $1', [restaurantId]);
  return result.rows[0] || null;
};

const findByUserId = async (userId) => {
  const result = await db.query(
    `SELECT
      r.id,
      r.nombre,
      r.descripcion,
      r.telefono,
      r.direccion,
      r.activo,
      ru.tipo_acceso
    FROM restaurantes r
    INNER JOIN restaurante_usuarios ru ON ru.restaurante_id = r.id
    WHERE ru.usuario_id = $1
      AND ru.activo = true
      AND r.activo = true
    ORDER BY r.nombre ASC`,
    [userId]
  );

  return result.rows;
};

const findAccess = async (restaurantId, userId) => {
  const result = await db.query(
    `SELECT * FROM restaurante_usuarios
    WHERE restaurante_id = $1
      AND usuario_id = $2
      AND activo = true`,
    [restaurantId, userId]
  );

  return result.rows[0] || null;
};

const findUsersByRestaurantId = async (restaurantId) => {
  const result = await db.query(
    `SELECT
      u.id,
      u.nombre,
      u.apellido,
      u.correo,
      u.telefono,
      u.activo,
      u.verificado,
      ru.tipo_acceso,
      ru.activo AS acceso_activo
    FROM restaurante_usuarios ru
    INNER JOIN usuarios u ON u.id = ru.usuario_id
    WHERE ru.restaurante_id = $1
    ORDER BY u.nombre ASC`,
    [restaurantId]
  );

  return result.rows;
};

const updateRestaurant = async (restaurantId, restaurant) => {
  const result = await db.query(
    `UPDATE restaurantes
    SET nombre = $2,
      descripcion = $3,
      telefono = $4,
      direccion = $5,
      fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *`,
    [restaurantId, restaurant.nombre, restaurant.descripcion, restaurant.telefono, restaurant.direccion]
  );

  return result.rows[0] || null;
};

const setRestaurantActive = async (restaurantId, active) => {
  const result = await db.query(
    `UPDATE restaurantes
    SET activo = $2,
      fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *`,
    [restaurantId, active]
  );

  return result.rows[0] || null;
};

const updateRestaurantUserAccess = async (restaurantId, userId, accessType, active) => {
  const result = await db.query(
    `UPDATE restaurante_usuarios
    SET tipo_acceso = $3,
      activo = $4
    WHERE restaurante_id = $1
      AND usuario_id = $2
    RETURNING *`,
    [restaurantId, userId, accessType, active]
  );

  return result.rows[0] || null;
};

module.exports = {
  VALID_ACCESS,
  createRestaurant,
  createRestaurantUser,
  findById,
  findByUserId,
  findAccess,
  findUsersByRestaurantId,
  updateRestaurant,
  setRestaurantActive,
  updateRestaurantUserAccess
};
