const maskAccountNumber = (accountNumber) => {
  const lastFour = String(accountNumber).slice(-4).padStart(4, '0');
  return `**** **** **** ${lastFour}`;
};

module.exports = {
  maskAccountNumber
};
