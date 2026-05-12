import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateDailyDigest, sendDailyDigest } from "@/lib/email/digest";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || request.headers.get("x-cron-secret");
  const secret = process.env.CRON_SECRET;

  if (secret && authHeader !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeUsers = await db.select().from(users).where(eq(users.isActive, true));

  const results: { userId: string; email: string; sent: boolean; reason?: string; error?: string; count?: number }[] = [];

  for (const user of activeUsers) {
    try {
      const digest = await generateDailyDigest(user.id);
      if (digest && digest.unreadCount > 0) {
        await sendDailyDigest(digest);
        results.push({ userId: user.id, email: user.email, sent: true, count: digest.unreadCount });
      } else {
        results.push({ userId: user.id, email: user.email, sent: false, reason: "no unread" });
      }
    } catch (e) {
      results.push({ userId: user.id, email: user.email, sent: false, error: String(e) });
    }
  }

  return NextResponse.json({ ok: true, results });
}
