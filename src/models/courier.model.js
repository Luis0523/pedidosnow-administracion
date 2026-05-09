const db = require('../db');

const findByUserId = async (usuarioId) => {
  const result = await db.query('SELECT * FROM couriers WHERE usuario_id = $1', [usuarioId]);
  return result.rows[0] || null;
};

const findAccountStatusByUserId = async (usuarioId) => {
  const result = await db.query(
    'SELECT account_status FROM couriers WHERE usuario_id = $1',
    [usuarioId]
  );

  return result.rows[0] || null;
};

const findAvailabilityByUserId = async (usuarioId) => {
  const result = await db.query(
    'SELECT operational_status FROM couriers WHERE usuario_id = $1',
    [usuarioId]
  );

  return result.rows[0] || null;
};

const updateAccountStatusByUserId = async (usuarioId, accountStatus) => {
  const result = await db.query(
    `UPDATE couriers
    SET account_status = $2,
      fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE usuario_id = $1
    RETURNING *`,
    [usuarioId, accountStatus]
  );

  return result.rows[0] || null;
};

const findProfileByUserId = async (usuarioId) => {
  const result = await db.query(
    `SELECT
      u.id AS user_id,
      u.nombre AS first_name,
      u.apellido AS last_name,
      u.correo AS email,
      u.telefono AS phone,
      c.id AS courier_id,
      c.cui,
      c.nit,
      c.nationality,
      c.department,
      c.address,
      c.birth_date,
      c.dpi_photo_base64,
      c.profile_photo_base64,
      c.account_status,
      c.operational_status,
      cv.id AS vehicle_id,
      cv.vehicle_type,
      cv.license_plate
    FROM usuarios u
    INNER JOIN couriers c ON c.usuario_id = u.id
    LEFT JOIN courier_vehicles cv ON cv.courier_id = c.id AND cv.activo = true
    WHERE u.id = $1
    ORDER BY cv.id ASC
    LIMIT 1`,
    [usuarioId]
  );

  return result.rows[0] || null;
};

const updateAvailabilityByUserId = async (usuarioId, operationalStatus) => {
  const result = await db.query(
    `UPDATE couriers
    SET operational_status = $2,
      fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE usuario_id = $1
    RETURNING *`,
    [usuarioId, operationalStatus]
  );

  return result.rows[0] || null;
};

const updateProfileByUserId = async (usuarioId, profile) => db.withTransaction(async (client) => {
  const courierResult = await client.query(
    `UPDATE couriers
    SET address = $2,
      fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE usuario_id = $1
    RETURNING *`,
    [usuarioId, profile.address]
  );

  const courier = courierResult.rows[0] || null;

  if (!courier) {
    return null;
  }

  await client.query(
    `UPDATE usuarios
    SET telefono = $2,
      fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id = $1`,
    [usuarioId, profile.phone]
  );

  await client.query(
    `UPDATE courier_vehicles
    SET vehicle_type = $2,
      license_plate = $3
    WHERE courier_id = $1
      AND activo = true`,
    [courier.id, profile.vehicleType, profile.licensePlate]
  );

  return courier;
});

const createUnlockRequest = async (courierId, reason) => {
  const result = await db.query(
    `INSERT INTO unlock_requests (courier_id, reason)
    VALUES ($1, $2)
    RETURNING *`,
    [courierId, reason]
  );

  return result.rows[0];
};

const findByCui = async (cui) => {
  const result = await db.query('SELECT * FROM couriers WHERE cui = $1', [cui]);
  return result.rows[0] || null;
};

const findVehicleByLicensePlate = async (licensePlate) => {
  const result = await db.query('SELECT * FROM courier_vehicles WHERE license_plate = $1', [licensePlate]);
  return result.rows[0] || null;
};

const create = async (courier, client) => {
  const result = await client.query(
    `INSERT INTO couriers (
      usuario_id,
      cui,
      nit,
      nationality,
      department,
      address,
      birth_date,
      dpi_photo_base64,
      profile_photo_base64,
      account_status,
      operational_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ACTIVE', 'INACTIVE')
    RETURNING *`,
    [
      courier.usuarioId,
      courier.cui,
      courier.nit,
      courier.nationality,
      courier.department,
      courier.address,
      courier.birthDate,
      courier.dpiPhotoBase64,
      courier.profilePhotoBase64
    ]
  );

  return result.rows[0];
};

const createVehicle = async (vehicle, client) => {
  const result = await client.query(
    `INSERT INTO courier_vehicles (courier_id, vehicle_type, license_plate)
    VALUES ($1, $2, $3)
    RETURNING *`,
    [vehicle.courierId, vehicle.vehicleType, vehicle.licensePlate]
  );

  return result.rows[0];
};

module.exports = {
  findByUserId,
  findAccountStatusByUserId,
  findAvailabilityByUserId,
  updateAccountStatusByUserId,
  findProfileByUserId,
  updateAvailabilityByUserId,
  updateProfileByUserId,
  createUnlockRequest,
  findByCui,
  findVehicleByLicensePlate,
  create,
  createVehicle
};
