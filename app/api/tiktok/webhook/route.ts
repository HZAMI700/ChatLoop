import { NextRequest, NextResponse } from "next/server";
import { parseTikTokEvents } from "@/lib/tiktok/webhook";
import { getDMQueue } from "@/lib/queue/client";
import { prisma } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const challenge = searchParams.get("challenge") || searchParams.get("hub.challenge");

  if (challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ status: "ok", service: "ChatLoop TikTok Webhook" });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { comments, messages } = parseTikTokEvents(body);

    const queue = getDMQueue();

    // Enqueue comment jobs
    for (const comment of comments) {
      await queue.add(
        "process-comment",
        {
          instagramAccountId: comment.accountId,
          commentId: comment.commentId,
          commentText: comment.commentText,
          commenterId: comment.commenterId,
          commenterName: comment.commenterName,
          mediaId: comment.videoId,
          source: "WEBHOOK",
        },
        {
          jobId: `tiktok_comment_${comment.commentId}`,
        }
      );
    }

    // Enqueue message jobs
    for (const msg of messages) {
      await queue.add(
        "process-message",
        {
          instagramAccountId: msg.accountId,
          messageId: msg.messageId,
          messageText: msg.messageText,
          senderId: msg.senderId,
        },
        {
          jobId: `tiktok_msg_${msg.messageId}`,
        }
      );
    }

    return NextResponse.json({ success: true, processed: comments.length + messages.length });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown webhook error";
    console.error("[TikTok Webhook] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
