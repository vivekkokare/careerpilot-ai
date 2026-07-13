/**
 * Sheets sync REST routes.
 *
 * GET    /api/v1/sheets/status          — sync status + last sync time
 * GET    /api/v1/sheets/config          — current config (no secrets)
 * POST   /api/v1/sheets/sync            — trigger full sync immediately
 * GET    /api/v1/sheets/conflicts       — list unresolved conflicts
 * PATCH  /api/v1/sheets/conflicts/:id   — resolve a conflict
 * GET    /api/v1/sheets/logs            — recent sync log entries (from BullMQ)
 * GET    /api/v1/auth/google            — start OAuth flow
 * GET    /api/v1/auth/google/callback   — OAuth callback
 * DELETE /api/v1/sheets/auth            — revoke Google token
 */

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import {
  getAuthUrl,
  exchangeCodeAndStore,
  revokeAndDeleteToken,
  getAuthenticatedClient,
} from "../lib/googleAuth";
import { SheetsSync } from "../services/sheets/SheetsSync";
import { ConflictResolver } from "../services/sheets/ConflictResolver";
import {
  enqueueFullSync,
  getSheetsQueue,
  getOfflineQueueLength,
} from "../services/sheets/SheetsQueue";
import { getSheetsConfig } from "../config/sheets";
import { sheetsLogger } from "../lib/logger";

const router = Router();

// ── Auth guard helper (local mode uses a fixed user ID) ────────────────────

function getUserId(req: Request): string {
  return (req as any).userId ?? "local_user_00000000000";
}

function getPrisma(req: Request): PrismaClient {
  return (req as any).prisma as PrismaClient;
}

// ── Status ─────────────────────────────────────────────────────────────────

router.get("/status", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const prisma = getPrisma(req);
  const cfg    = getSheetsConfig();

  try {
    const mapping = await prisma.sheetMapping.findFirst({
      where: { userId, sheetId: cfg.spreadsheetId },
    });

    const token = await prisma.oAuthToken.findUnique({
      where: { userId_provider: { userId, provider: "google" } },
      select: { expiresAt: true },
    });

    const queue          = getSheetsQueue();
    const [waiting, active, failed, offlineLen] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getFailedCount(),
      getOfflineQueueLength(userId),
    ]);

    const unresolvedConflicts = await prisma.sheetsConflict.count({
      where: mapping ? { sheetMappingId: mapping.id, resolution: "UNRESOLVED" } : { id: "none" },
    });

    res.json({
      enabled:       cfg.enabled,
      connected:     Boolean(token),
      tokenExpiry:   token?.expiresAt ?? null,
      spreadsheetId: cfg.spreadsheetId || null,
      tabName:       cfg.tabName,
      lastSyncAt:    mapping?.lastSyncAt ?? null,
      syncEnabled:   mapping?.syncEnabled ?? false,
      queue: { waiting, active, failed },
      offlineQueue:  offlineLen,
      conflicts:     unresolvedConflicts,
      strategy:      cfg.conflictStrategy,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    sheetsLogger.error("routes/status: error", { message });
    res.status(500).json({ error: message });
  }
});

// ── Config (read-only, no secrets) ────────────────────────────────────────

router.get("/config", (_req: Request, res: Response) => {
  const cfg = getSheetsConfig();
  res.json({
    enabled:          cfg.enabled,
    tabName:          cfg.tabName,
    autoSync:         cfg.autoSync,
    syncIntervalMs:   cfg.syncIntervalMs,
    maxRetries:       cfg.maxRetries,
    retryBaseDelayMs: cfg.retryBaseDelayMs,
    conflictStrategy: cfg.conflictStrategy,
  });
});

// ── Trigger full sync ──────────────────────────────────────────────────────

router.post("/sync", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const cfg    = getSheetsConfig();

  if (!cfg.enabled) {
    return res.status(400).json({ error: "Sheets sync is not enabled" });
  }

  try {
    await enqueueFullSync(userId, "manual-trigger");
    sheetsLogger.info("routes/sync: full sync enqueued", { userId });
    res.json({ ok: true, message: "Full sync enqueued" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// ── Conflicts ──────────────────────────────────────────────────────────────

router.get("/conflicts", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const prisma = getPrisma(req);
  const cfg    = getSheetsConfig();

  const mapping = await prisma.sheetMapping.findFirst({
    where: { userId, sheetId: cfg.spreadsheetId },
  });

  if (!mapping) return res.json({ conflicts: [] });

  const resolver   = new ConflictResolver(prisma, cfg.conflictStrategy);
  const conflicts  = await resolver.getUnresolved(mapping.id);
  res.json({ conflicts });
});

const resolveSchema = z.object({
  resolution:    z.enum(["LOCAL_WINS", "REMOTE_WINS", "MANUAL"]),
  resolvedValue: z.string(),
});

router.patch("/conflicts/:id", async (req: Request, res: Response) => {
  const { id }   = req.params;
  const prisma   = getPrisma(req);
  const cfg      = getSheetsConfig();
  const parsed   = resolveSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const resolver = new ConflictResolver(prisma, cfg.conflictStrategy);
  await resolver.markResolved(id, parsed.data.resolution, parsed.data.resolvedValue);
  res.json({ ok: true });
});

// ── Sync logs (recent BullMQ jobs) ────────────────────────────────────────

router.get("/logs", async (_req: Request, res: Response) => {
  const queue    = getSheetsQueue();
  const completed = await queue.getCompleted(0, 49);
  const failed    = await queue.getFailed(0, 49);

  const logs = [
    ...completed.map(j => ({
      id:          j.id,
      type:        j.data.type,
      status:      "completed",
      completedAt: j.finishedOn ? new Date(j.finishedOn).toISOString() : null,
      duration:    j.processedOn && j.finishedOn ? j.finishedOn - j.processedOn : null,
    })),
    ...failed.map(j => ({
      id:          j.id,
      type:        j.data.type,
      status:      "failed",
      failedAt:    j.finishedOn ? new Date(j.finishedOn).toISOString() : null,
      reason:      j.failedReason,
      attempts:    j.attemptsMade,
    })),
  ].sort((a, b) => {
    const ta = (a as any).completedAt ?? (a as any).failedAt ?? "";
    const tb = (b as any).completedAt ?? (b as any).failedAt ?? "";
    return tb.localeCompare(ta);
  }).slice(0, 50);

  res.json({ logs });
});

// ── OAuth flow ─────────────────────────────────────────────────────────────

router.get("/auth/google", (req: Request, res: Response) => {
  const userId = getUserId(req);
  const url    = getAuthUrl(userId);
  res.redirect(url);
});

router.get("/auth/google/callback", async (req: Request, res: Response) => {
  const code    = String(req.query.code ?? "");
  const state   = String(req.query.state ?? "");
  const userId  = state || getUserId(req);
  const prisma  = getPrisma(req);

  if (!code) {
    return res.status(400).json({ error: "Missing OAuth code" });
  }

  try {
    await exchangeCodeAndStore(code, userId, prisma);
    sheetsLogger.info("oauth: connected", { userId });
    res.redirect("/settings/integrations?sheets=connected");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    sheetsLogger.error("oauth: callback error", { message });
    res.redirect(`/settings/integrations?sheets=error&message=${encodeURIComponent(message)}`);
  }
});

router.delete("/auth", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const prisma = getPrisma(req);

  try {
    await revokeAndDeleteToken(userId, prisma);
    res.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export default router;
