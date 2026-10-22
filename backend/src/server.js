import "dotenv/config";
import { createApp } from "./app.js";
import { todoStore } from "./todoStoreInstance.js";

const DEFAULT_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

function parseAllowedOrigins(value) {
  if (!value) {
    return DEFAULT_ORIGINS;
  }

  return value
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

const port = Number(process.env.PORT) || 5000;
const allowedOrigins = parseAllowedOrigins(process.env.CLIENT_ORIGINS);

async function start() {
  await todoStore.init();

  const app = createApp({ todoStore, allowedOrigins });

  const server = app.listen(port, () => {
    console.log(`[api] Server running at http://localhost:${port}`);
    console.log(`[api] Allowed origins: ${allowedOrigins.join(", ")}`);
  });

  function shutDown(signal) {
    console.log(`\n[api] ${signal} received. Closing server...`);
    server.close(() => {
      console.log("[api] Server closed.");
      process.exit(0);
    });
  }

  process.on("SIGINT", () => shutDown("SIGINT"));
  process.on("SIGTERM", () => shutDown("SIGTERM"));
}

start().catch((error) => {
  console.error("[api] Failed to start:", error);
  process.exit(1);
});
