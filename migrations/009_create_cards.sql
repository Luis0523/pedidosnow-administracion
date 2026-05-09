CREATE TABLE cards (
  id SERIAL PRIMARY KEY,
  bank_account_id INTEGER NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  card_type VARCHAR(20) NOT NULL CHECK (card_type IN ('CREDIT', 'DEBIT')),
  masked_number VARCHAR(20) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cards_bank_account_id ON cards(bank_account_id);
