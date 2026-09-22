"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("ChatLoop application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F5F4FC] text-[#0F172A] flex flex-col justify-between py-12 px-4 sm:px-6 relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-[#818CF8]/20 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-[#C084FC]/15 blur-[140px]" />
      </div>

      {/* Top Header */}
      <div className="relative z-10 max-w-md w-full mx-auto flex items-center justify-between pb-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5B45FF] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-sm shadow-[0_4px_12px_rgba(91,69,255,0.35)]">
            CL
          </div>
          <span className="font-extrabold text-lg tracking-tight text-[#111222] font-mono">
            Chat<span className="text-[#5B45FF]">Loop</span>
          </span>
        </Link>
      </div>

      {/* Center Error Card */}
      <div className="relative z-10 max-w-md w-full mx-auto">
        <div className="bg-white/85 backdrop-blur-2xl rounded-3xl p-8 border border-white shadow-[0_16px_40px_rgba(99,102,241,0.08)] text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl mx-auto mb-5 shadow-inner">
            ⚡
          </div>

          <h2 className="text-xl font-bold text-[#0F172A] mb-2">
            Something went wrong
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            We encountered a temporary issue while loading this page. You can reload
            or return to the ChatLoop dashboard.
          </p>

          {error?.digest && (
            <div className="mb-6 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] font-mono text-slate-500 truncate">
              Reference: {error.digest}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => reset()}
              type="button"
              className="w-full py-3 px-5 rounded-full bg-[#5B45FF] text-white text-xs font-bold shadow-[0_6px_16px_rgba(91,69,255,0.3)] hover:bg-[#4E39EB] transition active:scale-95"
            >
              Try Again ↻
            </button>
            <Link
              href="/"
              className="w-full py-3 px-5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="relative z-10 max-w-md w-full mx-auto text-center pt-6 text-xs text-slate-400">
        <p>© {new Date().getFullYear()} ChatLoop · Smart Instagram & TikTok DM Automation</p>
      </div>
    </div>
  );
}
