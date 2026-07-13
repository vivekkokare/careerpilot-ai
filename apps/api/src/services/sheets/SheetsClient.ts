/**
 * Thin wrapper around the Google Sheets v4 API.
 * All methods are retry-safe — caller (SheetsSync) handles BullMQ retries.
 *
 * Row indices here are 1-based (Sheets API convention).
 * Column indices are 0-based internally but converted to A1 notation.
 */

import { google, sheets_v4 } from "googleapis";
import type { Auth } from "googleapis";
import { getSheetsConfig, EXPECTED_HEADERS, COLUMN_COUNT } from "../../config/sheets";
import { sheetsLogger } from "../../lib/logger";
import type { SheetRow } from "./SheetsMapper";

export type Sheets = sheets_v4.Sheets;

export class SheetsClient {
  private readonly sheets: Sheets;
  private readonly spreadsheetId: string;
  private readonly tabName: string;

  constructor(auth: Auth.OAuth2Client) {
    const cfg          = getSheetsConfig();
    this.sheets        = google.sheets({ version: "v4", auth });
    this.spreadsheetId = cfg.spreadsheetId;
    this.tabName       = cfg.tabName;
  }

  // ── Tab management ──────────────────────────────────────────────────────

  /** Ensure the target tab exists; create it if not. Returns the sheet gid. */
  async ensureTab(): Promise<number> {
    const meta = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
      fields: "sheets.properties",
    });

    const sheets = meta.data.sheets ?? [];
    const existing = sheets.find(
      (s) => s.properties?.title === this.tabName
    );

    if (existing?.properties?.sheetId != null) {
      return existing.properties.sheetId;
    }

    // Create tab
    const res = await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [{
          addSheet: {
            properties: { title: this.tabName },
          },
        }],
      },
    });

    const newSheetId = res.data.replies?.[0]?.addSheet?.properties?.sheetId ?? 0;
    sheetsLogger.info("sheets_client: tab created", { tab: this.tabName, sheetId: newSheetId });
    return newSheetId;
  }

  /** Write the header row if the tab is empty or headers don't match. */
  async ensureHeaders(): Promise<void> {
    const cfg      = getSheetsConfig();
    const range    = this.a1(`${this.tabName}!A${cfg.headerRow}:${col(COLUMN_COUNT - 1)}${cfg.headerRow}`);
    const existing = await this.getRange(range);

    const current = (existing?.[0] ?? []) as string[];
    const match   = EXPECTED_HEADERS.every((h, i) => current[i] === h);

    if (!match) {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range,
        valueInputOption: "RAW",
        requestBody: { values: [EXPECTED_HEADERS] },
      });
      sheetsLogger.info("sheets_client: headers written");
    }
  }

  // ── Read ────────────────────────────────────────────────────────────────

  /** Fetch all data rows (excludes header). Returns 2D array. */
  async getAllRows(): Promise<SheetRow[]> {
    const cfg   = getSheetsConfig();
    const range = `${this.tabName}!A${cfg.dataStartRow}:${col(COLUMN_COUNT - 1)}`;
    const rows  = await this.getRange(range);
    return (rows ?? []) as SheetRow[];
  }

  /** Get a single row by 1-based sheet row index. */
  async getRow(rowIndex: number): Promise<SheetRow | null> {
    const range = `${this.tabName}!A${rowIndex}:${col(COLUMN_COUNT - 1)}${rowIndex}`;
    const rows  = await this.getRange(range);
    return rows?.[0] as SheetRow ?? null;
  }

  async getRange(range: string): Promise<unknown[][] | null> {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range,
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    return res.data.values ?? null;
  }

  // ── Write ───────────────────────────────────────────────────────────────

  /** Append a new row at the end of the data region. Returns the new row index. */
  async appendRow(row: SheetRow): Promise<number> {
    const range  = `${this.tabName}!A:A`;
    const res    = await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range,
      valueInputOption:  "USER_ENTERED",
      insertDataOption:  "INSERT_ROWS",
      requestBody: { values: [row] },
    });

    // Parse updated range to get the row number
    const updatedRange = res.data.updates?.updatedRange ?? "";
    const match = updatedRange.match(/!A(\d+)/);
    return match ? parseInt(match[1]!, 10) : -1;
  }

  /** Overwrite an existing row by 1-based sheet row index. */
  async updateRow(rowIndex: number, row: SheetRow): Promise<void> {
    const range = `${this.tabName}!A${rowIndex}:${col(COLUMN_COUNT - 1)}${rowIndex}`;
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });
    sheetsLogger.debug("sheets_client: row updated", { rowIndex });
  }

  /** Clear a row (does NOT delete it — preserves row numbering). */
  async clearRow(rowIndex: number): Promise<void> {
    const range = `${this.tabName}!A${rowIndex}:${col(COLUMN_COUNT - 1)}${rowIndex}`;
    await this.sheets.spreadsheets.values.clear({
      spreadsheetId: this.spreadsheetId,
      range,
    });
    sheetsLogger.debug("sheets_client: row cleared", { rowIndex });
  }

  /** Batch update multiple rows in a single API call (quota-efficient). */
  async batchUpdateRows(updates: { rowIndex: number; row: SheetRow }[]): Promise<void> {
    if (updates.length === 0) return;

    const data = updates.map(({ rowIndex, row }) => ({
      range:  `${this.tabName}!A${rowIndex}:${col(COLUMN_COUNT - 1)}${rowIndex}`,
      values: [row],
    }));

    await this.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data,
      },
    });

    sheetsLogger.debug("sheets_client: batch update", { count: updates.length });
  }

  // ── Metadata ────────────────────────────────────────────────────────────

  async getSpreadsheetTitle(): Promise<string> {
    const meta = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
      fields: "properties.title",
    });
    return meta.data.properties?.title ?? this.spreadsheetId;
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private a1(range: string): string { return range; }
}

/** Convert 0-based column index to A1 letter (0=A, 25=Z, 26=AA…). */
export function col(index: number): string {
  let result = "";
  let n = index;
  do {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return result;
}
