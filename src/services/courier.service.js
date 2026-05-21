const { withTransaction } = require('../db');
const usuarioModel = require('../models/usuario.model');
const courierModel = require('../models/courier.model');
const bankAccountModel = require('../models/bankAccount.model');
const cloudinaryService = require('./cloudinary.service');
const { hashPassword } = require('../helpers/password.helper');
const { maskAccountNumber } = require('../helpers/card.helper');
const { BadRequestError, NotFoundError } = require('../utils/errors');

const VALID_VEHICLE_TYPES = new Set(['MOTORCYCLE', 'BICYCLE', 'CAR']);
const VALID_BANK_ACCOUNT_TYPES = new Set(['MONETARY', 'SAVINGS']);
const VALID_OPERATIONAL_STATUSES = new Set(['AVAILABLE', 'INACTIVE']);
const VALID_INTERNAL_OPERATIONAL_STATUSES = new Set(['AVAILABLE', 'INACTIVE', 'OCCUPIED']);
const VALID_ASSIGNMENT_MODULES = new Set(['logistica', 'paqueteria']);
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
  const [dpiPhotoUpload, profilePhotoUpload] = await Promise.all([
    cloudinaryService.uploadImage({
      imageBase64: normalizedPayload.dpiPhotoBase64,
      folder: 'couriers/dpi',
      publicId: normalizedPayload.cui
    }),
    cloudinaryService.uploadImage({
      imageBase64: normalizedPayload.profilePhotoBase64,
      folder: 'couriers/profile',
      publicId: normalizedPayload.cui
    })
  ]);
  let createdUser;
  let createdCourier;

  await withTransaction(async (client) => {
    const courierRole = await usuarioModel.findRoleByCode('repartidor', client);
    const bank = await bankAccountModel.findBankByBankId(normalizedPayload.bankId);

    if (!courierRole) {
      throw new BadRequestError('El rol repartidor no existe. Ejecuta los seeders.');
    }

    if (!bank) {
      throw new BadRequestError('El banco seleccionado no existe o esta inactivo.');
    }

    createdUser = await usuarioModel.create(
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

    createdCourier = await courierModel.create(
      {
        usuarioId: createdUser.id,
        cui: normalizedPayload.cui,
        nit: normalizedPayload.nit,
        nationality: normalizedPayload.nationality,
        department: normalizedPayload.department,
        address: normalizedPayload.address,
        birthDate: normalizedPayload.birthDate,
        dpiPhotoBase64: normalizedPayload.dpiPhotoBase64,
        profilePhotoBase64: normalizedPayload.profilePhotoBase64,
        dpiPhotoUrl: dpiPhotoUpload.url,
        profilePhotoUrl: profilePhotoUpload.url
      },
      client
    );

    await usuarioModel.updateProfileImageUrl(createdUser.id, profilePhotoUpload.url, client);

    await courierModel.createVehicle(
      {
        courierId: createdCourier.id,
        vehicleType: normalizedPayload.vehicleType,
        licensePlate: normalizedPayload.licensePlate
      },
      client
    );

    const bankAccount = await bankAccountModel.createBankAccount(
      {
        courierId: createdCourier.id,
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
    message: 'Repartidor registrado exitosamente. Tu cuenta esta activa.',
    id: createdUser.id,
    id_usuario: createdUser.id,
    userId: createdUser.id,
    email: normalizedPayload.email,
    profilePhotoUrl: profilePhotoUpload.url,
    rol: 'repartidor',
    role: 'repartidor',
    courierId: createdCourier.id
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
    dpiPhotoUrl: profile.dpi_photo_url,
    profilePhotoUrl: profile.profile_photo_url,
    profileImageUrl: profile.profile_image_url,
    accountStatus: profile.account_status,
    operationalStatus: profile.operational_status,
    vehicleType: profile.vehicle_type,
    licensePlate: profile.license_plate
  };
};

const updateProfilePhoto = async (userId, payload = {}) => {
  const courier = await courierModel.findByUserId(userId);

  if (!courier) {
    throw new BadRequestError('No existe un perfil de repartidor para este usuario.');
  }

  const upload = await cloudinaryService.uploadImage({
    imageBase64: payload.imageBase64 || payload.profilePhotoBase64,
    folder: 'couriers/profile',
    publicId: courier.cui
  });

  await withTransaction(async (client) => {
    await courierModel.updateProfilePhotoUrlByUserId(userId, upload.url, client);
    await usuarioModel.updateProfileImageUrl(userId, upload.url, client);
  });

  return {
    message: 'Foto de perfil actualizada correctamente.',
    profilePhotoUrl: upload.url,
    profileImageUrl: upload.url
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

const mapInternalCourier = (courier) => ({
  id: courier.courier_id,
  courierId: courier.courier_id,
  userId: courier.user_id,
  firstName: courier.first_name,
  lastName: courier.last_name,
  email: courier.email,
  phone: courier.phone,
  cui: courier.cui,
  active: courier.user_active,
  accountStatus: courier.account_status,
  operationalStatus: courier.operational_status,
  estado_operativo: courier.operational_status,
  activeModule: courier.active_module,
  modulo_activo: courier.active_module,
  activeDeliveryId: courier.active_delivery_id,
  entrega_id: courier.active_delivery_id,
  vehicleType: courier.vehicle_type,
  licensePlate: courier.license_plate
});

const normalizeAssignmentModule = (module) => module?.trim().toLowerCase();

const listInternalCouriers = async (query = {}) => {
  const available = query.available === 'true' || query.disponible === 'true';
  const module = normalizeAssignmentModule(query.module || query.modulo);

  if (module && !VALID_ASSIGNMENT_MODULES.has(module)) {
    throw new BadRequestError('El modulo no es valido.');
  }

  const couriers = await courierModel.listForAssignment({ available, module });

  return couriers.map(mapInternalCourier);
};

const getInternalCourier = async (courierId) => {
  const courier = await courierModel.findInternalByCourierId(courierId);

  if (!courier) {
    throw new NotFoundError('Repartidor no encontrado.');
  }

  return mapInternalCourier(courier);
};

const updateInternalCourierState = async (courierId, payload = {}) => {
  const requestedStatus = payload.operationalStatus || payload.estado_operativo;
  const operationalStatus = requestedStatus?.trim().toUpperCase();
  const activeModule = normalizeAssignmentModule(payload.activeModule || payload.modulo_activo);
  const activeDeliveryId = payload.activeDeliveryId || payload.entrega_id;

  if (!VALID_INTERNAL_OPERATIONAL_STATUSES.has(operationalStatus)) {
    throw new BadRequestError('El estado operativo no es valido.');
  }

  if (operationalStatus === 'OCCUPIED') {
    if (!activeModule || !VALID_ASSIGNMENT_MODULES.has(activeModule)) {
      throw new BadRequestError('modulo_activo es requerido y debe ser logistica o paqueteria.');
    }

    if (!activeDeliveryId) {
      throw new BadRequestError('entrega_id es requerido cuando el repartidor queda ocupado.');
    }
  }

  const nextActiveModule = operationalStatus === 'OCCUPIED' ? activeModule : null;
  const nextActiveDeliveryId = operationalStatus === 'OCCUPIED' ? String(activeDeliveryId) : null;
  const updated = await courierModel.setAssignmentState({
    courierId,
    operationalStatus,
    activeModule: nextActiveModule,
    activeDeliveryId: nextActiveDeliveryId
  });

  if (!updated) {
    const existing = await courierModel.findInternalByCourierId(courierId);

    if (!existing) {
      throw new NotFoundError('Repartidor no encontrado.');
    }

    throw new BadRequestError('El repartidor no esta disponible para asignacion.');
  }

  return getInternalCourier(courierId);
};

module.exports = {
  registerCourier,
  getAccountStatus,
  updateAccountStatus,
  getAvailability,
  updateAvailability,
  getProfile,
  updateProfile,
  updateProfilePhoto,
  createUnlockRequest,
  listInternalCouriers,
  getInternalCourier,
  updateInternalCourierState
};
