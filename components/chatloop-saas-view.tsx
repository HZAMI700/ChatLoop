"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface SupabaseStatus {
  connected: boolean;
  projectUrl: string;
  itemCount: number;
}

interface ChatLoopProps {
  supabaseStatus: SupabaseStatus;
}

interface LoopCard {
  id: string;
  title: string;
  keyword: string;
  triggerType: "Reel Comment" | "Story Reply" | "Direct DM" | "Lead Magnet";
  dmsSent: number;
  ctr: string;
  isActive: boolean;
  lastActive: string;
  secondaryText: string;
}

const INITIAL_LOOPS: LoopCard[] = [
  {
    id: "loop-1",
    title: "Reel Keyword Trigger",
    keyword: "LINK",
    triggerType: "Reel Comment",
    dmsSent: 1420,
    ctr: "48.2%",
    isActive: true,
    lastActive: "Just now",
    secondaryText: "Sends Guide & Tracked Link · Reel #108",
  },
  {
    id: "loop-2",
    title: "Story DM Responder",
    keyword: "VIP",
    triggerType: "Story Reply",
    dmsSent: 890,
    ctr: "54.1%",
    isActive: false,
    lastActive: "12m ago",
    secondaryText: "Instant Exclusive Access Button",
  },
  {
    id: "loop-3",
    title: "Lead Magnet Funnel",
    keyword: "FREE",
    triggerType: "Lead Magnet",
    dmsSent: 640,
    ctr: "61.0%",
    isActive: false,
    lastActive: "35m ago",
    secondaryText: "Follow-Gate Verification Enabled",
  },
  {
    id: "loop-4",
    title: "Flash Promo Broadcast",
    keyword: "DEAL",
    triggerType: "Direct DM",
    dmsSent: 1820,
    ctr: "39.5%",
    isActive: false,
    lastActive: "1h ago",
    secondaryText: "2 Tracked CTA Buttons · 15% Discount",
  },
  {
    id: "loop-5",
    title: "Customer Support Loop",
    keyword: "HELP",
    triggerType: "Direct DM",
    dmsSent: 210,
    ctr: "28.0%",
    isActive: false,
    lastActive: "2h ago",
    secondaryText: "24-Hour Official Messaging Window",
  },
];

