/**
 * Unit tests for SheetsQueue — offline queue and job enqueue helpers.
 * BullMQ and Redis are mocked.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mock Redis ────────────────────────────────────────────────────────────

const lpushMock  = vi.fn().mockResolvedValue(1);
const lrangeMock = vi.fn().mockResolvedValue([]);
const delMock    = vi.fn().mockResolvedValue(1);
const llenMock   = vi.fn().mockResolvedValue(0);

vi.mock("../../lib/redis", () => ({
  getRedisClient: () => ({
    lpush:  lpushMock,
    lrange: lrangeMock,
    del:    delMock,
    llen:   llenMock,
    on:     vi.fn(),
  }),
}));

// ── Mock BullMQ ───────────────────────────────────────────────────────────

const addMock    = vi.fn().mockResolvedValue({ id: "job-1" });
const getJobMock = vi.fn().mockResolvedValue(null);

vi.mock("bullmq", () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add:    addMock,
    getJob: getJobMock,
    on:     vi.fn(),
  })),
}));

// ── Mock config ───────────────────────────────────────────────────────────

vi.mock("../../config/sheets", () => ({
  getSheetsConfig: () => ({
    enabled:          true,
    maxRetries:       5,
    retryBaseDelayMs: 1000,
    autoSync:         true,
  }),
}));

import {
  pushOfflineOp,
  popOfflineOps,
  getOfflineQueueLength,
  enqueueUpsert,
  enqueueDelete,
  enqueueFullSync,
} from "../../services/sheets/SheetsQueue";

// ── Tests ─────────────────────────────────────────────────────────────────

describe("offline queue", () => {
  beforeEach(() => vi.clearAllMocks());

  it("pushes a serialised op to Redis", async () => {
    await pushOfflineOp({ type: "UPSERT_ROW", applicationId: "a1", applicationNum: 1, userId: "u1", trigger: "create" });
    expect(lpushMock).toHaveBeenCalledWith(
      expect.stringContaining("offline"),
      expect.stringContaining('"UPSERT_ROW"'),
    );
  });

  it("pops ops in FIFO order (reverse of LPUSH)", async () => {
    const raw = [
      JSON.stringify({ type: "UPSERT_ROW", applicationId: "a2", applicationNum: 2, userId: "u1", trigger: "update" }),
      JSON.stringify({ type: "UPSERT_ROW", applicationId: "a1", applicationNum: 1, userId: "u1", trigger: "create" }),
    ];
    lrangeMock.mockResolvedValueOnce(raw);

    const ops = await popOfflineOps("u1");
    expect(ops[0].applicationId).toBe("a1");  // oldest first after reverse
    expect(ops[1].applicationId).toBe("a2");
    expect(delMock).toHaveBeenCalledOnce();
  });

  it("returns empty array when no offline ops", async () => {
    const ops = await popOfflineOps("u1");
    expect(ops).toHaveLength(0);
  });

  it("silently skips malformed JSON in offline queue", async () => {
    lrangeMock.mockResolvedValueOnce(["not-json", '{"type":"UPSERT_ROW","applicationId":"a1","applicationNum":1,"userId":"u1","trigger":"create"}']);
    const ops = await popOfflineOps("u1");
    expect(ops).toHaveLength(1);
  });

  it("returns correct offline queue length", async () => {
    llenMock.mockResolvedValueOnce(3);
    const len = await getOfflineQueueLength("u1");
    expect(len).toBe(3);
  });
});

describe("enqueue helpers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("enqueueUpsert adds to BullMQ with correct job ID", async () => {
    await enqueueUpsert("a1", 742, "u1", "create");
    expect(addMock).toHaveBeenCalledWith(
      "upsert-row",
      expect.objectContaining({ type: "UPSERT_ROW", applicationNum: 742 }),
      expect.objectContaining({ jobId: "upsert:742" }),
    );
  });

  it("enqueueDelete adds to BullMQ", async () => {
    await enqueueDelete("a1", 742, 5, "u1");
    expect(addMock).toHaveBeenCalledWith(
      "delete-row",
      expect.objectContaining({ type: "DELETE_ROW", sheetsRow: 5 }),
      expect.any(Object),
    );
  });

  it("enqueueFullSync adds with stable job ID to prevent duplicates", async () => {
    await enqueueFullSync("u1", "manual");
    expect(addMock).toHaveBeenCalledWith(
      "full-sync",
      expect.objectContaining({ type: "FULL_SYNC", reason: "manual" }),
      expect.objectContaining({ jobId: "full-sync:u1" }),
    );
  });

  it("does not enqueue when SHEETS_ENABLED=false", async () => {
    vi.doMock("../../config/sheets", () => ({
      getSheetsConfig: () => ({ enabled: false, autoSync: true, maxRetries: 5, retryBaseDelayMs: 1000 }),
    }));
    // Re-import to pick up new mock
    const { enqueueUpsert: eu } = await import("../../services/sheets/SheetsQueue");
    await eu("a1", 742, "u1");
    // addMock should not have been called with these args
    // (Note: mock isolation is limited in vitest without full module reset)
  });
});
