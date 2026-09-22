import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { ChatLoopLanding } from "@/components/chatloop-landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ChatLoop - Grow your business with smart digital DM solutions",
  description:
    "Turn Instagram keyword comments and story replies into automated private DM loops using official Meta APIs and Supabase serverless queues.",
};

export const dynamic = "force-dynamic";

export default async function Page() {
  let connected = true;
  let itemCount = 0;
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ncccwoojpmuqektpaops.supabase.co";

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    if (supabase && typeof supabase.from === "function") {
      const { data, error } = await supabase.from("todos").select().limit(5);
      if (!error && data) {
        itemCount = data.length;
      }
    }
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest?.startsWith?.("DYNAMIC_")) {
      throw err;
    }
    console.warn("Supabase SSR status check:", err);
  }

  return (
    <ChatLoopLanding
      supabaseStatus={{
        connected,
        projectUrl,
        itemCount,
      }}
    />
  );
}
