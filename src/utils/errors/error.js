class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
  }
}

class DatabaseError extends Error {
  constructor(message) {
    super(message);
    this.name = "DatabaseError";
    this.statusCode = 500;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
}

class CustomError extends Error {
    constructor(message, code, success = false) {
      super(message);
      this.success = success;
      this.code = code;
    }
  }
module.exports = { DatabaseError, NotFoundError, ValidationError ,CustomError };
