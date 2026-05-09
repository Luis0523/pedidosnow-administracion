const { withTransaction } = require('../db');
const usuarioModel = require('../models/usuario.model');
const courierModel = require('../models/courier.model');
const bankAccountModel = require('../models/bankAccount.model');
const { hashPassword } = require('../helpers/password.helper');
const { maskAccountNumber } = require('../helpers/card.helper');
const { BadRequestError } = require('../utils/errors');

const VALID_VEHICLE_TYPES = new Set(['MOTORCYCLE', 'BICYCLE', 'CAR']);
const VALID_BANK_ACCOUNT_TYPES = new Set(['MONETARY', 'SAVINGS']);
const VALID_OPERATIONAL_STATUSES = new Set(['AVAILABLE', 'INACTIVE']);
const VALID_ACCOUNT_STATUSES = new Set(['PENDING_REVIEW', 'ACTIVE', 'BLOCKED', 'SUSPENDED_DEBT']);

const requiredFields = [
  'firstName',
  'lastName',
  'birthDate',
  'nationality',
  'department',
  'address',
  'phone',
  'email',
  'cui',
  'dpiPhotoBase64',
  'nit',
  'profilePhotoBase64',
  'vehicleType',
  'licensePlate',
  'bankAccountType',
  'bankId',
  'passwordRaw'
];

const normalizePayload = (payload) => ({
  firstName: payload.firstName?.trim(),
  lastName: payload.lastName?.trim(),
  birthDate: payload.birthDate,
  nationality: payload.nationality?.trim(),
  department: payload.department?.trim(),
  address: payload.address?.trim(),
  phone: payload.phone?.trim(),
  email: payload.email?.trim().toLowerCase(),
  cui: payload.cui?.trim(),
  dpiPhotoBase64: payload.dpiPhotoBase64,
  nit: payload.nit?.trim(),
  profilePhotoBase64: payload.profilePhotoBase64,
  vehicleType: payload.vehicleType,
  licensePlate: payload.licensePlate?.trim().toUpperCase(),
  bankAccountType: payload.bankAccountType,
  bankId: payload.bankId?.trim(),
  passwordRaw: payload.passwordRaw,
  accountNumber: payload.accountNumber?.trim() || payload.cui?.trim()
});

const validateRegistrationPayload = (payload) => {
  const missingFields = requiredFields.filter((field) => !payload[field]);

  if (missingFields.length > 0) {
    throw new BadRequestError(`Campos requeridos faltantes: ${missingFields.join(', ')}.`);
  }

  if (!payload.email.includes('@')) {
    throw new BadRequestError('El correo electronico no es valido.');
  }

  if (!VALID_VEHICLE_TYPES.has(payload.vehicleType)) {
    throw new BadRequestError('El tipo de vehiculo no es valido.');
  }

  if (!VALID_BANK_ACCOUNT_TYPES.has(payload.bankAccountType)) {
    throw new BadRequestError('El tipo de cuenta bancaria no es valido.');
  }

  if (String(payload.passwordRaw).length < 8) {
    throw new BadRequestError('La contrasena debe tener al menos 8 caracteres.');
  }
};

const ensureUniqueCourierData = async (payload) => {
  const [existingUser, existingCourier, existingVehicle] = await Promise.all([
    usuarioModel.findByEmail(payload.email),
    courierModel.findByCui(payload.cui),
    courierModel.findVehicleByLicensePlate(payload.licensePlate)
  ]);

  if (existingUser) {
    throw new BadRequestError('Ya existe un usuario registrado con ese correo.');
  }

  if (existingCourier) {
    throw new BadRequestError('Ya existe un repartidor registrado con ese CUI.');
  }

  if (existingVehicle) {
    throw new BadRequestError('Ya existe un vehiculo registrado con esa placa.');
  }
};

const registerCourier = async (payload) => {
  const normalizedPayload = normalizePayload(payload || {});

  validateRegistrationPayload(normalizedPayload);
  await ensureUniqueCourierData(normalizedPayload);

  const passwordHash = await hashPassword(normalizedPayload.passwordRaw);

  await withTransaction(async (client) => {
    const courierRole = await usuarioModel.findRoleByCode('repartidor', client);
    const bank = await bankAccountModel.findBankByBankId(normalizedPayload.bankId);

    if (!courierRole) {
      throw new BadRequestError('El rol repartidor no existe. Ejecuta los seeders.');
    }

    if (!bank) {
      throw new BadRequestError('El banco seleccionado no existe o esta inactivo.');
    }

    const user = await usuarioModel.create(
      {
        rolId: courierRole.id,
        nombre: normalizedPayload.firstName,
        apellido: normalizedPayload.lastName,
        correo: normalizedPayload.email,
        telefono: normalizedPayload.phone,
        passwordHash
      },
      client
    );

    const courier = await courierModel.create(
      {
        usuarioId: user.id,
        cui: normalizedPayload.cui,
        nit: normalizedPayload.nit,
        nationality: normalizedPayload.nationality,
        department: normalizedPayload.department,
        address: normalizedPayload.address,
        birthDate: normalizedPayload.birthDate,
        dpiPhotoBase64: normalizedPayload.dpiPhotoBase64,
        profilePhotoBase64: normalizedPayload.profilePhotoBase64
      },
      client
    );

    await courierModel.createVehicle(
      {
        courierId: courier.id,
        vehicleType: normalizedPayload.vehicleType,
        licensePlate: normalizedPayload.licensePlate
      },
      client
    );

    const bankAccount = await bankAccountModel.createBankAccount(
      {
        courierId: courier.id,
        bankId: bank.id,
        accountType: normalizedPayload.bankAccountType,
        accountNumber: normalizedPayload.accountNumber
      },
      client
    );

    await bankAccountModel.createCard(
      {
        bankAccountId: bankAccount.id,
        cardType: 'DEBIT',
        maskedNumber: maskAccountNumber(normalizedPayload.accountNumber)
      },
      client
    );
  });

  return {
    message: 'Repartidor registrado exitosamente. Tu cuenta esta activa.'
  };
};

