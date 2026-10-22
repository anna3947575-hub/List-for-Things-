/**
 * An error that is safe to expose to API clients.
 * Anything that is not an HttpError is treated as an unexpected server error.
 */
export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
