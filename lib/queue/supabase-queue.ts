/**
 * Supabase Queues (pgmq) + PostgreSQL Durable Queue Engine
 *
 * Implements a durable, transactional job queue using:
 * 1. Supabase pgmq extension (when available in Supabase PostgreSQL)
 * 2. PostgreSQL QueueJobState table for exact-once idempotency, auditability, and fallback
 */

import { prisma } from "@/lib/db/client";
import type { Prisma, JobStatus } from "@/app/generated/prisma/client";

export const DEFAULT_QUEUE_NAME = "instagram_dm_queue";
export const DEFAULT_VISIBILITY_TIMEOUT_SECONDS = 60;

export interface QueueJobPayload<T = unknown> {
  jobId: string;
  queueName: string;
  jobType: string;
  data: T;
  attempt: number;
  maxAttempts: number;
  workspaceId?: string;
  instagramAccountId: string;
  enqueuedAt: string;
}

export interface EnqueueJobOptions<T = unknown> {
  jobId: string;
  queueName?: string;
  jobType: string;
  data: T;
  delaySeconds?: number;
  workspaceId?: string;
  instagramAccountId: string;
  maxAttempts?: number;
}

export interface DequeuedJob<T = unknown> {
  msgId?: number | string;
  jobId: string;
  jobType: string;
  data: T;
  attempt: number;
  maxAttempts: number;
  workspaceId?: string;
  instagramAccountId: string;
  enqueuedAt: Date;
}

export interface QueueMetrics {
  waiting: number;
  active: number;
  delayed: number;
  failed: number;
  completed: number;
}

// Track whether pgmq extension functions exist in the database
let pgmqAvailable: boolean | null = null;

