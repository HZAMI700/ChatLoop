import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db/client";
import { decryptToken, encryptToken } from "@/lib/meta/oauth";
import { refreshLongLivedToken } from "@/lib/meta/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAYS_BEFORE_EXPIRY = 10;

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

async function handleRefreshTokens(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + DAYS_BEFORE_EXPIRY);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const usageReset = await prisma.workspace.updateMany({
    where: { usagePeriodStart: { lt: monthStart } },
    data: {
      usagePeriodStart: monthStart,
      dmsSentThisPeriod: 0,
    },
  });

  const accountsToRefresh = await prisma.instagramAccount.findMany({
    where: {
      accessToken: { not: "" },
      provider: "META",
      tokenExpiresAt: {
        not: null,
        lte: cutoffDate,
      },
    },
    select: {
      id: true,
      workspaceId: true,
      username: true,
      accessToken: true,
    },
  });

  const results: Array<{
    instagramAccountId: string;
    username: string;
    status: "refreshed" | "failed";
    error?: string;
  }> = [];

  for (const account of accountsToRefresh) {
    try {
      const currentToken = decryptToken(account.accessToken);
      const { accessToken: newToken, expiresIn } =
        await refreshLongLivedToken(currentToken);
      const encryptedToken = encryptToken(newToken);
      const newExpiry = new Date(Date.now() + expiresIn * 1000);

      await prisma.instagramAccount.update({
        where: { id: account.id },
        data: {
          accessToken: encryptedToken,
          tokenExpiresAt: newExpiry,
        },
      });

      results.push({
        instagramAccountId: account.id,
        username: account.username,
        status: "refreshed",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      await prisma.operationalEvent.create({
        data: {
          workspaceId: account.workspaceId,
          source: "TOKEN_REFRESH",
          level: "ERROR",
          message: `Token refresh failed for @${account.username}: ${errorMessage}`,
          payload: {
            instagramAccountId: account.id,
            username: account.username,
          },
        },
      });

      results.push({
        instagramAccountId: account.id,
        username: account.username,
        status: "failed",
        error: errorMessage,
      });
    }
  }

  await prisma.schedulerHeartbeat.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      lastRunAt: new Date(),
      lastCronName: "refresh-tokens",
      updatedAt: new Date(),
    },
    update: {
      lastRunAt: new Date(),
      lastCronName: "refresh-tokens",
      updatedAt: new Date(),
    },
  }).catch(() => {});

  return NextResponse.json({
    success: true,
    data: {
      totalProcessed: accountsToRefresh.length,
      workspacesReset: usageReset.count,
      results,
    },
  });
}

export async function POST(request: NextRequest) {
  return handleRefreshTokens(request);
}

export async function GET(request: NextRequest) {
  return handleRefreshTokens(request);
}
