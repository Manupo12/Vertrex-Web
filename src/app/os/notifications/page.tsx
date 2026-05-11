import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { NotificationsView } from "./NotificationsView";
import { requireOsUser } from "@/lib/auth/session";

export default async function NotificationsPage() {
  const session = await requireOsUser();
  const allNotifications = await db.select().from(notifications).where(eq(notifications.userId, session.userId)).orderBy(desc(notifications.createdAt));

  return (
    <div>
      <PageHeader 
        title="Centro de notificaciones" 
        description="Todas tus notificaciones" 
        breadcrumbs={[{ label: "Notificaciones" }]}
      />
      <NotificationsView initialNotifications={allNotifications} />
    </div>
  );
}
