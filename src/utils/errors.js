class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.publicMessage = message;
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Solicitud invalida.') {
    super(message, 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado.') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'No autorizado.') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado.') {
    super(message, 404);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError
};
