/**
 * Development / Standalone Worker Runner
 *
 * NOTE: In production on Vercel + Supabase, this background process is NOT needed.
 * Supabase Cron triggers /api/internal/worker and /api/internal/reconcile-comments.
 *
 * This file is provided for local development convenience (npm run worker).
 */

import { readBatch, completeJob, retryJob, failJob, DEFAULT_QUEUE_NAME } from "@/lib/queue/supabase-queue";
import { dispatchJob, isRetryableError, BACKOFF_DELAYS, recordWorkerFailure } from "@/lib/queue/dm-worker";
import { recordWorkerHeartbeat } from "@/lib/ops/worker-health";
import { reconcileComments } from "@/lib/polling/comment-reconciler";
import { attachPendingNextReels } from "@/lib/automation/attach-next-reel";
import type { DmQueueJob } from "@/lib/queue/client";
import os from "node:os";

const startedAt = new Date().toISOString();
const QUEUE_POLL_INTERVAL_MS = 3_000;
const HEARTBEAT_INTERVAL_MS = 30_000;
const COMMENT_POLL_INTERVAL_MS = Number(
  process.env.COMMENT_POLL_INTERVAL_MS ?? 5 * 60_000
);

console.log("[DM Worker] Started (Local Mode)");

let isProcessingQueue = false;

async function processQueueBatch() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;
  try {
    const batch = await readBatch(DEFAULT_QUEUE_NAME, 10, 60, `local_${os.hostname()}`);
    for (const job of batch) {
      try {
        await dispatchJob({
          id: job.jobId,
          name: job.jobType,
          data: job.data as DmQueueJob,
          attemptsMade: Math.max(0, job.attempt - 1),
        });
        await completeJob(job.jobId, job.msgId, DEFAULT_QUEUE_NAME);
        console.log(`[DM Worker] Job ${job.jobId} completed`);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`[DM Worker] Job ${job.jobId} failed:`, error.message);
        if (!isRetryableError(error) || job.attempt >= job.maxAttempts) {
          await failJob(job.jobId, job.attempt, error.message, job.msgId, DEFAULT_QUEUE_NAME);
          void recordWorkerFailure({ id: job.jobId, name: job.jobType, data: job.data as DmQueueJob, attemptsMade: job.attempt }, error);
        } else {
          const delayMs = BACKOFF_DELAYS[Math.min(job.attempt - 1, BACKOFF_DELAYS.length - 1)];
          await retryJob(job.jobId, job.attempt, Math.ceil(delayMs / 1000), error.message, job.msgId, DEFAULT_QUEUE_NAME);
        }
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[DM Worker] Batch error:", message);
  } finally {
    isProcessingQueue = false;
  }
}

async function heartbeat() {
  try {
    await recordWorkerHeartbeat({
      pid: process.pid,
      hostname: os.hostname(),
      startedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[DM Worker] Heartbeat failed:", message);
  }
}

void heartbeat();
const heartbeatTimer = setInterval(() => void heartbeat(), HEARTBEAT_INTERVAL_MS);
const queueTimer = setInterval(() => void processQueueBatch(), QUEUE_POLL_INTERVAL_MS);

async function poll() {
  try {
    const attached = await attachPendingNextReels();
    if (attached.bound > 0 || attached.failedAccounts > 0) {
      console.log("[DM Worker] Next-reel attachment:", attached);
    }
    await reconcileComments();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[DM Worker] Comment reconciliation failed:", message);
  }
}

setTimeout(() => void poll(), 10_000);
const pollTimer = setInterval(() => void poll(), COMMENT_POLL_INTERVAL_MS);

async function shutdown(signal: string) {
  console.log(`[DM Worker] ${signal} received, closing worker`);
  clearInterval(heartbeatTimer);
  clearInterval(queueTimer);
  clearInterval(pollTimer);
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
