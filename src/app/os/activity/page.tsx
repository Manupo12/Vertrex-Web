import { requireOsUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { activity } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { ActivityFeed } from "@/components/os/Activity/ActivityFeed";

export default async function ActivityPage() {
  await requireOsUser();

  const activities = await db
    .select()
    .from(activity)
    .orderBy(desc(activity.createdAt))
    .limit(50);

  return (
    <div>
      <PageHeader
        title="Actividad del sistema"
        description="Feed global de actividad"
      />
      <ActivityFeed activities={activities} />
    </div>
  );
}
