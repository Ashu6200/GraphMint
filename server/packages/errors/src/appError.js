class AppError extends Error {
  constructor(
    message = 'Unexpected error occurred',
    statusCode = 500,
    code = 'APP_ERROR',
    errors = null,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.success = false;
    this.name = 'AppError';
    this.errors = errors;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
export default AppError;
