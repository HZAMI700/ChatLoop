/**
 * Local Worker Runner
 *
 * Runs a single batch of queue processing against the configured database.
 * Useful for local development and testing.
 */

import { readBatch, completeJob, retryJob, failJob, DEFAULT_QUEUE_NAME } from "@/lib/queue/supabase-queue";
import { dispatchJob, isRetryableError, BACKOFF_DELAYS, recordWorkerFailure } from "@/lib/queue/dm-worker";
import { recordWorkerHeartbeat } from "@/lib/ops/worker-health";
import type { DmQueueJob } from "@/lib/queue/client";

async function main() {
  console.log("[Worker Runner] Draining queue batch...");
  const batch = await readBatch(DEFAULT_QUEUE_NAME, 10, 60, "local-cli");
  console.log(`[Worker Runner] Read ${batch.length} jobs`);

  let succeeded = 0;
  let failed = 0;
  let requeued = 0;

  for (const job of batch) {
    console.log(`[Worker Runner] Processing ${job.jobType} (${job.jobId})...`);
    try {
      await dispatchJob({
        id: job.jobId,
        name: job.jobType,
        data: job.data as DmQueueJob,
        attemptsMade: Math.max(0, job.attempt - 1),
      });
      await completeJob(job.jobId, job.msgId, DEFAULT_QUEUE_NAME);
      succeeded++;
      console.log(`[Worker Runner] Job ${job.jobId} completed successfully`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`[Worker Runner] Job ${job.jobId} failed:`, error.message);

      if (!isRetryableError(error) || job.attempt >= job.maxAttempts) {
        await failJob(job.jobId, job.attempt, error.message, job.msgId, DEFAULT_QUEUE_NAME);
        void recordWorkerFailure({ id: job.jobId, name: job.jobType, data: job.data as DmQueueJob, attemptsMade: job.attempt }, error);
        failed++;
      } else {
        const delayMs = BACKOFF_DELAYS[Math.min(job.attempt - 1, BACKOFF_DELAYS.length - 1)];
        await retryJob(job.jobId, job.attempt, Math.ceil(delayMs / 1000), error.message, job.msgId, DEFAULT_QUEUE_NAME);
        requeued++;
      }
    }
  }

  await recordWorkerHeartbeat({ jobsProcessed: succeeded });
  console.log(`[Worker Runner] Finished. Succeeded: ${succeeded}, Failed: ${failed}, Requeued: ${requeued}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[Worker Runner] Fatal error:", err);
  process.exit(1);
});
