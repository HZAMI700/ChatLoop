/**
 * Rate Limiter
 *
 * PostgreSQL-based atomic rate limiter for Instagram private replies.
 *
 * The cap matches Meta's documented limit: 750 private replies per hour
 * per Instagram professional account.
 *
 * Implemented using PostgreSQL row locking and atomic conditional updates
 * so concurrent Vercel serverless workers never exceed the cap.
 */

import { prisma } from "@/lib/db/client";

const RATE_LIMIT_MAX = 750; // private replies per hour, per Meta's documented cap
const RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds
const REQUEUE_DELAY_MS = 30 * 60 * 1000; // 30 minutes
const MAX_REQUEUE_ATTEMPTS = 3;

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  remainingDMs: number;
  shouldRequeue: boolean;
  requeueDelayMs: number;
  shouldSkip: boolean;
  reserved: boolean;
}

export function getCurrentWindowStart(now = new Date()): Date {
  const ms = now.getTime();
  const windowMs = RATE_LIMIT_WINDOW * 1000;
  return new Date(Math.floor(ms / windowMs) * windowMs);
}

function blockedResult(
  count: number,
  requeueAttempt: number
): RateLimitResult {
  if (requeueAttempt >= MAX_REQUEUE_ATTEMPTS) {
    return {
      allowed: false,
      currentCount: count,
      remainingDMs: 0,
      shouldRequeue: false,
      requeueDelayMs: 0,
      shouldSkip: true,
      reserved: false,
    };
  }

  return {
    allowed: false,
    currentCount: count,
    remainingDMs: 0,
    shouldRequeue: true,
    requeueDelayMs: REQUEUE_DELAY_MS,
    shouldSkip: false,
    reserved: false,
  };
}

/**
 * Check if an Instagram account is within its DM rate limit.
 *
 * @param instagramAccountId - The Instagram account ID to check
 * @param requeueAttempt - How many times this job has been requeued (0 = first attempt)
 * @returns Rate limit result with action recommendations
 */
export async function checkRateLimit(
  instagramAccountId: string,
  requeueAttempt: number = 0
): Promise<RateLimitResult> {
  const windowStart = getCurrentWindowStart();

  const existing = await prisma.instagramRateLimitWindow.findUnique({
    where: {
      instagramAccountId_windowStart: {
        instagramAccountId,
        windowStart,
      },
    },
    select: { count: true },
  });

  const count = existing ? existing.count : 0;

  if (count >= RATE_LIMIT_MAX) {
    return blockedResult(count, requeueAttempt);
  }

  return {
    allowed: true,
    currentCount: count,
    remainingDMs: Math.max(0, RATE_LIMIT_MAX - count),
    shouldRequeue: false,
    requeueDelayMs: 0,
    shouldSkip: false,
    reserved: false,
  };
}

/**
 * Atomically reserve a DM send slot for an Instagram account in PostgreSQL.
 * Uses atomic conditional upsert: increments only if count < RATE_LIMIT_MAX.
 */
