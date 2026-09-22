"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function TutorialPage() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);
  const [activeTab, setActiveTab] = useState<number>(1);

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNumber)
        ? prev.filter((s) => s !== stepNumber)
        : [...prev, stepNumber]
    );
  };

  const progressPercentage = Math.round((completedSteps.length / 5) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="panel rounded-3xl p-8 border border-border bg-gradient-to-br from-surface to-surface-hover shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold">
              <span>✦</span>
              <span>ChatLoop Onboarding Masterclass</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              User Tutorial & Setup Guide
            </h1>
            <p className="text-sm text-muted max-w-xl leading-relaxed">
              Step-by-step walkthrough to connect Instagram and TikTok, launch automated Comment-to-DM loops, configure the Follow-Gate, and schedule content.
            </p>
          </div>

          {/* Progress Tracker */}
          <div className="bg-background rounded-2xl p-5 border border-border shadow-sm text-center min-w-[180px]">
            <span className="text-xs font-semibold text-muted block">Onboarding Progress</span>
            <div className="text-3xl font-bold font-mono text-accent mt-1">
              {progressPercentage}%
            </div>
            <div className="w-full bg-surface-hover h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-accent h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-[10px] text-muted block mt-1.5">
              {completedSteps.length} of 5 Steps Complete
            </span>
          </div>
        </div>
      </div>

      {/* Step Selector Pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { num: 1, title: "1. Connect Accounts" },
          { num: 2, title: "2. Build DM Loop" },
          { num: 3, title: "3. Follow-Gate Setup" },
          { num: 4, title: "4. Content Scheduling" },
          { num: 5, title: "5. Analytics & Health" },
        ].map((s) => {
          const isDone = completedSteps.includes(s.num);
          const isCurrent = activeTab === s.num;
          return (
            <button
              key={s.num}
              onClick={() => setActiveTab(s.num)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                isCurrent
                  ? "bg-accent text-white shadow-sm"
                  : "panel border border-border text-foreground hover:bg-surface-hover"
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                isDone ? "bg-emerald-500 text-white font-bold" : "bg-muted/20 text-muted"
              }`}>
                {isDone ? "✓" : s.num}
              </span>
              <span>{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* Tutorial Content Panels */}
      <div className="panel rounded-3xl p-8 border border-border space-y-6">
        {/* STEP 1 */}
        {activeTab === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-xs font-bold text-accent uppercase tracking-wider font-mono">Module 1</span>
                <h2 className="text-xl font-bold text-foreground mt-0.5">Connecting Instagram & TikTok Accounts</h2>
              </div>
              <button
                onClick={() => toggleStep(1)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  completedSteps.includes(1)
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold"
                    : "bg-surface text-foreground border border-border"
                }`}
              >
                {completedSteps.includes(1) ? "✓ Completed" : "Mark Complete"}
              </button>
            </div>

            <div className="space-y-4 text-xs text-muted leading-relaxed">
              <h3 className="text-sm font-bold text-foreground">Instagram Connection Options:</h3>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong className="text-foreground">Direct Meta App:</strong> Go to developers.facebook.com, create a Business App with "Instagram Graph API" permissions, and set your Webhook URL to <code className="bg-surface-hover px-1.5 py-0.5 rounded text-accent font-mono">https://your-domain.vercel.app/api/webhook</code>.
                </li>
                <li>
                  <strong className="text-foreground">Zernio Managed:</strong> Enter your API key under <Link href="/settings" className="text-accent underline font-semibold">Settings</Link> to connect Instagram with zero developer account friction.
                </li>
              </ul>

              <h3 className="text-sm font-bold text-foreground pt-2">TikTok Webhook Setup:</h3>
              <p>
                In your TikTok Developer portal, configure your webhook endpoint to:
                <code className="block mt-1 bg-surface-hover p-2 rounded-lg text-foreground font-mono">
                  https://your-domain.vercel.app/api/tiktok/webhook
                </code>
                Subscribe to <code className="text-accent">video.comment.publish</code> and <code className="text-accent">im.message.receive</code> events.
              </p>
            </div>

            <div className="pt-3 flex gap-3">
              <Link
                href="/settings"
                className="px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-hover transition"
              >
                Go to Settings & Connections →
              </Link>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {activeTab === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-xs font-bold text-accent uppercase tracking-wider font-mono">Module 2</span>
                <h2 className="text-xl font-bold text-foreground mt-0.5">Building Your First Comment-to-DM Loop</h2>
              </div>
              <button
                onClick={() => toggleStep(2)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  completedSteps.includes(2)
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold"
                    : "bg-surface text-foreground border border-border"
                }`}
              >
                {completedSteps.includes(2) ? "✓ Completed" : "Mark Complete"}
              </button>
            </div>

            <div className="space-y-4 text-xs text-muted leading-relaxed">
              <p>
                A <strong>Loop</strong> automatically listens for specific words or phrases in post comments or Story replies and instantly sends a private direct message with tracked link buttons.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-2xl bg-surface border border-border space-y-2">
                  <h4 className="text-xs font-bold text-foreground">1. Trigger Keywords</h4>
                  <p>Choose high-intent words like <code className="text-accent font-mono font-bold">LINK</code>, <code className="text-accent font-mono font-bold">GUIDE</code>, or <code className="text-accent font-mono font-bold">VIP</code>. ChatLoop supports case-insensitive and numeric fuzzy matching.</p>
                </div>

                <div className="p-4 rounded-2xl bg-surface border border-border space-y-2">
                  <h4 className="text-xs font-bold text-foreground">2. Spintax Public Replies</h4>
                  <p>Auto-reply to their public comment to boost algorithmic reach: <code className="text-foreground">{"{Hey|Awesome}"} @{"{{name}}"}, sent you a DM! 📬</code></p>
                </div>
              </div>
            </div>

            <div className="pt-3 flex gap-3">
              <Link
                href="/campaigns/new"
                className="px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-hover transition"
              >
                Create New Campaign Loop →
              </Link>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {activeTab === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-xs font-bold text-accent uppercase tracking-wider font-mono">Module 3</span>
                <h2 className="text-xl font-bold text-foreground mt-0.5">Follow-Gate Verification Setup</h2>
              </div>
              <button
                onClick={() => toggleStep(3)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  completedSteps.includes(3)
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold"
                    : "bg-surface text-foreground border border-border"
                }`}
              >
                {completedSteps.includes(3) ? "✓ Completed" : "Mark Complete"}
              </button>
            </div>

            <div className="space-y-4 text-xs text-muted leading-relaxed">
              <p>
                The <strong>Follow-Gate</strong> checks whether a commenter actually follows your account before delivering your guide or discount link.
              </p>

              <div className="p-4 rounded-2xl bg-accent/5 border border-accent/20 space-y-2">
                <h4 className="text-xs font-bold text-accent">How it Works:</h4>
                <ol className="list-decimal pl-5 space-y-1 text-foreground">
                  <li>User comments your keyword on a Reel or TikTok video.</li>
                  <li>ChatLoop queries the official <code className="font-mono">is_user_follow_business</code> API.</li>
                  <li><strong>If they follow:</strong> DM is delivered immediately with CTA buttons!</li>
                  <li><strong>If they don't follow:</strong> ChatLoop sends a friendly DM: <em>"Please follow our page first, then tap verify to unlock your link!"</em></li>
                  <li>Once followed, ChatLoop detects the event and delivers the prize.</li>
                </ol>
              </div>
            </div>

            <div className="pt-3 flex gap-3">
              <Link
                href="/campaigns"
                className="px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-hover transition"
              >
                Manage Follow-Gate Loops →
              </Link>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {activeTab === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-xs font-bold text-accent uppercase tracking-wider font-mono">Module 4</span>
                <h2 className="text-xl font-bold text-foreground mt-0.5">Scheduling Content with Auto-Attached Loops</h2>
              </div>
              <button
                onClick={() => toggleStep(4)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  completedSteps.includes(4)
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold"
                    : "bg-surface text-foreground border border-border"
                }`}
              >
                {completedSteps.includes(4) ? "✓ Completed" : "Mark Complete"}
              </button>
            </div>

            <div className="space-y-4 text-xs text-muted leading-relaxed">
              <p>
                Never forget to turn on comment automations again! With the <strong>Content Scheduler</strong>, you can queue your Reels, Carousels, and TikTok videos days in advance.
              </p>

              <div className="p-4 rounded-2xl bg-surface border border-border space-y-2">
                <h4 className="text-xs font-bold text-foreground">Auto-Binding Feature:</h4>
                <p>
                  When you schedule a post, ChatLoop automatically reserves an automation loop. The second your media goes live on Instagram or TikTok, the Comment-to-DM trigger activates with zero manual intervention.
                </p>
              </div>
            </div>

            <div className="pt-3 flex gap-3">
              <Link
                href="/schedule"
                className="px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-hover transition"
              >
                Open Content Scheduler →
              </Link>
            </div>
          </div>
        )}

        {/* STEP 5 */}
        {activeTab === 5 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-xs font-bold text-accent uppercase tracking-wider font-mono">Module 5</span>
                <h2 className="text-xl font-bold text-foreground mt-0.5">Analytics, Safe Rate-Limits & Health</h2>
              </div>
              <button
                onClick={() => toggleStep(5)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  completedSteps.includes(5)
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold"
                    : "bg-surface text-foreground border border-border"
                }`}
              >
                {completedSteps.includes(5) ? "✓ Completed" : "Mark Complete"}
              </button>
            </div>

            <div className="space-y-4 text-xs text-muted leading-relaxed">
              <p>
                ChatLoop enforces a strict <strong>750 private replies/hour</strong> atomic ceiling using PostgreSQL row locking to guarantee your Instagram account stays in 100% good standing with Meta.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-surface border border-border space-y-1.5">
                  <h4 className="text-xs font-bold text-foreground">DM Delivery Logs</h4>
                  <p>View sent, failed, or queued messages with detailed error explanations and delivery timestamps under <Link href="/logs" className="text-accent underline">DM Logs</Link>.</p>
                </div>

                <div className="p-4 rounded-2xl bg-surface border border-border space-y-1.5">
                  <h4 className="text-xs font-bold text-foreground">System Health Diagnostics</h4>
                  <p>Check the live heartbeat of the Supabase pgmq queue, processor, and database under <Link href="/diagnostics" className="text-accent underline">Diagnostics</Link>.</p>
                </div>
              </div>
            </div>

            <div className="pt-3 flex gap-3">
              <Link
                href="/logs"
                className="px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-hover transition"
              >
                View Live DM Logs →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
