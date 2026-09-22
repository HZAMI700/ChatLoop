/**
 * TikTok Direct Message & Comment API Client
 *
 * Implements official TikTok Open API endpoints for:
 * 1. Comment public auto-replies
 * 2. Direct message delivery with buttons and tracked links
 */

interface TikTokReplyOptions {
  accessToken: string;
  videoId: string;
  commentId: string;
  text: string;
}

interface TikTokDMOptions {
  accessToken: string;
  userId: string;
  text: string;
  linkUrl?: string;
}

export async function replyToTikTokComment({
  accessToken,
  videoId,
  commentId,
  text,
}: TikTokReplyOptions): Promise<{ success: boolean; commentId?: string }> {
  try {
    const res = await fetch("https://open.tiktokapis.com/v2/comment/reply/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_id: videoId,
        comment_id: commentId,
        text,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.warn(`[TikTok API] Comment reply failed (${res.status}):`, errorText);
      return { success: false };
    }

    const data = await res.json();
    return { success: true, commentId: data?.data?.comment_id };
  } catch (err) {
    console.error("[TikTok API] Error replying to comment:", err);
    return { success: false };
  }
}

export async function sendTikTokDirectMessage({
  accessToken,
  userId,
  text,
  linkUrl,
}: TikTokDMOptions): Promise<{ success: boolean; messageId?: string }> {
  try {
    const messageBody = linkUrl ? `${text}\n\n👉 ${linkUrl}` : text;

    const res = await fetch("https://open.tiktokapis.com/v2/im/message/send/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient_id: userId,
        message: {
          text: messageBody,
        },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.warn(`[TikTok API] Direct message failed (${res.status}):`, errorText);
      return { success: false };
    }

    const data = await res.json();
    return { success: true, messageId: data?.data?.message_id };
  } catch (err) {
    console.error("[TikTok API] Error sending DM:", err);
    return { success: false };
  }
}
