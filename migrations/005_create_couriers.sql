CREATE TABLE couriers (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  cui VARCHAR(20) NOT NULL UNIQUE,
  nit VARCHAR(20),
  nationality VARCHAR(60) NOT NULL,
  department VARCHAR(80) NOT NULL,
  address TEXT NOT NULL,
  birth_date DATE NOT NULL,
  dpi_photo_base64 TEXT NOT NULL,
  profile_photo_base64 TEXT NOT NULL,
  account_status VARCHAR(30) NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (account_status IN ('PENDING_REVIEW', 'ACTIVE', 'BLOCKED', 'SUSPENDED_DEBT')),
  operational_status VARCHAR(20) NOT NULL DEFAULT 'INACTIVE' CHECK (operational_status IN ('AVAILABLE', 'INACTIVE')),
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_couriers_usuario_id ON couriers(usuario_id);
CREATE INDEX idx_couriers_account_status ON couriers(account_status);
CREATE INDEX idx_couriers_operational_status ON couriers(operational_status);
