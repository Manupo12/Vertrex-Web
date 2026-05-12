import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shareTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getOsSession } from "@/lib/auth/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getOsSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const tokens = await db
    .select()
    .from(shareTokens)
    .where(eq(shareTokens.documentId, id))
    .orderBy(shareTokens.createdAt);

  return NextResponse.json(tokens);
}
