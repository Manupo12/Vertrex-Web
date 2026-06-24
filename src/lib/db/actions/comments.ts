"use server";

import { db } from "@/lib/db";
import { comments, users, clientPortalUsers, clients } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireOsUser } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/log";
import { revalidatePath } from "next/cache";

export async function addCommentAction(targetType: string, targetId: string, body: string) {
  const user = await requireOsUser();
  const [comment] = await db.insert(comments).values({
    authorType: "team",
    authorId: user.userId,
    targetType: targetType as any,
    targetId,
    body
  }).returning();

  await logActivity({
    actorType: "team",
    actorId: user.userId,
    verb: "commented",
    targetType: targetType as any,
    targetId,
    payload: { commentId: comment.id }
  });

  revalidatePath(`/os/${targetType}s/${targetId}`);
  return comment;
}

export async function listCommentsAction(targetType: string, targetId: string) {
  const raw = await db.select()
    .from(comments)
    .where(and(eq(comments.targetType, targetType as any), eq(comments.targetId, targetId)))
    .orderBy(desc(comments.createdAt));

  const teamMembers = await db.select({ id: users.id, name: users.name }).from(users);
  const portalUsers = await db.select({ id: clientPortalUsers.id, name: clientPortalUsers.name }).from(clientPortalUsers);
  const clientsList = await db.select({ id: clients.id, name: clients.name }).from(clients);

  return raw.map(c => {
    let authorName = "Usuario";
    if (c.authorType === "team") {
      const u = teamMembers.find(x => x.id === c.authorId);
      if (u) authorName = u.name;
    } else {
      const p = portalUsers.find(x => x.id === c.authorId);
      if (p) authorName = p.name;
      else {
        const cl = clientsList.find(x => x.id === c.authorId);
        if (cl) authorName = cl.name;
      }
    }
    return {
      ...c,
      authorName
    };
  });
}

export async function addCommentFromPortalAction(targetType: string, targetId: string, body: string) {
  const { getPortalSession } = await import("@/lib/auth/portal");
  const session = await getPortalSession();
  if (!session) throw new Error("No autorizado");

  const [comment] = await db.insert(comments).values({
    authorType: "client",
    authorId: session.portalUserId || session.clientId,
    targetType: targetType as any,
    targetId,
    body
  }).returning();

  await logActivity({
    actorType: "client",
    actorId: session.portalUserId || session.clientId,
    verb: "commented",
    targetType: targetType as any,
    targetId,
    payload: { commentId: comment.id }
  });

  revalidatePath(`/portal/${session.slug}/${targetType}s/${targetId}`);
  return comment;
}
