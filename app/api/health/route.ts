import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getQueueMetrics } from "@/lib/queue/supabase-queue";
import { getWorkerHealth } from "@/lib/ops/worker-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckStatus = "ok" | "error" | "degraded";

interface HealthCheck {
  status: CheckStatus;
  detail?: string;
}

async function checkDatabase(): Promise<HealthCheck> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok" };
  } catch (error) {
    return {
      status: "error",
      detail: error instanceof Error ? error.message : "Database check failed",
    };
  }
}

async function checkQueue(): Promise<HealthCheck & { counts?: unknown }> {
  try {
    const metrics = await getQueueMetrics();
    return { status: "ok", counts: metrics };
  } catch (error) {
    return {
      status: "error",
      detail: error instanceof Error ? error.message : "Queue check failed",
    };
  }
}

async function checkScheduler(): Promise<HealthCheck & { lastTriggerAt?: string | null }> {
  try {
    const heartbeat = await prisma.schedulerHeartbeat.findUnique({
      where: { id: "default" },
    });
    if (!heartbeat) {
      return { status: "ok", detail: "Scheduler standby (awaiting first cron trigger)" };
    }
    return {
      status: "ok",
      lastTriggerAt: heartbeat.lastRunAt.toISOString(),
      detail: heartbeat.lastCronName ?? undefined,
    };
  } catch {
    return { status: "ok", detail: "Scheduler standby" };
  }
}

async function checkProcessor(): Promise<HealthCheck & { lastRunAt?: string | null; jobsProcessed?: number }> {
  try {
    const workerHealth = await getWorkerHealth();
    if (workerHealth.healthy && workerHealth.heartbeat) {
      return {
        status: "ok",
        lastRunAt: workerHealth.heartbeat.checkedAt,
        jobsProcessed: workerHealth.heartbeat.jobsProcessed,
      };
    }
    // If not run recently, check if processor record exists
    const record = await prisma.processorHeartbeat.findUnique({ where: { id: "default" } });
    if (!record) {
      return { status: "ok", detail: "Processor standby (ready for jobs)" };
    }
    return {
      status: record.status === "error" ? "error" : "ok",
      lastRunAt: record.lastRunAt.toISOString(),
      jobsProcessed: record.jobsProcessed,
      detail: record.lastError ?? undefined,
    };
  } catch {
    return { status: "ok", detail: "Processor standby" };
  }
}

export async function GET() {
  const [database, queue, scheduler, processor] = await Promise.all([
    checkDatabase(),
    checkQueue(),
    checkScheduler(),
    checkProcessor(),
  ]);

  const healthy =
    database.status === "ok" &&
    queue.status === "ok" &&
    processor.status !== "error";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      database: database.status,
      queue: queue.status,
      scheduler: scheduler.status,
      processor: processor.status,
      checks: {
        database,
        queue,
        scheduler,
        processor,
      },
    },
    { status: healthy ? 200 : 503 }
  );
}
