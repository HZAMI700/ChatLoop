import { NextRequest, NextResponse } from "next/server";
import { getCurrentWorkspaceId } from "@/lib/auth";
import { prisma } from "@/lib/db/client";

// In-memory / DB storage for scheduled content items
export interface ScheduledPostItem {
  id: string;
  workspaceId: string;
  platform: "INSTAGRAM" | "TIKTOK";
  mediaType: "REEL" | "POST" | "VIDEO";
  caption: string;
  mediaUrl: string;
  scheduledFor: string;
  status: "SCHEDULED" | "PUBLISHED" | "DRAFT";
  attachedKeyword?: string;
  attachedCampaignName?: string;
  createdAt: string;
}

// Fallback in-memory store if custom model is not migrated yet
let inMemoryScheduledPosts: ScheduledPostItem[] = [
  {
    id: "sched_1",
    workspaceId: "default",
    platform: "INSTAGRAM",
    mediaType: "REEL",
    caption: "3 tips to scale your business with automated DMs. Comment LINK to get the full blueprint! #growth #instagram",
    mediaUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600",
    scheduledFor: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    status: "SCHEDULED",
    attachedKeyword: "LINK",
    attachedCampaignName: "Free Blueprint Auto-DM",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sched_2",
    workspaceId: "default",
    platform: "TIKTOK",
    mediaType: "VIDEO",
    caption: "How we generated $34k in 30 days using TikTok comment auto-responders. Comment VIP! 🚀",
    mediaUrl: "https://images.unsplash.com/photo-1579869847514-7c1a19d2d2ad?w=600",
    scheduledFor: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    status: "SCHEDULED",
    attachedKeyword: "VIP",
    attachedCampaignName: "TikTok VIP Funnel",
    createdAt: new Date().toISOString(),
  },
];

export async function GET() {
  const workspaceId = await getCurrentWorkspaceId();
  const posts = inMemoryScheduledPosts.filter(
    (p) => p.workspaceId === (workspaceId || "default") || p.workspaceId === "default"
  );
  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  try {
    const workspaceId = await getCurrentWorkspaceId();
    const body = await request.json();

    const newPost: ScheduledPostItem = {
      id: `sched_${Date.now()}`,
      workspaceId: workspaceId || "default",
      platform: body.platform || "INSTAGRAM",
      mediaType: body.mediaType || "REEL",
      caption: body.caption || "",
      mediaUrl: body.mediaUrl || "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600",
      scheduledFor: body.scheduledFor || new Date(Date.now() + 3600 * 1000).toISOString(),
      status: "SCHEDULED",
      attachedKeyword: body.attachedKeyword || "LINK",
      attachedCampaignName: body.attachedCampaignName || "Automated DM Campaign",
      createdAt: new Date().toISOString(),
    };

    inMemoryScheduledPosts.unshift(newPost);
    return NextResponse.json({ success: true, post: newPost });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to schedule post";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  inMemoryScheduledPosts = inMemoryScheduledPosts.filter((p) => p.id !== id);
  return NextResponse.json({ success: true });
}
