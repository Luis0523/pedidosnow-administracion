ALTER TABLE couriers
  DROP CONSTRAINT IF EXISTS couriers_operational_status_check;

ALTER TABLE couriers
  ADD CONSTRAINT couriers_operational_status_check
  CHECK (operational_status IN ('AVAILABLE', 'INACTIVE', 'OCCUPIED'));

ALTER TABLE couriers
  ADD COLUMN IF NOT EXISTS active_module VARCHAR(30),
  ADD COLUMN IF NOT EXISTS active_delivery_id VARCHAR(80);

ALTER TABLE couriers
  ADD CONSTRAINT couriers_active_module_check
  CHECK (active_module IS NULL OR active_module IN ('logistica', 'paqueteria'));

CREATE INDEX IF NOT EXISTS idx_couriers_active_module ON couriers(active_module);
CREATE INDEX IF NOT EXISTS idx_couriers_active_delivery_id ON couriers(active_delivery_id);
