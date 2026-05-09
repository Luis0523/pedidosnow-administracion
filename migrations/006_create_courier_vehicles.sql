CREATE TABLE courier_vehicles (
  id SERIAL PRIMARY KEY,
  courier_id INTEGER NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('MOTORCYCLE', 'BICYCLE', 'CAR')),
  license_plate VARCHAR(20) NOT NULL UNIQUE,
  activo BOOLEAN NOT NULL DEFAULT true,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_courier_vehicles_courier_id ON courier_vehicles(courier_id);
