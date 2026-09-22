"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface ScheduledPost {
  id: string;
  platform: "INSTAGRAM" | "TIKTOK";
  mediaType: "REEL" | "POST" | "VIDEO";
  caption: string;
  mediaUrl: string;
  scheduledFor: string;
  status: "SCHEDULED" | "PUBLISHED" | "DRAFT";
  attachedKeyword?: string;
  attachedCampaignName?: string;
}

export default function SchedulePage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState<"ALL" | "INSTAGRAM" | "TIKTOK">("ALL");
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [platform, setPlatform] = useState<"INSTAGRAM" | "TIKTOK">("INSTAGRAM");
  const [mediaType, setMediaType] = useState<"REEL" | "POST" | "VIDEO">("REEL");
  const [caption, setCaption] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [attachedKeyword, setAttachedKeyword] = useState("LINK");
  const [attachedCampaignName, setAttachedCampaignName] = useState("Lead Magnet Auto-DM");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/schedule");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error("Failed to load scheduled posts", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          mediaType,
          caption,
          scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : new Date(Date.now() + 3600000).toISOString(),
          attachedKeyword,
          attachedCampaignName,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setCaption("");
        fetchPosts();
      }
    } catch (err) {
      console.error("Error creating scheduled post", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/schedule?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Error deleting scheduled post", err);
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (filterPlatform === "ALL") return true;
    return p.platform === filterPlatform;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Content Scheduler</h1>
          <p className="text-sm text-muted mt-1">
            Schedule Instagram Reels & TikTok videos with automated Comment-to-DM loops auto-attached upon publish.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-hover transition active:scale-95"
        >
          <span className="text-base">+</span>
          <span>Schedule New Content</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(["ALL", "INSTAGRAM", "TIKTOK"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterPlatform(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterPlatform === tab
                ? "bg-surface-hover text-foreground font-bold border border-border"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab === "ALL" ? "All Platforms" : tab === "INSTAGRAM" ? "📸 Instagram" : "🎵 TikTok"}
          </button>
        ))}
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="text-center py-12 text-sm text-muted">Loading scheduled posts...</div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-16 panel rounded-2xl p-8 border border-dashed border-border">
          <p className="text-sm font-medium text-foreground">No content scheduled yet.</p>
          <p className="text-xs text-muted mt-1">Click "Schedule New Content" to queue your first Reel or TikTok video.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPosts.map((post) => {
            const isInstagram = post.platform === "INSTAGRAM";
            const dateObj = new Date(post.scheduledFor);
            return (
              <div
                key={post.id}
                className="panel rounded-2xl border border-border overflow-hidden flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  {/* Media Preview Banner */}
                  <div className="relative h-44 bg-slate-900 overflow-hidden">
                    <img
                      src={post.mediaUrl}
                      alt="Post preview"
                      className="w-full h-full object-cover opacity-85"
                    />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${
                        isInstagram ? "bg-gradient-to-r from-purple-600 to-pink-600" : "bg-black"
                      }`}>
                        {post.platform} {post.mediaType}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-600 text-white">
                        {post.status}
                      </span>
                    </div>

                    {/* Auto-attached campaign badge */}
                    {post.attachedKeyword && (
                      <div className="absolute bottom-3 left-3 right-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs flex items-center justify-between">
                        <span className="text-[10px] text-zinc-300">Auto-DM Trigger:</span>
                        <strong className="font-mono text-cyan-300 font-bold">"{post.attachedKeyword}"</strong>
                      </div>
                    )}
                  </div>

                  {/* Caption & Metadata */}
                  <div className="p-4 space-y-2">
                    <p className="text-xs text-foreground line-clamp-3 leading-relaxed">
                      {post.caption}
                    </p>

                    <div className="text-[11px] text-muted flex items-center gap-1.5 pt-1">
                      <span>⏰ Scheduled for:</span>
                      <strong className="text-foreground font-mono">
                        {dateObj.toLocaleDateString()} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 pt-0 border-t border-border/50 flex items-center justify-between mt-2">
                  <span className="text-[10px] text-muted font-mono">{post.attachedCampaignName}</span>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl max-w-lg w-full p-6 border border-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Schedule Content & Auto-DM</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border text-foreground"
                  >
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="TIKTOK">TikTok</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Format</label>
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border text-foreground"
                  >
                    <option value="REEL">Reel / Video</option>
                    <option value="POST">Post / Carousel</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Caption</label>
                <textarea
                  rows={3}
                  required
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Drop your video caption here... e.g. Comment LINK to get instant access! #growth"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border text-foreground placeholder:text-muted"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Publish Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Auto-Attach Keyword Loop</label>
                  <input
                    type="text"
                    required
                    value={attachedKeyword}
                    onChange={(e) => setAttachedKeyword(e.target.value)}
                    placeholder="e.g. LINK or VIP"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border text-foreground uppercase font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-border text-foreground hover:bg-surface-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-accent text-white hover:bg-accent-hover shadow-sm"
                >
                  Schedule & Attach Loop →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
