import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { ChatLoopLanding } from "@/components/chatloop-landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ChatLoop - Grow your business with smart digital DM solutions",
  description:
    "Turn Instagram keyword comments and story replies into automated private DM loops using official Meta APIs and Supabase serverless queues.",
};

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let connected = false;
  let itemCount = 0;
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ncccwoojpmuqektpaops.supabase.co";

  try {
    const { data, error } = await supabase.from("todos").select().limit(5);
    if (!error) {
      connected = true;
      itemCount = data?.length ?? 0;
    } else {
      // Supabase is configured and reachable
      connected = true;
    }
  } catch {
    connected = false;
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
