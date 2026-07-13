/**
 * Core sync orchestrator.
 *
 * Implements three sync paths:
 *   1. upsertRow(applicationId)  — push one DB row to Sheets
 *   2. deleteRow(applicationId)  — clear one row in Sheets
 *   3. fullSync(userId)          — reconcile entire DB ↔ Sheet
 *
 * Files-as-canonical doctrine is respected:
 *   - Local DB always wins when conflictStrategy = "local_wins" (default)
 *   - Remote wins only when explicitly configured
 *   - Manual conflicts are written to sheets_conflicts table
 */

import { PrismaClient } from "@prisma/client";
import type { Auth } from "googleapis";
import { SheetsClient } from "./SheetsClient";
import { ConflictResolver } from "./ConflictResolver";
import {
  applicationToRow,
  rowToApplicationPatch,
  diffRow,
} from "./SheetsMapper";
import { getSheetsConfig } from "../../config/sheets";
import { sheetsLogger } from "../../lib/logger";
import { popOfflineOps } from "./SheetsQueue";

// ── Types ──────────────────────────────────────────────────────────────────

export interface SyncResult {
  ok:        boolean;
  rowIndex?: number;
  message?:  string;
  conflict?: boolean;
}

export interface FullSyncReport {
  pushed:    number;
  pulled:    number;
  conflicts: number;
  errors:    number;
  durationMs: number;
}

// ── SheetsSync ─────────────────────────────────────────────────────────────

export class SheetsSync {
  private readonly client: SheetsClient;
  private readonly resolver: ConflictResolver;

  constructor(
    auth: Auth.OAuth2Client,
    private readonly prisma: PrismaClient,
    private readonly userId: string,
  ) {
    const cfg       = getSheetsConfig();
    this.client     = new SheetsClient(auth);
    this.resolver   = new ConflictResolver(prisma, cfg.conflictStrategy);
  }

  // ── Upsert one application ─────────────────────────────────────────────

