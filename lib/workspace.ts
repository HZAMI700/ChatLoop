import { prisma } from "@/lib/db/client";
import type { Workspace, WorkspaceRole } from "@/app/generated/prisma/client";

function normalizeInviteEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function acceptPendingInvitationsForUser(
  userId: string,
  email?: string | null
): Promise<void> {
  if (!email) return;

  const normalizedEmail = normalizeInviteEmail(email);
  const now = new Date();
  const invitations = await prisma.workspaceInvitation.findMany({
    where: {
      email: normalizedEmail,
      status: "PENDING",
      expiresAt: { gt: now },
    },
  });

  for (const invitation of invitations) {
    await prisma.$transaction([
      prisma.workspaceMember.upsert({
        where: {
          workspaceId_userId: {
            workspaceId: invitation.workspaceId,
            userId,
          },
        },
        create: {
          workspaceId: invitation.workspaceId,
          userId,
          role: invitation.role,
        },
        update: {
          role: invitation.role,
        },
      }),
      prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: now,
        },
      }),
    ]);
  }
}

export async function getWorkspaceMembership(userId: string): Promise<{
  workspace: Workspace;
  role: WorkspaceRole;
} | null> {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) return null;

  return {
    workspace: membership.workspace,
    role: membership.role,
  };
}

export async function ensureWorkspaceForUser(
  userId: string,
  email?: string | null
): Promise<Workspace> {
  const workspaceName = email ? `${email.split("@")[0]}'s workspace` : "My workspace";

  try {
    await acceptPendingInvitationsForUser(userId, email);

    const existingMembership = await getWorkspaceMembership(userId);
    if (existingMembership) {
      return existingMembership.workspace;
    }

    // Ensure user record exists in Prisma before linking to Workspace
    if (userId) {
      try {
        await prisma.user.upsert({
          where: { id: userId },
          update: email ? { email } : {},
          create: {
            id: userId,
            email: email ?? null,
            name: email ? email.split("@")[0] : null,
          },
        });
      } catch (userErr) {
        console.warn("Prisma user upsert skipped:", userErr);
      }
    }

    return await prisma.workspace.create({
      data: {
        name: workspaceName,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: "OWNER",
          },
        },
      },
    });
  } catch (err) {
    console.warn("ensureWorkspaceForUser database fallback:", err);
    return {
      id: userId,
      name: workspaceName,
      ownerId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Workspace;
  }
}

export async function getPrimaryWorkspace(userId: string): Promise<Workspace | null> {
  const membership = await getWorkspaceMembership(userId);
  return membership?.workspace ?? null;
}
