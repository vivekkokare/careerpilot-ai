/**
 * BullMQ worker process for sheets sync jobs.
 *
 * Run with:  npm run worker  (tsx src/workers/sheetsWorker.ts)
 * In production: separate container / process alongside the API.
 *
 * The worker is intentionally isolated so it can be scaled independently
 * and restarted without affecting the main API server.
 */

import { Worker, type Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { getRedisClient, closeRedis } from "../lib/redis";
import { getAuthenticatedClient } from "../lib/googleAuth";
import { SheetsSync } from "../services/sheets/SheetsSync";
import { getSheetsConfig } from "../config/sheets";
import {
  SHEETS_QUEUE_NAME,
  popOfflineOps,
  type SheetsJobData,
} from "../services/sheets/SheetsQueue";
import { sheetsLogger, logger } from "../lib/logger";

// ── Bootstrap ──────────────────────────────────────────────────────────────

const prisma = new PrismaClient({
  log: [{ level: "error", emit: "event" }],
});

prisma.$on("error" as never, (e: unknown) => {
  logger.error("prisma: error", { err: e });
});

// ── Job processor ──────────────────────────────────────────────────────────

async function processJob(job: Job<SheetsJobData>): Promise<void> {
  const data   = job.data;
  const userId = "userId" in data ? data.userId : "system";
  const cfg    = getSheetsConfig();

  sheetsLogger.info("worker: processing job", {
    jobId:   job.id,
    type:    data.type,
    attempt: job.attemptsMade + 1,
    max:     cfg.maxRetries,
  });

  let auth;
  try {
    auth = await getAuthenticatedClient(userId, prisma);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // If no OAuth token → fail permanently (don't retry)
    if (msg.includes("No Google OAuth token")) {
      sheetsLogger.error("worker: no OAuth token — moving to DLQ", { userId });
      throw Object.assign(new Error(msg), { failedReason: "no_oauth_token" });
    }
    throw err;
  }

  const sync = new SheetsSync(auth, prisma, userId);

  switch (data.type) {
    case "UPSERT_ROW": {
      const result = await sync.upsertRow(data.applicationId);
      if (!result.ok && !result.conflict) {
        throw new Error(result.message ?? "upsert failed");
      }
      break;
    }

    case "DELETE_ROW": {
      const result = await sync.deleteRow(data.applicationId, data.sheetsRow);
      if (!result.ok) throw new Error(result.message ?? "delete failed");
      break;
    }

    case "FULL_SYNC": {
      const report = await sync.fullSync();
      sheetsLogger.info("worker: full sync complete", report);
      job.updateProgress(100);
      break;
    }

    case "DRAIN_OFFLINE": {
      await sync.drainOfflineQueue();
      break;
    }

    default:
      sheetsLogger.warn("worker: unknown job type", { data });
  }

  // Log SHEETS_SYNCED activity
  if (data.type !== "FULL_SYNC" && data.type !== "DRAIN_OFFLINE") {
    const applicationId = "applicationId" in data ? data.applicationId : null;
    if (applicationId) {
      await prisma.activity.create({
        data: {
          userId,
          applicationId,
          type:      "SHEETS_SYNCED",
          summary:   `Sheets ${data.type === "DELETE_ROW" ? "row cleared" : "row synced"}`,
          source:    "sheets-worker",
          occurredAt: new Date(),
        },
      });
    }
  }
}

// ── Worker instance ────────────────────────────────────────────────────────

function createWorker() {
  const cfg = getSheetsConfig();

  const worker = new Worker<SheetsJobData>(
    SHEETS_QUEUE_NAME,
    processJob,
    {
      connection: getRedisClient(),
      concurrency: 2,
      limiter: {
        max:      10,   // max 10 jobs
        duration: 1000, // per 1 second (Google Sheets API rate limit)
      },
    },
  );

  worker.on("completed", (job) => {
    sheetsLogger.debug("worker: job completed", { jobId: job.id, type: job.data.type });
  });

  worker.on("failed", (job, err) => {
    sheetsLogger.error("worker: job failed", {
      jobId:   job?.id,
      type:    job?.data?.type,
      attempt: job?.attemptsMade,
      err:     err.message,
    });
  });

  worker.on("stalled", (jobId) => {
    sheetsLogger.warn("worker: job stalled", { jobId });
  });

  worker.on("error", (err) => {
    sheetsLogger.error("worker: error", { err: err.message });
  });

  return worker;
}

// ── Graceful shutdown ──────────────────────────────────────────────────────

function setupGracefulShutdown(worker: Worker) {
  async function shutdown(signal: string) {
    logger.info(`worker: ${signal} received — shutting down`);
    await worker.close();
    await prisma.$disconnect();
    await closeRedis();
    process.exit(0);
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));
}

// ── Periodic full sync ─────────────────────────────────────────────────────

function startPeriodicSync(userId: string) {
  const cfg = getSheetsConfig();
  if (!cfg.syncIntervalMs || cfg.syncIntervalMs <= 0) return;

  setInterval(async () => {
    const { getSheetsQueue } = await import("../services/sheets/SheetsQueue");
    await getSheetsQueue().add(
      "full-sync",
      { type: "FULL_SYNC", userId, reason: "periodic" },
      { jobId: `full-sync:${userId}:periodic`, priority: 1 },
    );
    sheetsLogger.debug("worker: periodic full-sync enqueued");
  }, cfg.syncIntervalMs);
}

// ── Entry point ────────────────────────────────────────────────────────────

async function main() {
  const cfg = getSheetsConfig();

  if (!cfg.enabled) {
    logger.info("sheets_worker: SHEETS_ENABLED=false — worker not starting");
    process.exit(0);
  }

  logger.info("sheets_worker: starting", {
    queue:    SHEETS_QUEUE_NAME,
    strategy: cfg.conflictStrategy,
    interval: cfg.syncIntervalMs,
  });

  const worker = createWorker();
  setupGracefulShutdown(worker);

  // Kick off a full sync on worker start for the local user
  const LOCAL_USER_ID = "local_user_00000000000";
  const { enqueueFullSync } = await import("../services/sheets/SheetsQueue");
  await enqueueFullSync(LOCAL_USER_ID, "worker-start");

  startPeriodicSync(LOCAL_USER_ID);

  logger.info("sheets_worker: ready");
}

main().catch((err) => {
  logger.error("sheets_worker: fatal startup error", { err });
  process.exit(1);
});
