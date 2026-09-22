import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { reconcileComments } from "@/lib/polling/comment-reconciler";
import { attachPendingNextReels } from "@/lib/automation/attach-next-reel";
import { prisma } from "@/lib/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  try {
    // 1. Attach newly published reels to pending campaigns
    const attached = await attachPendingNextReels();

    // 2. Run comment reconciliation across active campaigns
    await reconcileComments();

    // Record scheduler heartbeat
    await prisma.schedulerHeartbeat.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        lastRunAt: new Date(),
        lastCronName: "reconcile-comments",
        updatedAt: new Date(),
      },
      update: {
        lastRunAt: new Date(),
        lastCronName: "reconcile-comments",
        updatedAt: new Date(),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      attached,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reconciliation failed";
    console.error("[Reconciliation] Error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