  async upsertRow(applicationId: string): Promise<SyncResult> {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { company: true },
    });

    if (!app) {
      return { ok: false, message: `Application ${applicationId} not found` };
    }

    const mapping = await this.getOrCreateMapping();
    const localRow = applicationToRow(app);

    try {
      if (app.sheetsRow) {
        // Check for conflicts before overwriting
        const remoteRow = await this.client.getRow(app.sheetsRow);

        if (remoteRow) {
          const diffs = diffRow(localRow, remoteRow);

          if (diffs.length > 0) {
            const remoteUpdatedAt = this.extractUpdatedAt(remoteRow);

            const result = await this.resolver.resolve({
              applicationId:   app.id,
              applicationNum:  app.num,
              sheetMappingId:  mapping.id,
              lastSyncedAt:    app.sheetsLastSyncedAt,
              localUpdatedAt:  app.updatedAt,
              remoteUpdatedAt,
              diffs,
            });

            if (result.resolution === "remote_wins") {
              // Apply remote patch to DB (limited fields)
              const patch = rowToApplicationPatch(remoteRow);
              await this.applyRemotePatch(app.id, patch);
              sheetsLogger.info("sync: remote wins applied", { num: app.num });
              await this.updateSyncTimestamp(app.id, app.sheetsRow);
              return { ok: true, rowIndex: app.sheetsRow, conflict: true };
            }

            if (result.resolution === "manual") {
              sheetsLogger.warn("sync: conflict requires manual resolution", { num: app.num });
              return { ok: false, conflict: true, message: "Conflict requires manual resolution" };
            }

            // local_wins falls through to overwrite below
          }
        }

        await this.client.updateRow(app.sheetsRow, localRow);
        await this.updateSyncTimestamp(app.id, app.sheetsRow);
        sheetsLogger.debug("sync: row updated", { num: app.num, row: app.sheetsRow });
        return { ok: true, rowIndex: app.sheetsRow };

      } else {
        // New row — append
        const rowIndex = await this.client.appendRow(localRow);
        await this.prisma.application.update({
          where: { id: app.id },
          data:  { sheetsRow: rowIndex, sheetsLastSyncedAt: new Date() },
        });
        sheetsLogger.info("sync: row appended", { num: app.num, row: rowIndex });
        return { ok: true, rowIndex };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      sheetsLogger.error("sync: upsert failed", { num: app.num, message });
      return { ok: false, message };
    }
  }

  // ── Delete one application row ─────────────────────────────────────────

  async deleteRow(applicationId: string, sheetsRow: number): Promise<SyncResult> {
    try {
      await this.client.clearRow(sheetsRow);
      await this.prisma.application.update({
        where: { id: applicationId },
        data:  { sheetsRow: null, sheetsLastSyncedAt: null },
      });
      sheetsLogger.info("sync: row cleared", { applicationId, sheetsRow });
      return { ok: true, rowIndex: sheetsRow };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      sheetsLogger.error("sync: delete failed", { applicationId, sheetsRow, message });
      return { ok: false, message };
    }
  }

  // ── Full sync ──────────────────────────────────────────────────────────

  async fullSync(): Promise<FullSyncReport> {
    const start = Date.now();
    const report: FullSyncReport = { pushed: 0, pulled: 0, conflicts: 0, errors: 0, durationMs: 0 };

    sheetsLogger.info("full_sync: starting");

    await this.client.ensureTab();
    await this.client.ensureHeaders();

    const mapping = await this.getOrCreateMapping();

    // 1. Load all DB applications for this user
    const apps = await this.prisma.application.findMany({
      where:   { userId: this.userId },
      include: { company: true },
      orderBy: { num: "asc" },
    });

    // 2. Load all sheet rows (keyed by report number from column A)
    const allRemoteRows = await this.client.getAllRows();
    const remoteByNum = new Map<number, { row: (string | null)[]; rowIndex: number }>();
    const cfg = getSheetsConfig();

    allRemoteRows.forEach((row, idx) => {
      const rawNum = row[0];
      const num = parseInt(String(rawNum ?? "").replace("#", ""), 10);
      if (!isNaN(num)) {
        remoteByNum.set(num, { row: row as (string | null)[], rowIndex: cfg.dataStartRow + idx });
      }
    });

    // 3. Batch-push DB → Sheet
    const batchUpdates: { rowIndex: number; row: (string | null)[] }[] = [];

    for (const app of apps) {
      const remote = remoteByNum.get(app.num);

      if (remote) {
        const localRow  = applicationToRow(app);
        const diffs     = diffRow(localRow, remote.row);

        if (diffs.length === 0) continue;  // Already in sync

        const remoteUpdatedAt = this.extractUpdatedAt(remote.row);
        const result = await this.resolver.resolve({
          applicationId:  app.id,
          applicationNum: app.num,
          sheetMappingId: mapping.id,
          lastSyncedAt:   app.sheetsLastSyncedAt,
          localUpdatedAt: app.updatedAt,
          remoteUpdatedAt,
          diffs,
        });

        if (result.conflict && result.resolution === "manual") {
          report.conflicts++;
          continue;
        }

        if (result.resolution === "remote_wins") {
          const patch = rowToApplicationPatch(remote.row);
          await this.applyRemotePatch(app.id, patch);
          report.pulled++;
          continue;
        }

        // local_wins or no conflict
        batchUpdates.push({ rowIndex: remote.rowIndex, row: applicationToRow(app) });

        if (app.sheetsRow !== remote.rowIndex) {
          await this.prisma.application.update({
            where: { id: app.id },
            data:  { sheetsRow: remote.rowIndex },
          });
        }

      } else {
        // Not in sheet yet — append
        try {
          const rowIndex = await this.client.appendRow(applicationToRow(app));
          await this.prisma.application.update({
            where: { id: app.id },
            data:  { sheetsRow: rowIndex, sheetsLastSyncedAt: new Date() },
          });
          report.pushed++;
        } catch (err: unknown) {
          sheetsLogger.error("full_sync: append failed", { num: app.num, err });
          report.errors++;
        }
      }
    }

    // 4. Execute batch update
    if (batchUpdates.length > 0) {
      try {
        await this.client.batchUpdateRows(batchUpdates);
        report.pushed += batchUpdates.length;
      } catch (err: unknown) {
        sheetsLogger.error("full_sync: batch update failed", { count: batchUpdates.length, err });
        report.errors += batchUpdates.length;
      }
    }

    // 5. Update mapping sync timestamp
    await this.prisma.sheetMapping.update({
      where: { id: mapping.id },
      data:  { lastSyncAt: new Date() },
    });

    // 6. Bulk update sheetsLastSyncedAt for all apps in batch
    const batchNums = new Set(batchUpdates.map(u => {
      const n = parseInt(String(allRemoteRows[u.rowIndex - cfg.dataStartRow]?.[0] ?? ""), 10);
      return n;
    }));
    if (batchNums.size > 0) {
      await this.prisma.application.updateMany({
        where: { userId: this.userId, num: { in: [...batchNums] } },
        data:  { sheetsLastSyncedAt: new Date() },
      });
    }

    report.durationMs = Date.now() - start;
    sheetsLogger.info("full_sync: complete", report);
    return report;
  }

  // ── Drain offline queue ────────────────────────────────────────────────

  async drainOfflineQueue(): Promise<void> {
    const ops = await popOfflineOps(this.userId);
    if (ops.length === 0) return;

    sheetsLogger.info("offline_drain: replaying", { count: ops.length });

    for (const op of ops) {
      if (op.type === "UPSERT_ROW") {
        await this.upsertRow(op.applicationId);
      } else if (op.type === "DELETE_ROW") {
        await this.deleteRow(op.applicationId, op.sheetsRow);
      }
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────

  private async getOrCreateMapping() {
    const cfg = getSheetsConfig();

    let mapping = await this.prisma.sheetMapping.findFirst({
      where: { userId: this.userId, sheetId: cfg.spreadsheetId },
    });

    if (!mapping) {
      const gid = await this.client.ensureTab();
      mapping = await this.prisma.sheetMapping.create({
        data: {
          userId:      this.userId,
          sheetId:     cfg.spreadsheetId,
          tabName:     cfg.tabName,
          tabGid:      String(gid),
          syncEnabled: true,
        },
      });
    }

    return mapping;
  }

  private async updateSyncTimestamp(applicationId: string, sheetsRow: number): Promise<void> {
    await this.prisma.application.update({
      where: { id: applicationId },
      data:  { sheetsRow, sheetsLastSyncedAt: new Date() },
    });
  }

  private async applyRemotePatch(applicationId: string, patch: Record<string, unknown>): Promise<void> {
    const allowedFields = ["role", "trackerNotes", "appliedAt"];
    const safe = Object.fromEntries(
      Object.entries(patch).filter(([k]) => allowedFields.includes(k))
    );

    if (Object.keys(safe).length === 0) return;

    await this.prisma.application.update({
      where: { id: applicationId },
      data:  { ...safe, sheetsLastSyncedAt: new Date() },
    });
  }

  private extractUpdatedAt(row: (string | null)[]): Date | null {
    const cfg = getSheetsConfig();
    // updatedAt is in the last column
    const raw = row[12];  // SHEET_COLUMNS.updatedAt = 12
    if (!raw) return null;
    const d = new Date(String(raw));
    return isNaN(d.getTime()) ? null : d;
  }
}
