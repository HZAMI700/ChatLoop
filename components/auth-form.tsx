"use client";

import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface AuthFormProps {
  callbackUrl?: string;
  defaultMode?: "signin" | "signup";
}

export function AuthForm({ callbackUrl = "/dashboard", defaultMode = "signin" }: AuthFormProps) {
  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);
  const [authMethod, setAuthMethod] = useState<"password" | "magic-link">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (authMethod === "magic-link") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}${callbackUrl}`,
          },
        });
        if (error) throw error;
        setSuccessMsg("Check your inbox! We sent you a secure magic link to sign in.");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}${callbackUrl}`,
          },
        });
        if (error) throw error;

        if (data.session) {
          router.push(callbackUrl);
          router.refresh();
        } else {
          setSuccessMsg("Account created! Check your email to confirm your registration or sign in.");
        }
      } else {
        // Sign In with password
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        if (data.session) {
          router.push(callbackUrl);
          router.refresh();
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred during authentication.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Mode Switcher Tabs */}
      <div className="flex rounded-2xl bg-white/70 backdrop-blur-xl p-1.5 border border-white shadow-sm mb-6">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition ${
            mode === "signin"
              ? "bg-[#5B45FF] text-white shadow-md shadow-[#5B45FF]/20"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition ${
            mode === "signup"
              ? "bg-[#5B45FF] text-white shadow-md shadow-[#5B45FF]/20"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Main Form Container with 3D Glassmorphism styling */}
      <div className="bg-white/85 backdrop-blur-2xl rounded-3xl p-8 border border-white shadow-[0_16px_40px_rgba(99,102,241,0.08)]">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#0F172A]">
            {mode === "signin" ? "Welcome back to ChatLoop" : "Start with ChatLoop"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {mode === "signin"
              ? "Access your Instagram automation campaigns and analytics."
              : "Automate comments to DMs, story replies, and tracked links."}
          </p>
        </div>

        {/* Auth Method Toggle */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600 mb-5 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => setAuthMethod("password")}
            className={`pb-1 transition ${
              authMethod === "password"
                ? "text-[#5B45FF] font-bold border-b-2 border-[#5B45FF]"
                : "hover:text-slate-900"
            }`}
          >
            Email + Password
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod("magic-link")}
            className={`pb-1 transition ${
              authMethod === "magic-link"
                ? "text-[#5B45FF] font-bold border-b-2 border-[#5B45FF]"
                : "hover:text-slate-900"
            }`}
          >
            Email Magic Link
          </button>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in duration-150">
            <span className="text-sm">⚠️</span>
            <div className="flex-1 leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in duration-150">
            <span className="text-sm">✓</span>
            <div className="flex-1 leading-relaxed">{successMsg}</div>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {mode === "signup" && authMethod === "password" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name / Brand Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Maya Creates"
                className="w-full px-4 py-3 text-xs rounded-2xl bg-[#F8FAFC] border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B45FF]/30 focus:bg-white transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Work Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full px-4 py-3 text-xs rounded-2xl bg-[#F8FAFC] border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B45FF]/30 focus:bg-white transition"
            />
          </div>

          {authMethod === "password" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => setAuthMethod("magic-link")}
                    className="text-[11px] text-[#5B45FF] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 text-xs rounded-2xl bg-[#F8FAFC] border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B45FF]/30 focus:bg-white transition"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-6 rounded-full bg-[#5B45FF] text-white text-xs font-bold shadow-[0_8px_20px_rgba(91,69,255,0.35)] hover:bg-[#4E39EB] transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              <span>
                {authMethod === "magic-link"
                  ? "Send Magic Link ↗"
                  : mode === "signup"
                  ? "Create Free Account →"
                  : "Sign In to Dashboard →"}
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500">
            Powered by{" "}
            <span className="font-semibold text-slate-700">Supabase Auth</span> &{" "}
            <span className="font-semibold text-slate-700">Official Meta Graph API</span>
          </p>
        </div>
      </div>
    </div>
  );
}
