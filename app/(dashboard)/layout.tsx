import { I18nProvider } from "@/lib/i18n/provider";
import { getI18n } from "@/lib/i18n/server";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard-shell";
import { getCurrentUserId, getCurrentUserEmail } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { ensureWorkspaceForUser } from "@/lib/workspace";

export async function generateMetadata() {
  return { title: "ChatLoop - Instagram & TikTok Comment-to-DM Automation" };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = await getI18n();
  const userId = await getCurrentUserId();
  const email = await getCurrentUserEmail();

  if (!userId) {
    redirect("/login");
  }

  let workspaceName = email ? `${email.split("@")[0]}'s Workspace` : "ChatLoop Workspace";
  let instagramUsername: string | null = null;
  let instagramAccountCount = 0;

  try {
    const workspace = await ensureWorkspaceForUser(userId, email);
    if (workspace) {
      workspaceName = workspace.name;
      const accounts = await prisma.instagramAccount.findMany({
        where: { workspaceId: workspace.id },
        orderBy: { connectedAt: "desc" },
        select: { username: true },
      });
      instagramUsername = accounts[0]?.username ?? null;
      instagramAccountCount = accounts.length;
    }
  } catch (err) {
    console.warn("DashboardLayout workspace fetch fallback:", err);
  }

  return (
    <I18nProvider locale={locale}>
      <DashboardShell
        workspaceName={workspaceName}
        instagramUsername={instagramUsername}
        instagramAccountCount={instagramAccountCount}
      >
        {children}
      </DashboardShell>
    </I18nProvider>
  );
}