async function isPgmqAvailable(): Promise<boolean> {
  if (pgmqAvailable !== null) return pgmqAvailable;
  try {
    const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM pg_proc
        JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
        WHERE pg_namespace.nspname = 'pgmq' AND pg_proc.proname = 'send'
      ) as exists;
    `;
    pgmqAvailable = Boolean(result[0]?.exists);
  } catch {
    pgmqAvailable = false;
  }
  return pgmqAvailable;
}

/**
 * Initialize the queue in Supabase pgmq if available.
 */
export async function ensureQueueExists(queueName: string = DEFAULT_QUEUE_NAME): Promise<void> {
  const available = await isPgmqAvailable();
  if (available) {
    try {
      await prisma.$executeRawUnsafe(`SELECT pgmq.create('${queueName}');`);
    } catch {
      // Queue might already exist, ignore duplicate error
    }
  }
}

/**
 * Enqueue a job into the durable queue.
 * Idempotency check: if a job with jobId is already COMPLETED or PROCESSING (within lock), skip re-enqueue.
 */
export async function enqueueJob<T = unknown>(options: EnqueueJobOptions<T>): Promise<{ enqueued: boolean; jobId: string }> {
  const queueName = options.queueName ?? DEFAULT_QUEUE_NAME;
  const maxAttempts = options.maxAttempts ?? 3;
  const delaySeconds = Math.max(0, options.delaySeconds ?? 0);
  const nextAttemptAt = new Date(Date.now() + delaySeconds * 1000);

  // Check existing job state for deduplication
  const existing = await prisma.queueJobState.findUnique({
    where: { id: options.jobId },
  });

  if (existing) {
    if (existing.status === "COMPLETED") {
      return { enqueued: false, jobId: options.jobId };
    }
    if (existing.status === "PROCESSING" && existing.lockedAt && Date.now() - existing.lockedAt.getTime() < 60_000) {
      return { enqueued: false, jobId: options.jobId };
    }
  }

  const payloadJson = options.data as unknown as Prisma.InputJsonValue;

  // Persist / update QueueJobState
  await prisma.queueJobState.upsert({
    where: { id: options.jobId },
    create: {
      id: options.jobId,
      queueName,
      jobType: options.jobType,
      status: "QUEUED",
      attempts: 0,
      maxAttempts,
      nextAttemptAt,
      payload: payloadJson,
      workspaceId: options.workspaceId ?? null,
      instagramAccountId: options.instagramAccountId,
    },
    update: {
      status: "QUEUED",
      nextAttemptAt,
      payload: payloadJson,
      lastError: null,
      lockedAt: null,
      lockedBy: null,
    },
  });

  const available = await isPgmqAvailable();
  if (available) {
    try {
      const msgPayload = JSON.stringify({
        jobId: options.jobId,
        queueName,
        jobType: options.jobType,
        data: options.data,
        attempt: 0,
        maxAttempts,
        workspaceId: options.workspaceId,
        instagramAccountId: options.instagramAccountId,
        enqueuedAt: new Date().toISOString(),
      });
      await prisma.$executeRawUnsafe(
        `SELECT pgmq.send($1, $2::jsonb, $3);`,
        queueName,
        msgPayload,
        delaySeconds
      );
    } catch (error) {
      console.warn("[SupabaseQueue] pgmq.send failed, falling back to database table queue:", error);
    }
  }

  return { enqueued: true, jobId: options.jobId };
}

/**
 * Read a batch of jobs for processing.
 * Respects visibility timeout and marks jobs as PROCESSING atomically.
 */
export async function readBatch(
  queueName: string = DEFAULT_QUEUE_NAME,
  batchSize: number = 10,
  visibilityTimeoutSeconds: number = DEFAULT_VISIBILITY_TIMEOUT_SECONDS,
  workerId: string = `worker_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
): Promise<DequeuedJob[]> {
  const available = await isPgmqAvailable();

  if (available) {
    try {
      const rows = await prisma.$queryRawUnsafe<Array<{
        msg_id: string | number;
        read_ct: number;
        enqueued_at: string;
        message: unknown;
      }>>(
        `SELECT msg_id, read_ct, enqueued_at, message FROM pgmq.read($1, $2, $3);`,
        queueName,
        visibilityTimeoutSeconds,
        batchSize
      );

      if (rows && rows.length > 0) {
        const jobs: DequeuedJob[] = [];
        const now = new Date();

        for (const row of rows) {
          const msg = typeof row.message === "string" ? JSON.parse(row.message) : row.message;
          const payload = msg as QueueJobPayload;
          const jobId = payload.jobId;

          // Check if already completed in JobState
          const state = await prisma.queueJobState.findUnique({ where: { id: jobId } });
          if (state?.status === "COMPLETED") {
            // Already handled, delete from pgmq
            await prisma.$executeRawUnsafe(`SELECT pgmq.delete($1, $2::bigint);`, queueName, row.msg_id).catch(() => {});
            continue;
          }

          // Lock job in JobState
          await prisma.queueJobState.update({
            where: { id: jobId },
            data: {
              status: "PROCESSING",
              lockedAt: now,
              lockedBy: workerId,
              attempts: { increment: 1 },
            },
          }).catch(() => {});

          jobs.push({
            msgId: row.msg_id,
            jobId: payload.jobId,
            jobType: payload.jobType,
            data: payload.data,
            attempt: Number(row.read_ct),
            maxAttempts: payload.maxAttempts ?? 3,
            workspaceId: payload.workspaceId,
            instagramAccountId: payload.instagramAccountId,
            enqueuedAt: new Date(row.enqueued_at),
          });
        }
        return jobs;
      }
    } catch (error) {
      console.warn("[SupabaseQueue] pgmq.read failed, falling back to database table queue:", error);
    }
  }

  // Fallback: Transactional table-based read with visibility timeout
  return await prisma.$transaction(async (_tx) => {
    // Cast needed: Prisma 7.x interactive-transaction client type omits model
    // delegates on some generated-client configurations (same as other files).
    const tx = _tx as unknown as typeof prisma;
    const now = new Date();
    const staleLockThreshold = new Date(now.getTime() - visibilityTimeoutSeconds * 1000);

    // Find jobs that are either QUEUED or STALE PROCESSING
    const candidates = await tx.queueJobState.findMany({
      where: {
        queueName,
        AND: [
          { nextAttemptAt: { lte: now } },
          {
            OR: [
              { status: "QUEUED" },
              {
                status: "PROCESSING",
                lockedAt: { lte: staleLockThreshold },
              },
            ],
          },
        ],
      },
      orderBy: { nextAttemptAt: "asc" },
      take: batchSize,
    });

    if (candidates.length === 0) return [];

    const jobs: DequeuedJob[] = [];

    for (const cand of candidates) {
      await tx.queueJobState.update({
        where: { id: cand.id },
        data: {
          status: "PROCESSING",
          lockedAt: now,
          lockedBy: workerId,
          attempts: { increment: 1 },
        },
      });

      jobs.push({
        jobId: cand.id,
        jobType: cand.jobType,
        data: cand.payload,
        attempt: cand.attempts + 1,
        maxAttempts: cand.maxAttempts,
        workspaceId: cand.workspaceId ?? undefined,
        instagramAccountId: cand.instagramAccountId ?? "",
        enqueuedAt: cand.createdAt,
      });
    }

    return jobs;
  });
}

