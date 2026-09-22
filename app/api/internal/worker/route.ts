import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import {
  readBatch,
  completeJob,
  retryJob,
  failJob,
  DEFAULT_QUEUE_NAME,
} from "@/lib/queue/supabase-queue";
import {
  dispatchJob,
  isRetryableError,
  BACKOFF_DELAYS,
  recordWorkerFailure,
} from "@/lib/queue/dm-worker";
import { recordWorkerHeartbeat } from "@/lib/ops/worker-health";
import type { DmQueueJob } from "@/lib/queue/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Maximum execution budget in milliseconds to guarantee safe return within Vercel limits
const MAX_EXECUTION_TIME_MS = 10_000;
const BATCH_SIZE = 15;

function isAuthorized(request: NextRequest): boolean {
  const secretHeader = request.headers.get("x-openreply-worker-secret");
  const authHeader = request.headers.get("authorization");

  const expectedSecret =
    process.env.OPENREPLY_WORKER_SECRET ||
    process.env.CRON_SECRET ||
    process.env.NEXTAUTH_SECRET;

  if (!expectedSecret) return false;

  const candidate =
    secretHeader ||
    (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);

  if (!candidate) return false;

  try {
    const candidateBuf = Buffer.from(candidate);
    const expectedBuf = Buffer.from(expectedSecret);
    return (
      candidateBuf.length === expectedBuf.length &&
      timingSafeEqual(candidateBuf, expectedBuf)
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const startTime = Date.now();
  const workerId = `vercel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  let processedCount = 0;
  let succeededCount = 0;
  let failedCount = 0;
  let requeuedCount = 0;

  try {
    const batch = await readBatch(DEFAULT_QUEUE_NAME, BATCH_SIZE, 60, workerId);

    for (const job of batch) {
      // Check execution time budget to prevent serverless timeout
      if (Date.now() - startTime > MAX_EXECUTION_TIME_MS) {
        break;
      }

      processedCount++;

      try {
        await dispatchJob({
          id: job.jobId,
          name: job.jobType,
          data: job.data as DmQueueJob,
          attemptsMade: Math.max(0, job.attempt - 1),
        });

        await completeJob(job.jobId, job.msgId, DEFAULT_QUEUE_NAME);
        succeededCount++;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        const retryable = isRetryableError(error);

        if (!retryable || job.attempt >= job.maxAttempts) {
          // Permanent failure or max attempts exhausted
          await failJob(job.jobId, job.attempt, error.message, job.msgId, DEFAULT_QUEUE_NAME);
          void recordWorkerFailure(
            {
              id: job.jobId,
              name: job.jobType,
              data: job.data as DmQueueJob,
              attemptsMade: job.attempt,
            },
            error
          );
          failedCount++;
        } else {
          // Retryable error: schedule retry with exponential backoff
          const delayMs =
            BACKOFF_DELAYS[
              Math.min(job.attempt - 1, BACKOFF_DELAYS.length - 1)
            ];
          const delaySeconds = Math.ceil(delayMs / 1000);
          await retryJob(
            job.jobId,
            job.attempt,
            delaySeconds,
            error.message,
            job.msgId,
            DEFAULT_QUEUE_NAME
          );
          requeuedCount++;
        }
      }
    }

    await recordWorkerHeartbeat({ jobsProcessed: succeededCount });

    return NextResponse.json({
      success: true,
      processed: processedCount,
      succeeded: succeededCount,
      failed: failedCount,
      requeued: requeuedCount,
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal worker error";
    await recordWorkerHeartbeat({ error: message });

    return NextResponse.json(
      {
        success: false,
        error: message,
        processed: processedCount,
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
