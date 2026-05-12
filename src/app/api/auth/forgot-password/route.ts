import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as jose from "jose";

function getAuthSecret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET || "default_super_secret_for_dev_only");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: true });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);

    if (user) {
      const resetToken = await new jose.SignJWT({ userId: user.id, purpose: "reset-password" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(getAuthSecret());

      console.info("[FORGOT PASSWORD] Token generated for", email, ":", resetToken);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[FORGOT PASSWORD ERROR]", e.message);
    return NextResponse.json({ success: true });
  }
}
