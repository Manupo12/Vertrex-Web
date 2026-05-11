import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments } from "@/lib/db/schema";
import { getPortalSession } from "@/lib/auth/portal";
import { logActivity } from "@/lib/activity/log";

export async function POST(request: NextRequest) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!session.portalUserId) {
    return NextResponse.json({ error: "Solo usuarios del portal pueden comentar" }, { status: 403 });
  }

  const body = await request.json();
  const { targetType, targetId, body: commentBody } = body;

  if (!targetType || !targetId || !commentBody || typeof commentBody !== "string" || commentBody.trim() === "") {
    return NextResponse.json({ error: "targetType, targetId y body son requeridos" }, { status: 400 });
  }

  const [comment] = await db
    .insert(comments)
    .values({
      authorType: "client",
      authorId: session.portalUserId,
      targetType,
      targetId,
      body: commentBody.trim(),
    })
    .returning();

  await logActivity({
    actorType: "client",
    actorId: session.portalUserId,
    verb: "commented",
    targetType,
    targetId,
    payload: { commentId: comment.id },
  });

  return NextResponse.json(comment, { status: 201 });
}
