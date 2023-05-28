class OutOfCoinsError extends Error {
  constructor(message) {
    super(message);
    this.name = 'Buy Coins';
  }
}

module.exports = { OutOfCoinsError};