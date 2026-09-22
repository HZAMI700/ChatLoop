-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'DEAD_LETTER');

-- CreateTable
CREATE TABLE "InstagramRateLimitWindow" (
    "id" TEXT NOT NULL,
    "instagramAccountId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramRateLimitWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueJobState" (
    "id" TEXT NOT NULL,
    "queueName" TEXT NOT NULL DEFAULT 'instagram_dm_queue',
    "jobType" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "payload" JSONB NOT NULL,
    "workspaceId" TEXT,
    "instagramAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueueJobState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessorHeartbeat" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "status" TEXT NOT NULL DEFAULT 'ok',
    "lastRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSuccessAt" TIMESTAMP(3),
    "jobsProcessed" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessorHeartbeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedulerHeartbeat" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "lastRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCronName" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchedulerHeartbeat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstagramRateLimitWindow_instagramAccountId_windowStart_idx" ON "InstagramRateLimitWindow"("instagramAccountId", "windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramRateLimitWindow_instagramAccountId_windowStart_key" ON "InstagramRateLimitWindow"("instagramAccountId", "windowStart");

-- CreateIndex
CREATE INDEX "QueueJobState_status_nextAttemptAt_idx" ON "QueueJobState"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "QueueJobState_workspaceId_idx" ON "QueueJobState"("workspaceId");

-- CreateIndex
CREATE INDEX "QueueJobState_instagramAccountId_idx" ON "QueueJobState"("instagramAccountId");
