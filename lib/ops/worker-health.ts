/**
 * Worker / Processor Health System
 *
 * PostgreSQL-based health monitoring for the Vercel queue processor
 * and Supabase Cron scheduler. Replaces Redis health keys.
 */

import { prisma } from "@/lib/db/client";

// Maximum age before the processor is considered degraded / stalled (10 minutes)
const PROCESSOR_HEALTHY_TTL_SECONDS = 600;

export interface WorkerHeartbeat {
  status: "running" | "idle" | "ok";
  worker: "dm";
  pid?: number;
  hostname?: string;
  startedAt?: string;
  checkedAt: string;
  jobsProcessed?: number;
}

export interface WorkerHealth {
  healthy: boolean;
  heartbeat: WorkerHeartbeat | null;
  ageMs: number | null;
}

export interface WorkerAlert {
  level: "warning" | "error";
  message: string;
  jobId?: string;
  instagramAccountId?: string;
  commentId?: string;
  createdAt: string;
}

export async function recordWorkerHeartbeat(
  heartbeat?: Partial<WorkerHeartbeat> & { jobsProcessed?: number; error?: string }
) {
  const now = new Date();
  await prisma.processorHeartbeat.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      status: heartbeat?.error ? "error" : "ok",
      lastRunAt: now,
      lastSuccessAt: heartbeat?.error ? undefined : now,
      jobsProcessed: heartbeat?.jobsProcessed ?? 0,
      lastError: heartbeat?.error ?? null,
      updatedAt: now,
    },
    update: {
      status: heartbeat?.error ? "error" : "ok",
      lastRunAt: now,
      lastSuccessAt: heartbeat?.error ? undefined : now,
      jobsProcessed: { increment: heartbeat?.jobsProcessed ?? 0 },
      lastError: heartbeat?.error ?? null,
      updatedAt: now,
    },
  }).catch((err) => {
    console.error("[WorkerHealth] Failed to record heartbeat:", err);
  });
}

export async function getWorkerHealth(): Promise<WorkerHealth> {
  try {
    const record = await prisma.processorHeartbeat.findUnique({
      where: { id: "default" },
    });

    if (!record) {
      return { healthy: false, heartbeat: null, ageMs: null };
    }

    const ageMs = Date.now() - record.lastRunAt.getTime();
    const healthy = ageMs <= PROCESSOR_HEALTHY_TTL_SECONDS * 1000 && record.status !== "error";

    const heartbeat: WorkerHeartbeat = {
      status: healthy ? "running" : "idle",
      worker: "dm",
      checkedAt: record.lastRunAt.toISOString(),
      jobsProcessed: record.jobsProcessed,
    };

    return {
      healthy,
      heartbeat,
      ageMs,
    };
  } catch {
    return { healthy: false, heartbeat: null, ageMs: null };
  }
}

export async function recordWorkerAlert(alert: Omit<WorkerAlert, "createdAt">) {
  await prisma.operationalEvent.create({
    data: {
      source: "WORKER",
      level: alert.level === "error" ? "ERROR" : "WARNING",
      message: alert.message,
      payload: {
        jobId: alert.jobId,
        instagramAccountId: alert.instagramAccountId,
        commentId: alert.commentId,
      },
    },
  }).catch(() => {});
}

export async function getWorkerAlerts(limit = 10): Promise<WorkerAlert[]> {
  try {
    const events = await prisma.operationalEvent.findMany({
      where: {
        source: "WORKER",
        level: { in: ["ERROR", "WARNING"] },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return events.map((event: { level: string; message: string; payload: unknown; createdAt: Date }) => {
      const payload = event.payload as Record<string, unknown> | null;
      return {
        level: event.level === "ERROR" ? "error" : "warning",
        message: event.message,
        jobId: typeof payload?.jobId === "string" ? payload.jobId : undefined,
        instagramAccountId: typeof payload?.instagramAccountId === "string" ? payload.instagramAccountId : undefined,
        commentId: typeof payload?.commentId === "string" ? payload.commentId : undefined,
        createdAt: event.createdAt.toISOString(),
      };
    });
  } catch {
    return [];
  }
}
