import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireOsUser } from "@/lib/auth/session";

export async function PUT(request: NextRequest) {
  try {
    const session = await requireOsUser();
    const body = await request.json();
    const { preferences } = body;
    await db.update(users).set({ preferences } as any).where(eq(users.id, session.userId));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
