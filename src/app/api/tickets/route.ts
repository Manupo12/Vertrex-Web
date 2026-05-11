import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tickets } from "@/lib/db/schema";
import { getPortalSession } from "@/lib/auth/portal";
import { linkEntities } from "@/lib/db/actions/graph";

export async function POST(request: NextRequest) {
  try {
    const session = await getPortalSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description } = body;

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }

    const [ticket] = await db.insert(tickets).values({
      clientId: session.clientId,
      title: title.trim(),
      description: description.trim(),
      status: "open"
    }).returning();

    await linkEntities(session.clientId, "client", ticket.id, "ticket", "created_ticket");

    return NextResponse.json(ticket);
  } catch {
    return NextResponse.json({ error: "Error al crear ticket" }, { status: 500 });
  }
}
