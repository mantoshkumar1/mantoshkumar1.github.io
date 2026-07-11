export class AppError extends Error {
  constructor(status, code, message, options = {}) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.retryAfter = options.retryAfter;
  }
}

export const badRequest = (message) => new AppError(400, "invalid_request", message);

export function toAppError(error) {
  if (error instanceof AppError) return error;
  console.error("Unhandled worker error", error instanceof Error ? error.message : error);
  return new AppError(500, "internal_error", "An unexpected error occurred.");
}
