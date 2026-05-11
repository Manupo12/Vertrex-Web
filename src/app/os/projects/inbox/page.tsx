import { db } from "@/lib/db";
import { tasks, users } from "@/lib/db/schema";
import { isNull, desc } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { InboxView } from "./InboxView";
import { requireOsUser } from "@/lib/auth/session";

export default async function InboxPage() {
  await requireOsUser();
  const inboxTasks = await db.select().from(tasks).where(isNull(tasks.projectId)).orderBy(desc(tasks.createdAt));
  const allUsers = await db.select().from(users);

  return (
    <div>
      <PageHeader 
        title="Inbox de triage" 
        description="Tareas capturadas sin proyecto. Asígnales destino o cancélalas." 
        breadcrumbs={[{ label: "Proyectos", href: "/os/projects" }, { label: "Inbox" }]}
      />
      <InboxView initialTasks={inboxTasks} users={allUsers} />
    </div>
  );
}
