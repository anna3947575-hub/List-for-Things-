import { HttpError } from "../lib/httpError.js";

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} was not found.`,
    },
  });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  // Invalid JSON is caught by Express's built-in JSON body parser.
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "The request body contains invalid JSON.",
      },
    });
  }

  if (error instanceof HttpError) {
    const payload = {
      code: error.code,
      message: error.message,
    };

    if (error.details) {
      payload.details = error.details;
    }

    return res.status(error.status).json({ error: payload });
  }

  if (error.code === "CORS_NOT_ALLOWED") {
    return res.status(403).json({
      error: {
        code: "CORS_NOT_ALLOWED",
        message: error.message,
      },
    });
  }

  // Log unexpected errors, but never leak stack traces to the client.
  console.error("[api] Unexpected error:", error);

  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong on the server. Please try again.",
    },
  });
}