/**
 * Mark a job as successfully completed.
 * Archives / deletes from pgmq and updates QueueJobState.
 */
export async function completeJob(
  jobId: string,
  msgId?: number | string,
  queueName: string = DEFAULT_QUEUE_NAME
): Promise<void> {
  await prisma.queueJobState.update({
    where: { id: jobId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      lockedAt: null,
      lockedBy: null,
      lastError: null,
    },
  }).catch(() => {});

  if (msgId !== undefined && msgId !== null) {
    const available = await isPgmqAvailable();
    if (available) {
      try {
        await prisma.$executeRawUnsafe(`SELECT pgmq.archive($1, $2::bigint);`, queueName, msgId);
      } catch {
        try {
          await prisma.$executeRawUnsafe(`SELECT pgmq.delete($1, $2::bigint);`, queueName, msgId);
        } catch {}
      }
    }
  }
}

/**
 * Schedule a job for retry with exponential backoff delay.
 */
export async function retryJob(
  jobId: string,
  attempt: number,
  backoffSeconds: number,
  error: string,
  msgId?: number | string,
  queueName: string = DEFAULT_QUEUE_NAME
): Promise<void> {
  const nextAttemptAt = new Date(Date.now() + backoffSeconds * 1000);

  await prisma.queueJobState.update({
    where: { id: jobId },
    data: {
      status: "QUEUED",
      attempts: attempt,
      lastError: error,
      nextAttemptAt,
      lockedAt: null,
      lockedBy: null,
    },
  }).catch(() => {});

  if (msgId !== undefined && msgId !== null) {
    const available = await isPgmqAvailable();
    if (available) {
      try {
        await prisma.$executeRawUnsafe(
          `SELECT pgmq.set_vt($1, $2::bigint, $3);`,
          queueName,
          msgId,
          backoffSeconds
        );
      } catch {}
    }
  }
}

/**
 * Mark a job as permanently failed (dead-letter).
 */
export async function failJob(
  jobId: string,
  attempt: number,
  error: string,
  msgId?: number | string,
  queueName: string = DEFAULT_QUEUE_NAME
): Promise<void> {
  await prisma.queueJobState.update({
    where: { id: jobId },
    data: {
      status: "FAILED",
      attempts: attempt,
      lastError: error,
      failedAt: new Date(),
      lockedAt: null,
      lockedBy: null,
    },
  }).catch(() => {});

  if (msgId !== undefined && msgId !== null) {
    const available = await isPgmqAvailable();
    if (available) {
      try {
        await prisma.$executeRawUnsafe(`SELECT pgmq.archive($1, $2::bigint);`, queueName, msgId);
      } catch {}
    }
  }
}

/**
 * Get queue metrics / depth.
 */
export async function getQueueMetrics(queueName: string = DEFAULT_QUEUE_NAME): Promise<QueueMetrics> {
  const now = new Date();

  const [waiting, delayed, active, failed, completed] = await Promise.all([
    prisma.queueJobState.count({
      where: { queueName, status: "QUEUED", nextAttemptAt: { lte: now } },
    }),
    prisma.queueJobState.count({
      where: { queueName, status: "QUEUED", nextAttemptAt: { gt: now } },
    }),
    prisma.queueJobState.count({
      where: { queueName, status: "PROCESSING" },
    }),
    prisma.queueJobState.count({
      where: { queueName, status: { in: ["FAILED", "DEAD_LETTER"] } },
    }),
    prisma.queueJobState.count({
      where: { queueName, status: "COMPLETED" },
    }),
  ]);

  return { waiting, active, delayed, failed, completed };
}
