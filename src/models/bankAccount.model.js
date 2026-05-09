const db = require('../db');

const findBankByBankId = async (bankId) => {
  const result = await db.query('SELECT * FROM banks WHERE bank_id = $1 AND activo = true', [bankId]);
  return result.rows[0] || null;
};

const createBankAccount = async (bankAccount, client) => {
  const result = await client.query(
    `INSERT INTO bank_accounts (courier_id, bank_id, account_type, account_number)
    VALUES ($1, $2, $3, $4)
    RETURNING *`,
    [
      bankAccount.courierId,
      bankAccount.bankId,
      bankAccount.accountType,
      bankAccount.accountNumber
    ]
  );

  return result.rows[0];
};

const createCard = async (card, client) => {
  const result = await client.query(
    `INSERT INTO cards (bank_account_id, card_type, masked_number)
    VALUES ($1, $2, $3)
    RETURNING *`,
    [card.bankAccountId, card.cardType, card.maskedNumber]
  );

  return result.rows[0];
};

module.exports = {
  findBankByBankId,
  createBankAccount,
  createCard
};
