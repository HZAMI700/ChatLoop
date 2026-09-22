/**
 * Rate Limiter — Unit Tests
 *
 * Tests the hourly private-reply cap enforcement using PostgreSQL / Prisma mocks.
 * Assertions derive from RATE_LIMIT_MAX so they survive a change to the cap.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockQueryRaw, mockTransaction, mockInstagramRateLimitWindow } = vi.hoisted(() => {
  const mockInstagramRateLimitWindow = {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  };
  return {
    mockQueryRaw: vi.fn(),
    mockTransaction: vi.fn(async (callback: (tx: unknown) => unknown) => {
      return callback({ instagramRateLimitWindow: mockInstagramRateLimitWindow });
    }),
    mockInstagramRateLimitWindow,
  };
});

vi.mock("@/lib/db/client", () => ({
  prisma: {
    $queryRaw: mockQueryRaw,
    $transaction: mockTransaction,
    instagramRateLimitWindow: mockInstagramRateLimitWindow,
  },
}));

import {
  checkRateLimit,
  incrementDMCounter,
  reserveDMSlot,
  releaseDMSlot,
  resetRateLimit,
  RATE_LIMIT_MAX,
} from "../lib/utils/rate-limiter";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkRateLimit", () => {
  it("should allow when count is below limit", async () => {
    mockInstagramRateLimitWindow.findUnique.mockResolvedValue({ count: 50 });

    const result = await checkRateLimit("account_123");

    expect(result.allowed).toBe(true);
    expect(result.currentCount).toBe(50);
    expect(result.remainingDMs).toBe(RATE_LIMIT_MAX - 50);
    expect(result.shouldRequeue).toBe(false);
    expect(result.shouldSkip).toBe(false);
    expect(result.reserved).toBe(false);
  });

  it("should allow when no previous count exists", async () => {
    mockInstagramRateLimitWindow.findUnique.mockResolvedValue(null);

    const result = await checkRateLimit("account_123");

    expect(result.allowed).toBe(true);
    expect(result.currentCount).toBe(0);
    expect(result.remainingDMs).toBe(RATE_LIMIT_MAX);
  });

  it("should deny when count reaches the limit", async () => {
    mockInstagramRateLimitWindow.findUnique.mockResolvedValue({ count: RATE_LIMIT_MAX });

    const result = await checkRateLimit("account_123");

    expect(result.allowed).toBe(false);
    expect(result.shouldRequeue).toBe(true);
    expect(result.shouldSkip).toBe(false);
  });

  it("should skip after max requeue attempts", async () => {
    mockInstagramRateLimitWindow.findUnique.mockResolvedValue({ count: RATE_LIMIT_MAX });

    const result = await checkRateLimit("account_123", 3);

    expect(result.allowed).toBe(false);
    expect(result.shouldRequeue).toBe(false);
    expect(result.shouldSkip).toBe(true);
  });
});

describe("reserveDMSlot", () => {
  it("should atomically reserve a slot when below the hourly cap", async () => {
    mockQueryRaw.mockResolvedValue([{ count: 51 }]);

    const result = await reserveDMSlot("account_123");

    expect(mockQueryRaw).toHaveBeenCalled();
    expect(result.allowed).toBe(true);
    expect(result.reserved).toBe(true);
    expect(result.currentCount).toBe(51);
    expect(result.remainingDMs).toBe(RATE_LIMIT_MAX - 51);
  });

  it("should recommend requeue when the atomic reserve is denied", async () => {
    mockQueryRaw.mockResolvedValue([]);
    mockInstagramRateLimitWindow.findUnique.mockResolvedValue({ count: RATE_LIMIT_MAX });

    const result = await reserveDMSlot("account_123", 0);

    expect(result.allowed).toBe(false);
    expect(result.reserved).toBe(false);
    expect(result.shouldRequeue).toBe(true);
    expect(result.shouldSkip).toBe(false);
  });

  it("should skip after max requeue attempts", async () => {
    mockQueryRaw.mockResolvedValue([]);
    mockInstagramRateLimitWindow.findUnique.mockResolvedValue({ count: RATE_LIMIT_MAX });

    const result = await reserveDMSlot("account_123", 3);

    expect(result.allowed).toBe(false);
    expect(result.shouldRequeue).toBe(false);
    expect(result.shouldSkip).toBe(true);
  });
});

describe("incrementDMCounter", () => {
  it("should use the atomic reservation path", async () => {
    mockQueryRaw.mockResolvedValue([{ count: 51 }]);

    const count = await incrementDMCounter("account_123");

    expect(mockQueryRaw).toHaveBeenCalled();
    expect(count).toBe(51);
  });
});

describe("releaseDMSlot", () => {
  it("hands a reserved slot back and returns the new count", async () => {
    mockQueryRaw.mockResolvedValue([{ count: 49 }]);

    const count = await releaseDMSlot("account_123");

    expect(mockQueryRaw).toHaveBeenCalled();
    expect(count).toBe(49);
  });
});

describe("resetRateLimit", () => {
  it("clears rate limit window for account", async () => {
    mockInstagramRateLimitWindow.deleteMany.mockResolvedValue({ count: 1 });

    await resetRateLimit("account_123");

    expect(mockInstagramRateLimitWindow.deleteMany).toHaveBeenCalled();
  });
});