export function ChatLoopSaaSView({ supabaseStatus }: ChatLoopProps) {
  const [activeTab, setActiveTab] = useState<"loops" | "triggers" | "inbox" | "supabase">("loops");
  const [loops, setLoops] = useState<LoopCard[]>(INITIAL_LOOPS);
  const [activeLoopId, setActiveLoopId] = useState<string>("loop-1");
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number }>({ minutes: 0, seconds: 26 });
  const [testComment, setTestComment] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);
  const [showSimModal, setShowSimModal] = useState(false);

  // Live countdown timer mimicking screenshot's "00:26" highlight module
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        } else {
          return { minutes: 1, seconds: 0 }; // Loop batch reset every minute
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (min: number, sec: number) => {
    const m = min.toString().padStart(2, "0");
    const s = sec.toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const toggleLoopActive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoops((prev) =>
      prev.map((loop) =>
        loop.id === id ? { ...loop, isActive: !loop.isActive } : loop
      )
    );
  };

  const handleRunSimulation = (keyword: string) => {
    setIsSimulating(true);
    setSimulationLog([`[Incoming Webhook] User commented "${keyword}" on Instagram Reel`]);

    setTimeout(() => {
      setSimulationLog((l) => [
        ...l,
        `[Keyword Engine] Exact match found for Loop keyword "${keyword}"`,
      ]);
    }, 400);

    setTimeout(() => {
      setSimulationLog((l) => [
        ...l,
        `[Rate Limiter] PostgreSQL atomic reservation: 743/750 hourly private replies safe`,
      ]);
    }, 800);

    setTimeout(() => {
      setSimulationLog((l) => [
        ...l,
        `[Meta Graph API] Private DM dispatched via official Instagram API`,
        `[Delivery Confirmed] Sent tracked button with auto-redirect token`,
      ]);
      setIsSimulating(false);
    }, 1300);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F4] text-[#0A2B24] font-sans antialiased selection:bg-[#0B3B32] selection:text-white pb-20">
      {/* Background Subtle Calligraphy/Ornament Watermark */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] flex items-center justify-center overflow-hidden">
        <span className="text-[28rem] font-serif select-none">∞</span>
      </div>

      <div className="relative max-w-md mx-auto px-4 pt-6 sm:max-w-xl md:max-w-2xl">
        {/* Top App Header with Circular Action Buttons */}
        <header className="flex items-center justify-between py-2">
          {/* Left Circular Button (Queue / Status Drawer) */}
          <button
            onClick={() => setActiveTab("supabase")}
            aria-label="Queue and Supabase Status"
            className="w-11 h-11 rounded-full bg-white border border-[#EBE5D8] shadow-sm flex items-center justify-center text-[#0B3B32] transition hover:bg-[#F2EEE4] active:scale-95"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          {/* Center Brand Calligraphy / Stylized Wordmark */}
          <div className="text-center">
            <Link href="/" className="inline-block group">
              <span className="block text-2xl md:text-3xl font-serif font-bold tracking-tight text-[#0B3B32] transition group-hover:opacity-80">
                ChatLoop
              </span>
              <span className="block text-[10px] uppercase tracking-widest font-mono text-[#8C8474]">
                Instagram Micro-SaaS
              </span>
            </Link>
          </div>

          {/* Right Circular Button (Quick Add / Dashboard) */}
          <Link
            href="/campaigns/new"
            aria-label="Create New Automation Loop"
            className="w-11 h-11 rounded-full bg-white border border-[#EBE5D8] shadow-sm flex items-center justify-center text-[#0B3B32] transition hover:bg-[#F2EEE4] active:scale-95"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </Link>
        </header>

        {/* Hero Highlight Widget (Matching Screenshot's 00:26 Countdown Box) */}
        <section className="my-6 text-center">
          <p className="text-sm font-medium text-[#7D7565] tracking-wide">
            Next DM Loop Batch in
          </p>

          {/* Huge Dynamic Countdown Counter */}
          <div className="mt-1 font-mono text-6xl md:text-7xl font-bold tracking-tight text-[#0B3B32]">
            {formatTimer(timeLeft.minutes, timeLeft.seconds)}
          </div>

          {/* Aesthetic Star & Crescent Loop Ornament from Screenshot */}
          <div className="flex items-center justify-center gap-1.5 my-2 text-[#C49B55]">
            <span className="text-xs">✦</span>
            <span className="text-sm">★</span>
            <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#FAF2DE] text-[#B88728] border border-[#ECD7A8]">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
              </svg>
            </div>
            <span className="text-sm">★</span>
            <span className="text-xs">✦</span>
          </div>

          {/* Meta Rate-Limit & Status Row */}
          <div className="text-xs font-medium text-[#655E50] flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
              <span className="font-semibold text-emerald-800">742 / 750</span> Hourly Safe DMs
            </span>
            <span>|</span>
            <span className="text-[#8A8272]">1,420 Auto-Replies Today</span>
          </div>
        </section>

        {/* Segmented Pill Navigation Bar (Matching Screenshot: Prayer times, Information, News, Calendar) */}
        <nav
          aria-label="Dashboard Sections"
          className="bg-white/90 backdrop-blur-sm border border-[#EBE5D8] rounded-2xl p-1.5 flex items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.02)] mb-5"
        >
          <button
            onClick={() => setActiveTab("loops")}
            className={`flex-1 py-2 text-xs md:text-sm font-medium rounded-xl transition ${
              activeTab === "loops"
                ? "bg-[#0B3B32] text-white shadow-sm"
                : "text-[#6B6557] hover:text-[#0A2B24]"
            }`}
          >
            Active Loops
          </button>
          <button
            onClick={() => setActiveTab("triggers")}
            className={`flex-1 py-2 text-xs md:text-sm font-medium rounded-xl transition ${
              activeTab === "triggers"
                ? "bg-[#0B3B32] text-white shadow-sm"
                : "text-[#6B6557] hover:text-[#0A2B24]"
            }`}
          >
            Keywords
          </button>
          <button
            onClick={() => setActiveTab("inbox")}
            className={`flex-1 py-2 text-xs md:text-sm font-medium rounded-xl transition ${
              activeTab === "inbox"
                ? "bg-[#0B3B32] text-white shadow-sm"
                : "text-[#6B6557] hover:text-[#0A2B24]"
            }`}
          >
            Inbox & Logs
          </button>
          <button
            onClick={() => setActiveTab("supabase")}
            className={`flex-1 py-2 text-xs md:text-sm font-medium rounded-xl transition ${
              activeTab === "supabase"
                ? "bg-[#0B3B32] text-white shadow-sm"
                : "text-[#6B6557] hover:text-[#0A2B24]"
            }`}
          >
            Supabase
          </button>
        </nav>

        {/* TAB CONTENT: ACTIVE LOOPS (Matching Screenshot's Card Rows) */}
        {activeTab === "loops" && (
          <div className="space-y-3">
            {loops.map((loop) => {
              const isSelected = activeLoopId === loop.id;
              return (
                <div
                  key={loop.id}
                  onClick={() => setActiveLoopId(loop.id)}
                  className={`relative cursor-pointer bg-white rounded-2xl p-4 transition-all duration-200 border ${
                    isSelected
                      ? "border-[#0B3B32] shadow-[0_4px_20px_rgba(11,59,50,0.06)] ring-1 ring-[#0B3B32]/10"
                      : "border-[#EBE5D8] hover:border-[#D5CDBD] shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                  }`}
                >
                  {/* Left Accent Stripe for Selected/Active Item (from Screenshot) */}
                  {isSelected && (
                    <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-[#0B3B32] rounded-r-full" />
                  )}

                  <div className="flex items-center justify-between pl-1">
                    {/* Left Column: Title, Bold Keyword Metric, Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#736B5C]">
                          {loop.title}
                        </span>
                        {loop.isActive ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            LIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-600">
                            PAUSED
                          </span>
                        )}
                      </div>

                      {/* Prominent Keyword Value (Matching Big Time Display from Screenshot) */}
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-mono font-bold tracking-tight text-[#0B3B32]">
                          {loop.keyword}
                        </span>
                        <span className="text-xs font-medium text-[#8F8675]">
                          {loop.dmsSent.toLocaleString()} DMs sent
                        </span>
                      </div>

                      {/* Secondary Info Line */}
                      <p className="text-xs text-[#6F6759] mt-0.5">
                        {loop.secondaryText}
                      </p>
                    </div>

                    {/* Right Column: Circular Bell / Action Button (from Screenshot) */}
                    <button
                      onClick={(e) => toggleLoopActive(loop.id, e)}
                      aria-label={loop.isActive ? "Pause Loop" : "Enable Loop"}
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                        loop.isActive
                          ? "bg-[#0B3B32] text-white shadow-md hover:bg-[#072922]"
                          : "bg-[#F7F4EC] text-[#786E5E] border border-[#E8E2D4] hover:bg-[#ECE6D8]"
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill={loop.isActive ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Quick Actions Footer Card */}
            <div className="bg-gradient-to-r from-[#F4EFE3] to-[#EFEADF] border border-[#E3DC handle rounded-2xl p-4 text-center mt-6">
              <h3 className="text-sm font-semibold text-[#0B3B32]">
                Want to test your Instagram Auto-DM in real time?
              </h3>
              <p className="text-xs text-[#6B6456] mt-1 mb-3">
                Simulate a comment on your Reels or Stories to verify loop delivery.
              </p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => {
                    handleRunSimulation("LINK");
                    setShowSimModal(true);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#0B3B32] text-white hover:bg-[#06241E] shadow-sm transition active:scale-95"
                >
                  ⚡ Simulate "LINK" Comment
                </button>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-[#D5CDBD] text-[#0B3B32] hover:bg-[#FAF8F4] transition"
                >
                  Full Dashboard →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: KEYWORDS & TRIGGERS */}
        {activeTab === "triggers" && (
          <div className="bg-white rounded-2xl p-5 border border-[#EBE5D8] shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#0B3B32]">Loop Triggers & Keywords</h2>
            <p className="text-xs text-[#6F6759]">
              Configure which comment text or Story replies start an automated DM loop.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3 bg-[#FAF8F2] rounded-xl border border-[#ECE5D8] flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-sm text-[#0B3B32]">LINK</span>
                  <p className="text-[11px] text-[#7A7161]">Whole-word match on Reels & Posts</p>
                </div>
                <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Active
                </span>
              </div>

              <div className="p-3 bg-[#FAF8F2] rounded-xl border border-[#ECE5D8] flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-sm text-[#0B3B32]">VIP</span>
                  <p className="text-[11px] text-[#7A7161]">Inbound DMs & Story text replies</p>
                </div>
                <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Active
                </span>
              </div>

              <div className="p-3 bg-[#FAF8F2] rounded-xl border border-[#ECE5D8] flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-sm text-[#0B3B32]">FREE</span>
                  <p className="text-[11px] text-[#7A7161]">Follow-Gate Enabled: checks follower status</p>
                </div>
                <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Active
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/campaigns/new"
                className="w-full inline-flex justify-center items-center py-2.5 px-4 rounded-xl bg-[#0B3B32] text-white text-xs font-semibold hover:bg-[#072922] transition"
              >
                + Add New Trigger Keyword
              </Link>
            </div>
          </div>
        )}

        {/* TAB CONTENT: INBOX & LOGS */}
        {activeTab === "inbox" && (
          <div className="bg-white rounded-2xl p-5 border border-[#EBE5D8] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0B3B32]">Recent DM Logs & Inbound</h2>
              <Link href="/inbox" className="text-xs text-[#0B3B32] font-semibold underline">
                Open Full Inbox
              </Link>
            </div>
            <div className="space-y-2.5">
              {[
                { user: "@maya.creates", keyword: "LINK", status: "SENT", time: "2m ago" },
                { user: "@dev.sarah", keyword: "VIP", status: "SENT", time: "14m ago" },
                { user: "@alex_growth", keyword: "FREE", status: "SENT", time: "28m ago" },
                { user: "@johnny_b", keyword: "DEAL", status: "SENT", time: "1h ago" },
              ].map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F2] border border-[#ECE5D8] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-[#0B3B32]/10 text-[#0B3B32] font-bold flex items-center justify-center text-xs">
                      {log.user[1].toUpperCase()}
                    </span>
                    <div>
                      <strong className="text-[#0B3B32]">{log.user}</strong>
                      <span className="text-[#888070] ml-1.5 font-mono">[{log.keyword}]</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {log.status}
                    </span>
                    <span className="block text-[10px] text-[#888070] mt-0.5">{log.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB CONTENT: SUPABASE CLOUD & CONFIG */}
        {activeTab === "supabase" && (
          <div className="bg-white rounded-2xl p-5 border border-[#EBE5D8] shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-base font-bold text-[#0B3B32]">Supabase Micro-SaaS Engine</h2>
            </div>
            <p className="text-xs text-[#6F6759]">
              Connected directly via Supabase SSR & PostgreSQL Queues (pgmq).
            </p>

            <div className="space-y-3 pt-1">
              <div className="p-3 bg-[#FAF8F2] rounded-xl border border-[#ECE5D8] text-xs space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#888070]">Supabase Project URL</span>
                <p className="font-mono text-[#0B3B32] break-all font-semibold">
                  {supabaseStatus.projectUrl || "https://ncccwoojpmuqektpaops.supabase.co"}
                </p>
              </div>

              <div className="p-3 bg-[#FAF8F2] rounded-xl border border-[#ECE5D8] text-xs space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#888070]">Status</span>
                <p className="font-semibold text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Active · Supabase Client Initialized with SSR Cookies
                </p>
              </div>

              <div className="p-3 bg-[#FAF8F2] rounded-xl border border-[#ECE5D8] text-xs space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#888070]">Architecture</span>
                <p className="text-[#4E473A]">
                  Zero Redis dependency. Serverless Vercel endpoints triggered by Supabase Cron.
                </p>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <Link
                href="/settings"
                className="flex-1 text-center py-2.5 px-4 rounded-xl bg-[#0B3B32] text-white text-xs font-semibold hover:bg-[#072922] transition"
              >
                Settings & API Keys
              </Link>
              <Link
                href="/api/health"
                target="_blank"
                className="py-2.5 px-4 rounded-xl bg-white border border-[#D5CDBD] text-[#0B3B32] text-xs font-semibold hover:bg-[#FAF8F4] transition"
              >
                Health Check ↗
              </Link>
            </div>
          </div>
        )}

        {/* Bottom Micro-SaaS Nav / Sign In Footer */}
        <footer className="mt-8 pt-6 border-t border-[#ECE5D8] flex items-center justify-between text-xs text-[#7A7161]">
          <div>
            <strong className="text-[#0B3B32] font-serif">ChatLoop</strong> · Micro-SaaS
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-[#0B3B32] font-semibold underline">
              Sign In
            </Link>
            <Link href="/dashboard" className="hover:text-[#0B3B32] font-semibold">
              Dashboard
            </Link>
            <Link href="/privacy" className="hover:text-[#0B3B32]">
              Privacy
            </Link>
          </div>
        </footer>
      </div>

      {/* Simulation Modal */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-[#EBE5D8] shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#EBE5D8]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="text-sm font-bold text-[#0B3B32]">Live ChatLoop Simulation</h4>
              </div>
              <button
                onClick={() => setShowSimModal(false)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#736B5C]">
                Simulate Comment Trigger
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testComment}
                  onChange={(e) => setTestComment(e.target.value)}
                  placeholder="e.g. LINK or VIP"
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#D5CDBD] bg-[#FAF8F2] focus:outline-none focus:ring-1 focus:ring-[#0B3B32]"
                />
                <button
                  disabled={isSimulating}
                  onClick={() => handleRunSimulation(testComment || "LINK")}
                  className="px-3 py-2 bg-[#0B3B32] text-white text-xs font-semibold rounded-xl hover:bg-[#072922] disabled:opacity-50"
                >
                  {isSimulating ? "Sending..." : "Test DM"}
                </button>
              </div>
            </div>

            <div className="mt-4 bg-[#14231E] text-emerald-300 font-mono text-[10px] p-3 rounded-xl max-h-40 overflow-y-auto space-y-1">
              {simulationLog.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  {log}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowSimModal(false)}
              className="mt-4 w-full py-2 bg-[#FAF8F4] text-[#0B3B32] border border-[#D5CDBD] text-xs font-semibold rounded-xl hover:bg-[#F0ECE2]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
