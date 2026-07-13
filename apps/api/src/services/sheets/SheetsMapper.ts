/**
 * Bidirectional mapping between Application DB rows and Google Sheets row arrays.
 *
 * Sheet column layout (0-indexed, see SHEET_COLUMNS in config/sheets.ts):
 *   A=num  B=date  C=company  D=role  E=status  F=score  G=pdf  H=report
 *   I=notes  J=appliedAt  K=comp  L=archetype  M=updatedAt
 */

import type { Application, Company } from "@prisma/client";
import { SHEET_COLUMNS, COLUMN_COUNT } from "../../config/sheets";

export type SheetRow = (string | null)[];

type AppWithCompany = Application & { company: Company | null };

// ── Application → Sheet row ────────────────────────────────────────────────

export function applicationToRow(app: AppWithCompany): SheetRow {
  const row: SheetRow = Array(COLUMN_COUNT).fill(null);
  const C = SHEET_COLUMNS;

  row[C.num]       = String(app.num);
  row[C.date]      = app.createdAt.toISOString().slice(0, 10);
  row[C.company]   = app.company?.name ?? "";
  row[C.role]      = app.role;
  row[C.status]    = app.status;
  row[C.score]     = app.score != null ? `${app.score.toFixed(1)}/5` : "";
  row[C.pdf]       = app.pdfGenerated ? "✅" : "❌";
  row[C.report]    = app.reportPath ?? "";
  row[C.notes]     = app.trackerNotes ?? "";
  row[C.appliedAt] = app.appliedAt?.toISOString().slice(0, 10) ?? "";
  row[C.comp]      = formatComp(app);
  row[C.archetype] = app.archetypeA ?? "";
  row[C.updatedAt] = app.updatedAt.toISOString();

  return row;
}

// ── Sheet row → partial Application ───────────────────────────────────────

export interface RowPatch {
  num?:        number;
  role?:       string;
  status?:     string;
  score?:      number | null;
  trackerNotes?: string;
  appliedAt?:  Date | null;
  updatedAt?:  Date;
}

export function rowToApplicationPatch(row: SheetRow): RowPatch {
  const C = SHEET_COLUMNS;
  const patch: RowPatch = {};

  const num = parseInt(cell(row, C.num) ?? "", 10);
  if (!isNaN(num)) patch.num = num;

  const role = cell(row, C.role);
  if (role) patch.role = role;

  const status = cell(row, C.status);
  if (status) patch.status = status;

  const scoreRaw = cell(row, C.score);
  if (scoreRaw != null) {
    const n = parseFloat(scoreRaw.replace("/5", "").trim());
    patch.score = isNaN(n) ? null : n;
  }

  const notes = cell(row, C.notes);
  if (notes !== null) patch.trackerNotes = notes;

  const appliedRaw = cell(row, C.appliedAt);
  if (appliedRaw) {
    const d = new Date(appliedRaw);
    patch.appliedAt = isNaN(d.getTime()) ? null : d;
  }

  const updatedRaw = cell(row, C.updatedAt);
  if (updatedRaw) {
    const d = new Date(updatedRaw);
    if (!isNaN(d.getTime())) patch.updatedAt = d;
  }

  return patch;
}

// ── Column-level diff ─────────────────────────────────────────────────────

export interface ColumnDiff {
  column:      string;
  localValue:  string;
  remoteValue: string;
}

export function diffRow(local: SheetRow, remote: SheetRow): ColumnDiff[] {
  const colNames = Object.keys(SHEET_COLUMNS) as (keyof typeof SHEET_COLUMNS)[];
  const diffs: ColumnDiff[] = [];

  for (const col of colNames) {
    const idx  = SHEET_COLUMNS[col];
    const lv   = cell(local, idx) ?? "";
    const rv   = cell(remote, idx) ?? "";
    if (lv !== rv) {
      diffs.push({ column: col, localValue: lv, remoteValue: rv });
    }
  }

  return diffs;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function cell(row: SheetRow, idx: number): string | null {
  return row[idx] !== undefined && row[idx] !== null
    ? String(row[idx]).trim()
    : null;
}

function formatComp(app: Application): string {
  if (!app.advertisedCompMin) return "";
  const currency = app.advertisedCompCurrency ?? "USD";
  const min = formatAmount(app.advertisedCompMin, currency);
  const max = app.advertisedCompMax ? formatAmount(app.advertisedCompMax, currency) : null;
  return max ? `${min}–${max}` : min;
}

function formatAmount(cents: number, currency: string): string {
  const value = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style:    "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
