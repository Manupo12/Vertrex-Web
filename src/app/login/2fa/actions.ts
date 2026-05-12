"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyTwoFactorToken } from "@/lib/auth/two-factor";
import { signOsSession } from "@/lib/auth/session";

export async function verifyTwoFactorLoginAction(formData: FormData) {
  const userId = String(formData.get("userId") || "");
  const token = String(formData.get("token") || "").trim();

  if (!userId || !token || token.length !== 6) {
    redirect("/login?error=1");
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) redirect("/login?error=1");

  const prefs = user.preferences as Record<string, unknown> | null;
  const secret = prefs?.twoFactorSecret as string | undefined;
  if (!secret) redirect("/login?error=1");

  const valid = verifyTwoFactorToken(secret, token);
  if (!valid) redirect("/login/2fa?error=invalid");

  await signOsSession({ userId: user.id, email: user.email, name: user.name, role: user.role });

  redirect("/os/admin");
}
