/**
 * Express 4 does not automatically pass rejected promises to the error
 * middleware, so async route handlers are wrapped with this helper.
 */
export function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
