import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db/client";
import { createInstagramContext } from "@/lib/instagram/provider";
import { getUserInfo } from "@/lib/instagram/provider";
import {
  backfillFollowerHistory,
  recordFollowerSnapshot,
} from "@/lib/reports/follower-history";

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

async function handleSnapshotFollowers(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const accounts = await prisma.instagramAccount.findMany({
    where: {
      OR: [
        { provider: "META", accessToken: { not: "" } },
        { provider: "ZERNIO", zernioAccountId: { not: null } },
      ],
    },
    select: {
      id: true,
      workspaceId: true,
      username: true,
      instagramId: true,
      accessToken: true,
      provider: true,
      zernioAccountId: true,
    },
  });

  let recorded = 0;
  let backfilled = 0;
  const failures: Array<{ username: string; reason: string }> = [];

  for (const account of accounts) {
    try {
      const token = await createInstagramContext(account);
      if (token.provider === "ZERNIO") {
        const imported = await backfillFollowerHistory({
          instagramAccountId: account.id,
          accessToken: token,
          instagramId: account.instagramId,
          currentFollowers: 0,
        });
        backfilled += imported;
        if (imported === 0)
          failures.push({
            username: account.username,
            reason:
              "Zernio follower history is unavailable or already stored (Analytics add-on required)",
          });
        continue;
      }
      const info = await getUserInfo({ context: token });

      if (typeof info.followers_count !== "number") {
        failures.push({
          username: account.username,
          reason: "followers_count not returned",
        });
        continue;
      }

      await recordFollowerSnapshot(account.id, info.followers_count);
      recorded += 1;

      const existing = await prisma.followerSnapshot.count({
        where: { instagramAccountId: account.id },
      });
      if (existing <= 1) {
        backfilled += await backfillFollowerHistory({
          instagramAccountId: account.id,
          accessToken: token,
          instagramId: account.instagramId,
          currentFollowers: info.followers_count,
        });
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Unknown error";
      failures.push({ username: account.username, reason });
      await prisma.operationalEvent
        .create({
          data: {
            source: "SYSTEM",
            level: "WARNING",
            workspaceId: account.workspaceId,
            message: "Follower snapshot failed",
            payload: { username: account.username, reason },
          },
        })
        .catch(() => {});
    }
  }

  await prisma.schedulerHeartbeat.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      lastRunAt: new Date(),
      lastCronName: "snapshot-followers",
      updatedAt: new Date(),
    },
    update: {
      lastRunAt: new Date(),
      lastCronName: "snapshot-followers",
      updatedAt: new Date(),
    },
  }).catch(() => {});

  return NextResponse.json({
    success: true,
    data: {
      accounts: accounts.length,
      recorded,
      backfilled,
      failures,
    },
  });
}

export async function POST(request: NextRequest) {
  return handleSnapshotFollowers(request);
}

export async function GET(request: NextRequest) {
  return handleSnapshotFollowers(request);
}
