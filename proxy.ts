import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

const PROTECTED_PREFIXES = ["/dashboard", "/automations", "/logs", "/settings"];

function hasSessionCookie(request: NextRequest): boolean {
  try {
    const allCookies = request.cookies.getAll();
    const hasNextAuth =
      request.cookies.has("authjs.session-token") ||
      request.cookies.has("__Secure-authjs.session-token") ||
      request.cookies.has("next-auth.session-token") ||
      request.cookies.has("__Secure-next-auth.session-token");

    const hasSupabase =
      allCookies.some(
        (c) =>
          c.name.startsWith("sb-") &&
          (c.name.includes("-auth-token") || c.name.includes("-token"))
      ) ||
      request.cookies.has("sb-access-token") ||
      request.cookies.has("sb-refresh-token");

    return hasNextAuth || hasSupabase;
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  try {
    // Refresh Supabase session
    const { supabaseResponse } = createClient(request);

    const pathname = request.nextUrl.pathname;
    const isProtected = PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
    const isLogin = pathname === "/login";
    const isAuthenticated = hasSessionCookie(request);

    if (isProtected && !isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isLogin && isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return supabaseResponse || NextResponse.next();
  } catch (err) {
    console.error("Proxy execution caught error:", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/automations/:path*",
    "/logs/:path*",
    "/settings/:path*",
    "/login",
  ],
};
