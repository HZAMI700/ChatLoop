import { createBrowserClient } from "@supabase/ssr";

const DEFAULT_SUPABASE_URL = "https://ncccwoojpmuqektpaops.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_9QJZ4NP_b92S3Hw4_o_B1Q_02ViVN5r";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export const createClient = () => {
  if (typeof window !== "undefined" && browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_KEY;

  try {
    const client = createBrowserClient(
      supabaseUrl,
      supabaseKey,
    );
    if (typeof window !== "undefined") {
      browserClient = client;
    }
    return client;
  } catch (err) {
    console.warn("Supabase browser client initialization fallback:", err);
    return {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
      }),
      auth: {
        signInWithOtp: () => Promise.resolve({ data: null, error: null }),
        signInWithPassword: () => Promise.resolve({ data: { session: null }, error: null }),
        signUp: () => Promise.resolve({ data: { session: null }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
      },
    } as unknown as ReturnType<typeof createBrowserClient>;
  }
};
