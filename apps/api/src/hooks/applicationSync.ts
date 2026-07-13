/**
 * Application sync hooks — called from application CRUD routes to auto-enqueue
 * sheets sync jobs whenever an application is created, updated, or deleted.
 *
 * Falls back to the offline queue when Redis is unavailable.
 */

import { getSheetsConfig } from "../config/sheets";
import {
  enqueueUpsert,
  enqueueDelete,
  pushOfflineOp,
} from "../services/sheets/SheetsQueue";
import { sheetsLogger } from "../lib/logger";

// ── Hook: application created ──────────────────────────────────────────────

export async function onApplicationCreated(
  applicationId: string,
  applicationNum: number,
  userId: string,
): Promise<void> {
  if (!getSheetsConfig().enabled || !getSheetsConfig().autoSync) return;

  try {
    await enqueueUpsert(applicationId, applicationNum, userId, "create");
  } catch (err) {
    sheetsLogger.warn("hook: Redis unavailable — using offline queue", { err });
    await pushOfflineOp({ type: "UPSERT_ROW", applicationId, applicationNum, userId, trigger: "create" });
  }
}

// ── Hook: application updated ──────────────────────────────────────────────

export async function onApplicationUpdated(
  applicationId: string,
  applicationNum: number,
  userId: string,
): Promise<void> {
  if (!getSheetsConfig().enabled || !getSheetsConfig().autoSync) return;

  try {
    await enqueueUpsert(applicationId, applicationNum, userId, "update");
  } catch (err) {
    sheetsLogger.warn("hook: Redis unavailable — using offline queue", { err });
    await pushOfflineOp({ type: "UPSERT_ROW", applicationId, applicationNum, userId, trigger: "update" });
  }
}

// ── Hook: application deleted ──────────────────────────────────────────────

export async function onApplicationDeleted(
  applicationId: string,
  applicationNum: number,
  sheetsRow: number | null,
  userId: string,
): Promise<void> {
  if (!getSheetsConfig().enabled || !getSheetsConfig().autoSync) return;
  if (!sheetsRow) return;  // Not in Sheets yet — nothing to delete

  try {
    await enqueueDelete(applicationId, applicationNum, sheetsRow, userId);
  } catch (err) {
    sheetsLogger.warn("hook: Redis unavailable — using offline queue", { err });
    await pushOfflineOp({ type: "DELETE_ROW", applicationId, applicationNum, sheetsRow, userId });
  }
}
