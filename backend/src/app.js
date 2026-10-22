import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { createTodosRouter } from "./routes/todos.js";

export function createApp({ todoStore, allowedOrigins = [] }) {
  const app = express();

  app.disable("x-powered-by");

  app.use(
    cors({
      origin(origin, callback) {
        // Requests without an Origin header (for example curl or a server-side
        // request) are allowed. Browser requests must match the allowlist.
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        const error = new Error(
          `Origin ${origin} is not allowed to access this API.`,
        );
        error.code = "CORS_NOT_ALLOWED";
        callback(error);
      },
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type"],
      maxAge: 86_400,
    }),
  );

  app.use(express.json({ limit: "10kb" }));

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
    });
  });

  app.use("/api/todos", createTodosRouter(todoStore));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
