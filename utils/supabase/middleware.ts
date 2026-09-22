import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const DEFAULT_SUPABASE_URL = "https://ncccwoojpmuqektpaops.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_9QJZ4NP_b92S3Hw4_o_B1Q_02ViVN5r";

export const createClient = (request: NextRequest) => {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_KEY;

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            try {
              return request.cookies.getAll();
            } catch {
              return [];
            }
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
              supabaseResponse = NextResponse.next({
                request,
              });
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
              );
            } catch {
              // Ignore cookie mutations when running in edge/proxy
            }
          },
        },
      },
    );

    return { supabase, supabaseResponse };
  } catch (err) {
    console.warn("Supabase middleware client initialization fallback:", err);
    return { supabase: null, supabaseResponse };
  }
};
