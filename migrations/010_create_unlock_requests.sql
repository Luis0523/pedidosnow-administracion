CREATE TABLE unlock_requests (
  id SERIAL PRIMARY KEY,
  courier_id INTEGER NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_resolucion TIMESTAMP
);

CREATE INDEX idx_unlock_requests_courier_id ON unlock_requests(courier_id);
CREATE INDEX idx_unlock_requests_status ON unlock_requests(status);
