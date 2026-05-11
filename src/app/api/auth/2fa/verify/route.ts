import { NextRequest, NextResponse } from "next/server";
import { requireOsUser } from "@/lib/auth/session";
import { verifyTwoFactorToken } from "@/lib/auth/two-factor";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await requireOsUser();
    const body = await request.json();
    const { token } = body;

    const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const prefs = user.preferences as any || {};
    const secret = prefs.twoFactorSecret;
    if (!secret) return NextResponse.json({ error: "2FA no configurado" }, { status: 400 });

    const valid = verifyTwoFactorToken(secret, token);
    if (!valid) return NextResponse.json({ error: "Token inválido" }, { status: 400 });

    await db.update(users).set({
      preferences: { ...prefs, twoFactorEnabled: true },
    } as any).where(eq(users.id, session.userId));

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
