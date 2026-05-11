import { NextResponse } from "next/server";
import { requireOsUser } from "@/lib/auth/session";
import { generateTwoFactorSecret } from "@/lib/auth/two-factor";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    const session = await requireOsUser();
    const { secret, otpauthUrl } = generateTwoFactorSecret(session.email);

    await db.update(users).set({
      preferences: { twoFactorSecret: secret, twoFactorEnabled: false },
    } as any).where(eq(users.id, session.userId));

    return NextResponse.json({ secret, otpauthUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
