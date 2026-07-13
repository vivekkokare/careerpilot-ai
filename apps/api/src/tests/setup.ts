/**
 * Global test setup — runs before every test file.
 * Sets required env vars so modules that call process.env don't throw.
 */

process.env.ENCRYPTION_KEY    = "a".repeat(64);   // 32 bytes hex
process.env.SHEETS_ENABLED    = "true";
process.env.SHEETS_SPREADSHEET_ID = "test_sheet_id";
process.env.SHEETS_TAB_NAME   = "Applications";
process.env.REDIS_URL         = "redis://localhost:6379";
process.env.DATABASE_URL      = "postgresql://test:test@localhost:5432/test";
process.env.NODE_ENV          = "test";
process.env.LOG_LEVEL         = "error";           // suppress logs during tests

// Reset singleton config cache between tests
import { resetSheetsConfigCache } from "../config/sheets";
import { afterEach } from "vitest";
afterEach(() => resetSheetsConfigCache());
