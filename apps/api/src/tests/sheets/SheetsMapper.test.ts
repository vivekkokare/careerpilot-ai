/**
 * Unit tests for SheetsMapper — Application ↔ Sheet row conversion.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { applicationToRow, rowToApplicationPatch, diffRow } from "../../services/sheets/SheetsMapper";
import { SHEET_COLUMNS } from "../../config/sheets";
import type { Application, Company } from "@prisma/client";

// ── Fixtures ──────────────────────────────────────────────────────────────

const BASE_DATE = new Date("2026-07-11T14:22:00Z");

function makeApp(overrides: Partial<Application & { company: Company | null }> = {}): Application & { company: Company | null } {
  return {
    id:                    "app1",
    userId:                "u1",
    num:                   742,
    role:                  "Staff AI Engineer",
    status:                "EVALUATED",
    score:                 4.4,
    pdfGenerated:          true,
    reportPath:            "reports/742-anthropic-2026-07-11.md",
    trackerNotes:          "Dream role",
    appliedAt:             null,
    via:                   null,
    archetypeA:            "AI_PLATFORM_LLMOPS",
    archetypeB:            null,
    legitimacyTier:        "HIGH_CONFIDENCE",
    advertisedCompMin:     25000000,
    advertisedCompMax:     35000000,
    advertisedCompCurrency: "USD",
    companyId:             "c1",
    sheetsRow:             null,
    sheetsLastSyncedAt:    null,
    primaryContactId:      null,
    mdChecksum:            null,
    mdRowSnapshot:         null,
    createdAt:             BASE_DATE,
    updatedAt:             BASE_DATE,
    company: {
      id:             "c1",
      slug:           "anthropic",
      name:           "Anthropic",
      website:        "https://anthropic.com",
      atsProvider:    "greenhouse",
      atsBaseUrl:     null,
      linkedinUrl:    null,
      crunchbaseUrl:  null,
      legitimacyTier: "HIGH_CONFIDENCE",
      legitimacyNotes: null,
      isBlacklisted:  false,
      blacklistReason: null,
      blacklistedAt:  null,
      reApplyWindowDays: null,
      lastAppliedAt:  null,
      createdAt:      BASE_DATE,
      updatedAt:      BASE_DATE,
    },
    ...overrides,
  };
}

// ── applicationToRow ──────────────────────────────────────────────────────

describe("applicationToRow", () => {
  it("maps all columns correctly", () => {
    const app = makeApp();
    const row = applicationToRow(app);

    const C = SHEET_COLUMNS;
    expect(row[C.num]).toBe("742");
    expect(row[C.company]).toBe("Anthropic");
    expect(row[C.role]).toBe("Staff AI Engineer");
    expect(row[C.status]).toBe("EVALUATED");
    expect(row[C.score]).toBe("4.4/5");
    expect(row[C.pdf]).toBe("✅");
    expect(row[C.report]).toBe("reports/742-anthropic-2026-07-11.md");
    expect(row[C.notes]).toBe("Dream role");
    expect(row[C.archetype]).toBe("AI_PLATFORM_LLMOPS");
  });

  it("formats comp range as currency", () => {
    const app = makeApp();
    const row = applicationToRow(app);
    expect(row[SHEET_COLUMNS.comp]).toMatch(/\$250,000/);
  });

  it("renders ❌ when pdf not generated", () => {
    const row = applicationToRow(makeApp({ pdfGenerated: false }));
    expect(row[SHEET_COLUMNS.pdf]).toBe("❌");
  });

  it("leaves appliedAt empty when null", () => {
    const row = applicationToRow(makeApp({ appliedAt: null }));
    expect(row[SHEET_COLUMNS.appliedAt]).toBe("");
  });

  it("handles missing company gracefully", () => {
    const row = applicationToRow(makeApp({ company: null }));
    expect(row[SHEET_COLUMNS.company]).toBe("");
  });

  it("handles null score", () => {
    const row = applicationToRow(makeApp({ score: null }));
    expect(row[SHEET_COLUMNS.score]).toBe("");
  });

  it("produces exactly COLUMN_COUNT cells", () => {
    const { COLUMN_COUNT } = require("../../config/sheets");
    const row = applicationToRow(makeApp());
    expect(row.length).toBe(COLUMN_COUNT);
  });
});

// ── rowToApplicationPatch ─────────────────────────────────────────────────

describe("rowToApplicationPatch", () => {
  it("parses num, role, status, score from a valid row", () => {
    const app    = makeApp();
    const row    = applicationToRow(app);
    const patch  = rowToApplicationPatch(row);

    expect(patch.num).toBe(742);
    expect(patch.role).toBe("Staff AI Engineer");
    expect(patch.status).toBe("EVALUATED");
    expect(patch.score).toBeCloseTo(4.4, 1);
  });

  it("parses trackerNotes", () => {
    const patch = rowToApplicationPatch(applicationToRow(makeApp()));
    expect(patch.trackerNotes).toBe("Dream role");
  });

  it("handles empty row gracefully", () => {
    const patch = rowToApplicationPatch([]);
    expect(patch.num).toBeUndefined();
  });

  it("returns null score for empty score cell", () => {
    const row = applicationToRow(makeApp({ score: null }));
    const patch = rowToApplicationPatch(row);
    expect(patch.score).toBeNull();
  });
});

// ── diffRow ───────────────────────────────────────────────────────────────

describe("diffRow", () => {
  it("returns empty array for identical rows", () => {
    const row = applicationToRow(makeApp());
    expect(diffRow(row, row)).toHaveLength(0);
  });

  it("detects a status change", () => {
    const local  = applicationToRow(makeApp({ status: "APPLIED" }));
    const remote = applicationToRow(makeApp({ status: "EVALUATED" }));
    const diffs  = diffRow(local, remote);
    expect(diffs.some(d => d.column === "status")).toBe(true);
  });

  it("detects a notes change", () => {
    const local  = applicationToRow(makeApp({ trackerNotes: "updated" }));
    const remote = applicationToRow(makeApp({ trackerNotes: "original" }));
    const diffs  = diffRow(local, remote);
    expect(diffs.some(d => d.column === "notes")).toBe(true);
  });

  it("includes localValue and remoteValue in each diff", () => {
    const local  = applicationToRow(makeApp({ status: "APPLIED" }));
    const remote = applicationToRow(makeApp({ status: "EVALUATED" }));
    const diff   = diffRow(local, remote).find(d => d.column === "status")!;
    expect(diff.localValue).toBe("APPLIED");
    expect(diff.remoteValue).toBe("EVALUATED");
  });
});
