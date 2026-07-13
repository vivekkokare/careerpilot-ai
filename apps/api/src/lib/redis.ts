/**
 * Shared Redis client (ioredis) used by BullMQ and the offline queue.
 * Exported as a singleton — do not create additional connections.
 */

import Redis from "ioredis";
import { logger } from "./logger";

let _client: Redis | null = null;

export function getRedisClient(): Redis {
  if (_client) return _client;

  const url = process.env.REDIS_URL ?? "redis://localhost:6379";

  _client = new Redis(url, {
    maxRetriesPerRequest: null,   // Required by BullMQ
    enableReadyCheck:     false,
    lazyConnect:          false,
  });

  _client.on("connect",      () => logger.info("redis: connected"));
  _client.on("ready",        () => logger.info("redis: ready"));
  _client.on("error",   (err) => logger.error("redis: error", { err: err.message }));
  _client.on("reconnecting", () => logger.warn("redis: reconnecting"));

  return _client;
}

export async function closeRedis(): Promise<void> {
  if (_client) {
    await _client.quit();
    _client = null;
  }
}
