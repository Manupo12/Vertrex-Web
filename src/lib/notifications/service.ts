import { db } from "@/lib/db";
import { notifications, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email/provider";

export async function pushNotification(params: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  targetType?: any;
  targetId?: string;
  sendEmail?: boolean;
}) {
  const [notification] = await db
    .insert(notifications)
    .values({
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      targetType: params.targetType,
      targetId: params.targetId,
    })
    .returning();

  if (params.sendEmail && process.env.PORTAL_NOTIFICATIONS_ENABLED === "true") {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, params.userId)).limit(1);
      if (user) {
        await sendEmail({ to: user.email, subject: params.title, html: `<p>${params.body || params.title}</p>` });
      }
    } catch (e) {
      console.error("[EMAIL] Failed to send:", e);
    }
  }

  return notification;
}
