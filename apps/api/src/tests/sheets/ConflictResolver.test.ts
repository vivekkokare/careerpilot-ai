/**
 * Unit tests for ConflictResolver.
 * Prisma is mocked — no real DB required.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConflictResolver } from "../../services/sheets/ConflictResolver";
import type { ConflictContext } from "../../services/sheets/ConflictResolver";

// ── Mock Prisma ───────────────────────────────────────────────────────────

const mockCreate   = vi.fn().mockResolvedValue({});
const mockUpdate   = vi.fn().mockResolvedValue({});
const mockFindMany = vi.fn().mockResolvedValue([]);

const prisma = {
  sheetsConflict: {
    createMany:  mockCreate,
    update:      mockUpdate,
    findMany:    mockFindMany,
  },
} as any;

// ── Fixtures ──────────────────────────────────────────────────────────────

const LAST_SYNC  = new Date("2026-07-10T12:00:00Z");
const BEFORE     = new Date("2026-07-10T10:00:00Z");
const AFTER      = new Date("2026-07-10T14:00:00Z");

function makeCtx(overrides: Partial<ConflictContext> = {}): ConflictContext {
  return {
    applicationId:   "app1",
    applicationNum:  742,
    sheetMappingId:  "sm1",
    lastSyncedAt:    LAST_SYNC,
    localUpdatedAt:  AFTER,
    remoteUpdatedAt: AFTER,
    diffs: [{ column: "status", localValue: "APPLIED", remoteValue: "EVALUATED" }],
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("ConflictResolver — local_wins strategy", () => {
  let resolver: ConflictResolver;
  beforeEach(() => {
    vi.clearAllMocks();
    resolver = new ConflictResolver(prisma, "local_wins");
  });

  it("returns hasConflict=false when no diffs", async () => {
    const result = await resolver.resolve(makeCtx({ diffs: [] }));
    expect(result.hasConflict).toBe(false);
    expect(result.resolution).toBeNull();
  });

  it("local_wins when both sides changed after last sync", async () => {
    const result = await resolver.resolve(makeCtx({
      localUpdatedAt:  AFTER,
      remoteUpdatedAt: AFTER,
    }));
    expect(result.hasConflict).toBe(true);
    expect(result.resolution).toBe("local_wins");
    expect(result.unresolvedDiffs).toHaveLength(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns local_wins (no conflict) when only local changed", async () => {
    const result = await resolver.resolve(makeCtx({
      localUpdatedAt:  AFTER,
      remoteUpdatedAt: BEFORE,
    }));
    expect(result.hasConflict).toBe(false);
    expect(result.resolution).toBe("local_wins");
  });

  it("returns remote_wins (no conflict) when only remote changed", async () => {
    const result = await resolver.resolve(makeCtx({
      localUpdatedAt:  BEFORE,
      remoteUpdatedAt: AFTER,
    }));
    expect(result.hasConflict).toBe(false);
    expect(result.resolution).toBe("remote_wins");
  });

  it("treats null lastSyncedAt as epoch 0 (everything is 'after')", async () => {
    const result = await resolver.resolve(makeCtx({ lastSyncedAt: null }));
    // Both sides are "after" epoch — true conflict
    expect(result.hasConflict).toBe(true);
    expect(result.resolution).toBe("local_wins");
  });
});

describe("ConflictResolver — remote_wins strategy", () => {
  it("returns remote_wins on true conflict", async () => {
    const resolver = new ConflictResolver(prisma, "remote_wins");
    const result   = await resolver.resolve(makeCtx());
    expect(result.resolution).toBe("remote_wins");
    expect(result.hasConflict).toBe(true);
  });
});

describe("ConflictResolver — manual strategy", () => {
  let resolver: ConflictResolver;
  beforeEach(() => {
    vi.clearAllMocks();
    resolver = new ConflictResolver(prisma, "manual");
  });

  it("persists conflicts and returns manual resolution", async () => {
    const ctx    = makeCtx();
    const result = await resolver.resolve(ctx);
    expect(result.resolution).toBe("manual");
    expect(result.unresolvedDiffs).toHaveLength(1);
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it("writes correct data to sheetsConflict.createMany", async () => {
    const ctx = makeCtx({
      diffs: [
        { column: "status",  localValue: "APPLIED",    remoteValue: "EVALUATED" },
        { column: "notes",   localValue: "note a",     remoteValue: "note b"    },
      ],
    });
    await resolver.resolve(ctx);
    const [call] = mockCreate.mock.calls;
    expect(call[0].data).toHaveLength(2);
    expect(call[0].data[0].columnName).toBe("status");
    expect(call[0].data[0].resolution).toBe("UNRESOLVED");
  });
});

describe("ConflictResolver.markResolved", () => {
  it("calls prisma.sheetsConflict.update with correct fields", async () => {
    const resolver = new ConflictResolver(prisma, "local_wins");
    await resolver.markResolved("conflict1", "LOCAL_WINS", "APPLIED");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "conflict1" },
      data: {
        resolution:    "LOCAL_WINS",
        resolvedValue: "APPLIED",
        resolvedAt:    expect.any(Date),
      },
    });
  });
});
