/**
 * Supabase Queue Client
 *
 * Provides the DM processing queue adapter backed by Supabase Queues (pgmq)
 * and PostgreSQL durable job state.
 */

import {
  enqueueJob,
  getQueueMetrics,
  DEFAULT_QUEUE_NAME,
  type QueueMetrics,
} from "./supabase-queue";

// ─── Job Types ───────────────────────────────────────────────────────────────────

export type CommentSource = "WEBHOOK" | "POLLING";

export interface ProcessCommentJob {
  accountConnectionId?: string;
  instagramAccountId: string;
  commentId: string;
  commentText: string;
  commenterId: string;
  commenterName?: string;
  mediaId: string;
  originalMediaId?: string;
  requeueAttempt?: number;
  source?: CommentSource;
}

export interface ProcessPostbackJob {
  accountConnectionId?: string;
  instagramAccountId: string;
  userId: string;
  payload: string;
  mid?: string;
  fallback?: boolean;
}

export interface ProcessFollowUpJob {
  accountConnectionId?: string;
  instagramAccountId: string;
  userId: string;
  automationId: string;
  commenterName?: string | null;
}

export interface ProcessMessageJob {
  accountConnectionId?: string;
  instagramAccountId: string;
  messageId: string;
  messageText: string;
  senderId: string;
}

export type DmQueueJob =
  | ProcessCommentJob
  | ProcessPostbackJob
  | ProcessFollowUpJob
  | ProcessMessageJob;

export const POSTBACK_JOB_NAME = "process-postback";
export const FOLLOWUP_JOB_NAME = "process-followup";
export const MESSAGE_JOB_NAME = "process-message";

export interface AddJobOptions {
  jobId?: string;
  delay?: number; // delay in milliseconds
  attempts?: number;
  priority?: number;
}

export interface DMQueueAdapter {
  add(name: string, data: DmQueueJob, options?: AddJobOptions): Promise<{ id: string }>;
  getJobCounts(...types: string[]): Promise<Record<string, number>>;
  getMetrics(): Promise<QueueMetrics>;
}

class SupabaseDMQueue implements DMQueueAdapter {
  async add(name: string, data: DmQueueJob, options?: AddJobOptions): Promise<{ id: string }> {
    const instagramAccountId = data.instagramAccountId;
    const delaySeconds = options?.delay ? Math.max(0, Math.ceil(options.delay / 1000)) : 0;

    let jobId = options?.jobId;
    if (!jobId) {
      if ("commentId" in data) {
        jobId = `comment_${instagramAccountId}_${data.commentId}`;
      } else if (name === POSTBACK_JOB_NAME && "userId" in data) {
        const pb = data as ProcessPostbackJob;
        const key = (pb.mid ?? pb.payload).replace(/:/g, "_");
        jobId = `postback_${instagramAccountId}_${pb.userId}_${key}`;
      } else if (name === MESSAGE_JOB_NAME && "messageId" in data) {
        jobId = `message_${instagramAccountId}_${Buffer.from(data.messageId).toString("base64url")}`;
      } else if (name === FOLLOWUP_JOB_NAME && "automationId" in data) {
        jobId = `followup_${data.automationId}_${data.userId}`;
      } else {
        jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }
    }

    await enqueueJob({
      jobId,
      queueName: DEFAULT_QUEUE_NAME,
      jobType: name,
      data,
      delaySeconds,
      instagramAccountId,
      maxAttempts: options?.attempts ?? 3,
    });

    return { id: jobId };
  }

  async getJobCounts(..._types: string[]): Promise<Record<string, number>> {
    const metrics = await getQueueMetrics(DEFAULT_QUEUE_NAME);
    return {
      waiting: metrics.waiting,
      active: metrics.active,
      delayed: metrics.delayed,
      failed: metrics.failed,
      completed: metrics.completed,
    };
  }

  async getMetrics(): Promise<QueueMetrics> {
    return getQueueMetrics(DEFAULT_QUEUE_NAME);
  }
}

const queueInstance = new SupabaseDMQueue();

export function getDMQueue(): DMQueueAdapter {
  return queueInstance;
}
