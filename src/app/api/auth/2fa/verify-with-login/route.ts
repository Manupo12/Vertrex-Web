import { NextRequest, NextResponse } from "next/server";
import { verifyTwoFactorToken } from "@/lib/auth/two-factor";
import { signOsSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token } = body;

    if (!userId || !token) {
      return NextResponse.json({ error: "userId y token requeridos" }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const prefs = user.preferences as Record<string, unknown> | null;
    const secret = prefs?.twoFactorSecret as string | undefined;
    if (!secret) {
      return NextResponse.json({ error: "2FA no configurado" }, { status: 400 });
    }

    const valid = verifyTwoFactorToken(secret, token);
    if (!valid) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    await signOsSession({ userId: user.id, email: user.email, name: user.name, role: user.role });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
