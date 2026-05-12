import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as jose from "jose";
import { createPasswordHash } from "@/lib/auth/session";

function getAuthSecret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET || "default_super_secret_for_dev_only");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password || password.length < 6) {
      return NextResponse.json({ error: "Token y contraseña (mín. 6 caracteres) requeridos" }, { status: 400 });
    }

    let payload: { userId: string; purpose: string };
    try {
      const result = await jose.jwtVerify(token, getAuthSecret());
      payload = result.payload as unknown as { userId: string; purpose: string };
    } catch {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 });
    }

    if (payload.purpose !== "reset-password") {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    const passwordHash = await createPasswordHash(password);
    await db.update(users).set({ passwordHash }).where(eq(users.id, payload.userId));

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