export async function reserveDMSlot(
  instagramAccountId: string,
  requeueAttempt: number = 0
): Promise<RateLimitResult> {
  const windowStart = getCurrentWindowStart();

  try {
    const result = await prisma.$queryRaw<Array<{ count: number }>>`
      INSERT INTO "InstagramRateLimitWindow" ("id", "instagramAccountId", "windowStart", "count", "updatedAt")
      VALUES (gen_random_uuid()::text, ${instagramAccountId}, ${windowStart}, 1, NOW())
      ON CONFLICT ("instagramAccountId", "windowStart")
      DO UPDATE SET "count" = "InstagramRateLimitWindow"."count" + 1, "updatedAt" = NOW()
      WHERE "InstagramRateLimitWindow"."count" < ${RATE_LIMIT_MAX}
      RETURNING "count";
    `;

    if (result && result.length > 0) {
      const count = result[0].count;
      return {
        allowed: true,
        currentCount: count,
        remainingDMs: Math.max(0, RATE_LIMIT_MAX - count),
        shouldRequeue: false,
        requeueDelayMs: 0,
        shouldSkip: false,
        reserved: true,
      };
    }
  } catch {
    // If raw query fails (e.g. SQLite in test environments or missing extension), fall back to Prisma transaction
    return await prisma.$transaction(async (_tx) => {
      // Cast needed: Prisma 7.x interactive-transaction client type omits model
      // delegates on some generated-client configurations (same as other files).
      const tx = _tx as unknown as typeof prisma;
      const existing = await tx.instagramRateLimitWindow.findUnique({
        where: {
          instagramAccountId_windowStart: {
            instagramAccountId,
            windowStart,
          },
        },
      });

      const count = existing?.count ?? 0;
      if (count >= RATE_LIMIT_MAX) {
        return blockedResult(count, requeueAttempt);
      }

      const updated = await tx.instagramRateLimitWindow.upsert({
        where: {
          instagramAccountId_windowStart: {
            instagramAccountId,
            windowStart,
          },
        },
        create: {
          instagramAccountId,
          windowStart,
          count: 1,
        },
        update: {
          count: { increment: 1 },
        },
      });

      return {
        allowed: true,
        currentCount: updated.count,
        remainingDMs: Math.max(0, RATE_LIMIT_MAX - updated.count),
        shouldRequeue: false,
        requeueDelayMs: 0,
        shouldSkip: false,
        reserved: true,
      };
    });
  }

  // Cap was reached; inspect current count
  const existing = await prisma.instagramRateLimitWindow.findUnique({
    where: {
      instagramAccountId_windowStart: {
        instagramAccountId,
        windowStart,
      },
    },
    select: { count: true },
  });

  const count = existing?.count ?? RATE_LIMIT_MAX;
  return blockedResult(count, requeueAttempt);
}

/**
 * Release a DM slot previously taken by reserveDMSlot when a send fails.
 * Clamped to 0.
 */
export async function releaseDMSlot(
  instagramAccountId: string
): Promise<number> {
  const windowStart = getCurrentWindowStart();

  try {
    const result = await prisma.$queryRaw<Array<{ count: number }>>`
      UPDATE "InstagramRateLimitWindow"
      SET "count" = GREATEST("count" - 1, 0), "updatedAt" = NOW()
      WHERE "instagramAccountId" = ${instagramAccountId}
        AND "windowStart" = ${windowStart}
      RETURNING "count";
    `;

    if (result && result.length > 0) {
      return result[0].count;
    }
  } catch {
    // Fallback for test databases without postgres functions
    const existing = await prisma.instagramRateLimitWindow.findUnique({
      where: {
        instagramAccountId_windowStart: {
          instagramAccountId,
          windowStart,
        },
      },
    });

    if (existing && existing.count > 0) {
      const updated = await prisma.instagramRateLimitWindow.update({
        where: { id: existing.id },
        data: { count: Math.max(0, existing.count - 1) },
      });
      return updated.count;
    }
  }

  return 0;
}

/**
 * Backwards-compatible helper for tests and admin scripts.
 */
export async function incrementDMCounter(
  instagramAccountId: string
): Promise<number> {
  const result = await reserveDMSlot(instagramAccountId, MAX_REQUEUE_ATTEMPTS);
  return result.currentCount;
}

/**
 * Get the current DM count for an Instagram account in the current hourly window.
 */
export async function getCurrentDMCount(
  instagramAccountId: string
): Promise<number> {
  const windowStart = getCurrentWindowStart();
  const window = await prisma.instagramRateLimitWindow.findUnique({
    where: {
      instagramAccountId_windowStart: {
        instagramAccountId,
        windowStart,
      },
    },
    select: { count: true },
  });

  return window ? window.count : 0;
}

/**
 * Reset the rate limiter for an account (useful for testing).
 */
export async function resetRateLimit(
  instagramAccountId: string
): Promise<void> {
  const windowStart = getCurrentWindowStart();
  await prisma.instagramRateLimitWindow.deleteMany({
    where: {
      instagramAccountId,
      windowStart,
    },
  });
}

export { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW, REQUEUE_DELAY_MS, MAX_REQUEUE_ATTEMPTS };
