"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface SupabaseStatus {
  connected: boolean;
  projectUrl: string;
  itemCount: number;
}

interface ChatLoopLandingProps {
  supabaseStatus: SupabaseStatus;
}

export function ChatLoopLanding({ supabaseStatus }: ChatLoopLandingProps) {
  const [activeKeyword, setActiveKeyword] = useState<"LINK" | "VIP" | "FREE" | "DEAL">("LINK");
  const [customComment, setCustomComment] = useState("");
  const [simStep, setSimStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [liveCounter, setLiveCounter] = useState(58);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Live activity pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCounter((prev) => (prev > 90 ? 45 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulate = (keyword: "LINK" | "VIP" | "FREE" | "DEAL") => {
    setActiveKeyword(keyword);
    setIsSimulating(true);
    setSimStep(1); // 1: Comment received

    setTimeout(() => {
      setSimStep(2); // 2: Keyword matched & Follow gate check
    }, 500);

    setTimeout(() => {
      setSimStep(3); // 3: PostgreSQL Atomic Rate Limit Reserved
    }, 1000);

    setTimeout(() => {
      setSimStep(4); // 4: Meta Graph API private reply delivered
      setIsSimulating(false);
    }, 1600);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customComment.trim()) return;
    const upper = customComment.trim().toUpperCase();
    if (upper.includes("VIP")) handleSimulate("VIP");
    else if (upper.includes("FREE")) handleSimulate("FREE");
    else if (upper.includes("DEAL")) handleSimulate("DEAL");
    else handleSimulate("LINK");
  };

  const showNotification = (msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F5F4FC] text-[#0F172A] font-sans antialiased overflow-x-hidden selection:bg-[#5B45FF] selection:text-white">
      {/* Toast Notification */}
      {alertMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#0F101E] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/20 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <span className="text-emerald-400">✓</span>
          <span>{alertMessage}</span>
        </div>
      )}

      {/* Dynamic Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#818CF8]/20 via-[#C084FC]/15 to-transparent blur-[120px]" />
        <div className="absolute top-[35%] right-[-5%] w-[550px] h-[550px] rounded-full bg-gradient-to-bl from-[#6366F1]/15 via-[#A855F7]/10 to-transparent blur-[140px]" />
        <div className="absolute bottom-[10%] left-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#38BDF8]/15 via-[#818CF8]/10 to-transparent blur-[130px]" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-24">
        {/* Navigation Bar matching screenshot */}
        <header className="sticky top-4 z-40 flex items-center justify-between py-3 px-6 rounded-full bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_4px_24px_rgba(99,102,241,0.06)]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5B45FF] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-lg shadow-[0_4px_14px_rgba(91,69,255,0.4)] group-hover:scale-105 transition">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <span className="font-extrabold text-xl tracking-tight text-[#111222] font-mono">
              Chat<span className="text-[#5B45FF]">Loop</span>
            </span>
          </Link>

          {/* Center Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#64748B]">
            <a href="#features" className="hover:text-[#111222] transition">Features</a>
            <a href="#pipeline" className="hover:text-[#111222] transition">Architecture</a>
            <a href="#pricing" className="hover:text-[#111222] transition">Pricing</a>
            <a href="#analytics" className="hover:text-[#111222] transition">Analytics</a>
            <Link href="/templates" className="hover:text-[#111222] transition">Templates</Link>
          </nav>

          {/* Right Action Button */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-[#475569] hover:text-[#0F172A] px-3 py-1.5 hidden sm:inline-block"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-full bg-[#111222] text-white text-xs font-semibold hover:bg-[#20223A] transition-all shadow-[0_4px_16px_rgba(17,18,34,0.2)] active:scale-95 flex items-center gap-1.5"
            >
              <span>Launch App</span>
              <span className="text-[#818CF8]">→</span>
            </Link>
          </div>
        </header>

        {/* HERO SECTION matching screenshot composition */}
        <section className="mt-12 lg:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Headline, Copy, Action Buttons */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-purple-100 shadow-sm text-xs font-medium text-[#5B45FF]">
              <span className="w-2 h-2 rounded-full bg-[#5B45FF] animate-pulse" />
              <span>Official Meta Graph API + Supabase Serverless</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-[#0F172A] leading-[1.12]">
              Grow your business with smart digital <span className="bg-gradient-to-r from-[#5B45FF] via-[#7C3AED] to-[#EC4899] bg-clip-text text-transparent">DM solutions</span>
            </h1>

            <p className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-xl">
              Turn Instagram comments and Story mentions into automated private reply loops.
              Deliver guides, checkout links, and follow-gates with zero drop-off and 100% Meta rate-limit safety.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/login?mode=signup"
                className="px-7 py-3.5 rounded-full bg-[#5B45FF] text-white font-semibold text-sm shadow-[0_8px_24px_rgba(91,69,255,0.35)] hover:bg-[#4E39EB] transition-all active:scale-95 flex items-center gap-2"
              >
                <span>Get Started Free</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <a
                href="#demo"
                className="px-6 py-3.5 rounded-full bg-white/80 backdrop-blur-md border border-[#E2E8F0] text-[#0F172A] font-semibold text-sm hover:bg-white transition-all shadow-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-[#5B45FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Interactive Sandbox</span>
              </a>
            </div>

            {/* Supabase Status Pill */}
            <div className="flex items-center gap-3 text-xs text-[#64748B] pt-1">
              <div className="flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Supabase Connected
              </div>
              <span className="text-[#94A3B8] font-mono truncate max-w-[280px]">
                {supabaseStatus.projectUrl}
              </span>
            </div>
          </div>

          {/* Right Column: 3D Glass Cylinders & Floating Showcase */}
          <div className="lg:col-span-6 relative flex flex-col items-center justify-center">
            {/* 3D Glass Artwork Container */}
            <div className="relative w-full max-w-lg aspect-[4/3] flex items-center justify-center">
              {/* Circular 3D Glass Tray */}
              <div className="absolute w-72 sm:w-80 h-72 sm:h-80 rounded-full border-4 border-white/60 bg-gradient-to-tr from-white/30 to-white/80 shadow-[0_20px_50px_rgba(99,102,241,0.18)] backdrop-blur-2xl flex items-center justify-center">
                <div className="w-56 h-56 rounded-full border-2 border-white/80 bg-white/10" />
              </div>

              {/* Translucent Glass Cylinders */}
              <div className="relative z-10 flex items-end gap-3.5 mb-8">
                {/* Cylinder 1 - Indigo */}
                <div className="w-12 h-36 rounded-full bg-gradient-to-b from-[#818CF8]/70 via-[#6366F1]/50 to-[#4F46E5]/80 border-2 border-white/80 shadow-2xl backdrop-blur-md relative overflow-hidden">
                  <div className="absolute top-1 left-2 w-8 h-3 rounded-full bg-white/60 blur-[1px]" />
                </div>
                {/* Cylinder 2 - Violet Low */}
                <div className="w-14 h-24 rounded-full bg-gradient-to-b from-[#A78BFA]/70 via-[#8B5CF6]/50 to-[#7C3AED]/80 border-2 border-white/80 shadow-2xl backdrop-blur-md relative overflow-hidden">
                  <div className="absolute top-1 left-2.5 w-9 h-3 rounded-full bg-white/60 blur-[1px]" />
                </div>
                {/* Cylinder 3 - Emerald High */}
                <div className="w-12 h-44 rounded-full bg-gradient-to-b from-[#2DD4BF]/70 via-[#14B8A6]/50 to-[#0D9488]/80 border-2 border-white/80 shadow-2xl backdrop-blur-md relative overflow-hidden">
                  <div className="absolute top-1 left-2 w-8 h-3 rounded-full bg-white/60 blur-[1px]" />
                </div>
                {/* Cylinder 4 - Crystal Clear Tall */}
                <div className="w-12 h-52 rounded-full bg-gradient-to-b from-white/80 via-white/40 to-white/70 border-2 border-white/90 shadow-2xl backdrop-blur-lg relative overflow-hidden">
                  <div className="absolute top-1 left-2 w-8 h-3 rounded-full bg-white blur-[1px]" />
                </div>
              </div>

              {/* Floating 3D Frosted Tiles */}
              <div className="absolute top-2 right-4 w-16 h-16 rounded-2xl bg-white/85 border border-white shadow-[0_10px_25px_rgba(99,102,241,0.2)] backdrop-blur-md flex items-center justify-center text-[#5B45FF]">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>

              <div className="absolute top-8 left-2 w-14 h-14 rounded-2xl bg-white/80 border border-white shadow-[0_8px_20px_rgba(99,102,241,0.15)] backdrop-blur-md flex items-center justify-center text-[#8B5CF6]">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>

              <div className="absolute -top-3 right-28 w-14 h-14 rounded-2xl bg-white/75 border border-white shadow-lg backdrop-blur-md flex items-center justify-center text-[#EC4899]">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>

            {/* Dark Glossy Analytics Card */}
            <div className="w-full max-w-md -mt-6 bg-[#0E0F1D]/90 backdrop-blur-2xl rounded-3xl p-5 border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.35)] text-white">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#5B45FF] animate-pulse" />
                  <span className="text-xs font-mono font-semibold tracking-wider text-slate-300">
                    LIVE AUTOMATION STREAM
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  PostgreSQL · pgmq
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 items-center">
                <div>
                  <span className="text-[11px] text-slate-400 block">Total Revenue Tracked</span>
                  <div className="text-2xl font-bold font-mono text-white mt-0.5">
                    $34,853.40 <span className="text-xs font-normal text-emerald-400 font-sans">net</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Via 2,840 Tracked Link Clicks
                  </span>
                </div>

                <div className="flex flex-col items-end">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>742 / 750 Safe DMs</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2">
                    Atomic Rate-Limit Window
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 HORIZONTAL STAT CARDS */}
        <section className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "DMs Delivered", value: "22,397+", badge: "99.8%", color: "bg-[#5B45FF]" },
            { label: "Tracked Clicks", value: "20,283", badge: "48.2%", color: "bg-[#7C3AED]" },
            { label: "Meta API Rate Safe", value: "10,980+", badge: "Zero Ban", color: "bg-[#2563EB]" },
            { label: "Leads Captured", value: "30,790+", badge: "Active", color: "bg-[#059669]" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-white shadow-[0_4px_20px_rgba(99,102,241,0.04)] hover:shadow-md transition-all"
            >
              <span className="text-xs font-medium text-[#64748B] block">{stat.label}</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold font-mono tracking-tight text-[#0F172A]">
                  {stat.value}
                </span>
                <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${stat.color}`}>
                  {stat.badge}
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* BENTO GRID (Section 2 - Exact visual architecture) */}
        <section id="features" className="mt-20 space-y-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl font-bold text-[#0F172A] tracking-tight">
              A Complete Instagram Growth Engine Built for Creators & Agencies
            </h2>
            <p className="text-sm text-[#64748B] mt-2">
              Every feature from the core codebase redesigned with luxury glassmorphism and serverless speed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Card 1: Left Dark Card */}
            <div className="md:col-span-4 bg-[#0F101E] rounded-3xl p-6 border border-white/10 shadow-xl text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-44 h-44 bg-[#5B45FF]/20 rounded-full blur-3xl pointer-events-none" />

              <div>
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white mb-5">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold tracking-tight">
                  Private DM Automation Suite
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Trigger automatic DMs from post comments, Reel interactions, and direct Story text replies.
                  Personalize with commenter usernames and send up to two tracked link buttons.
                </p>
              </div>

              <div className="mt-8 pt-5 border-t border-white/10 flex items-center justify-between">
                <Link
                  href="/campaigns/new"
                  className="px-4 py-2 rounded-xl bg-[#5B45FF] text-white text-xs font-semibold hover:bg-[#4E39EB] transition"
                >
                  Create Loop →
                </Link>
                <span className="text-[11px] font-mono text-slate-400">
                  Meta v25.0
                </span>
              </div>
            </div>

            {/* Card 2: Center Creator & Multi-Trigger Card */}
            <div className="md:col-span-8 bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-[0_8px_30px_rgba(99,102,241,0.06)] grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              {/* Creator Photo Area */}
              <div className="sm:col-span-5 rounded-2xl overflow-hidden bg-gradient-to-tr from-[#E2E8F0] to-[#F8FAFC] border border-slate-200 aspect-[4/5] relative flex items-center justify-center">
                <div className="text-center p-4">
                  <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-tr from-[#5B45FF] to-[#A855F7] p-1 shadow-lg">
                    <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center font-bold text-xl text-[#5B45FF]">
                      CL
                    </div>
                  </div>
                  <h4 className="font-bold text-sm text-[#0F172A] mt-3">Verified Creator</h4>
                  <p className="text-[11px] text-[#64748B]">@studio.growth</p>
                  <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    +4,280 Followers via Gate
                  </div>
                </div>
              </div>

              {/* Details Column */}
              <div className="sm:col-span-7 space-y-4">
                <div className="inline-block px-2.5 py-1 rounded-full bg-purple-50 text-[#5B45FF] text-xs font-semibold border border-purple-200">
                  Follow-Gate Technology
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                  Multi-Trigger Dynamic Loops
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Require followers before handing over high-value links. ChatLoop queries Meta's official
                  <code>is_user_follow_business</code> API. If they don't follow, it politely re-prompts them; once followed, it auto-delivers!
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Keyword Matching</span>
                    <strong className="text-xs text-[#0F172A]">Whole-word & partial</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Public Comment Reply</span>
                    <strong className="text-xs text-[#0F172A]">Spintax rotation</strong>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      handleSimulate("FREE");
                      showNotification("Follow-gate simulation triggered for keyword FREE");
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold hover:bg-slate-800 transition"
                  >
                    Test Follow-Gate Logic
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: Bottom Left Card (Tracked Links) */}
            <div className="md:col-span-6 bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-[0_8px_30px_rgba(99,102,241,0.06)] flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-semibold text-[#5B45FF] uppercase tracking-wider">
                  LINK ORDER & SECURITY
                </span>
                <h3 className="text-2xl font-bold text-[#0F172A] mt-1">
                  Tracked Links with Safe Protocol Defense
                </h3>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                  Every link button generated by ChatLoop uses encrypted slugs (<code className="text-[#5B45FF]">/r/[slug]</code>)
                  with IP hash counting, user agent logging, and strict protocol validation rejecting unsafe URI schemes.
                </p>
              </div>

              {/* 3 Tier Pills */}
              <div className="grid grid-cols-3 gap-3 my-6">
                {[
                  { label: "Button 1", metric: "Primary", active: true },
                  { label: "Button 2", metric: "Upsell", active: false },
                  { label: "Security", metric: "Safe URL", active: false },
                ].map((tier, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border text-center transition ${
                      tier.active
                        ? "bg-[#5B45FF]/10 border-[#5B45FF]/30 text-[#5B45FF]"
                        : "bg-[#F8FAFC] border-slate-200 text-slate-600"
                    }`}
                  >
                    <span className="text-[10px] block font-medium">{tier.label}</span>
                    <span className="text-xs font-bold block mt-1 font-mono">{tier.metric}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Duplicate Campaign Safe</span>
                <Link href="/campaigns" className="text-[#5B45FF] font-semibold hover:underline">
                  Manage Campaign Links →
                </Link>
              </div>
            </div>

            {/* Card 4: Bottom Right Dark Card (Supabase Queue) */}
            <div id="analytics" className="md:col-span-6 bg-[#0E0F1D] rounded-3xl p-6 border border-white/10 shadow-2xl text-white relative overflow-hidden flex flex-col justify-between">
              <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-[#818CF8]">
                    SUPABASE PGMQ ENGINE
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Live Daemonless
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-3">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">Queue Throughput</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Cron-triggered serverless execution every 60s
                    </p>
                  </div>
                  {/* Floating counter widget */}
                  <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-center shadow-lg">
                    <span className="text-2xl font-mono font-extrabold text-white block">
                      {liveCounter}
                    </span>
                    <span className="text-[9px] uppercase font-mono text-purple-300">
                      Jobs/Min
                    </span>
                  </div>
                </div>
              </div>

              {/* 3D-styled chart simulation */}
              <div className="my-6 flex items-end gap-2.5 h-20 px-2">
                {[45, 60, 75, 40, 95, 68, 88, 100, 72, 85, 92, 100].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div
                      style={{ height: `${h}%` }}
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        i >= 9
                          ? "bg-gradient-to-t from-[#5B45FF] to-[#A78BFA] shadow-[0_0_12px_rgba(91,69,255,0.6)]"
                          : "bg-white/20 group-hover:bg-white/40"
                      }`}
                    />
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Zero Redis · Zero PM2</span>
                <Link
                  href="/api/health"
                  target="_blank"
                  className="text-purple-300 hover:text-white font-mono flex items-center gap-1"
                >
                  <span>Health Check</span>
                  <span>↗</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* PIPELINE ARCHITECTURE SECTION (#pipeline) */}
        <section id="pipeline" className="mt-20 space-y-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-mono font-semibold text-[#5B45FF] uppercase tracking-wider">
              SERVERLESS WORKFLOW
            </span>
            <h2 className="text-3xl font-bold text-[#0F172A] tracking-tight mt-1">
              End-to-End Instagram Automation Architecture
            </h2>
            <p className="text-sm text-[#64748B] mt-2">
              How ChatLoop ingests events, enforces rate-limits, and executes private replies with zero daemon overhead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#5B45FF]/10 text-[#5B45FF] flex items-center justify-center font-bold text-lg">
                1
              </div>
              <h4 className="text-lg font-bold text-[#0F172A]">Webhook Ingestion</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Instagram delivers comment, postback, and DM events to Vercel Next.js route handlers. Events are verified and enqueued into Supabase pgmq in &lt;15ms.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center font-bold text-lg">
                2
              </div>
              <h4 className="text-lg font-bold text-[#0F172A]">Atomic Rate Limiting</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                PostgreSQL row-level locking enforces Meta’s 750 private replies/hour cap. Overflow messages are delayed safely rather than dropped or banned.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#059669]/10 text-[#059669] flex items-center justify-center font-bold text-lg">
                3
              </div>
              <h4 className="text-lg font-bold text-[#0F172A]">Delivery & Click Tracking</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Official Graph API delivers private DMs with tracked link buttons. When users tap buttons, ChatLoop records conversion CTR and triggers follow-up loops.
              </p>
            </div>
          </div>
        </section>

        {/* PRICING SECTION (#pricing) */}
        <section id="pricing" className="mt-20 space-y-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono font-semibold text-[#5B45FF] uppercase tracking-wider">
              TRANSPARENT PRICING
            </span>
            <h2 className="text-3xl font-bold text-[#0F172A] tracking-tight mt-1">
              Start Free. Scale with Growth.
            </h2>
            <p className="text-sm text-[#64748B] mt-2">
              No hidden fees, no per-message overage charges. 100% self-hosted on your own Supabase infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">Starter Loop</h3>
                <p className="text-xs text-[#64748B] mt-1">For single creator accounts</p>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-bold font-mono text-[#0F172A]">$0</span>
                  <span className="text-xs text-[#64748B]"> / forever</span>
                </div>
                <ul className="space-y-2.5 text-xs text-[#475569]">
                  <li className="flex items-center gap-2">✓ 1 Instagram Business Account</li>
                  <li className="flex items-center gap-2">✓ 3 Active Keyword Loops</li>
                  <li className="flex items-center gap-2">✓ Meta 750/hr Rate Guard</li>
                  <li className="flex items-center gap-2">✓ Supabase PostgreSQL Queue</li>
                </ul>
              </div>
              <Link
                href="/login?mode=signup"
                className="mt-8 w-full py-3 text-center rounded-2xl bg-slate-100 text-[#0F172A] text-xs font-bold hover:bg-slate-200 transition"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro Creator Plan (Featured) */}
            <div className="bg-[#0F101E] rounded-3xl p-6 border border-[#5B45FF]/40 shadow-2xl text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-[#5B45FF] text-white text-[10px] font-bold rounded-bl-xl uppercase font-mono">
                POPULAR
              </div>
              <div>
                <h3 className="text-lg font-bold">Pro Creator</h3>
                <p className="text-xs text-slate-400 mt-1">For scaling influencers & brands</p>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-bold font-mono text-white">$29</span>
                  <span className="text-xs text-slate-400"> / month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">✓ 3 Instagram Business Accounts</li>
                  <li className="flex items-center gap-2">✓ Unlimited Keyword Automations</li>
                  <li className="flex items-center gap-2">✓ Follow-Gate Verification Engine</li>
                  <li className="flex items-center gap-2">✓ Tracked Link Analytics & CTR</li>
                  <li className="flex items-center gap-2">✓ Story Mention & DM Triggers</li>
                </ul>
              </div>
              <Link
                href="/login?mode=signup"
                className="mt-8 w-full py-3 text-center rounded-2xl bg-[#5B45FF] text-white text-xs font-bold hover:bg-[#4E39EB] transition shadow-lg shadow-[#5B45FF]/30"
              >
                Upgrade to Pro →
              </Link>
            </div>

            {/* Agency Plan */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">Agency Suite</h3>
                <p className="text-xs text-[#64748B] mt-1">For marketing agencies & teams</p>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-bold font-mono text-[#0F172A]">$79</span>
                  <span className="text-xs text-[#64748B]"> / month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-[#475569]">
                  <li className="flex items-center gap-2">✓ 10+ Instagram Accounts</li>
                  <li className="flex items-center gap-2">✓ Multi-Workspace Team Roles</li>
                  <li className="flex items-center gap-2">✓ White-Label Client Reports</li>
                  <li className="flex items-center gap-2">✓ Priority Support & Setup</li>
                </ul>
              </div>
              <Link
                href="/login?mode=signup"
                className="mt-8 w-full py-3 text-center rounded-2xl bg-slate-100 text-[#0F172A] text-xs font-bold hover:bg-slate-200 transition"
              >
                Contact Agency Team
              </Link>
            </div>
          </div>
        </section>

        {/* INTERACTIVE SANDBOX / DEMO SECTION (#demo) */}
        <section id="demo" className="mt-20 bg-white/90 backdrop-blur-2xl rounded-3xl p-8 border border-white shadow-[0_12px_40px_rgba(99,102,241,0.08)]">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <span className="text-xs font-mono font-semibold text-[#5B45FF] uppercase tracking-wider">
              REAL-TIME SIMULATOR
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-1">
              Test ChatLoop Live in Action
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-2">
              Select a keyword or type your own comment below to trace the complete Instagram comment-to-DM execution pipeline.
            </p>

            {/* Keyword selector pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {(["LINK", "VIP", "FREE", "DEAL"] as const).map((kw) => (
                <button
                  key={kw}
                  onClick={() => handleSimulate(kw)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition ${
                    activeKeyword === kw
                      ? "bg-[#5B45FF] text-white shadow-md shadow-[#5B45FF]/30 scale-105"
                      : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                  }`}
                >
                  "{kw}"
                </button>
              ))}
            </div>

            {/* Custom Comment Input Form */}
            <form onSubmit={handleCustomSubmit} className="mt-4 flex max-w-sm mx-auto gap-2">
              <input
                type="text"
                value={customComment}
                onChange={(e) => setCustomComment(e.target.value)}
                placeholder="Type e.g. send me the link..."
                className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5B45FF]/30"
              />
              <button
                type="submit"
                disabled={isSimulating}
                className="px-4 py-2.5 bg-[#5B45FF] text-white text-xs font-bold rounded-xl hover:bg-[#4E39EB] disabled:opacity-50"
              >
                {isSimulating ? "..." : "Send"}
              </button>
            </form>
          </div>

          {/* Interactive Pipeline Steps */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              {
                step: 1,
                title: "1. Comment Webhook",
                desc: `@user commented "${activeKeyword}" on Reel`,
                icon: "💬",
              },
              {
                step: 2,
                title: "2. Follow-Gate",
                desc: "Meta is_user_follow_business verified",
                icon: "🛡️",
              },
              {
                step: 3,
                title: "3. Atomic Rate Limiter",
                desc: "PostgreSQL < 750 window reserved",
                icon: "⚡",
              },
              {
                step: 4,
                title: "4. Private DM Sent",
                desc: "DM delivered with 2 tracked buttons",
                icon: "📬",
              },
            ].map((p) => {
              const isActive = simStep >= p.step;
              return (
                <div
                  key={p.step}
                  className={`p-4 rounded-2xl border transition-all ${
                    isActive
                      ? "bg-gradient-to-b from-[#F5F3FF] to-white border-[#5B45FF]/40 shadow-sm"
                      : "bg-slate-50 border-slate-200 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{p.icon}</span>
                    {isActive ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400">Step {p.step}</span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-[#0F172A]">{p.title}</h4>
                  <p className="text-[11px] text-[#64748B] mt-1">{p.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Simulated Instagram DM Preview Card */}
          <div className="mt-8 max-w-sm mx-auto bg-[#0F101E] rounded-3xl p-5 border border-white/10 shadow-2xl text-white">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#5B45FF] to-[#A855F7] flex items-center justify-center text-xs font-bold text-white">
                CL
              </div>
              <div>
                <strong className="text-xs block">ChatLoop Brand Bot</strong>
                <span className="text-[10px] text-slate-400">Instagram Direct Message</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="bg-white/10 rounded-2xl p-3 text-xs leading-relaxed">
                <p>Hey there! Here is your requested <strong>{activeKeyword}</strong> resource 👇</p>
              </div>

              {/* Tracked Button 1 */}
              <button
                type="button"
                onClick={() => showNotification("Tracked Button 1 Clicked! Redirecting through /r/[slug]...")}
                className="w-full p-2.5 rounded-xl bg-[#5B45FF] text-white text-center text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#4E39EB] active:scale-95 transition"
              >
                <span>Open Resource Link</span>
                <span className="text-[10px]">↗</span>
              </button>

              {/* Tracked Button 2 */}
              <button
                type="button"
                onClick={() => showNotification("Tracked Button 2 Clicked! Product upsell page opened.")}
                className="w-full p-2 rounded-xl bg-white/10 text-slate-200 text-center text-[11px] font-medium hover:bg-white/20 active:scale-95 transition cursor-pointer"
              >
                <span>View Creator Store</span>
              </button>

              <div className="text-[10px] text-center text-slate-400 pt-1">
                ✓ Sent via Official Meta Graph API
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER matching screenshot design */}
        <footer className="mt-20 pt-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-[#0F172A]">ChatLoop</span>
            <span>·</span>
            <span>Instagram Comment-to-DM Micro-SaaS</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-[#0F172A] font-semibold">Dashboard</Link>
            <Link href="/templates" className="hover:text-[#0F172A]">Templates</Link>
            <Link href="/privacy" className="hover:text-[#0F172A]">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#0F172A]">Terms</Link>
            <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#5B45FF] font-semibold">
              Supabase Powered
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
