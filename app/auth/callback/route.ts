import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  // Determine the correct host and protocol for redirection
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host") || requestUrl.host;
  const protocol =
    request.headers.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");
  const baseUrl = `${protocol}://${host}`;

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Handle PKCE code exchange
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(next, baseUrl));
      }
      console.error("Supabase auth code exchange error:", error);
    }

    // 2. Handle OTP token_hash verification (email confirmation / magic link)
    if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });
      if (!error) {
        return NextResponse.redirect(new URL(next, baseUrl));
      }
      console.error("Supabase auth verifyOtp error:", error);
    }
  } catch (err) {
    console.error("Supabase auth callback unexpected error:", err);
  }

  // Fallback to login page with informative message
  return NextResponse.redirect(
    new URL(
      `/login?message=${encodeURIComponent("Email confirmed successfully! You can now sign in.")}`,
      baseUrl
    )
  );
}
