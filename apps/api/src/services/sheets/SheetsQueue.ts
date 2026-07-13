/**
 * BullMQ queue definition for sheets sync jobs.
 *
 * Job types:
 *   UPSERT_ROW   — create or update one application's sheet row
 *   DELETE_ROW   — clear one application's sheet row
 *   FULL_SYNC    — reconcile entire DB → Sheet (and Sheet → DB for remote_wins strategy)
 *   DRAIN_OFFLINE — replay jobs queued while Redis was unavailable
 *
 * Retry policy: exponential backoff (base × 2^attempt), capped at 30 min.
 * Dead-letter: after maxRetries the job moves to the "failed" set in BullMQ's
 * built-in DLQ — visible in the BullMQ dashboard (Bull Board).
 */

import { Queue, type JobsOptions } from "bullmq";
import { getRedisClient } from "../../lib/redis";
import { getSheetsConfig } from "../../config/sheets";
import { sheetsLogger } from "../../lib/logger";

// ── Job type definitions ──────────────────────────────────────────────────

export type SheetsJobType = "UPSERT_ROW" | "DELETE_ROW" | "FULL_SYNC" | "DRAIN_OFFLINE";

export interface UpsertRowJob {
  type:          "UPSERT_ROW";
  applicationId: string;
  applicationNum: number;
  userId:        string;
  trigger:       "create" | "update" | "delete-then-recreate";
}

export interface DeleteRowJob {
  type:          "DELETE_ROW";
  applicationId: string;
  applicationNum: number;
  sheetsRow:     number;
  userId:        string;
}

export interface FullSyncJob {
  type:   "FULL_SYNC";
  userId: string;
  reason: string;
}

export interface DrainOfflineJob {
  type:   "DRAIN_OFFLINE";
  userId: string;
}

export type SheetsJobData =
  | UpsertRowJob
  | DeleteRowJob
  | FullSyncJob
  | DrainOfflineJob;

// ── Queue name ─────────────────────────────────────────────────────────────

export const SHEETS_QUEUE_NAME = "sheets-sync";

// ── Singleton queue ────────────────────────────────────────────────────────

let _queue: Queue<SheetsJobData> | null = null;

export function getSheetsQueue(): Queue<SheetsJobData> {
  if (_queue) return _queue;

  _queue = new Queue<SheetsJobData>(SHEETS_QUEUE_NAME, {
    connection: getRedisClient(),
    defaultJobOptions: defaultJobOptions(),
  });

  _queue.on("error", (err) => {
    sheetsLogger.error("queue: error", { err: err.message });
  });

  return _queue;
}

function defaultJobOptions(): JobsOptions {
  const cfg = getSheetsConfig();
  return {
    attempts: cfg.maxRetries,
    backoff: {
      type:  "exponential",
      delay: cfg.retryBaseDelayMs,
    },
    removeOnComplete: { count: 500 },
    removeOnFail:     { count: 200 },
  };
}

// ── Enqueue helpers ────────────────────────────────────────────────────────

export async function enqueueUpsert(
  applicationId: string,
  applicationNum: number,
  userId: string,
  trigger: UpsertRowJob["trigger"] = "update",
): Promise<void> {
  if (!getSheetsConfig().enabled) return;

  const q = getSheetsQueue();
  const jobId = `upsert:${applicationNum}`;

  // De-duplicate: if a job for the same application is already waiting, remove it
  // (the new enqueue supersedes it)
  const existing = await q.getJob(jobId);
  if (existing) {
    const state = await existing.getState();
    if (state === "waiting" || state === "delayed") {
      await existing.remove();
    }
  }

  await q.add(
    "upsert-row",
    { type: "UPSERT_ROW", applicationId, applicationNum, userId, trigger },
    { jobId, priority: 10 },
  );

  sheetsLogger.debug("queue: enqueued upsert", { applicationNum, trigger });
}

export async function enqueueDelete(
  applicationId: string,
  applicationNum: number,
  sheetsRow: number,
  userId: string,
): Promise<void> {
  if (!getSheetsConfig().enabled) return;

  await getSheetsQueue().add(
    "delete-row",
    { type: "DELETE_ROW", applicationId, applicationNum, sheetsRow, userId },
    { priority: 10 },
  );

  sheetsLogger.debug("queue: enqueued delete", { applicationNum, sheetsRow });
}

export async function enqueueFullSync(userId: string, reason = "manual"): Promise<void> {
  if (!getSheetsConfig().enabled) return;

  await getSheetsQueue().add(
    "full-sync",
    { type: "FULL_SYNC", userId, reason },
    { jobId: `full-sync:${userId}`, priority: 5 },
  );

  sheetsLogger.info("queue: enqueued full sync", { reason });
}

// ── Offline queue (Redis LPUSH / LRANGE fallback) ─────────────────────────
//
// When the BullMQ queue is unavailable (Redis disconnected) we fall back to
// storing pending operations as JSON in a Redis list.  A DRAIN_OFFLINE job
// is enqueued once connectivity is restored to replay them.
//
// Key: "sheets:offline:{userId}"

const OFFLINE_KEY = (uid: string) => `sheets:offline:${uid}`;

export async function pushOfflineOp(data: SheetsJobData): Promise<void> {
  const redis = getRedisClient();
  const uid   = "userId" in data ? data.userId : "system";
  await redis.lpush(OFFLINE_KEY(uid), JSON.stringify(data));
  sheetsLogger.warn("offline_queue: op queued", { type: data.type });
}

export async function popOfflineOps(userId: string): Promise<SheetsJobData[]> {
  const redis = getRedisClient();
  const key   = OFFLINE_KEY(userId);
  const raw   = await redis.lrange(key, 0, -1);
  await redis.del(key);

  return raw
    .map(s => { try { return JSON.parse(s) as SheetsJobData; } catch { return null; } })
    .filter((x): x is SheetsJobData => x !== null)
    .reverse();  // LPUSH means newest-first; reverse to replay oldest-first
}

export async function getOfflineQueueLength(userId: string): Promise<number> {
  return getRedisClient().llen(OFFLINE_KEY(userId));
}
