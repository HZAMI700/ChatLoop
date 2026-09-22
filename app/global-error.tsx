"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global ChatLoop runtime error:", error);
  }, [error]);

  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#F5F4FC] text-[#0F172A] flex flex-col justify-center items-center p-6 font-sans antialiased">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-2xl rounded-3xl p-8 border border-slate-200/80 shadow-[0_20px_50px_rgba(99,102,241,0.12)] text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl mx-auto mb-5 shadow-inner">
            ✨
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] mb-2 font-mono">
            Chat<span className="text-[#5B45FF]">Loop</span>
          </h1>
          <p className="text-sm font-semibold text-slate-800 mb-1">
            Application Recovery
          </p>
          <p className="text-xs text-slate-500 mb-6">
            A temporary connection issue occurred. Click reload to refresh the session.
          </p>
          <button
            onClick={() => reset()}
            type="button"
            className="w-full py-3.5 px-6 rounded-full bg-[#5B45FF] text-white text-xs font-bold shadow-[0_8px_20px_rgba(91,69,255,0.35)] hover:bg-[#4E39EB] transition"
          >
            Reload Application ↻
          </button>
        </div>
      </body>
    </html>
  );
}
