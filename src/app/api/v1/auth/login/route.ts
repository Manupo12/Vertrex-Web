import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/session";
import { verifyTwoFactorToken } from "@/lib/auth/two-factor";
import { createApiTokenForUser } from "@/lib/db/actions/api-tokens";
import { rateLimit } from "@/lib/api/ratelimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!(await rateLimit(req)).ok) {
    return NextResponse.json(
      { error: { code: "rate_limited", message: "Demasiadas solicitudes" } },
      { status: 429 },
    );
  }
  const body = await req.json().catch(() => null);
  const email = body?.email;
  const password = body?.password;
  const otp = body?.otp;
  const tokenName = body?.tokenName;
  if (!email || !password) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "email y password requeridos" } },
      { status: 400 },
    );
  }

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), eq(users.isActive, true)))
    .limit(1);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json(
      { error: { code: "invalid_credentials", message: "Credenciales inválidas" } },
      { status: 401 },
    );
  }
  const prefs = (user.preferences ?? {}) as Record<string, any>;
  if (prefs.twoFactorEnabled) {
    if (!otp) return NextResponse.json({ data: { twoFactorRequired: true } });
    const secret = prefs.twoFactorSecret as string | undefined;
    if (!secret || !verifyTwoFactorToken(secret, otp)) {
      return NextResponse.json(
        { error: { code: "invalid_otp", message: "Código 2FA inválido" } },
        { status: 401 },
      );
    }
  }
  const { token, record } = await createApiTokenForUser(user.id, tokenName || "vertrex-cli");
  return NextResponse.json({
    data: {
      token,
      tokenId: record.id,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    },
  });
}
