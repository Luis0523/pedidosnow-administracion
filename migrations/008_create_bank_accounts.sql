CREATE TABLE bank_accounts (
  id SERIAL PRIMARY KEY,
  courier_id INTEGER NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  bank_id INTEGER NOT NULL REFERENCES banks(id),
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('MONETARY', 'SAVINGS')),
  account_number VARCHAR(60) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bank_accounts_courier_id ON bank_accounts(courier_id);
CREATE INDEX idx_bank_accounts_bank_id ON bank_accounts(bank_id);