const getAccountStatus = async (userId) => {
  const courier = await courierModel.findAccountStatusByUserId(userId);

  if (!courier) {
    throw new BadRequestError('No existe un perfil de repartidor para este usuario.');
  }

  return {
    status: courier.account_status
  };
};

const updateAccountStatus = async (userId, payload) => {
  const accountStatus = payload?.accountStatus;

  if (!VALID_ACCOUNT_STATUSES.has(accountStatus)) {
    throw new BadRequestError('El estado de cuenta no es valido.');
  }

  const courier = await courierModel.updateAccountStatusByUserId(userId, accountStatus);

  if (!courier) {
    throw new BadRequestError('No existe un perfil de repartidor para este usuario.');
  }

  return {
    message: `Estado de cuenta actualizado a ${accountStatus}.`
  };
};

const getAvailability = async (userId) => {
  const courier = await courierModel.findAvailabilityByUserId(userId);

  if (!courier) {
    throw new BadRequestError('No existe un perfil de repartidor para este usuario.');
  }

  return {
    operationalStatus: courier.operational_status
  };
};

const updateAvailability = async (userId, payload) => {
  const operationalStatus = payload?.operationalStatus;

  if (!VALID_OPERATIONAL_STATUSES.has(operationalStatus)) {
    throw new BadRequestError('El estado operativo no es valido.');
  }

  const courier = await courierModel.updateAvailabilityByUserId(userId, operationalStatus);

  if (!courier) {
    throw new BadRequestError('No existe un perfil de repartidor para este usuario.');
  }

  return {
    message: `Estado operativo actualizado a ${operationalStatus}.`
  };
};

const getProfile = async (userId) => {
  const profile = await courierModel.findProfileByUserId(userId);

  if (!profile) {
    throw new BadRequestError('No existe un perfil de repartidor para este usuario.');
  }

  return {
    firstName: profile.first_name,
    lastName: profile.last_name,
    birthDate: profile.birth_date,
    nationality: profile.nationality,
    department: profile.department,
    address: profile.address,
    phone: profile.phone,
    email: profile.email,
    cui: profile.cui,
    nit: profile.nit,
    dpiPhotoBase64: profile.dpi_photo_base64,
    profilePhotoBase64: profile.profile_photo_base64,
    accountStatus: profile.account_status,
    operationalStatus: profile.operational_status,
    vehicleType: profile.vehicle_type,
    licensePlate: profile.license_plate
  };
};

const updateProfile = async (userId, payload) => {
  const address = payload?.address?.trim();
  const phone = payload?.phone?.trim();
  const vehicleType = payload?.vehicleType;
  const licensePlate = payload?.licensePlate?.trim().toUpperCase();

  if (!address || !phone || !vehicleType || !licensePlate) {
    throw new BadRequestError('address, phone, vehicleType y licensePlate son requeridos.');
  }

  if (!VALID_VEHICLE_TYPES.has(vehicleType)) {
    throw new BadRequestError('El tipo de vehiculo no es valido.');
  }

  const existingVehicle = await courierModel.findVehicleByLicensePlate(licensePlate);
  const currentProfile = await courierModel.findProfileByUserId(userId);

  if (!currentProfile) {
    throw new BadRequestError('No existe un perfil de repartidor para este usuario.');
  }

  if (existingVehicle && existingVehicle.courier_id !== currentProfile.courier_id) {
    throw new BadRequestError('Ya existe un vehiculo registrado con esa placa.');
  }

  await courierModel.updateProfileByUserId(userId, {
    address,
    phone,
    vehicleType,
    licensePlate
  });

  return {
    message: 'Perfil actualizado correctamente.'
  };
};

const createUnlockRequest = async (userId, payload) => {
  const reason = payload?.reason?.trim();

  if (!reason) {
    throw new BadRequestError('reason es requerido.');
  }

  const courier = await courierModel.findByUserId(userId);

  if (!courier) {
    throw new BadRequestError('No existe un perfil de repartidor para este usuario.');
  }

  await courierModel.createUnlockRequest(courier.id, reason);

  return {
    message: 'Tu solicitud de desbloqueo ha sido enviada al equipo de administracion.'
  };
};

module.exports = {
  registerCourier,
  getAccountStatus,
  updateAccountStatus,
  getAvailability,
  updateAvailability,
  getProfile,
  updateProfile,
  createUnlockRequest
};
