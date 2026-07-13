/**
 * Conflict detection and resolution.
 *
 * A conflict occurs when BOTH the local DB row AND the remote sheet row were
 * modified after the last known sync timestamp.
 *
 * Resolution strategies:
 *   local_wins  — DB value always wins (default, preserves files-as-canonical)
 *   remote_wins — Sheet value always wins (useful when team edits in Sheets)
 *   manual      — Unresolved conflict written to `sheets_conflicts` table for
 *                 human review via the UI
 */

import type { PrismaClient } from "@prisma/client";
import type { ConflictStrategy } from "../../config/sheets";
import type { ColumnDiff } from "./SheetsMapper";
import { sheetsLogger } from "../../lib/logger";

export interface ConflictContext {
  applicationId: string;
  applicationNum: number;
  sheetMappingId: string;
  lastSyncedAt:  Date | null;
  localUpdatedAt: Date;
  remoteUpdatedAt: Date | null;
  diffs: ColumnDiff[];
}

export type ResolutionChoice = "local_wins" | "remote_wins";

export interface ConflictResult {
  hasConflict: boolean;
  resolution:  ResolutionChoice | "manual" | null;
  /** Columns that could not be auto-resolved (manual strategy). */
  unresolvedDiffs: ColumnDiff[];
}

export class ConflictResolver {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly strategy: ConflictStrategy,
  ) {}

  /**
   * Determine if a real conflict exists, then resolve according to strategy.
   * Returns the resolution and any diffs that need manual handling.
   */
  async resolve(ctx: ConflictContext): Promise<ConflictResult> {
    if (ctx.diffs.length === 0) {
      return { hasConflict: false, resolution: null, unresolvedDiffs: [] };
    }

    const lastSync = ctx.lastSyncedAt?.getTime() ?? 0;
    const localChanged  = ctx.localUpdatedAt.getTime() > lastSync;
    const remoteChanged = ctx.remoteUpdatedAt != null
      ? ctx.remoteUpdatedAt.getTime() > lastSync
      : false;

    // Only a conflict if BOTH sides changed since last sync
    if (!localChanged || !remoteChanged) {
      // One side diverged — no true conflict; whichever changed wins
      const resolution: ResolutionChoice = localChanged ? "local_wins" : "remote_wins";
      return { hasConflict: false, resolution, unresolvedDiffs: [] };
    }

    sheetsLogger.warn("conflict: detected", {
      num:      ctx.applicationNum,
      columns:  ctx.diffs.map(d => d.column),
      strategy: this.strategy,
    });

    if (this.strategy === "local_wins") {
      return { hasConflict: true, resolution: "local_wins", unresolvedDiffs: [] };
    }

    if (this.strategy === "remote_wins") {
      return { hasConflict: true, resolution: "remote_wins", unresolvedDiffs: [] };
    }

    // manual — write conflict records to DB, return unresolved
    await this.persistConflicts(ctx);
    return { hasConflict: true, resolution: "manual", unresolvedDiffs: ctx.diffs };
  }

  private async persistConflicts(ctx: ConflictContext): Promise<void> {
    const ops = ctx.diffs.map(diff =>
      this.prisma.sheetsConflict.upsert({
        where: {
          // Composite upsert key: same mapping + application + column
          // (no unique constraint on column alone — use create/update pattern)
          id: "placeholder",   // overridden below
        },
        create: {
          sheetMappingId: ctx.sheetMappingId,
          applicationId:  ctx.applicationId,
          columnName:     diff.column,
          localValue:     diff.localValue,
          remoteValue:    diff.remoteValue,
          resolution:     "UNRESOLVED",
        },
        update: {
          localValue:  diff.localValue,
          remoteValue: diff.remoteValue,
          resolution:  "UNRESOLVED",
          resolvedAt:  null,
        },
      })
    );

    // upsert by column not possible with current schema (no unique on columnName).
    // Use createMany with skipDuplicates instead.
    await this.prisma.sheetsConflict.createMany({
      data: ctx.diffs.map(diff => ({
        sheetMappingId: ctx.sheetMappingId,
        applicationId:  ctx.applicationId,
        columnName:     diff.column,
        localValue:     diff.localValue,
        remoteValue:    diff.remoteValue,
        resolution:     "UNRESOLVED",
      })),
      skipDuplicates: false,
    });

    sheetsLogger.info("conflict: persisted for manual review", {
      num:     ctx.applicationNum,
      columns: ctx.diffs.map(d => d.column),
    });
  }

  /** Mark a conflict as resolved with a chosen value. */
  async markResolved(
    conflictId: string,
    resolution: "LOCAL_WINS" | "REMOTE_WINS" | "MANUAL",
    resolvedValue: string,
  ): Promise<void> {
    await this.prisma.sheetsConflict.update({
      where: { id: conflictId },
      data: {
        resolution:    resolution,
        resolvedValue: resolvedValue,
        resolvedAt:    new Date(),
      },
    });
  }

  /** Fetch all unresolved conflicts for a given sheet mapping. */
  async getUnresolved(sheetMappingId: string) {
    return this.prisma.sheetsConflict.findMany({
      where: {
        sheetMappingId,
        resolution: "UNRESOLVED",
      },
      include: { application: { select: { num: true, role: true, company: { select: { name: true } } } } },
      orderBy: { detectedAt: "desc" },
    });
  }
}
