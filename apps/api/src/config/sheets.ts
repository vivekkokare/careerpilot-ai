/**
 * Sheets sync configuration — centralises all env-driven settings.
 * Every sheets service reads from here, never from process.env directly.
 */

export type ConflictStrategy = "local_wins" | "remote_wins" | "manual";

export interface SheetsConfig {
  enabled:          boolean;
  spreadsheetId:    string;
  tabName:          string;
  headerRow:        number;
  dataStartRow:     number;
  autoSync:         boolean;
  syncIntervalMs:   number;
  maxRetries:       number;
  retryBaseDelayMs: number;
  conflictStrategy: ConflictStrategy;
}

/** Column indices (0-based) inside the sheet. */
export const SHEET_COLUMNS = {
  num:        0,   // A  — report number (#742)
  date:       1,   // B  — evaluation date
  company:    2,   // C  — company name
  role:       3,   // D  — role title
  status:     4,   // E  — canonical status
  score:      5,   // F  — global score (e.g. 4.4/5)
  pdf:        6,   // G  — ✅ or ❌
  report:     7,   // H  — report file path
  notes:      8,   // I  — tracker notes
  appliedAt:  9,   // J  — application date
  comp:       10,  // K  — comp range
  archetype:  11,  // L  — role archetype
  updatedAt:  12,  // M  — last updated (ISO)
} as const;

export const COLUMN_COUNT = Object.keys(SHEET_COLUMNS).length;

/** Header labels that must match column indices above. */
export const EXPECTED_HEADERS = [
  "#", "Date", "Company", "Role", "Status", "Score",
  "PDF", "Report", "Notes", "Applied", "Comp", "Archetype", "Updated",
];

function int(v: string | undefined, fallback: number): number {
  const n = parseInt(v ?? "", 10);
  return isNaN(n) ? fallback : n;
}

function bool(v: string | undefined, fallback: boolean): boolean {
  if (v === undefined) return fallback;
  return v.toLowerCase() !== "false" && v !== "0";
}

function strategy(v: string | undefined): ConflictStrategy {
  if (v === "remote_wins" || v === "manual") return v;
  return "local_wins";
}

export function loadSheetsConfig(): SheetsConfig {
  return {
    enabled:          bool(process.env.SHEETS_ENABLED, false),
    spreadsheetId:    process.env.SHEETS_SPREADSHEET_ID ?? "",
    tabName:          process.env.SHEETS_TAB_NAME ?? "Applications",
    headerRow:        int(process.env.SHEETS_HEADER_ROW, 1),
    dataStartRow:     int(process.env.SHEETS_DATA_START_ROW, 2),
    autoSync:         bool(process.env.SHEETS_AUTO_SYNC, true),
    syncIntervalMs:   int(process.env.SHEETS_SYNC_INTERVAL_MS, 5 * 60_000),
    maxRetries:       int(process.env.SHEETS_MAX_RETRIES, 5),
    retryBaseDelayMs: int(process.env.SHEETS_RETRY_BASE_DELAY_MS, 1_000),
    conflictStrategy: strategy(process.env.SHEETS_CONFLICT_STRATEGY),
  };
}

let _cached: SheetsConfig | null = null;

export function getSheetsConfig(): SheetsConfig {
  if (!_cached) _cached = loadSheetsConfig();
  return _cached;
}

/** Reset the singleton — only used in tests. */
export function resetSheetsConfigCache(): void {
  _cached = null;
}
