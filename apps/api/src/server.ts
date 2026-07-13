/**
 * career-ops REST API server
 *
 * Single-user local mode: CAREER_OPS_AUTH=none (default).
 * All routes are prefixed /api/v1/.
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { json } from "express";
import { careerOpsRouter } from "./routes/careerOps";
import sheetsRouter from "./routes/sheets";
import { assistantRouter } from "./routes/assistant";
import { logger } from "./lib/logger";

const app  = express();
const port = parseInt(process.env.PORT ?? "3001", 10);
const isDev = process.env.NODE_ENV !== "production";

// ── Middleware ───────────────────────────────────────────────────────────────

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: isDev ? "*" : process.env.ALLOWED_ORIGIN, credentials: true }));
app.use(compression() as express.RequestHandler);
app.use(json({ limit: "2mb" }));
app.use(morgan(isDev ? "dev" : "combined", {
  stream: { write: (msg) => logger.http(msg.trimEnd()) },
}));

// ── Routes ───────────────────────────────────────────────────────────────────

app.get("/api/v1/health", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString(), version: process.env.npm_package_version ?? "1.0.0" });
});

app.use("/api/v1/career-ops", careerOpsRouter);
app.use("/api/v1/sheets",     sheetsRouter);
app.use("/api/v1/assistant",  assistantRouter);

// ── Error handler ────────────────────────────────────────────────────────────

app.use((err: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Zod validation errors
  if (err.name === "ZodError") {
    return res.status(400).json({ ok: false, error: "Validation error", details: (err as unknown as { issues: unknown[] }).issues });
  }
  const status = err.status ?? 500;
  logger.error("unhandled", { message: err.message, stack: isDev ? err.stack : undefined });
  return res.status(status).json({ ok: false, error: isDev ? err.message : "Internal server error" });
});

// ── Start ────────────────────────────────────────────────────────────────────

const server = app.listen(port, "127.0.0.1", () => {
  logger.info(`career-ops API listening on http://127.0.0.1:${port}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received — shutting down");
  server.close(() => process.exit(0));
});

export { app };
