CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  rol_id INTEGER NOT NULL REFERENCES roles(id),
  nombre VARCHAR(120) NOT NULL,
  apellido VARCHAR(120),
  correo VARCHAR(150) NOT NULL UNIQUE,
  telefono VARCHAR(30),
  password_hash VARCHAR(255) NOT NULL,
  proveedor_auth VARCHAR(50) NOT NULL DEFAULT 'mock',
  external_auth_id VARCHAR(120),
  activo BOOLEAN NOT NULL DEFAULT true,
  verificado BOOLEAN NOT NULL DEFAULT false,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usuarios_rol_id ON usuarios(rol_id);
CREATE INDEX idx_usuarios_correo ON usuarios(correo);
