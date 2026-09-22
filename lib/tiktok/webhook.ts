/**
 * TikTok Webhook Event Parser
 */

export interface TikTokCommentEvent {
  platform: "TIKTOK";
  accountId: string;
  videoId: string;
  commentId: string;
  commentText: string;
  commenterId: string;
  commenterName?: string;
  createTime: number;
}

export interface TikTokDMEvent {
  platform: "TIKTOK";
  accountId: string;
  senderId: string;
  messageId: string;
  messageText: string;
  createTime: number;
}

export function parseTikTokEvents(payload: any): {
  comments: TikTokCommentEvent[];
  messages: TikTokDMEvent[];
} {
  const comments: TikTokCommentEvent[] = [];
  const messages: TikTokDMEvent[] = [];

  if (!payload || typeof payload !== "object") {
    return { comments, messages };
  }

  // Handle video.comment.publish
  if (payload.event === "video.comment.publish" || payload.type === "comment") {
    const data = payload.content || payload.data || payload;
    if (data.comment_id) {
      comments.push({
        platform: "TIKTOK",
        accountId: payload.client_key || payload.user_id || "tiktok_default",
        videoId: data.video_id || "",
        commentId: data.comment_id,
        commentText: data.text || data.comment_text || "",
        commenterId: data.user_id || data.commenter_id || "",
        commenterName: data.user_name || data.nickname,
        createTime: data.create_time || Date.now(),
      });
    }
  }

  // Handle direct messages
  if (payload.event === "im.message.receive" || payload.type === "message") {
    const data = payload.content || payload.data || payload;
    if (data.message_id) {
      messages.push({
        platform: "TIKTOK",
        accountId: payload.client_key || payload.user_id || "tiktok_default",
        senderId: data.from_user_id || data.sender_id || "",
        messageId: data.message_id,
        messageText: data.text || data.content?.text || "",
        createTime: data.create_time || Date.now(),
      });
    }
  }

  return { comments, messages };
}
