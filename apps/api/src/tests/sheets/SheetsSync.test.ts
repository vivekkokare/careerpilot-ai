/**
 * Integration-style unit tests for SheetsSync.
 * SheetsClient and Prisma are fully mocked — no Google API calls.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";

// ── Mock SheetsClient ─────────────────────────────────────────────────────

vi.mock("../../services/sheets/SheetsClient", () => ({
  SheetsClient: vi.fn().mockImplementation(() => ({
    ensureTab:        vi.fn().mockResolvedValue(0),
    ensureHeaders:    vi.fn().mockResolvedValue(undefined),
    getAllRows:        vi.fn().mockResolvedValue([]),
    getRow:           vi.fn().mockResolvedValue(null),
    appendRow:        vi.fn().mockResolvedValue(5),
    updateRow:        vi.fn().mockResolvedValue(undefined),
    clearRow:         vi.fn().mockResolvedValue(undefined),
    batchUpdateRows:  vi.fn().mockResolvedValue(undefined),
  })),
}));

// ── Mock Google Auth ──────────────────────────────────────────────────────

vi.mock("../../lib/googleAuth", () => ({
  getAuthenticatedClient: vi.fn().mockResolvedValue({}),
}));

// ── Mock offline queue ────────────────────────────────────────────────────

vi.mock("../../services/sheets/SheetsQueue", () => ({
  popOfflineOps: vi.fn().mockResolvedValue([]),
}));

import { SheetsSync } from "../../services/sheets/SheetsSync";
import { SheetsClient } from "../../services/sheets/SheetsClient";
import { applicationToRow } from "../../services/sheets/SheetsMapper";

// ── Mock Prisma ───────────────────────────────────────────────────────────

const BASE_DATE = new Date("2026-07-11T14:22:00Z");

const mockApp = {
  id:                    "app1",
  userId:                "u1",
  num:                   742,
  role:                  "Staff AI Engineer",
  status:                "EVALUATED" as const,
  score:                 4.4,
  pdfGenerated:          true,
  reportPath:            "reports/742-anthropic.md",
  trackerNotes:          "notes",
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
  company: { id: "c1", name: "Anthropic", slug: "anthropic", website: null, atsProvider: null,
    atsBaseUrl: null, linkedinUrl: null, crunchbaseUrl: null, legitimacyTier: "HIGH_CONFIDENCE",
    legitimacyNotes: null, isBlacklisted: false, blacklistReason: null, blacklistedAt: null,
    reApplyWindowDays: null, lastAppliedAt: null, createdAt: BASE_DATE, updatedAt: BASE_DATE },
};

const mockMapping = { id: "sm1", userId: "u1", sheetId: "sheet123", tabName: "Applications",
  tabGid: "0", syncEnabled: true, lastSyncAt: null, lastLocalSeq: null, lastRemoteSeq: null,
  createdAt: BASE_DATE, updatedAt: BASE_DATE };

function makePrisma(appOverrides: any = {}) {
  const app = { ...mockApp, ...appOverrides };
  return {
    application: {
      findUnique: vi.fn().mockResolvedValue(app),
      findMany:   vi.fn().mockResolvedValue([app]),
      update:     vi.fn().mockResolvedValue({ ...app, sheetsRow: 5 }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    sheetMapping: {
      findFirst: vi.fn().mockResolvedValue(mockMapping),
      create:    vi.fn().mockResolvedValue(mockMapping),
      update:    vi.fn().mockResolvedValue(mockMapping),
    },
    sheetsConflict: {
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      count:      vi.fn().mockResolvedValue(0),
    },
    activity: {
      create: vi.fn().mockResolvedValue({}),
    },
  } as any;
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("SheetsSync.upsertRow", () => {
  it("appends a new row when sheetsRow is null", async () => {
    const prisma   = makePrisma({ sheetsRow: null });
    const auth     = {} as any;
    const sync     = new SheetsSync(auth, prisma, "u1");
    const client   = (SheetsClient as Mock).mock.results[0]!.value;

    const result   = await sync.upsertRow("app1");

    expect(result.ok).toBe(true);
    expect(result.rowIndex).toBe(5);
    expect(client.appendRow).toHaveBeenCalledOnce();
    expect(prisma.application.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sheetsRow: 5 }) })
    );
  });

  it("updates existing row when sheetsRow is set", async () => {
    const prisma   = makePrisma({ sheetsRow: 3, sheetsLastSyncedAt: new Date("2026-07-10T00:00:00Z") });
    const auth     = {} as any;
    const sync     = new SheetsSync(auth, prisma, "u1");
    const client   = (SheetsClient as Mock).mock.results[
      (SheetsClient as Mock).mock.results.length - 1
    ].value;

    // No remote row → no conflict path
    client.getRow.mockResolvedValueOnce(null);

    const result = await sync.upsertRow("app1");
    expect(result.ok).toBe(true);
    expect(client.updateRow).toHaveBeenCalledWith(3, expect.any(Array));
  });

  it("returns ok=false when application not found", async () => {
    const prisma = makePrisma();
    prisma.application.findUnique = vi.fn().mockResolvedValue(null);
    const sync   = new SheetsSync({} as any, prisma, "u1");
    const result = await sync.upsertRow("missing");
    expect(result.ok).toBe(false);
  });

  it("handles SheetsClient errors and returns ok=false", async () => {
    const prisma = makePrisma({ sheetsRow: null });
    const sync   = new SheetsSync({} as any, prisma, "u1");
    const client = (SheetsClient as Mock).mock.results[
      (SheetsClient as Mock).mock.results.length - 1
    ].value;
    client.appendRow.mockRejectedValueOnce(new Error("quota exceeded"));
    const result = await sync.upsertRow("app1");
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/quota/);
  });
});

describe("SheetsSync.deleteRow", () => {
  it("clears the sheet row and nulls sheetsRow in DB", async () => {
    const prisma = makePrisma({ sheetsRow: 7 });
    const sync   = new SheetsSync({} as any, prisma, "u1");
    const client = (SheetsClient as Mock).mock.results[
      (SheetsClient as Mock).mock.results.length - 1
    ].value;

    const result = await sync.deleteRow("app1", 7);
    expect(result.ok).toBe(true);
    expect(client.clearRow).toHaveBeenCalledWith(7);
    expect(prisma.application.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { sheetsRow: null, sheetsLastSyncedAt: null } })
    );
  });
});

describe("SheetsSync.fullSync", () => {
  it("appends rows for applications not yet in sheet", async () => {
    const prisma = makePrisma({ sheetsRow: null });
    const sync   = new SheetsSync({} as any, prisma, "u1");
    const client = (SheetsClient as Mock).mock.results[
      (SheetsClient as Mock).mock.results.length - 1
    ].value;
    client.getAllRows.mockResolvedValueOnce([]);

    const report = await sync.fullSync();
    expect(report.pushed).toBe(1);
    expect(report.errors).toBe(0);
  });

  it("skips rows already in sync (no diffs)", async () => {
    const prisma = makePrisma({ sheetsRow: 2, sheetsLastSyncedAt: BASE_DATE });
    const sync   = new SheetsSync({} as any, prisma, "u1");
    const client = (SheetsClient as Mock).mock.results[
      (SheetsClient as Mock).mock.results.length - 1
    ].value;

    // Return remote row identical to local
    const identicalRow = applicationToRow(mockApp as any);
    client.getAllRows.mockResolvedValueOnce([identicalRow]);

    const report = await sync.fullSync();
    expect(report.pushed).toBe(0);
    expect(report.errors).toBe(0);
  });
});
