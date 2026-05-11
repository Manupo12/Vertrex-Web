import { db } from "@/lib/db";
import { eq, and, isNull, desc } from "drizzle-orm";
import { users, notifications } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email/provider";

type NotificationRow = typeof notifications.$inferSelect;

export type DailyDigest = {
  userId: string;
  email: string;
  unreadCount: number;
  notificationsByType: Record<string, NotificationRow[]>;
};

export async function generateDailyDigest(
  userId: string,
): Promise<DailyDigest | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return null;

  const unread = await db
    .select()
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), isNull(notifications.readAt)),
    )
    .orderBy(desc(notifications.createdAt));

  const notificationsByType: Record<string, NotificationRow[]> = {};
  for (const n of unread) {
    if (!notificationsByType[n.type]) notificationsByType[n.type] = [];
    notificationsByType[n.type].push(n);
  }

  return {
    userId: user.id,
    email: user.email,
    unreadCount: unread.length,
    notificationsByType,
  };
}

export async function sendDailyDigest(digest: DailyDigest) {
  const typeSections = Object.entries(digest.notificationsByType)
    .map(([type, items]) => {
      const list = items
        .map(
          (n) =>
            `<li><strong>${n.title}</strong>${n.body ? ` — ${n.body}` : ""}</li>`,
        )
        .join("");
      return `<h3>${type} (${items.length})</h3><ul>${list}</ul>`;
    })
    .join("");

  const html = `
<h2>Resumen diario de notificaciones</h2>
<p>Tienes <strong>${digest.unreadCount}</strong> notificaciones sin leer.</p>
${typeSections}
  `.trim();

  await sendEmail({
    to: digest.email,
    subject: `Vertrex OS — ${digest.unreadCount} notificaciones sin leer`,
    html,
  });
}
