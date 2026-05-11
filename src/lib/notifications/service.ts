import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
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
    // In a real app we'd fetch the user's email and preferences here
    // const user = await db.query.users.findFirst({ where: eq(users.id, params.userId) });
    // if (user) {
    //   await sendEmail({ to: user.email, subject: params.title, html: `<p>${params.body}</p>` });
    // }
  }

  return notification;
}
