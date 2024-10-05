class CustomError extends Error {
  constructor(message, code, success = false) {
    super(message);
    this.success = success;
    this.code = code;
  }
}
module.exports = { CustomError };
