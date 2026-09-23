import NextAuth, { type NextAuthConfig } from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/client";
import { ensureWorkspaceForUser, getPrimaryWorkspace } from "@/lib/workspace";
import { isEmailAllowedToSignIn } from "@/lib/env";

type AdapterPrismaClient = Parameters<typeof PrismaAdapter>[0];

const emailFrom = process.env.EMAIL_FROM ?? "ChatLoop <login@example.com>";
// Setting EMAIL_SERVER switches magic links to your own SMTP server, for
// self-hosters who do not want a third-party mail service. Resend stays the
// default, so an existing deployment is unaffected.
const smtpServer = process.env.EMAIL_SERVER;

/**
 * Provider id the login form has to sign in with. It differs per transport,
 * so it is derived here rather than hardcoded at the call site.
 */
export const EMAIL_PROVIDER_ID = smtpServer ? "nodemailer" : "resend";

export const authConfig = {
  adapter: PrismaAdapter(prisma as unknown as AdapterPrismaClient),
  providers: [
    smtpServer
      ? Nodemailer({ server: smtpServer, from: emailFrom })
      : Resend({
          apiKey: process.env.RESEND_API_KEY ?? "missing-resend-api-key",
          from: emailFrom,
        }),
  ],
  callbacks: {
    // Runs before the magic link is sent, so a blocked address never receives
    // one, and again when the link is verified.
    async signIn({ user }) {
      return isEmailAllowedToSignIn(user?.email);
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id) {
        await ensureWorkspaceForUser(user.id, user.email);
      }
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-request",
  },
  session: {
    strategy: "database",
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET ?? "chatloop-production-nextauth-secret-key-32chars",
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export async function getCurrentUserId(): Promise<string | null> {
  // 1. NextAuth session check
  try {
    const session = await auth();
    if (session?.user?.id) return session.user.id;
  } catch {
    // NextAuth session not present
  }

  // 2. Supabase Auth session check
  try {
    const { cookies } = await import("next/headers");
    const { createClient } = await import("@/utils/supabase/server");
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    if (supabase && typeof supabase.auth?.getUser === "function") {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) return user.id;
    }
  } catch {
    // Supabase session not present
  }

  return null;
}

export async function getCurrentUserEmail(): Promise<string | null> {
  // 1. NextAuth check
  try {
    const session = await auth();
    if (session?.user?.email) return session.user.email;
  } catch {
    // NextAuth not present
  }

  // 2. Supabase Auth check
  try {
    const { cookies } = await import("next/headers");
    const { createClient } = await import("@/utils/supabase/server");
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    if (supabase && typeof supabase.auth?.getUser === "function") {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) return user.email;
    }
  } catch {
    // Supabase not present
  }

  return null;
}

export async function getCurrentWorkspaceId(): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  try {
    const workspace = await getPrimaryWorkspace(userId);
    if (workspace) return workspace.id;

    const email = await getCurrentUserEmail();
    const createdWorkspace = await ensureWorkspaceForUser(userId, email);
    return createdWorkspace.id;
  } catch (err) {
    console.warn("Failed to get primary workspace from DB:", err);
    return userId; // Fallback to user ID as workspace ID
  }
}
