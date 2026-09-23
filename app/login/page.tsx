import { AuthForm } from "@/components/auth-form";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In & Register - ChatLoop",
  description: "Sign in or create your ChatLoop account to automate Instagram comments to DMs.",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string;
    mode?: "signin" | "signup";
    error?: string;
    message?: string;
  }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/dashboard";
  const defaultMode = params.mode === "signup" ? "signup" : "signin";

  return (
    <div className="min-h-screen bg-[#F5F4FC] text-[#0F172A] font-sans antialiased relative overflow-hidden flex flex-col justify-between py-10 px-4 sm:px-6 selection:bg-[#5B45FF] selection:text-white">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[25%] w-[500px] h-[500px] rounded-full bg-[#818CF8]/20 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] rounded-full bg-[#C084FC]/15 blur-[140px]" />
      </div>

      {/* Top Header */}
      <div className="relative z-10 max-w-md w-full mx-auto flex items-center justify-between pb-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5B45FF] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-sm shadow-[0_4px_12px_rgba(91,69,255,0.35)]">
            CL
          </div>
          <span className="font-extrabold text-lg tracking-tight text-[#111222] font-mono">
            Chat<span className="text-[#5B45FF]">Loop</span>
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition flex items-center gap-1"
        >
          <span>← Back to Home</span>
        </Link>
      </div>

      {/* Center Auth Form */}
      <div className="relative z-10 w-full my-auto">
        <AuthForm
          callbackUrl={callbackUrl}
          defaultMode={defaultMode}
          initialError={params.error}
          initialMessage={params.message}
        />
      </div>

      {/* Bottom Footer */}
      <div className="relative z-10 max-w-md w-full mx-auto text-center pt-6 text-xs text-slate-400">
        <p>© {new Date().getFullYear()} ChatLoop · All rights reserved.</p>
      </div>
    </div>
  );
}
